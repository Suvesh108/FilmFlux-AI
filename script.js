// FilmFlux AI - Main Script
// api object is loaded from api.js before this script

// State
let currentPage = 1;
let currentQuery = '';
let currentView = 'home'; // 'home', 'search', 'favorites', 'genre', 'ai'
let searchMode = 'text'; // 'text', 'genre', 'ai'
let selectedGenres = []; // Array of selected genre IDs
let allGenres = []; // List of all available genres
let favorites = JSON.parse(localStorage.getItem('flimflux_favorites')) || [];


// DOM Elements
const searchInput = document.getElementById('search-input');
const movieGrid = document.getElementById('movie-grid');
const pagination = document.getElementById('pagination');
const prevBtn = document.getElementById('prev-page');
const nextBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const navHome = document.getElementById('nav-home');
const navFavorites = document.getElementById('nav-favorites');
const bgOverlay = document.getElementById('bg-overlay');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the movie details page
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (movieId) {
        loadMoviePage(movieId);
    } else {
        // We are on the home/index page
        if (!api.checkKeys()) {
            alert('🔑 API Key Required!\n\nGet a FREE TMDB API key in 2 minutes:\n\n1. Go to: themoviedb.org/signup\n2. Sign up (free)\n3. Settings → API → Request Key\n4. Add key to api.js\n5. Refresh this page\n\nThen search for Batman and enjoy real movie data!');
        }

        // Check for view param (e.g. favorites)
        const viewParam = urlParams.get('view');
        if (viewParam === 'favorites') {
            currentView = 'favorites';
            updateNav();
            loadFavorites();
        } else {
            loadTrending();
        }

        setupEventListeners();
    }
});

function setupEventListeners() {
    // Search Mode Selector
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            switchSearchMode(mode);
        });
    });

    // Text Search with Debounce
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let timeout = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const query = e.target.value.trim();
                if (query) {
                    currentQuery = query;
                    currentPage = 1;
                    currentView = 'search';
                    searchMovies(query);
                } else {
                    currentView = 'home';
                    loadTrending();
                }
            }, 500);
        });
    }

    // AI Search Button
    const aiSearchBtn = document.getElementById('ai-search-btn');
    const aiSearchInput = document.getElementById('ai-search-input');
    if (aiSearchBtn && aiSearchInput) {
        aiSearchBtn.addEventListener('click', async () => {
            const query = aiSearchInput.value.trim();
            if (!query) return;

            aiSearchBtn.disabled = true;
            aiSearchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';

            await performAISearch(query);

            aiSearchBtn.disabled = false;
            aiSearchBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Search';
        });

        // Allow Enter key to trigger search
        aiSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                aiSearchBtn.click();
            }
        });
    }

    // Pagination
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                handlePageChange();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentPage++;
            handlePageChange();
        });
    }

    // Navigation
    const navHome = document.getElementById('nav-home');
    const navFavorites = document.getElementById('nav-favorites');
    if (navHome) {
        navHome.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    if (navFavorites) {
        navFavorites.addEventListener('click', () => {
            window.location.href = 'index.html?view=favorites';
        });
    }
}

// Switch between search modes
function switchSearchMode(mode) {
    searchMode = mode;

    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Show/hide appropriate search container
    document.getElementById('text-search-mode').classList.toggle('hidden', mode !== 'text');
    document.getElementById('genre-search-mode').classList.toggle('hidden', mode !== 'genre');
    document.getElementById('ai-search-mode').classList.toggle('hidden', mode !== 'ai');

    // Load genre chips if switching to genre mode
    if (mode === 'genre' && allGenres.length === 0) {
        loadGenres();
    }

    // Reset to trending if switching modes
    if (mode === 'text') {
        currentView = 'home';
        loadTrending();
    }
}

// Load and display genre chips
async function loadGenres() {
    const genresData = await api.getGenres();
    allGenres = genresData.genres || [];

    const container = document.getElementById('genre-chips');
    if (!container) return;

    container.innerHTML = '';

    allGenres.forEach(genre => {
        const chip = document.createElement('div');
        chip.className = 'genre-chip';
        chip.textContent = genre.name;
        chip.dataset.genreId = genre.id;

        chip.addEventListener('click', () => {
            toggleGenre(genre.id, chip);
        });

        container.appendChild(chip);
    });
}

// Toggle genre selection
function toggleGenre(genreId, chipElement) {
    console.log("Toggling genre:", genreId);
    const index = selectedGenres.indexOf(genreId);

    if (index === -1) {
        selectedGenres.push(genreId);
        chipElement.classList.add('active');
    } else {
        selectedGenres.splice(index, 1);
        chipElement.classList.remove('active');
    }
    console.log("Selected genres:", selectedGenres);

    // Search by selected genres
    if (selectedGenres.length > 0) {
        currentView = 'genre';
        currentPage = 1;
        searchByGenre();
    } else {
        currentView = 'home';
        loadTrending();
    }
}

// Search movies by genre
async function searchByGenre() {
    console.log("Searching by genre...");
    showSkeleton();
    try {
        const data = await api.discoverByGenre(selectedGenres, currentPage);
        console.log("Genre search results:", data);
        renderGrid(data.results);
        updatePagination(data.page, data.total_pages);
    } catch (error) {
        console.error("Error in searchByGenre:", error);
    }
}

// AI-powered search
async function performAISearch(query) {
    currentView = 'ai';
    currentPage = 1;
    showSkeleton();

    const data = await api.aiSearch(query);

    if (data.error) {
        const movieGrid = document.getElementById('movie-grid');
        if (movieGrid) {
            movieGrid.innerHTML = `
                <div style="text-align:center; grid-column: 1/-1; padding: 2rem;">
                    <p style="color: #ff6b6b; font-size: 1.2rem; margin-bottom: 1rem;">${data.error}</p>
                    <p>Please check your <strong>Gemini API Key</strong> in <code>api.js</code>.</p>
                </div>
            `;
        }
        return;
    }

    renderGrid(data.results);
    updatePagination(data.page, data.total_pages);
}


function updateNav() {
    if (!navHome || !navFavorites) return;

    if (currentView === 'favorites') {
        navFavorites.classList.add('active');
        navHome.classList.remove('active');
        if (pagination) pagination.classList.add('hidden');
    } else {
        navHome.classList.add('active');
        navFavorites.classList.remove('active');
    }
}

function handlePageChange() {
    if (currentView === 'home') {
        loadTrending();
    } else if (currentView === 'search') {
        searchMovies(currentQuery);
    } else if (currentView === 'genre') {
        searchByGenre();
    } else if (currentView === 'ai') {
        performAISearch(document.getElementById('ai-search-input').value);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadTrending() {
    showSkeleton();
    const data = await api.getTrending(currentPage);
    renderGrid(data.results);
    updatePagination(data.page, data.total_pages);
}

async function searchMovies(query) {
    showSkeleton();
    const data = await api.searchMovies(query, currentPage);
    renderGrid(data.results);
    updatePagination(data.page, data.total_pages);
}

function loadFavorites() {
    if (favorites.length === 0) {
        movieGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 2rem;">No favorites yet. Start exploring!</p>';
        return;
    }
    renderFavoritesGrid();
}

async function renderFavoritesGrid() {
    showSkeleton();

    const promises = favorites.map(id => api.getMovieDetails(id));
    const results = await Promise.all(promises);

    renderGrid(results.filter(m => m)); // Filter out nulls
}

function showSkeleton() {
    if (!movieGrid) return;
    movieGrid.innerHTML = '';
    const skeletonCount = 10; // Number of skeletons to show
    for (let i = 0; i < skeletonCount; i++) {
        const card = document.createElement('div');
        card.className = 'movie-card skeleton skeleton-card';
        movieGrid.appendChild(card);
    }
}

function renderGrid(movies) {
    if (!movieGrid) return;
    movieGrid.innerHTML = '';

    if (!movies || movies.length === 0) {
        movieGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No movies found.</p>';
        if (pagination) pagination.classList.add('hidden');
        return;
    }

    movies.forEach((movie, index) => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.style.animationDelay = `${index * 0.05}s`; // Staggered animation
        card.innerHTML = `
            <div class="poster-container">
                <img src="${api.getImageUrl(movie.poster_path)}" alt="${movie.title}" loading="lazy">
            </div>
            <div class="movie-info">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-meta">
                    <span class="year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                    <span class="rating"><i class="fa-solid fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                </div>
            </div>
        `;
        // Navigate to movie page on click
        card.addEventListener('click', () => {
            window.location.href = `movie.html?id=${movie.id}`;
        });
        movieGrid.appendChild(card);
    });
}

function updatePagination(page, totalPages) {
    if (!pagination) return;

    if (totalPages <= 1) {
        pagination.classList.add('hidden');
    } else {
        pagination.classList.remove('hidden');
        pageInfo.textContent = `Page ${page} of ${totalPages}`;
        prevBtn.disabled = page === 1;
        nextBtn.disabled = page === totalPages;
    }
}

// --- Movie Details Page Logic ---

async function loadMoviePage(movieId) {
    const contentDiv = document.getElementById('movie-content');
    if (!contentDiv) return;

    const movie = await api.getMovieDetails(movieId);
    if (!movie) {
        contentDiv.innerHTML = '<p style="text-align:center; padding: 2rem;">Movie not found.</p>';
        return;
    }

    // Dynamic Background Effect
    const originalPoster = api.getOriginalImageUrl(movie.poster_path);
    if (originalPoster && bgOverlay) {
        bgOverlay.style.background = `
            linear-gradient(to bottom, rgba(15, 15, 19, 0.8), var(--bg-color)),
            url(${originalPoster}) no-repeat center center/cover
        `;
    }

    // Render Details
    contentDiv.innerHTML = `
        <div class="modal-body" style="padding: 0;">
            <div class="modal-poster">
                <img src="${api.getImageUrl(movie.poster_path)}" alt="${movie.title}">
            </div>
            <div class="modal-info">
                <h2>${movie.title}</h2>
                <div class="modal-meta">
                    <span>${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                    <span><i class="fa-solid fa-star"></i> ${movie.vote_average.toFixed(1)}</span>
                </div>

                ${movie.spoken_languages && movie.spoken_languages.length > 0 ? `
                    <div class="languages-section">
                        <h4><i class="fa-solid fa-language"></i> Available Languages</h4>
                        <div class="language-tags">
                            ${movie.spoken_languages.map(lang => `
                                <span class="language-tag">${lang.english_name}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div id="watch-providers-container"></div>

                <p class="overview-text">${movie.overview}</p>
                
                <div class="ai-section">
                    <h3><i class="fa-solid fa-robot"></i> AI Analysis</h3>
                    <div id="ai-content" class="ai-content">
                        <p class="placeholder-text">Click "Generate AI Description" to get a futuristic insight.</p>
                    </div>
                    <button id="generate-ai-btn" class="ai-btn">Generate AI Description</button>
                </div>

                <div class="modal-actions">
                    <button id="page-fav-btn" class="fav-btn"><i class="fa-regular fa-heart"></i> Add to Favorites</button>
                </div>
            </div>
        </div>
        
        <div class="recommendations-section">
            <h3>You might also like</h3>
            <div id="recommendations-grid" class="rec-grid">
                <!-- Recommendations injected here -->
            </div>
        </div>
    `;

    // AI Logic
    const aiBtn = document.getElementById('generate-ai-btn');
    const aiContent = document.getElementById('ai-content');

    aiBtn.onclick = async () => {
        aiBtn.disabled = true;
        aiBtn.textContent = 'Generating...';
        aiContent.innerHTML = '<p>Thinking...</p>';

        const description = await api.generateDescription(movie.title, movie.overview);
        aiContent.innerHTML = `<p>${description}</p>`;
        aiBtn.textContent = 'Regenerate';
        aiBtn.disabled = false;
    };

    // Favorites Logic
    const favBtn = document.getElementById('page-fav-btn');
    updatePageFavBtn(movieId, favBtn);

    favBtn.onclick = () => {
        toggleFavorite(movieId);
        updatePageFavBtn(movieId, favBtn);
    };

    // Watch Providers
    loadWatchProviders(movieId);

    // Recommendations
    loadRecommendations(movieId);
}

async function loadWatchProviders(movieId) {
    const providers = await api.getWatchProviders(movieId, 'US');
    const container = document.getElementById('watch-providers-container');
    if (!container) return;

    if (!providers || (!providers.flatrate && !providers.rent && !providers.buy)) {
        return; // Don't show section if no providers available
    }

    let html = '<div class="watch-providers-section"><h3><i class="fa-solid fa-tv"></i> Where to Watch</h3>';

    if (providers.flatrate && providers.flatrate.length > 0) {
        html += '<div style="margin-bottom: 1rem;"><h4 style="font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-bottom: 0.5rem;">Stream</h4><div class="provider-logos">';
        providers.flatrate.forEach(provider => {
            html += `
                <div class="provider-logo" title="${provider.provider_name}">
                    <img src="https://image.tmdb.org/t/p/original${provider.logo_path}" alt="${provider.provider_name}">
                </div>
            `;
        });
        html += '</div></div>';
    }

    if (providers.rent && providers.rent.length > 0) {
        html += '<div style="margin-bottom: 1rem;"><h4 style="font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-bottom: 0.5rem;">Rent</h4><div class="provider-logos">';
        providers.rent.forEach(provider => {
            html += `
                <div class="provider-logo" title="${provider.provider_name}">
                    <img src="https://image.tmdb.org/t/p/original${provider.logo_path}" alt="${provider.provider_name}">
                </div>
            `;
        });
        html += '</div></div>';
    }

    html += '<p style="font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-top: 1rem;">Data provided by JustWatch</p></div>';
    container.innerHTML = html;
}


async function loadRecommendations(id) {
    const data = await api.getRecommendations(id);
    const container = document.getElementById('recommendations-grid');
    if (!container) return;

    container.innerHTML = '';

    if (data.results && data.results.length > 0) {
        data.results.slice(0, 4).forEach(movie => {
            const card = document.createElement('div');
            card.className = 'rec-card';
            card.innerHTML = `
                <img src="${api.getImageUrl(movie.poster_path)}" alt="${movie.title}">
                <div class="rec-title">${movie.title}</div>
            `;
            card.addEventListener('click', () => {
                window.location.href = `movie.html?id=${movie.id}`;
            });
            container.appendChild(card);
        });
    } else {
        container.innerHTML = '<p>No recommendations available.</p>';
    }
}

function toggleFavorite(id) {
    // Reload favorites from storage to ensure sync
    favorites = JSON.parse(localStorage.getItem('flimflux_favorites')) || [];

    const index = favorites.indexOf(id);
    if (index === -1) {
        favorites.push(id);
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('flimflux_favorites', JSON.stringify(favorites));
}

function updatePageFavBtn(id, btn) {
    // Reload favorites to check status
    favorites = JSON.parse(localStorage.getItem('flimflux_favorites')) || [];

    if (favorites.includes(id)) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fa-solid fa-heart"></i> Remove from Favorites';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fa-regular fa-heart"></i> Add to Favorites';
    }
}
