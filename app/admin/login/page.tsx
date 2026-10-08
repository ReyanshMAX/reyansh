import type { Metadata } from 'next';
import { GitHubSignInButton } from './GitHubSignInButton';

export const metadata: Metadata = { title: 'Sign in — Reyansh Rastogi' };

const ERRORS: Record<string, string> = {
  oauth: 'GitHub sign-in failed. Try again.',
  not_owner: 'This dashboard is private.',
};

export default async function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  const { error } = await searchParams;
  const message = typeof error === 'string' ? ERRORS[error] : undefined;
  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-bg px-4">
      <div className="flex w-full max-w-[440px] flex-col gap-6 rounded-[28px] border-[1.5px] border-admin-line bg-admin-panel p-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-[36px] leading-none font-extrabold tracking-[-0.03em]">Site dashboard</h1>
          <p className="text-admin-muted">Owner access only.</p>
        </div>
        {message && (
          <p role="alert" className="rounded-xl border-[1.5px] border-orange bg-white px-4 py-3 font-medium">
            {message}
          </p>
        )}
        <GitHubSignInButton />
      </div>
    </div>
  );
}
