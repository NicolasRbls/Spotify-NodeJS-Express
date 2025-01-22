const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database/db');
const router = express.Router();

// Page d'inscription
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Inscription' });
});

// Traitement de l'inscription
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
    [username, email, hashedPassword],
    (err) => {
      if (err) {
        res.status(500).send('Erreur : utilisateur existant.');
      } else {
        res.redirect('/auth/login');
      }
    }
  );
});

// Page de connexion
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Connexion' });
});

// Traitement de la connexion
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).send('Email ou mot de passe incorrect.');
    } else {
      req.session.userId = user.id;
      res.redirect('/music');
    }
  });
});

// Déconnexion
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
