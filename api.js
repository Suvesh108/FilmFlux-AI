// 🔑 Add your API keys here (get free at themoviedb.org)
const TMDB_API_KEY = 'your API key'; // Get from: https://www.themoviedb.org/settings/api
const GEMINI_API_KEY = 'your API key'; // Get from: https://makersuite.google.com/app/apikey

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const IMAGE_ORIGINAL_URL = 'https://image.tmdb.org/t/p/original';

const api = {
    // TMDB API Calls - Fetch real data from the internet
    async getTrending(page = 1) {
        try {
            const response = await fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching trending movies:", error);
            return { results: [] };
        }
    },

    async searchMovies(query, page = 1) {
        try {
            const response = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`);
            return await response.json();
        } catch (error) {
            console.error("Error searching movies:", error);
            return { results: [] };
        }
    },

    async getMovieDetails(id) {
        try {
            const response = await fetch(`${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching movie details:", error);
            return null;
        }
    },

    async getRecommendations(id) {
        try {
            const response = await fetch(`${TMDB_BASE_URL}/movie/${id}/recommendations?api_key=${TMDB_API_KEY}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            return { results: [] };
        }
    },

    // Gemini AI - Generate real AI descriptions
    async generateDescription(title, overview) {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
            return "⚠️ Please add your Gemini API Key in api.js to enable AI descriptions.";
        }

        const prompt = `Write a short, engaging, and futuristic description for the movie "${title}". Here is the standard overview: "${overview}". Make it sound exciting and tech-savvy.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text;
            } else {
                return "AI generation failed. Please try again.";
            }
        } catch (error) {
            console.error("Error generating AI description:", error);
            return "Error connecting to AI service.";
        }
    },

    // Get list of all genres
    async getGenres() {
        try {
            const response = await fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching genres:", error);
            return { genres: [] };
        }
    },

    // Discover movies by genre
    async discoverByGenre(genreIds = [], page = 1) {
        try {
            const genreString = genreIds.join(',');
            const response = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreString}&page=${page}&sort_by=popularity.desc`);
            return await response.json();
        } catch (error) {
            console.error("Error discovering movies by genre:", error);
            return { results: [] };
        }
    },

    // Get watch providers (streaming availability)
    async getWatchProviders(movieId, region = 'US') {
        try {
            const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`);
            const data = await response.json();
            return data.results?.[region] || null;
        } catch (error) {
            console.error("Error fetching watch providers:", error);
            return null;
        }
    },

    // AI-powered search using Gemini
    async aiSearch(naturalQuery) {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
            return { error: "Please add your Gemini API Key to enable AI search." };
        }

        const prompt = `You are a movie expert. The user wants recommendations for: "${naturalQuery}".
        Return a JSON object with a list of 8 specific movie titles that best match this request.
        Format: { "recommended_movies": ["Movie Title 1", "Movie Title 2", ...] }
        Do not include markdown formatting. Only JSON.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            const data = await response.json();
            console.log("Gemini API Response:", JSON.stringify(data, null, 2));

            if (data.candidates && data.candidates.length > 0) {
                const aiResponse = data.candidates[0].content.parts[0].text.trim();
                const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

                let recommendations;
                try {
                    recommendations = JSON.parse(cleanResponse);
                } catch (e) {
                    console.error("Failed to parse AI response:", cleanResponse);
                    return { error: "AI response was not valid JSON." };
                }

                if (!recommendations.recommended_movies || !Array.isArray(recommendations.recommended_movies)) {
                    return { error: "AI did not return a list of movies." };
                }

                // Fetch details for each recommended movie in parallel
                const moviePromises = recommendations.recommended_movies.map(async (title) => {
                    const searchResult = await this.searchMovies(title);
                    // Return the first match if it exists
                    return searchResult.results && searchResult.results.length > 0 ? searchResult.results[0] : null;
                });

                const movies = await Promise.all(moviePromises);
                // Filter out any that weren't found
                const validMovies = movies.filter(m => m !== null);

                return {
                    results: validMovies,
                    page: 1,
                    total_pages: 1,
                    aiInterpretation: { keywords: naturalQuery } // Keep for compatibility if needed
                };
            } else {
                return { error: "AI search failed. Please try again." };
            }
        } catch (error) {
            console.error("Error with AI search:", error);
            return { error: "Error connecting to AI service." };
        }
    },


    getImageUrl(path) {
        return path ? `${IMAGE_BASE_URL}${path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    },

    getOriginalImageUrl(path) {
        return path ? `${IMAGE_ORIGINAL_URL}${path}` : null;
    },

    checkKeys() {
        return TMDB_API_KEY !== 'YOUR_TMDB_API_KEY';
    }
};
