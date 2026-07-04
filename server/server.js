import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify credentials. Add them to your .env file.");
  }

  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ grant_type: "client_credentials" })
  });

  if (!response.ok) {
    throw new Error("Could not get Spotify access token.");
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return cachedToken;
}

async function spotifyRequest(endpoint) {
  const token = await getSpotifyToken();

  const response = await fetch(`${SPOTIFY_API_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify API error: ${response.status} ${errorText}`);
  }

  return response.json();
}

app.get("/api/search", async (req, res) => {
  try {
    const artistName = req.query.artist;

    if (!artistName || artistName.trim() === "") {
      return res.status(400).json({ message: "Please enter an artist name." });
    }

    const searchData = await spotifyRequest(
      `/search?${new URLSearchParams({
        q: artistName,
        type: "artist",
        limit: "1"
      })}`
    );

    const artist = searchData.artists?.items?.[0];

    if (!artist) {
      return res.status(404).json({ message: "No artist found. Try another name." });
    }

    const albumsData = await spotifyRequest(
      `/artists/${artist.id}/albums?${new URLSearchParams({
        include_groups: "album,single",
        limit: "20",
        market: "US"
      })}`
    );

    const uniqueAlbums = removeDuplicateAlbums(albumsData.items || []);

    res.json({
      artist: {
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url || null,
        followers: artist.followers?.total || 0,
        genres: artist.genres || [],
        spotifyUrl: artist.external_urls?.spotify || "#"
      },
      albums: uniqueAlbums.map((album) => ({
        id: album.id,
        name: album.name,
        image: album.images?.[0]?.url || null,
        releaseDate: album.release_date,
        totalTracks: album.total_tracks,
        albumType: album.album_type,
        spotifyUrl: album.external_urls?.spotify || "#"
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong while fetching Spotify data." });
  }
});

function removeDuplicateAlbums(albums) {
  const seen = new Set();

  return albums.filter((album) => {
    const normalizedName = album.name.toLowerCase().trim();

    if (seen.has(normalizedName)) {
      return false;
    }

    seen.add(normalizedName);
    return true;
  });
}

// Serve the Vite frontend after Render runs npm run build
const distPath = path.join(__dirname, "../dist");

app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
