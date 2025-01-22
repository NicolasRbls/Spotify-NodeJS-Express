const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const db = require('../database/db');
const { parseBuffer } = require('music-metadata');


// Configuration de multer pour traiter les fichiers uploadés
const upload = multer({ storage: multer.memoryStorage() });

// Route pour afficher tous les morceaux
router.get('/', (req, res) => {
  db.all('SELECT id, title, artist FROM tracks', (err, rows) => {
    if (err) {
      res.status(500).send('Erreur serveur.');
    } else {
      res.render('music/list', { title: 'Liste des morceaux', tracks: rows });
    }
  });
});

// Route pour ajouter un morceau avec un fichier MP3
router.post('/add', upload.single('file'), async (req, res) => {
    try {
      const { title, artist, album } = req.body;
      const fileBuffer = req.file.buffer;
  
      // Analyse des métadonnées pour obtenir la durée
      const metadata = await parseBuffer(fileBuffer, 'audio/mpeg');
      const duration = Math.floor(metadata.format.duration); // Durée en secondes
  
      // Insertion dans la base de données
      db.run(
        `INSERT INTO tracks (title, artist, album, duration, file) VALUES (?, ?, ?, ?, ?)`,
        [title, artist, album, duration, fileBuffer],
        (err) => {
          if (err) {
            res.status(500).send('Erreur lors de l’ajout du morceau.');
          } else {
            res.redirect('/music');
          }
        }
      );
    } catch (error) {
      console.error('Erreur lors du traitement du fichier MP3 :', error);
      res.status(500).send('Erreur lors du traitement du fichier MP3.');
    }
  });

// Route pour lire un morceau
router.get('/play/:id', (req, res) => {
  const trackId = req.params.id;

  db.get(`SELECT title, artist, album, duration, file FROM tracks WHERE id = ?`, [trackId], (err, track) => {
    if (err || !track) {
      res.status(404).send('Morceau introuvable.');
    } else {
      res.set('Content-Type', 'audio/mpeg');
      res.send(track.file);
    }
  });
});

module.exports = router;
