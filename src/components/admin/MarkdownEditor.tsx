'use client';

import 'katex/dist/katex.min.css';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useRef, useState, type JSX } from 'react';
import { renderMarkdownPreview } from '@/server/markdown';

type Tab = 'write' | 'preview' | 'split';
const TOOLS = ['H2', 'Bold', 'Italic', 'Link', 'Code', 'Quote', 'Image', 'Math'] as const;
type Tool = (typeof TOOLS)[number];

const extensions = [
  markdown(),
  EditorView.lineWrapping,
  EditorView.theme({
    '&': { fontSize: '18px', backgroundColor: '#FFFFFF' },
    '.cm-content': { fontFamily: 'var(--font-dm-mono), monospace', padding: '16px 0' },
    '.cm-gutters': { display: 'none' },
    '&.cm-focused': { outline: 'none' },
  }),
];

function words(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

// docs/DASHBOARD.md "MarkdownEditor".
export function MarkdownEditor(props: {
  value: string;
  onChange: (v: string) => void;
  onUploadImage: (file: File) => Promise<{ url: string; alt: string }>;
}): JSX.Element {
  const { value, onChange, onUploadImage } = props;
  const viewRef = useRef<EditorView | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1440 ? 'split' : 'write',
  );
  const [html, setHtml] = useState('');
  const [uploading, setUploading] = useState(false);
  const showPreview = tab !== 'write';

  // Preview: same server pipeline as the public site, debounced 400ms.
  useEffect(() => {
    if (!showPreview) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const out = await renderMarkdownPreview(value);
      if (!cancelled) setHtml(out);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value, showPreview]);

  // Wraps the selection (or inserts at the cursor) and keeps focus in the editor.
  function wrap(before: string, after = '', placeholder = '') {
    const view = viewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const sel = view.state.sliceDoc(from, to) || placeholder;
    view.dispatch({
      changes: { from, to, insert: `${before}${sel}${after}` },
      selection: { anchor: from + before.length, head: from + before.length + sel.length },
    });
    view.focus();
  }

  function prefixLine(prefix: string) {
    const view = viewRef.current;
    if (!view) return;
    const line = view.state.doc.lineAt(view.state.selection.main.from);
    view.dispatch({ changes: { from: line.from, insert: prefix } });
    view.focus();
  }

  async function insertImage(file: File) {
    setUploading(true);
    try {
      const { url, alt } = await onUploadImage(file);
      wrap(`![${alt.replace(/[[\]]/g, '')}](${url})`);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function runTool(label: Tool) {
    switch (label) {
      case 'H2': return prefixLine('## ');
      case 'Bold': return wrap('**', '**', 'bold');
      case 'Italic': return wrap('_', '_', 'italic');
      case 'Link': return wrap('[', '](https://)', 'link text');
      case 'Code': return wrap('`', '`', 'code');
      case 'Quote': return prefixLine('> ');
      case 'Image': return fileRef.current?.click();
      case 'Math': return wrap('$', '$', 'x^2');
    }
  }

  const n = words(value);
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border-[1.5px] border-admin-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-[1.5px] border-admin-line bg-admin-panel p-1.5">
        <div className="flex flex-wrap">
          {TOOLS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => runTool(label)}
              disabled={tab === 'preview' || (label === 'Image' && uploading)}
              className="min-h-11 min-w-11 rounded-lg px-2.5 text-[14px] font-bold hover:bg-white disabled:opacity-40"
            >
              {label === 'Image' && uploading ? 'Uploading…' : label}
            </button>
          ))}
        </div>
        <div className="flex rounded-pill border-[1.5px] border-admin-line bg-white p-0.5">
          {(['write', 'preview', 'split'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={`min-h-10 rounded-pill px-3 text-[13px] font-bold capitalize ${tab === t ? 'bg-ink text-cream' : ''}`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void insertImage(f);
          }}
        />
      </div>
      <div className={tab === 'split' ? 'grid grid-cols-2 divide-x-[1.5px] divide-admin-line' : ''}>
        {tab !== 'preview' && (
          <div className="min-h-[420px] px-4">
            <CodeMirror
              value={value}
              onChange={onChange}
              extensions={extensions}
              basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false }}
              onCreateEditor={(view) => {
                viewRef.current = view;
              }}
            />
          </div>
        )}
        {showPreview && (
          <div className="min-h-[420px] overflow-x-auto bg-cream px-6 py-5">
            {value.trim() ? (
              <div className="prose-site" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="text-admin-muted">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-4 border-t-[1.5px] border-admin-line px-4 py-2 font-mono text-xs text-admin-muted">
        <span>{n} words</span>
        <span>~{Math.max(1, Math.round(n / 220))} min read</span>
      </div>
    </div>
  );
}
