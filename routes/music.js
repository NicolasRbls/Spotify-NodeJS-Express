const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const db = require('../database/db');
const { getAudioDurationInSeconds } = require('get-audio-duration');


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

    // Créer un fichier temporaire pour obtenir la durée
    const tempFilePath = './temp-' + Date.now() + '.mp3';
    require('fs').writeFileSync(tempFilePath, fileBuffer);

    console.log('Analyse des métadonnées...');

    // Obtenir la durée
    const duration = await getAudioDurationInSeconds(tempFilePath);
    
    // Supprimer le fichier temporaire
    require('fs').unlinkSync(tempFilePath);

    console.log('Durée analysée :', duration);

    // Insertion dans la base de données
    db.run(
      `INSERT INTO tracks (title, artist, album, duration, file) VALUES (?, ?, ?, ?, ?)`,
      [title, artist, album, Math.floor(duration), fileBuffer],
      (err) => {
        if (err) {
          console.error("Erreur lors de l'insertion dans la base :", err);
          res.status(500).send("Erreur lors de l'ajout du morceau.");
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

router.get('/player/:id', (req, res) => {
  const trackId = parseInt(req.params.id, 10);

  db.get(`SELECT * FROM tracks WHERE id = ?`, [trackId], (err, track) => {
    if (err || !track) {
      res.status(404).send('Morceau introuvable.');
    } else {
      // Récupérer les pistes précédente et suivante
      db.get(`SELECT id FROM tracks WHERE id < ? ORDER BY id DESC LIMIT 1`, [trackId], (err, previousTrack) => {
        if (err) previousTrack = null;
        db.get(`SELECT id FROM tracks WHERE id > ? ORDER BY id ASC LIMIT 1`, [trackId], (err, nextTrack) => {
          if (err) nextTrack = null;

          res.render('music/play', {
            title: track.title,
            track,
            previousTrack: previousTrack ? previousTrack.id : null,
            nextTrack: nextTrack ? nextTrack.id : null,
          });
        });
      });
    }
  });
});

router.get('/play/:id', (req, res) => {
  const trackId = req.params.id;

  db.get(`SELECT file FROM tracks WHERE id = ?`, [trackId], (err, track) => {
    if (err || !track) {
      res.status(404).send('Morceau introuvable.');
    } else {
      res.set('Content-Type', 'audio/mpeg');
      res.send(track.file);
    }
  });
});

router.get('/play/:id/next', (req, res) => {
  const currentId = parseInt(req.params.id, 10);
  db.get(`SELECT id FROM tracks WHERE id > ? ORDER BY id ASC LIMIT 1`, [currentId], (err, nextTrack) => {
    if (err || !nextTrack) {
      res.redirect(`/player/${currentId}`); // Rester sur la piste actuelle si aucune suivante
    } else {
      res.redirect(`/player/${nextTrack.id}`);
    }
  });
});

router.get('/play/:id/previous', (req, res) => {
  const currentId = parseInt(req.params.id, 10);
  db.get(`SELECT id FROM tracks WHERE id < ? ORDER BY id DESC LIMIT 1`, [currentId], (err, previousTrack) => {
    if (err || !previousTrack) {
      res.redirect(`/player/${currentId}`); // Rester sur la piste actuelle si aucune précédente
    } else {
      res.redirect(`/player/${previousTrack.id}`);
    }
  });
});


module.exports = router;
