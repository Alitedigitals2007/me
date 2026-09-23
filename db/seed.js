try { process.loadEnvFile(); } catch {}
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false }
});

const DEFAULT_SETTINGS = {
  site_name: 'Alite',
  tagline: 'Portfolio, blog & marketplace',
  hero_name: 'Alite',
  hero_title: 'Builder & creator',
  hero_bio: '',
  hero_photo: '/img/me.jpg',
  about_bio: '',
  social_twitter: '',
  social_github: '',
  social_linkedin: '',
  social_instagram: '',
  contact_email: '',
  telegram_chat_id: '',
  og_image: '/img/logo.png'
};

const AD_SLOTS = [
  { name: 'Homepage banner', position: 'home_banner', price_per_day: 2000, max_active: 1, description: 'Large banner at the top of the homepage' },
  { name: 'Sidebar', position: 'sidebar', price_per_day: 800, max_active: 2, description: 'Sidebar ad shown across blog & portfolio pages' },
  { name: 'Blog inline', position: 'blog_inline', price_per_day: 1000, max_active: 1, description: 'Inline ad inside blog posts' }
];

const REAL_CONTENT_SETTINGS = {
  site_name: 'ALITE',
  tagline: 'Full-Stack System Architect · Web Designer · Student Leader · Data Analyst · Project Manager',
  hero_name: 'Atilola Israel Ayomide',
  hero_title: 'Full-Stack System Architect',
  hero_bio: 'I build smart systems that help people manage, grow, and succeed through technology and structured thinking. I architect the logic that runs your business while you sleep — high-end systems, designed for the streets of Nigeria and the markets of the world.',
  about_bio: 'I am a driven multi-dimensional individual with a strong passion for technology, leadership, and building systems that solve real-world problems. My journey started from curiosity — evolving into a love for using technology to lead. Today I focus on designing platforms and coordinating people effectively. Execution over excuses.',
  contact_whatsapp: '2349154681851',
  contact_email: ''
};

const AD_PACKAGES = [
  { name: 'Website only', mediums: 'website', daily_rate: 1200, bundle_3_rate: 3200, description: 'Your ad runs on this website — 1 day ₦1,200 · 3 days ₦3,200' },
  { name: 'Channel only', mediums: 'channel', daily_rate: 1000, bundle_3_rate: 1800, description: 'Your ad runs on my channel — 1 day ₦1,000 · 3 days ₦1,800' },
  { name: 'Status only', mediums: 'status', daily_rate: 1000, bundle_3_rate: 2500, description: 'Your ad runs on my WhatsApp status — 1 day ₦1,000 · 3 days ₦2,500' },
  { name: 'Channel + Status', mediums: 'channel,status', daily_rate: 1500, bundle_3_rate: 4000, description: 'Your ad runs on my channel and WhatsApp status — 1 day ₦1,500 · 3 days ₦4,000' },
  { name: 'Website + Channel', mediums: 'website,channel', daily_rate: 1700, bundle_3_rate: 5000, description: 'Your ad runs on this website and my channel — 1 day ₦1,700 · 3 days ₦5,000' },
  { name: 'All three', mediums: 'website,channel,status', daily_rate: 2000, bundle_3_rate: 5000, description: 'Website + channel + status — full reach — 1 day ₦2,000 · 3 days ₦5,000' }
];

const EDUCATION_SEED = [
  {
    institution: 'University of Ibadan',
    program: '300 Level – Physics (Civil Engineering in view)',
    start_date: '2023',
    end_date: 'Present',
    description: 'Class representative across levels and an active student leader — from PSRC and FASAA SRC assemblies to helpdesk committees, orientation programs and the Board of Representatives.',
    order_index: 0,
    type: 'education'
  },
  {
    institution: 'Global Wealth Institute',
    program: 'Final Year – Project Stage',
    start_date: '',
    end_date: '',
    description: '',
    order_index: 1,
    type: 'education'
  },
  { institution: 'Certification', program: 'SEO Optimization', start_date: '', end_date: '', description: '', order_index: 10, type: 'certification' },
  { institution: 'Certification', program: 'Web Design', start_date: '', end_date: '', description: '', order_index: 11, type: 'certification' },
  { institution: 'Certification', program: 'Project Management', start_date: '', end_date: '', description: '', order_index: 12, type: 'certification' },
  { institution: 'Certification', program: 'Human Resource Management', start_date: '', end_date: '', description: '', order_index: 13, type: 'certification' },
  { institution: 'Certification', program: 'Quality Assurance & Control', start_date: '', end_date: '', description: '', order_index: 14, type: 'certification' }
];

const ROLES_SEED = [
  { title: 'Class Representative', org: 'Physics 100L, University of Ibadan', start_date: '2023', end_date: '2024', description: 'Class Representative (Current) — 100L.', order_index: 0 },
  { title: 'Member', org: 'PSRC (7th Assembly)', start_date: '2023', end_date: '2024', description: '100L.', order_index: 1 },
  { title: 'Coordinator', org: 'Board of 100L Reps', start_date: '2023', end_date: '2024', description: '100L.', order_index: 2 },
  { title: 'Co-host', org: 'Stadium of Elites', start_date: '2023', end_date: '2024', description: '100L.', order_index: 3 },
  { title: 'PR Team', org: 'Ibiza 3.0', start_date: '2023', end_date: '2024', description: '100L.', order_index: 4 },
  { title: 'Webinar Host', org: 'Freshmen Orientation', start_date: '2023', end_date: '2024', description: '100L.', order_index: 5 },
  { title: 'Organizer', org: 'Post-UTME Mock', start_date: '2023', end_date: '2024', description: '100L.', order_index: 6 },
  { title: 'Delegate', org: 'Energy Club Seminar', start_date: '2023', end_date: '2024', description: '100L.', order_index: 7 },
  { title: 'Class Representative', org: 'Physics 200L, University of Ibadan', start_date: '2024', end_date: '2025', description: '200L.', order_index: 8 },
  { title: 'Chief Whip', org: 'PSRC (8th Assembly)', start_date: '2024', end_date: '2025', description: '200L.', order_index: 9 },
  { title: 'Member', org: 'Faculty SRC (14th Assembly)', start_date: '2024', end_date: '2025', description: '200L.', order_index: 10 },
  { title: 'Coordinator', org: 'Board of Reps, UI', start_date: '2024', end_date: '2025', description: '200L.', order_index: 11 },
  { title: 'Member', org: 'FASSA Helpdesk Committee', start_date: '2024', end_date: '2025', description: '200L.', order_index: 12 },
  { title: 'Member', org: 'UISU Helpdesk Committee', start_date: '2024', end_date: '2025', description: '200L.', order_index: 13 },
  { title: 'PR Team', org: 'Ibiza 4.0', start_date: '2024', end_date: '2025', description: '200L.', order_index: 14 },
  { title: 'PR Team', org: 'FASSA Week', start_date: '2024', end_date: '2025', description: '200L.', order_index: 15 },
  { title: 'Co-Head', org: 'FASSA Supporters Committee', start_date: '2024', end_date: '2025', description: '200L.', order_index: 16 },
  { title: 'Member', org: 'FASSA Finance Committee', start_date: '2024', end_date: '2025', description: '200L.', order_index: 17 },
  { title: 'Publicity Member', org: 'UISU Electoral Commission', start_date: '2024', end_date: '2025', description: '200L.', order_index: 18 },
  { title: 'Publicity Member', org: 'JAW WAR', start_date: '2024', end_date: '2025', description: '200L.', order_index: 19 },
  { title: 'Founder', org: 'GradeSense Pro (200+ users)', start_date: '2024', end_date: 'Present', description: '200L.', order_index: 20 },
  { title: 'Deputy Speaker', org: 'FASAA SRC (15th Assembly)', start_date: '2025', end_date: 'Present', description: '300L.', order_index: 21 },
  { title: 'Member', org: 'PSRC (9th Assembly)', start_date: '2025', end_date: 'Present', description: '300L.', order_index: 22 },
  { title: 'Delegate', org: 'DMUN Conference', start_date: '2025', end_date: 'Present', description: '300L.', order_index: 23 },
  { title: 'Chairperson', org: 'UISU Freshers Helpdesk', start_date: '2025', end_date: 'Present', description: '300L.', order_index: 24 },
  { title: 'Team Lead', org: 'RKH WhatsApp Channel', start_date: '2025', end_date: 'Present', description: '300L.', order_index: 25 },
  { title: 'Team Lead', org: 'RKH Archives', start_date: '2025', end_date: 'Present', description: '300L.', order_index: 26 },
  { title: 'Host', org: 'SIWES Orientation Webinar', start_date: '2025', end_date: 'Present', description: '300L.', order_index: 27 },
  { title: 'Publicity Member', org: 'TLDs', start_date: '2025', end_date: 'Present', description: '300L.', order_index: 28 },
  { title: 'Class Representative', org: 'Physics 300L, University of Ibadan', start_date: '2025', end_date: 'Present', description: '300L.', order_index: 29 },
  { title: 'Co-Host', org: 'Fresher Orientation', start_date: '2025', end_date: 'Present', description: '300L.', order_index: 30 }
];

const WELCOME_POST = {
  title: 'Welcome to my new platform',
  slug: 'welcome-to-my-new-platform',
  excerpt: 'One home for my work, my writing, my store and my ideas — built to scale without friction.',
  content:
    '<p>Welcome to my new home on the web. This platform brings together everything I build and do: my portfolio, this blog, my marketplace and even paid ad placements for partners who want to reach my audience.</p><h2>What you will find here</h2><ul><li><strong>Portfolio</strong> — projects I have designed and shipped, from full web systems to automation tools.</li><li><strong>Blog</strong> — writing on technology, student leadership and building in public.</li><li><strong>Marketplace</strong> — products and services I offer, plus curated listings from others.</li><li><strong>Advertise</strong> — affordable, transparent ad slots for partners.</li></ul><p>I build smart systems that help people manage, grow, and succeed through technology and structured thinking. Execution over excuses.</p>',
  tags: 'platform, welcome',
  status: 'published'
};

async function seedRealContent() {
  // DO NOTHING everywhere: never overwrite values the admin changed from the dashboard
  for (const [k, v] of Object.entries(REAL_CONTENT_SETTINGS)) {
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING',
      [k, v]
    );
  }
  console.log('-- Real content: settings filled --');

  const edu = await pool.query('SELECT COUNT(*)::int AS c FROM education');
  if (edu.rows[0].c === 0) {
    for (const e of EDUCATION_SEED) {
      await pool.query(
        'INSERT INTO education (institution, program, start_date, end_date, description, order_index, type) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [e.institution, e.program, e.start_date, e.end_date, e.description, e.order_index, e.type]
      );
    }
    console.log('-- Real content: education seeded --');
  }

  const roles = await pool.query('SELECT COUNT(*)::int AS c FROM roles');
  if (roles.rows[0].c === 0) {
    for (const r of ROLES_SEED) {
      await pool.query(
        'INSERT INTO roles (title, org, start_date, end_date, description, order_index) VALUES ($1,$2,$3,$4,$5,$6)',
        [r.title, r.org, r.start_date, r.end_date, r.description, r.order_index]
      );
    }
    console.log('-- Real content: roles seeded --');
  }

  const posts = await pool.query('SELECT COUNT(*)::int AS c FROM blog_posts');
  if (posts.rows[0].c === 0) {
    await pool.query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, tags, status, publish_at)
       VALUES ($1,$2,$3,$4,$5,'published',now())`,
      [WELCOME_POST.title, WELCOME_POST.slug, WELCOME_POST.excerpt, WELCOME_POST.content, WELCOME_POST.tags]
    );
    console.log('-- Real content: welcome post seeded --');
  }
}

async function main() {
  console.log('-- Connecting to database --');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('-- Tables ready --');

  for (const s of AD_SLOTS) {
    await pool.query(
      `INSERT INTO ad_slots (name, position, price_per_day, max_active, description)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (position) DO NOTHING`,
      [s.name, s.position, s.price_per_day, s.max_active, s.description]
    );
  }
  console.log('-- Ad slots seeded --');

  for (const p of AD_PACKAGES) {
    await pool.query(
      `INSERT INTO ad_packages (name, mediums, daily_rate, bundle_3_rate, description)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (name) DO NOTHING`,
      [p.name, p.mediums, p.daily_rate, p.bundle_3_rate, p.description]
    );
  }
  console.log('-- Ad packages seeded --');

  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    await pool.query('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING', [k, v]);
  }
  console.log('-- Default settings seeded --');

  await seedRealContent();

  const email = (process.env.ADMIN_EMAIL || '').trim();
  const password = (process.env.ADMIN_PASSWORD || '').trim();
  if (email && password) {
    const hash = await bcrypt.hash(password, 10);
    const username = email.includes('@') ? null : email;
    const em = email.includes('@') ? email : null;
    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE ($1::text IS NOT NULL AND username = $1) OR ($2::text IS NOT NULL AND email = $2) LIMIT 1',
      [username, em]
    );
    const hasOldPasswordCol = (await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password'`
    )).rowCount > 0;
    if (existing.length) {
      await pool.query('UPDATE users SET password_hash=$2, role=$3 WHERE id=$1', [existing[0].id, hash, 'admin']);
      if (hasOldPasswordCol) await pool.query('UPDATE users SET password=$2 WHERE id=$1', [existing[0].id, hash]);
    } else if (hasOldPasswordCol) {
      await pool.query(
        'INSERT INTO users (email, username, password_hash, password, role) VALUES ($1,$2,$3,$3,$4)',
        [em, username, hash, 'admin']
      );
    } else {
      await pool.query(
        'INSERT INTO users (email, username, password_hash, role) VALUES ($1,$2,$3,$4)',
        [em, username, hash, 'admin']
      );
    }
    console.log(`-- Admin ready (login: ${email}) --`);
  } else {
    console.log('-- WARNING: ADMIN_EMAIL/ADMIN_PASSWORD not set in .env, admin not created --');
  }

  console.log('-- Seed complete --');
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
