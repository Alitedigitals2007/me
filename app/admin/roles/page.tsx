import TimelineManager from '@/components/admin/TimelineManager';
import getPool from '@/lib/db';

export const metadata = { title: 'Roles' };

async function safeQuery(query: string, params?: any[]) {
  try {
    const { rows } = await getPool().query(query, params);
    return rows;
  } catch {
    return [];
  }
}

export default async function RolesPage() {
  const rows = await safeQuery('SELECT * FROM roles ORDER BY order_index ASC');
  return (
    <TimelineManager
      table="roles"
      title="Leadership & roles"
      fields={[
        { name: 'title', label: 'Role title', required: true },
        { name: 'org', label: 'Organization' },
        { name: 'start_date', label: 'Start (e.g. 2024)' },
        { name: 'end_date', label: 'End' },
        { name: 'description', label: 'Details', type: 'textarea' }
      ]}
      items={rows}
    />
  );
}
