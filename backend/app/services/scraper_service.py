import asyncio
import re
import requests
from concurrent.futures import ThreadPoolExecutor

# Crucial import: Load sys path helper to resolve scraper folder imports
import backend.app.utils.sys_path_helper

# Scraper module imports
from ImdbDataExtraction.search_by_string.search_by_string import search_all as raw_search_all, format_results as raw_format_search
from ImdbDataExtraction.search_by_id.search_movie import get_movie_details, format_movie_details
from ImdbDataExtraction.movie_info_downloader.download_movie_info import get_movie_info
from ImdbDataExtraction.trending_downloader.trending_movies import get_trending_movies, extract_movie_ids
from ImdbDataExtraction.trending_downloader.trending_trailers import get_trending_trailers
from ImdbDataExtraction.chart_downloader.chart_titles import get_all_chart_titles
from ImdbDataExtraction.images_dowloader.images_downloader import fetch_page as fetch_images_page, extract_images
from ImdbDataExtraction.videos_downloader.extract_video_ids_from_gallery import get_all_title_videos, get_video_urls
from ImdbDataExtraction.review_downloader.reviews import fetch_page as fetch_reviews_page
from ImdbDataExtraction.news_downloader.latest_movie_news import fetch_news_page, extract_news_items
from ImdbDataExtraction.people_downloader.scrape_all_people import fetch_page as fetch_people_page, extract_people
from ImdbDataExtraction.streaming_availability.streaming_checker import get_streaming_availability
from ImdbDataExtraction.justwatch_downloader.justwatch_popular import fetch_popular
from ImdbDataExtraction.rottentomatoes_downloader.rt_reviews_by_imdb import fetch_reviews_by_imdb_id
from ImdbDataExtraction.rottentomatoes_downloader.rt_title_page import extract_title_page
from ImdbDataExtraction.rottentomatoes_downloader.rt_search import search_content as search_rt_content
from ImdbDataExtraction.rottentomatoes_downloader.rt_reviews_by_imdb import ranked_candidates, resolve_rt_match, search_query_for_imdb_title
from ImdbDataExtraction.season_episodes.get_season_episodes import get_season_episodes
from ImdbDataExtraction.search_by_filters.search_by_filters import search_by_genre

# Create a ThreadPoolExecutor for running blocking requests in parallel
executor = ThreadPoolExecutor(max_workers=20)

async def run_in_thread(func, *args, **kwargs):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(executor, lambda: func(*args, **kwargs))

# 1. Search by String
async def search_by_string(query: str, limit: int = 20):
    def _search():
        data = raw_search_all(query, limit)
        results = raw_format_search(data, limit)
        return results
    return await run_in_thread(_search)

# 2. Search by ID & Movie Info (Unified)
async def get_title_details(title_id: str):
    # Fetch primary movie details, reviews, streaming, and trailer in parallel
    def _fetch_all():
        # Get primary detailed data (GraphQL)
        raw_details = get_movie_details(title_id)
        details = format_movie_details(raw_details)
        if not details:
            return None
            
        # Get LD+JSON backup details
        try:
            ld_info = get_movie_info(title_id)
        except Exception:
            ld_info = None

        if ld_info:
            details["description"] = details.get("plot") or ld_info.get("description")
            
        # Fill cast details from enhanced actors or credits
        cast = details.get("enhanced_actors", [])
        if not cast and "Cast" in details.get("credits", {}):
            cast = details["credits"]["Cast"]
            
        # Format the required structure
        movie_obj = {
            "id": details.get("id"),
            "title": details.get("title"),
            "year": details.get("release_year"),
            "rating": details.get("rating"),
            "poster": details.get("poster_url"),
            "description": details.get("plot") or (ld_info.get("description") if ld_info else ""),
            "genres": details.get("genres", []),
            "cast": cast,
            "videos": [],
            "images": [],
            "reviews": [],
            "streaming": []
        }
        return movie_obj, details
        
    result = await run_in_thread(_fetch_all)
    if not result:
        return None
        
    movie_obj, details = result
    
    # Async fetch secondary enrichments: videos, reviews, streaming, images
    tasks = [
        get_title_videos_async(title_id),
        get_title_reviews_async(title_id),
        get_title_streaming_async(title_id),
        get_title_images_async(title_id)
    ]
    videos, reviews, streaming, images = await asyncio.gather(*tasks)
    
    movie_obj["videos"] = videos[:10] if videos else []
    movie_obj["reviews"] = reviews[:10] if reviews else []
    movie_obj["streaming"] = streaming if streaming else []
    movie_obj["images"] = images[:12] if images else []
    
    return movie_obj

# 3. Trending Movies
async def get_trending(count: int = 8):
    def _fetch():
        data = get_trending_movies(count=count, data_window="HOURS")
        movies = extract_movie_ids(data)
        return movies
    return await run_in_thread(_fetch)

# 4. Charts (Top 250, Popular, Box Office)
async def get_chart(chart_type: str, limit: int = 250):
    def _fetch():
        if chart_type == "top250":
            return get_all_chart_titles("top", limit=limit)
        elif chart_type == "popular":
            return get_all_chart_titles("moviemeter", limit=limit)
        elif chart_type == "boxoffice":
            # Call custom Box Office Mojo fallback scraper
            return fetch_box_office_mojo_sync()
        return []
    return await run_in_thread(_fetch)

def fetch_box_office_mojo_sync():
    """Scrape weekend Box Office Mojo table and enrich with IMDb IDs in parallel"""
    url = "https://www.boxofficemojo.com/weekend/chart/"
    headers = {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            return []
        html_text = response.text
        rows = re.findall(r'<tr.*?>(.*?)</tr>', html_text, re.DOTALL)
        box_office_list = []
        
        # Parse top 10 movies
        for idx, row in enumerate(rows[1:11], 1):
            cols = re.findall(r'<td.*?>(.*?)</td>', row, re.DOTALL)
            if len(cols) >= 10:
                rank = re.sub(r'<[^>]+>', '', cols[0]).strip()
                lw = re.sub(r'<[^>]+>', '', cols[1]).strip()
                title = re.sub(r'<[^>]+>', '', cols[2]).strip()
                weekend_gross = re.sub(r'<[^>]+>', '', cols[3]).strip()
                theaters = re.sub(r'<[^>]+>', '', cols[5]).strip()
                total_gross = re.sub(r'<[^>]+>', '', cols[8]).strip()
                weeks = re.sub(r'<[^>]+>', '', cols[9]).strip()
                distributor = re.sub(r'<[^>]+>', '', cols[10]).strip()
                
                # Resolve IMDb ID via suggestions API
                imdb_id = None
                poster_url = None
                year = None
                rating = None
                
                try:
                    s_data = raw_search_all(title, limit=3)
                    suggestions = raw_format_search(s_data, limit=3)
                    title_suggestions = [s for s in suggestions if s["type"] == "Title"]
                    if title_suggestions:
                        best_match = title_suggestions[0]
                        imdb_id = best_match["id"]
                        poster_url = best_match.get("image")
                        year = best_match.get("year")
                except Exception:
                    pass
                    
                box_office_list.append({
                    "rank": int(rank) if rank.isdigit() else idx,
                    "lw": lw,
                    "id": imdb_id,
                    "title": title,
                    "year": year,
                    "rating": rating,
                    "poster_url": poster_url,
                    "weekend_gross": weekend_gross,
                    "theaters": theaters,
                    "total_gross": total_gross,
                    "weeks": weeks,
                    "distributor": distributor
                })
        return box_office_list
    except Exception as e:
        print(f"Error parsing Box Office Mojo: {e}")
        return []

# 5. Get Title Images
async def get_title_images_async(title_id: str):
    def _fetch():
        data = fetch_images_page(title_id, after_cursor=None)
        images = []
        if "data" in data and data["data"] and "title" in data["data"] and data["data"]["title"]:
            if "images" in data["data"]["title"] and data["data"]["title"]["images"]:
                edges = data["data"]["title"]["images"].get("edges", [])
                for edge in edges:
                    node = edge.get("node", {})
                    if "url" in node:
                        images.append({
                            "url": node["url"],
                            "caption": node.get("caption", {}).get("plainText") if node.get("caption") else None,
                            "width": node.get("width"),
                            "height": node.get("height")
                        })
        return images
    return await run_in_thread(_fetch)

# 6. Get Title Videos
async def get_title_videos_async(title_id: str):
    def _fetch():
        return get_all_title_videos(title_id, limit=20, max_pages=1)
    return await run_in_thread(_fetch)

# 7. Get Title Reviews
async def get_title_reviews_async(title_id: str):
    def _fetch():
        data = fetch_reviews_page(title_id, after_cursor=None)
        reviews = []
        if "data" in data and data["data"] and "title" in data["data"] and data["data"]["title"]:
            if "reviews" in data["data"]["title"] and data["data"]["title"]["reviews"]:
                edges = data["data"]["title"]["reviews"].get("edges", [])
                for edge in edges:
                    node = edge.get("node", {})
                    if node:
                        reviews.append({
                            "id": node.get("id"),
                            "author": node.get("author", {}).get("nickName") if node.get("author") else "Anonymous",
                            "rating": node.get("authorRating"),
                            "submission_date": node.get("submissionDate"),
                            "summary": node.get("summary", {}).get("originalText") if node.get("summary") else "",
                            "text": node.get("text", {}).get("originalText", {}).get("plainText") if node.get("text") else ""
                        })
        return reviews
    return await run_in_thread(_fetch)

# 8. News
async def get_news(id_or_category: str):
    def _fetch():
        # Check if it is a title ID
        if id_or_category.startswith("tt"):
            # Fetch news for a specific movie ID
            url = "https://caching.graphql.imdb.com/"
            headers = {
                "accept": "application/graphql+json, application/json",
                "content-type": "application/json",
                "origin": "https://www.imdb.com",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            }
            query = """
            query GetTitleNews($id: ID!) {
              title(id: $id) {
                news(first: 20) {
                  edges {
                    node {
                      id
                      articleTitle { plainText }
                      externalUrl
                      date
                      source { homepage { label url } }
                      text { plaidHtml }
                      image { url height width caption { plainText } }
                      byline
                    }
                  }
                }
              }
            }
            """
            payload = {"query": query, "variables": {"id": id_or_category}}
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            data = response.json()
            edges = data.get("data", {}).get("title", {}).get("news", {}).get("edges", [])
            news_items = []
            for edge in edges:
                node = edge.get("node", {})
                if node:
                    news_items.append({
                        "id": node.get("id"),
                        "title": node.get("articleTitle", {}).get("plainText") if node.get("articleTitle") else None,
                        "url": node.get("externalUrl"),
                        "source_label": node.get("source", {}).get("homepage", {}).get("label") if node.get("source") else None,
                        "source_url": node.get("source", {}).get("homepage", {}).get("url") if node.get("source") else None,
                        "published_at": node.get("date"),
                        "byline": node.get("byline"),
                        "text_html": node.get("text", {}).get("plaidHtml") if node.get("text") else None,
                        "image": node.get("image")
                    })
            return news_items
        else:
            # Map common filters
            category = id_or_category.upper()
            if category == "CELEB":
                category = "CELEBRITY"
            # Category query
            data = fetch_news_page(after=None, limit=20, category_filter=category, locale="en-US", original_title_text=False)
            if data:
                return extract_news_items(data, plain_text=True)
            return []
    return await run_in_thread(_fetch)

# 9. Get People / Actors details
async def get_people_details(name_or_id: str):
    def _fetch():
        person_id = name_or_id
        # If it's a name, search to resolve ID
        if not name_or_id.startswith("nm"):
            s_data = raw_search_all(name_or_id, limit=3)
            suggestions = raw_format_search(s_data, limit=3)
            people_suggestions = [s for s in suggestions if s["type"] == "Person"]
            if people_suggestions:
                person_id = people_suggestions[0]["id"]
            else:
                return None
                
        # Query details using name(id: $id)
        url = "https://caching.graphql.imdb.com/"
        headers = {
            "accept": "application/graphql+json, application/json",
            "content-type": "application/json",
            "origin": "https://www.imdb.com",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        }
        query = """
        query GetPerson($id: ID!) {
          name(id: $id) {
            id
            nameText { text }
            primaryImage { url width height }
            primaryProfessions { category { text id } }
            knownFor(first: 5) {
              edges {
                node {
                  title {
                    id
                    titleText { text }
                    releaseYear { year }
                    titleType { text }
                    ratingsSummary { aggregateRating }
                  }
                }
              }
            }
            birthDate { dateComponents { day month year } }
            deathDate { dateComponents { day month year } }
            birthLocation { text }
            height { measurement { value unit } }
            bio { text { plainText } }
            trivia(first: 5) { edges { node { text { plainText } } } }
            quotes(first: 3) { edges { node { text { plainText } } } }
            nickNames { text }
            akas(first: 10) { edges { node { text } } }
            meterRanking { currentRank }
          }
        }
        """
        payload = {"query": query, "variables": {"id": person_id}}
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        data = response.json()
        name_data = data.get("data", {}).get("name", {})
        if not name_data:
            return None
            
        # Parse professions
        professions = [p.get("category", {}).get("text") for p in name_data.get("primaryProfessions", []) if p.get("category")]
        
        # Parse known for
        known_for = []
        for edge in name_data.get("knownFor", {}).get("edges", []):
            title = edge.get("node", {}).get("title")
            if title:
                known_for.append({
                    "id": title.get("id"),
                    "title": title.get("titleText", {}).get("text") if title.get("titleText") else None,
                    "year": title.get("releaseYear", {}).get("year") if title.get("releaseYear") else None,
                    "type": title.get("titleType", {}).get("text") if title.get("titleType") else None,
                    "rating": title.get("ratingsSummary", {}).get("aggregateRating") if title.get("ratingsSummary") else None
                })
                
        # Parse birth date
        birth_comp = name_data.get("birthDate", {}).get("dateComponents") if name_data.get("birthDate") else None
        birth_date = f"{birth_comp['year']}-{birth_comp.get('month', 1):02d}-{birth_comp.get('day', 1):02d}" if birth_comp and birth_comp.get("year") else None
        
        # Parse death date
        death_comp = name_data.get("deathDate", {}).get("dateComponents") if name_data.get("deathDate") else None
        death_date = f"{death_comp['year']}-{death_comp.get('month', 1):02d}-{death_comp.get('day', 1):02d}" if death_comp and death_comp.get("year") else None
        
        # Parse trivia
        trivia = [edge.get("node", {}).get("text", {}).get("plainText") for edge in name_data.get("trivia", {}).get("edges", []) if edge.get("node")]
        
        # Parse quotes
        quotes = [edge.get("node", {}).get("text", {}).get("plainText") for edge in name_data.get("quotes", {}).get("edges", []) if edge.get("node")]
        
        # Parse akas
        akas = [edge.get("node", {}).get("text") for edge in name_data.get("akas", {}).get("edges", []) if edge.get("node")]
        
        return {
            "id": name_data.get("id"),
            "name": name_data.get("nameText", {}).get("text") if name_data.get("nameText") else None,
            "image": name_data.get("primaryImage", {}).get("url") if name_data.get("primaryImage") else None,
            "professions": professions,
            "known_for": known_for,
            "birth_date": birth_date,
            "death_date": death_date,
            "birth_place": name_data.get("birthLocation", {}).get("text") if name_data.get("birthLocation") else None,
            "height": name_data.get("height", {}).get("measurement", {}).get("value") if name_data.get("height") else None,
            "bio": name_data.get("bio", {}).get("text", {}).get("plainText") if name_data.get("bio") else None,
            "trivia": trivia,
            "quotes": quotes,
            "nicknames": [n.get("text") for n in name_data.get("nickNames", []) if n.get("text")],
            "akas": akas,
            "rank": name_data.get("meterRanking", {}).get("currentRank") if name_data.get("meterRanking") else None
        }
    return await run_in_thread(_fetch)

# 10. Streaming Availability
async def get_title_streaming_async(title_id: str):
    def _fetch():
        availability = get_streaming_availability(title_id) or {}
        # Parse the watch options
        watch_options = []
        
        # Parse primary
        primary = availability.get("data", {}).get("title", {}).get("primaryWatchOption")
        if primary and primary.get("watchOption"):
            opt = primary["watchOption"]
            watch_options.append({
                "provider": opt.get("provider", {}).get("name", {}).get("value") if opt.get("provider") else "Unknown",
                "link": opt.get("link"),
                "description": opt.get("description", {}).get("value") if opt.get("description") else "Streaming",
                "type": "Primary"
            })
            
        # Parse categorized
        categories = availability.get("data", {}).get("title", {}).get("watchOptionsByCategory", {}).get("categorizedWatchOptionsList", [])
        for cat in categories:
            cat_name = cat.get("categoryName", {}).get("value", "Other")
            for opt in cat.get("watchOptions", []):
                logo_url = None
                logos = opt.get("provider", {}).get("logos", {}) if opt.get("provider") else {}
                if logos.get("slate"):
                    logo_url = logos["slate"].get("url")
                    
                watch_options.append({
                    "provider": opt.get("provider", {}).get("id") or "Unknown",
                    "provider_name": opt.get("title", {}).get("value") or "Unknown",
                    "logo": logo_url,
                    "link": opt.get("link"),
                    "description": opt.get("shortDescription", {}).get("value") if opt.get("shortDescription") else "",
                    "type": cat_name
                })
        return watch_options
    return await run_in_thread(_fetch)

# 11. Rotten Tomatoes Data
async def get_rottentomatoes_data(title_id: str):
    def _fetch():
        # Step 1: Get IMDb movie details
        imdb_title = get_imdb_title_cached(title_id)
        if not imdb_title:
            return None
            
        # Step 2: Search on Rotten Tomatoes
        query = search_query_for_imdb_title(imdb_title)
        hits = search_rt_content(query, hits_per_page=5, timeout=10)
        candidates_list = ranked_candidates(imdb_title, hits)
        if not candidates_list or not candidates_list[0].get("url"):
            return None
            
        # Get best match
        best_candidate = candidates_list[0]
        # Step 3: Extract RT title page info
        rt_info = extract_title_page(best_candidate["url"], timeout=10)
        return rt_info
        
    return await run_in_thread(_fetch)

def get_imdb_title_cached(imdb_id):
    """Local helper for RT match lookup"""
    from ImdbDataExtraction.rottentomatoes_downloader.rt_reviews_by_imdb import get_imdb_title
    try:
        return get_imdb_title(imdb_id)
    except Exception:
        return None

# 12. Season Episodes
async def get_title_episodes(title_id: str, limit: int = 100):
    def _fetch():
        episodes, _ = get_season_episodes(title_id, after_cursor=None, limit=limit, include_extended=True)
        
        formatted_episodes = []
        for ep in episodes:
            title_text = ep.get("titleText")
            title = title_text.get("text") if title_text else None
            
            series_info = ep.get("series", {})
            ep_info = series_info.get("episodeNumber") if series_info else None
            
            formatted_episodes.append({
                "id": ep.get("id"),
                "title": title,
                "season": ep_info.get("seasonNumber") if ep_info else None,
                "episode": ep_info.get("episodeNumber") if ep_info else None,
                "release_date": ep.get("releaseDate"),
                "rating": ep.get("ratingsSummary", {}).get("aggregateRating") if ep.get("ratingsSummary") else None,
                "plot": ep.get("plot", {}).get("plotText", {}).get("plainText") if ep.get("plot") else None,
                "poster": ep.get("primaryImage", {}).get("url") if ep.get("primaryImage") else None,
                "runtime_minutes": (ep.get("runtime", {}).get("seconds") or 0) // 60 if ep.get("runtime") else None
            })
        return formatted_episodes
    return await run_in_thread(_fetch)

# 13. Filter Search
async def get_filtered_titles(genre: str = None, min_year: int = None, max_year: int = None, min_rating: float = None, max_rating: float = None, title_type: str = None, limit: int = 50):
    def _fetch():
        edges, _ = search_by_genre(
            target_genre=genre,
            limit=limit,
            languages=None,
            min_year=min_year,
            max_year=max_year,
            min_rating=min_rating,
            max_rating=max_rating,
            title_type=title_type,
            after_cursor=None
        )
        
        results = []
        for edge in edges:
            node = edge.get("node", {}).get("title", {})
            if node:
                results.append({
                    "id": node.get("id"),
                    "title": node.get("titleText", {}).get("text") if node.get("titleText") else None,
                    "year": node.get("releaseYear", {}).get("year") if node.get("releaseYear") else None,
                    "rating": node.get("ratingsSummary", {}).get("aggregateRating") if node.get("ratingsSummary") else None,
                    "genres": [g.get("text") for g in node.get("genres", {}).get("genres", [])] if node.get("genres") else [],
                    "type": node.get("titleType", {}).get("text") if node.get("titleType") else None
                })
        return results
    return await run_in_thread(_fetch)

# 14. Regional Trending Search
async def get_regional_trending(region: str, count: int = 8):
    def _fetch():
        lang_map = {
            "bollywood": ["hi"],
            "south_indian": ["te", "ta", "ml", "kn"],
            "hollywood": ["en"]
        }
        langs = lang_map.get(region, ["en"])
        
        edges, _ = search_by_genre(
            target_genre=None,
            limit=count,
            languages=langs,
            min_year=None,
            max_year=None,
            min_rating=None,
            max_rating=None,
            title_type="movie",
            after_cursor=None
        )
        
        results = []
        for idx, edge in enumerate(edges, 1):
            node = edge.get("node", {}).get("title", {})
            if node:
                # Format to match trending_movies structure
                results.append({
                    "id": node.get("id"),
                    "title": node.get("titleText", {}).get("text") if node.get("titleText") else None,
                    "release_year": node.get("releaseYear", {}).get("year") if node.get("releaseYear") else None,
                    "rating": node.get("ratingsSummary", {}).get("aggregateRating") if node.get("ratingsSummary") else None,
                    "genres": [g.get("text") for g in node.get("genres", {}).get("genres", [])] if node.get("genres") else [],
                    "poster_url": node.get("primaryImage", {}).get("url") if node.get("primaryImage") else None,
                    "rank": idx
                })
        return results
    return await run_in_thread(_fetch)

