import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

// These variables live only on the backend, not in the browser.
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify credentials. Add them to your .env file.");
  }

  // Reuse the access token until it is close to expiring.
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

  // Spotify usually returns 3600 seconds. Subtract 60 seconds as a safety buffer.
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

    // First, search Spotify for the artist.
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

    // Then, use the artist ID to get albums and singles.
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
    // Spotify may return multiple editions of the same album.
    const normalizedName = album.name.toLowerCase().trim();

    if (seen.has(normalizedName)) {
      return false;
    }

    seen.add(normalizedName);
    return true;
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
