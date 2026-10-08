import { getSettings } from '@/server/queries';

// Blog, project and list pages only; tile pages have the Links tile instead (docs/UI.md).
export async function Footer() {
  const { githubUrl, linkedinUrl } = await getSettings();
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t-[2.5px] border-ink pt-6 text-[16px] font-medium">
      <span>© {new Date().getFullYear()} Reyansh Rastogi</span>
      <span className="flex gap-5">
        {githubUrl && <a href={githubUrl} target="_blank" rel="noreferrer" className="underline">GitHub</a>}
        {linkedinUrl && <a href={linkedinUrl} target="_blank" rel="noreferrer" className="underline">LinkedIn</a>}
      </span>
    </footer>
  );
}
