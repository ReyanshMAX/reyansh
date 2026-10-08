import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/PageHeader';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Settings — Reyansh Rastogi' };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsForm />
    </>
  );
}
