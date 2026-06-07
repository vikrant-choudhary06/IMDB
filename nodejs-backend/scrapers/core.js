import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept": "application/json, text/plain, */*"
};

// 1. Search by String (using IMDb suggestions API)
export const searchByString = async (query, limit = 20) => {
    try {
        const url = `https://v3.sg.media-imdb.com/suggestion/i/${encodeURIComponent(query)}.json`;
        const res = await axios.get(url, { headers: HEADERS, params: { includeVideos: 1 } });
        
        const results = [];
        const suggestions = res.data.d || [];
        
        for (const item of suggestions.slice(0, limit)) {
            let itemType = "Unknown";
            if (item.id.startsWith("tt")) {
                if (item.q === "TV series" || item.q === "TV mini-series") itemType = "TV Series";
                else if (item.q === "video game") itemType = "Video Game";
                else itemType = "Title";
            } else if (item.id.startsWith("nm")) {
                itemType = "Person";
            } else if (item.id.startsWith("co")) {
                itemType = "Company";
            }

            results.push({
                id: item.id,
                title: item.l,
                type: itemType,
                year: item.y || null,
                image: item.i ? item.i.imageUrl : null,
                roles: item.s ? item.s.split(', ') : []
            });
        }
        return results;
    } catch (e) {
        console.error("Search Error:", e.message);
        return [];
    }
};

// 2. Trending Movies (using GraphQL)
export const getTrendingMovies = async (count = 8) => {
    try {
        const url = "https://caching.graphql.imdb.com/";
        const headers = {
            "accept": "application/graphql+json, application/json",
            "content-type": "application/json",
            "origin": "https://www.imdb.com",
            "user-agent": HEADERS["User-Agent"]
        };
        const query = `
        query GetTrendingMovies {
          meterTitleConnection(
            first: ${count}
            sort: { by: RANK, order: ASC }
            filter: { meterRank: { rankType: MOVIEMETER } }
          ) {
            edges {
              node {
                title {
                  id
                  titleText { text }
                  releaseYear { year }
                  ratingsSummary { aggregateRating }
                  primaryImage { url }
                  genres { genres { text } }
                }
              }
            }
          }
        }
        `;
        const res = await axios.post(url, { query }, { headers });
        const edges = res.data?.data?.meterTitleConnection?.edges || [];
        
        return edges.map((edge, index) => {
            const node = edge.node.title;
            return {
                id: node.id,
                title: node.titleText?.text,
                release_year: node.releaseYear?.year,
                rating: node.ratingsSummary?.aggregateRating,
                genres: node.genres?.genres?.map(g => g.text) || [],
                poster_url: node.primaryImage?.url,
                rank: index + 1
            };
        });
    } catch (e) {
        console.error("Trending Error:", e.message);
        return [];
    }
};

// 3. Charts (Top 250) (using HTML parsing via Cheerio)
export const getChart = async (chartType = "top", limit = 250) => {
    try {
        const urlMap = {
            "top": "https://m.imdb.com/chart/top/",
            "moviemeter": "https://m.imdb.com/chart/moviemeter/",
            "bottom": "https://m.imdb.com/chart/bottom/"
        };
        const url = urlMap[chartType] || urlMap["top"];
        const res = await axios.get(url, { headers: HEADERS });
        
        // Extract JSON-LD script from the page
        const $ = cheerio.load(res.data);
        const scriptData = $('script[type="application/ld+json"]').html();
        
        if (!scriptData) return [];
        const json = JSON.parse(scriptData);
        const items = json.itemListElement || [];
        
        return items.slice(0, limit).map((item, index) => {
            const idMatch = item.url.match(/\/title\/(tt\d+)/);
            return {
                id: idMatch ? idMatch[1] : null,
                title: item.name,
                url: item.url,
                rank: index + 1
            };
        });
    } catch (e) {
        console.error("Chart Error:", e.message);
        return [];
    }
};

// 4. Movie Details (Basic GraphQL)
export const getMovieDetails = async (id) => {
    try {
        const url = "https://caching.graphql.imdb.com/";
        const headers = {
            "accept": "application/graphql+json, application/json",
            "content-type": "application/json",
            "origin": "https://www.imdb.com",
            "user-agent": HEADERS["User-Agent"]
        };
        const query = `
        query GetTitleDetails($id: ID!) {
          title(id: $id) {
            id
            titleText { text }
            releaseYear { year }
            ratingsSummary { aggregateRating }
            primaryImage { url }
            plot { plotText { plainText } }
            genres { genres { text } }
            principalCredits {
                category { text }
                credits { name { nameText { text } id } }
            }
          }
        }
        `;
        const res = await axios.post(url, { query, variables: { id } }, { headers });
        const data = res.data?.data?.title;
        if (!data) return null;
        
        const cast = [];
        data.principalCredits?.forEach(pc => {
            if (pc.category?.text === "Actors") {
                pc.credits?.forEach(c => {
                    cast.push({ name: c.name?.nameText?.text, url: `/name/${c.name?.id}/` });
                });
            }
        });
        
        return {
            id: data.id,
            title: data.titleText?.text,
            year: data.releaseYear?.year,
            rating: data.ratingsSummary?.aggregateRating,
            poster: data.primaryImage?.url,
            description: data.plot?.plotText?.plainText,
            genres: data.genres?.genres?.map(g => g.text) || [],
            cast: cast,
            videos: [],
            images: [],
            reviews: [],
            streaming: []
        };
    } catch (e) {
        console.error("Movie Details Error:", e.message);
        return null;
    }
};
