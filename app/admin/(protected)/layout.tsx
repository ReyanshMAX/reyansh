import { AdminData } from '@/components/admin/AdminDataServer';
import { AdminShell } from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminData>
      <AdminShell>{children}</AdminShell>
    </AdminData>
  );
}
