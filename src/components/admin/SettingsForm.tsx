'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { settingsInput } from '@/lib/schemas';
import { saveSettings } from '@/server/settings';
import { useAdminData } from './AdminData';
import { MediaPicker } from './MediaPicker';
import { nextToastId, Toast, type ToastMessage } from './Toast';

export function SettingsForm() {
  const router = useRouter();
  const { settings, media } = useAdminData();
  const [nowText, setNowText] = useState(settings.nowText);
  const [email, setEmail] = useState(settings.email);
  const [githubUrl, setGithubUrl] = useState(settings.githubUrl);
  const [linkedinUrl, setLinkedinUrl] = useState(settings.linkedinUrl);
  const [resumePath, setResumePath] = useState(settings.resumePath);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  // MediaPicker works in ids; the setting stores the storage path.
  const resumeId = resumePath ? media.find((m) => m.path === resumePath)?.id ?? null : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const input = { nowText, email: email.trim(), githubUrl: githubUrl.trim(), linkedinUrl: linkedinUrl.trim(), resumePath };
    const parsed = settingsInput.safeParse(input);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), 'Check this value'])));
      return;
    }
    setErrors({});
    setSaving(true);
    const result = await saveSettings(parsed.data);
    setSaving(false);
    if (result.ok) {
      setToast({ id: nextToastId(), tone: 'info', body: 'Settings saved. The live site is updated.' });
      router.refresh();
    } else {
      setToast({ id: nextToastId(), tone: 'error', body: `Couldn't save (${result.error}).` });
    }
  }

  const field = (
    key: string, label: string, value: string, set: (v: string) => void,
    opts: { type?: string; max?: number; placeholder?: string } = {},
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className="admin-label">{label}</span>
      <input
        className={`admin-input ${errors[key] ? 'border-orange' : ''}`}
        type={opts.type ?? 'text'}
        value={value}
        maxLength={opts.max}
        placeholder={opts.placeholder}
        onChange={(e) => set(e.target.value)}
      />
      {errors[key] && <span className="text-[13px] text-orange">{errors[key]}</span>}
    </label>
  );

  return (
    <form onSubmit={save} className="flex max-w-[640px] flex-col gap-6 p-6">
      <label className="flex flex-col gap-1.5">
        <span className="admin-label">Now text (shown in every Now tile)</span>
        <textarea
          className={`admin-input min-h-24 resize-y ${errors.nowText ? 'border-orange' : ''}`}
          value={nowText}
          maxLength={160}
          onChange={(e) => setNowText(e.target.value)}
        />
        <span className="self-end font-mono text-xs text-admin-muted">{nowText.length}/160</span>
      </label>
      {field('email', 'Email', email, setEmail, { type: 'email', placeholder: 'you@example.com' })}
      {field('githubUrl', 'GitHub URL', githubUrl, setGithubUrl, { type: 'url', placeholder: 'https://github.com/…' })}
      {field('linkedinUrl', 'LinkedIn URL', linkedinUrl, setLinkedinUrl, { type: 'url', placeholder: 'https://www.linkedin.com/in/…' })}
      <div className="flex flex-col gap-1.5">
        <span className="admin-label">Résumé (PDF)</span>
        <MediaPicker
          kind="file"
          value={resumeId ?? (resumePath ? resumePath : null)}
          onChange={(id) => setResumePath(id ? media.find((m) => m.id === id)?.path ?? null : null)}
        />
      </div>
      <div>
        <button type="submit" className="admin-btn admin-btn-accent" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
      <Toast toast={toast} onDone={clearToast} />
    </form>
  );
}
