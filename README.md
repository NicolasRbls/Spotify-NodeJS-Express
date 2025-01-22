# Music App 🎵

Bienvenue sur **Music App**, une plateforme rétro pour écouter, gérer et télécharger vos morceaux préférés.

## 📋 Description
Music App est une application web conçue pour permettre aux utilisateurs de :

- Ajouter et écouter des morceaux de leur bibliothèque.
- Télécharger des chansons directement depuis YouTube.
- Supprimer les morceaux dont ils n'ont plus besoin.
- Créer un compte ou se connecter pour accéder à toutes les fonctionnalités.

## 🚀 Fonctionnalités

- **Écouter vos morceaux :**
  - Lecture de morceaux directement depuis l'application.
- **Téléchargement depuis YouTube :**
  - Recherchez vos chansons préférées sur YouTube et téléchargez-les en MP3.
- **Gestion des morceaux :**
  - Ajout, suppression, et organisation des morceaux.
- **Authentification utilisateur :**
  - Créez un compte ou connectez-vous pour une expérience personnalisée.

## 🛠️ Technologies utilisées

- **Backend** : Node.js avec le framework Express.
- **Base de données** : SQLite pour stocker les utilisateurs et les morceaux.
- **Frontend** :
  - Twig comme moteur de templates.
  - CSS rétro avec [Retro CSS](https://retrocss.netlify.app/).
- **Téléchargement YouTube :** yt-dlp.
- **Autres bibliothèques :**
  - Multer pour gérer les fichiers uploadés.
  - FontAwesome pour les icônes.

## 📂 Structure du projet

```
Spotify-NodeJS-Express
├── database
│   ├── db.js              # Configuration de la base de données
│   ├── music.db
│   └── sessions.db        # Fichier de sessions (SQLite)
├── public
│   ├── css                # Fichiers CSS statiques
│   ├── uploads            # Dossier pour les fichiers téléchargés
├── routes
│   ├── auth.js            # Routes pour l'authentification
│   ├── music.js           # Routes pour la gestion des morceaux
├── views
│   ├── base.twig          # Template de base
│   ├── index.twig         # Page d'accueil
│   ├── music
│   |    ├── list.twig      # Liste des morceaux
│   |    └── play.twig      # Page de lecture des morceaux
│   ├── auth
│       ├── login.twig      
│       └── list.twig      
├── .env                   # Variables d'environnement
├── app.js                 # Point d'entrée principal de l'application
├── package.json           # Dépendances et scripts Node.js
└── README.md              # Documentation
```

## ⚙️ Prérequis

- **Node.js** (v16 ou supérieur)
- **npm**
- **SQLite**
- **yt-dlp** installé globalement ou localement
- **ffmpeg** installé et accessible via le PATH

## 📝 Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/NicolasRbls/Spotify-NodeJS-Express.git
   cd Spotify-NodeJS-Express
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Avoir la base : 
    ```bash
    node .\database\db.js 
    ```
4. Configurez les variables d'environnement dans un fichier `.env` :
   ```env
   YOUTUBE_API_KEY=Votre_Cle_API_Youtube
   ```
5. Assurez-vous que `yt-dlp` et `ffmpeg` sont installés et accessibles :
   ```bash
   yt-dlp --version
   ffmpeg -version
   ```
6. Lancez l'application :
   ```bash
   node app.js
   ```

## 🔑 Authentification

- Les utilisateurs doivent créer un compte ou se connecter pour accéder à la gestion des morceaux.

## 🌟 Utilisation

### Page d'accueil

- Une interface rétro avec des blocs d'informations sur les fonctionnalités.

### Gestion des morceaux

1. **Ajouter un morceau :**
   - Remplissez les champs requis et ajoutez un fichier MP3.
2. **Télécharger depuis YouTube :**
   - Recherchez une chanson et cliquez sur `Télécharger`.
3. **Écouter ou supprimer un morceau :**
   - Cliquez sur `Écouter` pour jouer un morceau ou sur `Supprimer` pour l'enlever.

### Recherche de morceaux

- Une barre de recherche permet de filtrer les morceaux dans la liste.

## 🛡️ Sécurité

- Les mots de passe sont hachés avant d'être enregistrés.
- Les sessions utilisateur sont sécurisées grâce à des cookies et des tokens de session.

## 🐛 Dépannage

1. **Erreur : `yt-dlp` ou `ffmpeg` non trouvé :**
   - Assurez-vous que ces outils sont installés et configurés dans votre PATH.
2. **Problème d'accès à la base de données :**
   - Vérifiez que le fichier SQLite est correctement configuré dans `db.js`.

## 📜 Licence

Ce projet est sous licence MIT.