import AdminGuard from './AdminGuard';
import AdminShell from './AdminShell';

export const metadata = {
  title: {
    default: 'DESIRE Admin',
    template: '%s | DESIRE Admin',
  },

  description:
    'DESIRE administration portal',
};

export default function AdminLayout({
  children,
}) {
  return (
    <AdminGuard>
      <AdminShell>
        {children}
      </AdminShell>
    </AdminGuard>
  );
}