require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./config/db');
const { loadSiteLocals } = require('./middleware/locals');
const { startLocalScheduler } = require('./lib/cron');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '2mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use(
  session({
    store: new pgSession({ pool, tableName: 'session', createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || 'alite-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' }
  })
);

app.use(loadSiteLocals);

app.use('/', require('./routes/site'));
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));

app.use((req, res) => {
  res.status(404);
  if (req.path.startsWith('/admin')) return res.render('admin/notfound', { title: 'Not found' });
  res.render('site/notfound', { title: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('ERROR:', err);
  res.status(500).render('site/error', { title: 'Error', message: err.message });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startLocalScheduler();
}

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Alite running at http://localhost:${PORT}`));
}

module.exports = app;
