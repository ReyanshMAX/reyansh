'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PageSlug, Tile, TileType } from '@/lib/tiles';
import { saveDraftLayout } from '@/server/layouts';
import { getTileDef } from '@/tiles/registry';
import { applyMobileOrder, placeNewTile, repackMobileOrder } from './layoutMath';

export type SaveState = 'saved' | 'saving' | 'unsaved' | 'error';

const AUTOSAVE_MS = 1000;
const HISTORY_CAP = 50;
// Consecutive content edits to the same tile within this window share one undo step.
const COALESCE_MS = 1000;

type Positions = readonly { i: string; x: number; y: number; w: number; h: number }[];

// docs/DASHBOARD.md "State + saving".
export function useLayoutEditor(page: PageSlug, initial: Tile[], initialSavedAt: string | null) {
  const [tiles, setTiles] = useState<Tile[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [savedAt, setSavedAt] = useState<string | null>(initialSavedAt);
  const [past, setPast] = useState<Tile[][]>([]);
  const [future, setFuture] = useState<Tile[][]>([]);

  const latest = useRef(tiles);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const lastEdit = useRef<{ id: string; at: number } | null>(null);

  const save = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) await inFlight.current;
    if (!dirty.current) return true;
    dirty.current = false;
    setSaveState('saving');
    const run = (async () => {
      const result = await saveDraftLayout(page, latest.current);
      if (result.ok) {
        setSavedAt(result.data.updatedAt);
        setSaveState(dirty.current ? 'unsaved' : 'saved');
        return true;
      }
      console.error('saveDraftLayout failed', result);
      dirty.current = true;
      setSaveState('error');
      return false;
    })();
    inFlight.current = run;
    try {
      return await run;
    } finally {
      inFlight.current = null;
    }
  }, [page]);

  const schedule = useCallback(() => {
    dirty.current = true;
    setSaveState('unsaved');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void save();
    }, AUTOSAVE_MS);
  }, [save]);

  // Applies a change: records an undo snapshot (unless coalesced), then autosaves.
  const commit = useCallback((next: Tile[], opts: { coalesceId?: string } = {}) => {
    const prev = latest.current;
    const now = Date.now();
    const coalesce = opts.coalesceId !== undefined
      && lastEdit.current?.id === opts.coalesceId
      && now - lastEdit.current.at < COALESCE_MS;
    lastEdit.current = opts.coalesceId !== undefined ? { id: opts.coalesceId, at: now } : null;
    if (!coalesce) {
      setPast((p) => [...p, prev].slice(-HISTORY_CAP));
      setFuture([]);
    }
    latest.current = next;
    setTiles(next);
    schedule();
  }, [schedule]);

  const restore = useCallback((next: Tile[]) => {
    lastEdit.current = null;
    latest.current = next;
    setTiles(next);
    setSelectedId((s) => (s && next.some((t) => t.id === s) ? s : null));
    schedule();
  }, [schedule]);

  const undo = useCallback(() => {
    if (!past.length) return;
    const prev = past[past.length - 1];
    setPast(past.slice(0, -1));
    setFuture((f) => [latest.current, ...f].slice(0, HISTORY_CAP));
    restore(prev);
  }, [past, restore]);

  const redo = useCallback(() => {
    if (!future.length) return;
    const [next, ...rest] = future;
    setFuture(rest);
    setPast((p) => [...p, latest.current].slice(-HISTORY_CAP));
    restore(next);
  }, [future, restore]);

  // Cancels the debounce and saves now. Resolves true when the draft is persisted.
  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    return save();
  }, [save]);

  // Replaces state with server tiles (Discard draft); clears history.
  const reset = useCallback((next: Tile[], at: string | null) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    dirty.current = false;
    lastEdit.current = null;
    latest.current = next;
    setTiles(next);
    setPast([]);
    setFuture([]);
    setSelectedId(null);
    setSaveState('saved');
    setSavedAt(at);
  }, []);

  useEffect(() => {
    if (saveState === 'saved') return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [saveState]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const addTile = useCallback((type: TileType) => {
    const def = getTileDef(type);
    if (!def) return;
    const current = latest.current;
    const tile: Tile = {
      id: crypto.randomUUID(),
      type,
      pos: placeNewTile(current, def.defaultSize),
      color: def.defaultColor,
      stickers: [],
      mobileOrder: current.length,
      hideOnMobile: false,
      config: structuredClone(def.defaultConfig),
    };
    commit([...current, tile]);
    setSelectedId(tile.id);
  }, [commit]);

  const updateTile = useCallback((id: string, patch: Partial<Omit<Tile, 'id' | 'type'>>) => {
    const contentOnly = Object.keys(patch).every((k) => k === 'config' || k === 'stickers');
    commit(
      latest.current.map((t) => (t.id === id ? ({ ...t, ...patch } as Tile) : t)),
      contentOnly ? { coalesceId: id } : {},
    );
  }, [commit]);

  const removeTile = useCallback((id: string) => {
    commit(repackMobileOrder(latest.current.filter((t) => t.id !== id)));
    setSelectedId((s) => (s === id ? null : s));
  }, [commit]);

  // Called on drag/resize stop: one undo snapshot per gesture.
  const applyPositions = useCallback((rgl: Positions) => {
    const byId = new Map(rgl.map((p) => [p.i, p]));
    let changed = false;
    const next = latest.current.map((t) => {
      const p = byId.get(t.id);
      if (!p || (p.x === t.pos.x && p.y === t.pos.y && p.w === t.pos.w && p.h === t.pos.h)) return t;
      changed = true;
      return { ...t, pos: { x: p.x, y: p.y, w: p.w, h: p.h } };
    });
    if (changed) commit(next);
  }, [commit]);

  const reorderMobile = useCallback((orderedIds: string[]) => {
    const next = applyMobileOrder(latest.current, orderedIds);
    if (next.some((t, i) => t.mobileOrder !== latest.current[i].mobileOrder)) commit(next);
  }, [commit]);

  return {
    tiles,
    selectedId,
    select: setSelectedId,
    addTile,
    updateTile,
    removeTile,
    applyPositions,
    reorderMobile,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    saveState,
    savedAt,
    flush,
    retry: flush,
    reset,
  };
}
