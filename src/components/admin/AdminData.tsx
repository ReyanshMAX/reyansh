'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MediaItem } from '@/lib/media';
import { toProjectCard, type ProjectCard, type ProjectRow } from '@/lib/projects';
import type { SiteSettings } from '@/lib/settings';

interface AdminData {
  settings: SiteSettings;
  media: MediaItem[];
  mediaById: ReadonlyMap<string, MediaItem>;
  projects: ProjectRow[];
  projectCards: ReadonlyMap<string, ProjectCard & { draft: boolean }>;
  upsertMedia: (item: MediaItem) => void;
  removeMedia: (id: string) => void;
}

const Ctx = createContext<AdminData | null>(null);

// Settings + media library for dashboard pages: inspectors, MediaPicker and the
// editor canvas read from here instead of fetching per component.
export function AdminDataProvider({ settings, media: initialMedia, projects, children }: {
  settings: SiteSettings;
  media: MediaItem[];
  projects: ProjectRow[];
  children: ReactNode;
}) {
  const [media, setMedia] = useState(initialMedia);
  const [prevInitial, setPrevInitial] = useState(initialMedia);
  if (prevInitial !== initialMedia) {
    setPrevInitial(initialMedia);
    setMedia(initialMedia);
  }
  const upsertMedia = useCallback((item: MediaItem) => {
    setMedia((list) => [item, ...list.filter((m) => m.id !== item.id)]);
  }, []);
  const removeMedia = useCallback((id: string) => setMedia((list) => list.filter((m) => m.id !== id)), []);
  const value = useMemo(
    () => ({
      settings,
      media,
      mediaById: new Map(media.map((m) => [m.id, m])),
      projects,
      projectCards: new Map(projects.map((p) => [p.id, { ...toProjectCard(p), draft: !p.published }])),
      upsertMedia,
      removeMedia,
    }),
    [settings, media, projects, upsertMedia, removeMedia],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminData(): AdminData {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdminData must be used inside AdminDataProvider');
  return v;
}
