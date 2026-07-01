import "./style.css";

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="page-shell">
    <section class="hero">
      <p class="eyebrow">Spotify Web API Project</p>
      <h1>Album Finder</h1>
      <p class="hero-text">
        Search for an artist and explore their albums, singles, release dates, and Spotify links.
      </p>

      <form id="search-form" class="search-form">
        <input
          id="artist-input"
          type="text"
          placeholder="Try Taylor Swift, Drake, Arijit Singh..."
          aria-label="Artist name"
        />
        <button type="submit">Search</button>
      </form>
    </section>

    <section id="status" class="status hidden"></section>
    <section id="results" class="results"></section>
  </main>
`;

const form = document.querySelector("#search-form");
const input = document.querySelector("#artist-input");
const statusBox = document.querySelector("#status");
const results = document.querySelector("#results");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const artistName = input.value.trim();

  if (!artistName) {
    showStatus("Please type an artist name first.", "error");
    return;
  }

  showStatus("Searching Spotify...", "loading");
  results.innerHTML = "";

  try {
    const response = await fetch(`/api/search?artist=${encodeURIComponent(artistName)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not find artist.");
    }

    hideStatus();
    renderResults(data.artist, data.albums);
  } catch (error) {
    showStatus(error.message, "error");
  }
});

function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
}

function hideStatus() {
  statusBox.className = "status hidden";
  statusBox.textContent = "";
}

function renderResults(artist, albums) {
  const genreText = artist.genres.length > 0 ? artist.genres.join(", ") : "No genres listed";
  const followerText = new Intl.NumberFormat("en-US").format(artist.followers);

  results.innerHTML = `
    <article class="artist-card">
      <img
        src="${artist.image || "https://placehold.co/300x300?text=No+Image"}"
        alt="${artist.name}"
      />
      <div>
        <p class="eyebrow">Artist</p>
        <h2>${artist.name}</h2>
        <p><strong>Followers:</strong> ${followerText}</p>
        <p><strong>Genres:</strong> ${genreText}</p>
        <a href="${artist.spotifyUrl}" target="_blank" rel="noreferrer">Open artist on Spotify</a>
      </div>
    </article>

    <div class="section-heading">
      <h2>Albums & Singles</h2>
      <p>${albums.length} results found</p>
    </div>

    <div class="album-grid">
      ${albums.map(createAlbumCard).join("")}
    </div>
  `;
}

function createAlbumCard(album) {
  return `
    <article class="album-card">
      <img
        src="${album.image || "https://placehold.co/300x300?text=No+Cover"}"
        alt="${album.name} album cover"
      />
      <div class="album-content">
        <span>${album.albumType}</span>
        <h3>${album.name}</h3>
        <p>Released: ${album.releaseDate}</p>
        <p>${album.totalTracks} tracks</p>
        <a href="${album.spotifyUrl}" target="_blank" rel="noreferrer">Listen on Spotify</a>
      </div>
    </article>
  `;
}
