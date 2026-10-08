'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PageSlug, Tile, TileType } from '@/lib/tiles';
import { saveDraftLayout } from '@/server/layouts';
import { getTileDef } from '@/tiles/registry';
import { placeNewTile, repackMobileOrder } from './layoutMath';

export type SaveState = 'saved' | 'saving' | 'unsaved' | 'error';

const AUTOSAVE_MS = 1000;

type Positions = readonly { i: string; x: number; y: number; w: number; h: number }[];

// Phase 1 subset of the hook in docs/DASHBOARD.md (no undo/redo or stacking order yet).
export function useLayoutEditor(page: PageSlug, initial: Tile[], initialSavedAt: string | null) {
  const [tiles, setTiles] = useState<Tile[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [savedAt, setSavedAt] = useState<string | null>(initialSavedAt);

  const latest = useRef(tiles);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<boolean> | null>(null);

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

  const commit = useCallback((next: Tile[]) => {
    latest.current = next;
    dirty.current = true;
    setTiles(next);
    setSaveState('unsaved');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void save();
    }, AUTOSAVE_MS);
  }, [save]);

  // Cancels the debounce and saves now. Resolves true when the draft is persisted.
  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    return save();
  }, [save]);

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
    commit(latest.current.map((t) => (t.id === id ? ({ ...t, ...patch } as Tile) : t)));
  }, [commit]);

  const removeTile = useCallback((id: string) => {
    commit(repackMobileOrder(latest.current.filter((t) => t.id !== id)));
    setSelectedId((s) => (s === id ? null : s));
  }, [commit]);

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

  return {
    tiles,
    selectedId,
    select: setSelectedId,
    addTile,
    updateTile,
    removeTile,
    applyPositions,
    flush,
    retry: flush,
    saveState,
    savedAt,
  };
}
