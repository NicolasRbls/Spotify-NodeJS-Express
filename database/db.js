const sqlite3 = require('sqlite3').verbose();

// Création et initialisation de la base de données
const db = new sqlite3.Database('./database/music.db', (err) => {
  if (err) {
    console.error('Erreur lors de la connexion à la base de données :', err);
  } else {
    console.log('Base de données connectée avec succès.');
    db.serialize(() => {
      // Table pour les morceaux
      db.run(`
        CREATE TABLE IF NOT EXISTS tracks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          artist TEXT NOT NULL,
          album TEXT,
          duration INTEGER,
          file BLOB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Table pour les utilisateurs
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    
      console.log('Tables "tracks", "users".');

    });
  }
});

module.exports = db;
