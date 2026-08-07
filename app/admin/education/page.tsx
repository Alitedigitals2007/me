import TimelineManager from '@/components/admin/TimelineManager';
import pool from '@/lib/db';

export const metadata = { title: 'Education' };

export default async function EducationPage() {
  const { rows } = await pool.query('SELECT * FROM education ORDER BY order_index ASC');
  return (
    <TimelineManager
      table="education"
      title="Education"
      fields={[
        { name: 'institution', label: 'Institution', required: true },
        { name: 'program', label: 'Program' },
        { name: 'start_date', label: 'Start (e.g. 2023)' },
        { name: 'end_date', label: 'End (e.g. 2027)' },
        { name: 'description', label: 'Details', type: 'textarea' }
      ]}
      items={rows}
    />
  );
}
