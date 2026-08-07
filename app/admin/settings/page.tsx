import SettingsForm from '@/components/admin/SettingsForm';
import SocialManager from '@/components/admin/SocialManager';

export const metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div>
      <h1 className="font-display font-extrabold uppercase text-3xl">Settings</h1>
      <p className="text-sm text-muted mt-1 mb-8">Site-wide content shown across every page.</p>
      <SettingsForm />
      <SocialManager />
    </div>
  );
}
