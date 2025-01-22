const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const musicRoutes = require('./routes/music');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 3000;

// Configuration du moteur de templates Twig
app.set('view engine', 'twig');
app.set('views', path.join(__dirname, 'views'));

// Middleware pour les fichiers statiques et les données POST
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Configuration de la session (utilisation d'une base séparée)
app.use(
  session({
    store: new SQLiteStore({
      db: './database/sessions.db', // Base de données pour les sessions
      table: 'sessions', // Table pour les sessions
    }),
    secret: 'votre_secret_securise', // Clé secrète
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Mettre true si HTTPS est utilisé
      maxAge: 1000 * 60 * 60 * 24, // 24 heures
    },
  })
);

// Middleware pour protéger les routes
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.redirect('/auth/login');
  }
}

// Routes
app.use('/auth', authRoutes);
app.use('/music', isAuthenticated, musicRoutes);

// Page d'accueil
app.get('/', (req, res) => {
  res.render('index', { title: 'Music App' });
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
