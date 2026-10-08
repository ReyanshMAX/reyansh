'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import type { MediaItem } from '@/lib/media';
import { deleteMedia, updateMediaAlt } from '@/server/media';
import { useAdminData } from './AdminData';
import { Toast, type ToastMessage } from './Toast';
import { ACCEPTED_TYPES, uploadMedia } from './upload';

function formatBytes(n: number): string {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

function AltField({ item, onSaved, onError }: { item: MediaItem; onSaved: (alt: string) => void; onError: (msg: string) => void }) {
  const [value, setValue] = useState(item.alt);
  const [saving, setSaving] = useState(false);
  const dirty = value.trim() !== item.alt;
  async function save() {
    if (!dirty) return;
    setSaving(true);
    const result = await updateMediaAlt(item.id, value);
    setSaving(false);
    if (result.ok) onSaved(value.trim());
    else onError(`Couldn't save alt text (${result.error})`);
  }
  return (
    <label className="flex flex-col gap-1">
      <span className="admin-label">Alt text{!item.alt && ' (required to use it)'}</span>
      <div className="flex gap-2">
        <input
          className={`admin-input ${!item.alt ? 'border-orange' : ''}`}
          value={value}
          maxLength={300}
          placeholder="Describe the image"
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === 'Enter' && void save()}
        />
        {saving && <span className="self-center text-xs text-admin-muted">Saving…</span>}
      </div>
    </label>
  );
}

export function MediaLibrary() {
  const router = useRouter();
  const { media, upsertMedia, removeMedia } = useAdminData();
  const [uploading, setUploading] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const say = (tone: ToastMessage['tone'], body: string) => setToast({ id: Date.now(), tone, body });

  async function upload(files: FileList | File[]) {
    const list = [...files];
    if (!list.length) return;
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        upsertMedia(await uploadMedia(file, ''));
      } catch (e) {
        say('error', e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploading((n) => n - 1);
      }
    }
    router.refresh();
  }

  async function remove(item: MediaItem) {
    if (!window.confirm('Delete this file? This cannot be undone.')) return;
    const result = await deleteMedia(item.id);
    if (result.ok) {
      removeMedia(item.id);
      router.refresh();
      say('info', 'Deleted.');
    } else {
      say('error', result.error.startsWith('Used in:') ? `Can't delete. ${result.error}` : `Delete failed (${result.error})`);
    }
  }

  const images = media.filter((m) => m.kind === 'image');
  const files = media.filter((m) => m.kind === 'file');

  return (
    <div className="flex flex-col gap-8 p-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void upload(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center gap-3 rounded-[28px] border-2 border-dashed p-10 text-center ${
          dragOver ? 'border-admin-accent bg-white' : 'border-admin-line'
        }`}
      >
        <p className="text-[17px] font-bold">Drop images or PDFs here</p>
        <p className="text-[14px] text-admin-muted">Photos are resized to 2400px and saved as WebP. Max 10 MB.</p>
        <button type="button" className="admin-btn admin-btn-accent" onClick={() => inputRef.current?.click()}>
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void upload(e.target.files);
            e.target.value = '';
          }}
        />
        {uploading > 0 && <p className="text-[14px]" aria-live="polite">Uploading {uploading}…</p>}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-[20px] font-extrabold">Images</h2>
        {images.length === 0 && <p className="text-admin-muted">No images yet.</p>}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {images.map((m) => (
            <div key={m.id} className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-admin-line bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- dashboard thumbnail */}
              <img src={m.url} alt={m.alt} className="aspect-[4/3] w-full rounded-xl bg-admin-bg object-cover" />
              <div className="font-mono text-xs text-admin-muted">
                {m.width && m.height ? `${m.width}×${m.height} · ` : ''}{formatBytes(m.bytes)}
              </div>
              <AltField
                item={m}
                onSaved={(alt) => upsertMedia({ ...m, alt })}
                onError={(msg) => say('error', msg)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="admin-btn flex-1"
                  onClick={() => void navigator.clipboard.writeText(m.url).then(() => say('info', 'URL copied.'))}
                >
                  Copy URL
                </button>
                <button type="button" className="admin-btn" onClick={() => void remove(m)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[20px] font-extrabold">Files</h2>
        {files.length === 0 && <p className="text-admin-muted">No files yet.</p>}
        <ul className="flex flex-col gap-2">
          {files.map((m) => (
            <li key={m.id} className="flex items-center gap-4 rounded-2xl border-[1.5px] border-admin-line bg-white px-4 py-2">
              <span className="font-mono text-xs text-admin-muted">PDF</span>
              <a href={m.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-medium underline">
                {m.path.split('/').pop()}
              </a>
              <span className="font-mono text-xs text-admin-muted">{formatBytes(m.bytes)}</span>
              <button
                type="button"
                className="admin-btn"
                onClick={() => void navigator.clipboard.writeText(m.url).then(() => say('info', 'URL copied.'))}
              >
                Copy URL
              </button>
              <button type="button" className="admin-btn" onClick={() => void remove(m)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>
      <Toast toast={toast} onDone={clearToast} />
    </div>
  );
}
