const express = require('express');
require('dotenv').config();
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const db = require('../database/db');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const ytdl = require('ytdl-core');
const youtubeSearch = require('youtube-search');
const { exec } = require('child_process');
const path = require('path');
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

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

// Options pour l'API YouTube Data
const searchOpts = {
  maxResults: 10,
  key: YOUTUBE_API_KEY,
  type: 'video'
};

// Route pour rechercher sur YouTube
router.get('/search', (req, res) => {
  const query = req.query.query;
  youtubeSearch(query, searchOpts, (err, results) => {
    if (err) {
      console.error('Erreur lors de la recherche sur YouTube :', err);
      res.status(500).send('Erreur lors de la recherche sur YouTube.');
    } else {
      const youtubeResults = results.map(result => ({
        title: result.title,
        videoId: result.id
      }));
      res.render('music/list', { title: 'Liste des morceaux', youtubeResults });
    }
  });
});

// Route pour télécharger une vidéo YouTube et l'ajouter à la base
router.get('/download', (req, res) => {
  const videoId = req.query.videoId;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const outputPath = path.join(__dirname, '../public/uploads');
  const outputFile = path.join(outputPath, `${videoId}.mp3`);

  // Commande yt-dlp pour récupérer les métadonnées et télécharger
  const command = `yt-dlp --extract-audio --audio-format mp3 --write-info-json --output "${outputPath}/%(id)s.%(ext)s" ${videoUrl}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Erreur lors du téléchargement :', error.message);
      res.status(500).send('Erreur lors du téléchargement de la vidéo.');
      return;
    }

    try {
      // Charger les métadonnées JSON
      const metadataFile = path.join(outputPath, `${videoId}.info.json`);
      const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));

      const title = metadata.title || `YouTube Video - ${videoId}`;
      const artist = metadata.uploader || 'YouTube';
      const album = metadata.uploader || 'YouTube';
      const duration = Math.floor(metadata.duration || 0); // Durée en secondes

      console.log(`Téléchargement réussi : ${title}, durée ${duration} secondes.`);

      // Lire le fichier MP3
      const fileBuffer = fs.readFileSync(outputFile);

      // Ajouter à la base de données
      db.run(
        `INSERT INTO tracks (title, artist, album, duration, file) VALUES (?, ?, ?, ?, ?)`,
        [title, artist, album, duration, fileBuffer],
        (err) => {
          if (err) {
            console.error('Erreur lors de l’ajout à la base :', err);
            res.status(500).send('Erreur lors de l’ajout à la base.');
          } else {
            // Nettoyer les fichiers temporaires
            fs.unlinkSync(outputFile);
            fs.unlinkSync(metadataFile);
            res.redirect('/music');
          }
        }
      );
    } catch (err) {
      console.error('Erreur lors de la lecture des métadonnées ou du fichier :', err.message);
      res.status(500).send('Erreur lors de la lecture des métadonnées.');
    }
  });
});

// Route pour supprimer un morceau
router.get('/delete/:id', (req, res) => {
  const trackId = parseInt(req.params.id, 10);

  db.get(`SELECT file FROM tracks WHERE id = ?`, [trackId], (err, track) => {
    if (err || !track) {
      console.error('Erreur lors de la récupération du fichier à supprimer :', err);
      res.status(404).send('Morceau introuvable.');
    } else {
      // Supprimer le morceau de la base de données
      db.run(`DELETE FROM tracks WHERE id = ?`, [trackId], (deleteErr) => {
        if (deleteErr) {
          console.error('Erreur lors de la suppression dans la base :', deleteErr);
          res.status(500).send('Erreur lors de la suppression.');
        } else {
          console.log(`Morceau supprimé : ID ${trackId}`);
          res.redirect('/music');
        }
      });
    }
  });
});


module.exports = router;
