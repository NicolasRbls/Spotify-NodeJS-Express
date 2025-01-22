const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Route pour afficher tous les morceaux
router.get('/', (req, res) => {
  db.all('SELECT * FROM tracks', (err, rows) => {
    if (err) {
      res.status(500).send('Erreur serveur.');
    } else {
      res.render('music/list', { title: 'Liste des morceaux', tracks: rows });
    }
  });
});

// Route pour ajouter un morceau
router.post('/add', (req, res) => {
  const { title, artist, album, duration } = req.body;
  db.run(
    `INSERT INTO tracks (title, artist, album, duration) VALUES (?, ?, ?, ?)`,
    [title, artist, album, duration],
    (err) => {
      if (err) {
        res.status(500).send('Erreur serveur.');
      } else {
        res.redirect('/music');
      }
    }
  );
});

module.exports = router;
