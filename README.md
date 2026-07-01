# Album Finder with Spotify API

A beginner-friendly web development project that lets users search for a music artist and view their Spotify albums and singles.

## Features

- Search for an artist by name
- Display artist name, image, followers, genres, and Spotify profile link
- Display albums and singles with cover art, title, release date, track count, and Spotify link
- Loading and error messages
- Responsive UI for desktop and mobile
- Backend API route keeps Spotify credentials hidden from the frontend

## Tech Stack

- HTML
- CSS
- JavaScript
- Vite
- Node.js
- Express
- Spotify Web API

## File Structure

```text
album-finder-spotify-api/
├── server/
│   └── server.js
├── src/
│   ├── main.js
│   └── style.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── README.md
```

## Getting Spotify API Credentials

1. Go to the Spotify Developer Dashboard.
2. Log in with your Spotify account.
3. Create a new app.
4. Copy your Client ID and Client Secret.
5. Create a `.env` file in this project using `.env.example` as a guide.

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
PORT=3000
```

Do not commit your `.env` file to GitHub.

## Setup Instructions

Install dependencies:

```bash
npm install
```

Start the frontend and backend together:

```bash
npm run dev
```

Open the Vite URL shown in your terminal, usually:

```text
http://localhost:5173
```

## How It Works

1. The user types an artist name into the search form.
2. The frontend sends a request to the backend route: `/api/search?artist=artistName`.
3. The backend safely uses Spotify Client Credentials Flow to get an access token.
4. The backend searches Spotify for the artist.
5. The backend uses the artist ID to fetch albums and singles.
6. The frontend displays the artist information and album cards.

## Suggested GitHub Repo Name

```text
album-finder-spotify-api
```

## Suggested Commit Messages

```text
git commit -m "Set up Vite and Express project structure"
git commit -m "Add Spotify API backend search route"
git commit -m "Build responsive album finder UI"
git commit -m "Add loading and error states"
git commit -m "Write README and setup instructions"
```

## Resume Bullet

Built a responsive Album Finder web app using JavaScript, Vite, Express, and the Spotify Web API to search artists, fetch album data securely through a backend proxy, and display artist metadata, album covers, release dates, and external Spotify links.
