# 🎬 FilmFlux AI

**Interactive Movie Search Web App Powered by Google Gemini**

FilmFlux AI is an interactive web application that allows users to search and explore movies instantly. It combines the **TMDB API** for real-time movie data with **Google Gemini AI** or use any another Sto generate intelligent, context-aware movie descriptions and analysis.

---

## 🚀 Features

* 🔍 **Multi-Mode Search** – Search by **Title**, filter by **Genre**, or use **AI Natural Language** queries.
* 🤖 **AI-Enhanced Analysis** – Google Gemini generates rich, futuristic movie summaries and recommendations.
* ❤️ **Favorites System** – Save your favorite movies to a persistent local watchlist.
* 🎨 **Interactive UI** – Glassmorphism design with smooth animations and responsive layout.
* ⚡ **Real-Time Data** – Fetches up-to-date movie info (ratings, release dates, posters) from TMDB.
* � **Watch Providers** – See where to stream, rent, or buy movies (powered by JustWatch via TMDB).

---

## 🧠 How It Works

1. **Search**: Enter a movie title, select a genre, or ask the AI (e.g., "funny sci-fi movies from the 80s").
2. **Fetch**: The app queries the TMDB API for raw movie data.
3. **Enhance**: Google Gemini processes the details to provide unique insights.
4. **Explore**: View details, ratings, cast, and streaming availability in a beautiful modal interface.

---

## 📦 Installation & Usage

This is a **static web application** built with HTML, CSS, and Vanilla JavaScript. No build step or package manager is required.

### Option 1: Direct Open
Simply double-click `index.html` to open it in your web browser.

### Option 2: Live Server (Recommended)
For the best experience (and to avoid CORS issues with some browsers), use a local server like VS Code's **Live Server** extension.

1. Open the project folder in VS Code.
2. Right-click `index.html` and select **"Open with Live Server"**.

### Configuration
To enable AI features and movie data, you must provide your own API keys in `api.js`:

1. Open `api.js`.
2. Insert your **TMDB API Key** (free from [themoviedb.org](https://www.themoviedb.org/documentation/api)).
3. Insert your **Google Gemini API Key** (free from [aistudio.google.com](https://aistudio.google.com/)).

```javascript
/* api.js */
const API_KEY = 'YOUR_TMDB_API_KEY';
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
```

---

## 📅 Roadmap

* 📽️ Include trailer previews
* 🌐 Multi-language support for UI
* 👤 User accounts for cross-device syncing

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

## 📜 License

This project is licensed under the **MIT License**.
