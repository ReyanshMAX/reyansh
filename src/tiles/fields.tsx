'use client';

// Small labelled inputs shared by tile inspectors.
export function Field({ label, value, max, multiline = false, onChange }: {
  label: string;
  value: string;
  max: number;
  multiline?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="admin-label">{label}</span>
      {multiline ? (
        <textarea className="admin-input min-h-28 resize-y" value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="admin-input" value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />
      )}
      {multiline && (
        <span className="self-end font-mono text-xs text-admin-muted">
          {value.length}/{max}
        </span>
      )}
    </label>
  );
}
