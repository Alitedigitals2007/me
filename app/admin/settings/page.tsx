import AdminHeader from '@/components/admin/AdminHeader';
import SettingsForm from '@/components/admin/SettingsForm';
import SocialManager from '@/components/admin/SocialManager';

export const metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div>
      <AdminHeader title="Settings" sub="Site identity, contacts and integrations." />
      <p className="text-sm text-muted mt-1 mb-8">Site-wide content shown across every page.</p>
      <SettingsForm />
      <SocialManager />
    </div>
  );
}
