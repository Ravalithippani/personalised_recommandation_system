import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
import google.generativeai as genai
from sklearn.metrics.pairwise import cosine_similarity
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
from pymongo import MongoClient
from bson.objectid import ObjectId
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


# --- CONFIGURATION ---
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# RENAMED to reflect it's the OMDb key
OMDB_API_KEY = os.environ.get("OMDB_API_KEY") 
GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY")
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET = os.getenv("JWT_SECRET") # Assuming JWT_SECRET is in your main .env
client = MongoClient(MONGO_URI)
db = client.recommenderDB
users_collection = db.users
# --- CACHING ---
_cache = {}

# --- HELPER FUNCTIONS: DATA PROCESSING ---
def process_title_for_search(title: str):
    if not isinstance(title, str): return ""
    processed_title = re.sub(r'\s*$$[^)]*$$\s*$', '', title).strip()
    if processed_title.endswith(', The'): processed_title = 'The ' + processed_title[:-5]
    if processed_title.endswith(', A'): processed_title = 'A ' + processed_title[:-3]
    if processed_title.endswith(', An'): processed_title = 'An ' + processed_title[:-4]
    processed_title = re.sub(r'^(the|a|an)\s+', '', processed_title, flags=re.IGNORECASE)
    return re.sub(r'[^a-zA-Z0-9]', '', processed_title).lower()
# --- THIS IS THE CORRECTED FUNCTION ---
def load_movie_data():
    """Loads all movie data files intelligently to prevent column conflicts."""
    if "movies" in _cache: return _cache["movies"]
    
    # Load the main embeddings file, which has our primary title list
    embeddings_df = pd.read_parquet("data/movie_embeddings.parquet")
# ... and so on for other pd.read_parquet()
    
    # From the other files, ONLY load the columns we need to avoid name conflicts
    movies_genres_df = pd.read_csv("data/movies.csv")[['movieId', 'genres']]
    links_df = pd.read_csv("data/links.csv")[['movieId', 'imdbId', 'tmdbId']]
    
    # Merge the dataframes
    merged_df = pd.merge(embeddings_df, movies_genres_df, on='movieId', how='inner')
    final_df = pd.merge(merged_df, links_df, on='movieId', how='inner') # Keeping tmdbId as a unique identifier
    
    try:
        custom_embeddings_df = pd.read_parquet("data/custom_embeddings.parquet")
        final_df = pd.concat([final_df, custom_embeddings_df], ignore_index=True)
        print(f"Successfully loaded and combined {len(custom_embeddings_df)} custom movies.")
    except FileNotFoundError:
        print("No custom movies file found.")
        
    final_df.dropna(subset=['tmdbId'], inplace=True)
    final_df['tmdbId'] = final_df['tmdbId'].astype(int)
    final_df['search_title'] = final_df['title'].apply(process_title_for_search)
    
    _cache["movies"] = final_df
    print("Movie data loaded and cached.")
    return final_df

def load_book_data():
    """Loads and prepares the book data."""
    if "books" in _cache: return _cache["books"]
    
    df = pd.read_parquet("data/book_embeddings.parquet")
    df.dropna(subset=['isbn', 'title', 'authors'], inplace=True)
    df['search_title'] = df['title'].apply(process_title_for_search)
    
    _cache["books"] = df
    print("Book data loaded and cached.")
    return df

def load_music_data():
    if "music" in _cache: return _cache["music"]
    df = pd.read_parquet("data/music_embeddings.parquet")
    df.dropna(subset=['track_id', 'track_name', 'artist_name', 'embedding'], inplace=True)
    df['search_title'] = df['track_name'].apply(process_title_for_search)
    df['search_artist'] = df['artist_name'].apply(lambda x: re.sub(r'[^a-zA-Z0-9]', '', str(x)).lower())
    _cache["music"] = df
    print("Music data loaded.")
    return df
# --- TEMPORARY DEBUGGING VERSION of fetch_poster ---
def fetch_poster(tmdb_id: int):
    """
    Fetches a movie poster URL reliably from OMDb using the movie's unique IMDb ID.
    """
    # --- DEBUG PRINT 1: Check if the API key loaded ---
    print(f"OMDb API Key Loaded: {OMDB_API_KEY}")

    if tmdb_id in _cache:
        return _cache[tmdb_id]

    try:
        # Get the IMDb ID from the movie_df, ensuring it's the first match
        imdb_id = movie_df[movie_df['tmdbId'] == tmdb_id]['imdbId'].iloc[0]
        
        # Convert to string and format as 'ttXXXXXXX' (pad with zeros to 7 digits)
        imdb_id_str = str(int(float(str(imdb_id))))  # Handle potential float or string issues
        imdb_id_formatted = f"tt{imdb_id_str.zfill(7)}"
    except (IndexError, ValueError) as e:
        print(f"IMDb ID not found or invalid for tmdbId {tmdb_id}: {e}")
        return "https://via.placeholder.com/500x750.png?text=No+Poster+Found"

    retry_strategy = Retry(total=3, status_forcelist=[429, 500, 502, 503, 504], backoff_factor=1)
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session = requests.Session()
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    
    base_url = "https://www.omdbapi.com/"
    url = f"{base_url}?i={imdb_id_formatted}&apikey={OMDB_API_KEY}"
    
    # --- DEBUG PRINT 2: Check the final URL being called ---
    print(f"Requesting URL: {url}")
    
    try:
        response = session.get(url)
        response.raise_for_status()
        data = response.json()

        # --- DEBUG PRINT 3: See the exact response from OMDb ---
        print(f"OMDb Response for {imdb_id_formatted}: {data}")
        
        poster_path = data.get('Poster')
        
        if data.get('Response') == 'True' and poster_path and poster_path != 'N/A':
            _cache[tmdb_id] = poster_path
            return poster_path
        else:
            print(f"OMDb found no poster. Reason: {data.get('Error')}")
            
    except requests.exceptions.RequestException as e:
        print(f"OMDb API request failed for IMDb ID {imdb_id_formatted}: {e}")
        
    return "https://via.placeholder.com/500x750.png?text=No+Poster+Found"

def fetch_book_cover(isbn: str):
    """Fetches a book cover URL from the Google Books API."""
    if isbn in _cache: return _cache[isbn]
    
    url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&key={GOOGLE_BOOKS_API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        if "items" in data and len(data["items"]) > 0:
            thumbnail = data["items"][0]["volumeInfo"].get("imageLinks", {}).get("thumbnail")
            if thumbnail:
                _cache[isbn] = thumbnail
                return thumbnail
    except Exception as e:
        print(f"Failed to get book cover for ISBN {isbn}: {e}")
        
    return "https://via.placeholder.com/500x750.png?text=No+Cover+Found"

# --- HELPER FUNCTIONS: RECOMMENDATION LOGIC ---
chat_model = genai.GenerativeModel('gemini-pro')

def get_movie_recommendations(title: str, df: pd.DataFrame, top_n: int = 5):
    """Finds movies similar to a given title."""
    search_term = process_title_for_search(title)
    movie_row = df[df['search_title'] == search_term]
    if movie_row.empty: return pd.DataFrame()
    
    query_embedding = movie_row['embedding'].iloc[0]
    query_embedding = np.array(query_embedding).reshape(1, -1)
    all_embeddings = np.stack(df['embedding'].values)
    similarities = cosine_similarity(query_embedding, all_embeddings).flatten()
    
    original_movie_index = movie_row.index[0]
    all_top_indices = np.argsort(similarities)[::-1][:top_n + 5]
    top_indices = [idx for idx in all_top_indices if idx != original_movie_index][:top_n]
    return df.iloc[top_indices]

def get_book_recommendations(title: str, df: pd.DataFrame, top_n: int = 5):
    """Finds books similar to a given title."""
    search_term = process_title_for_search(title)
    book_row = df[df['search_title'] == search_term]
    if book_row.empty: return pd.DataFrame()
    
    query_embedding = book_row['embedding'].iloc[0]
    query_embedding = np.array(query_embedding).reshape(1, -1)
    all_embeddings = np.stack(df['embedding'].values)
    similarities = cosine_similarity(query_embedding, all_embeddings).flatten()
    
    original_book_index = book_row.index[0]
    all_top_indices = np.argsort(similarities)[::-1][:top_n + 5]
    top_indices = [idx for idx in all_top_indices if idx != original_book_index][:top_n]
    return df.iloc[top_indices]
# --- API SETUP & ENDPOINTS ---
app = FastAPI()
movie_df = load_movie_data()
book_df = load_book_data()
music_df = load_music_data()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # This allows all origins (not recommended for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# New endpoint for Google Sign-In
@app.post("/api/auth/google")
async def google_auth(token: dict):
    try:
        # Verify the Google ID token
        id_info = id_token.verify_oauth2_token(
            token["token"], google_requests.Request(), os.getenv("GOOGLE_CLIENT_ID")
        )
        email = id_info["email"]
        name = id_info.get("name", email.split("@")[0])
        picture = id_info.get("picture")

        # Check if user exists in MongoDB
        user = users_collection.find_one({"email": email})
        if not user:
            # Create new user
            user_id = str(ObjectId())
            new_user = {
                "email": email,
                "name": name,
                "avatar": picture,
                "favorites": [],
                "_id": ObjectId(user_id)
            }
            users_collection.insert_one(new_user)
        else:
            user_id = str(user["_id"])

        # Generate JWT
        payload = {"user": {"id": user_id}}
        jwt_token = jwt.encode(payload, os.getenv("JWT_SECRET"), algorithm="HS256")

        return {"token": jwt_token, "user": {"id": user_id, "name": name, "email": email}}
    except ValueError as e:
        print(f"Google token verification failed: {e}")
        return {"error": "Invalid Google token"}, 401
    except Exception as e:
        print(f"Authentication error: {e}")
        return {"error": "Authentication failed"}, 500

def get_music_recommendations(track_title: str, df: pd.DataFrame, top_n: int = 5):
    """Finds songs similar to a given track using precomputed embeddings."""
    search_term = process_title_for_search(track_title)
    song_row = df[df["search_title"] == search_term]
    if song_row.empty:
        return pd.DataFrame()

    query_embedding = np.array(song_row["embedding"].iloc[0]).reshape(1, -1)
    all_embeddings = np.stack(df["embedding"].values)
    similarities = cosine_similarity(query_embedding, all_embeddings).flatten()

    original_index = song_row.index[0]
    all_top_indices = np.argsort(similarities)[::-1][: top_n + 5]
    top_indices = [idx for idx in all_top_indices if idx != original_index][:top_n]
    return df.iloc[top_indices]

def get_explanation(original_item: str, recommended_item: str, item_type: str):
    cache_key = f"exp_{item_type}_{original_item}_{recommended_item}"
    if cache_key in _cache: return _cache[cache_key]
    prompt = f"You are a friendly expert. In about 30-35 words, explain why someone who liked the {item_type} '{original_item}' would also enjoy the {item_type} '{recommended_item}'."
    try:
        response = chat_model.generate_content(prompt)
        explanation = response.text
        _cache[cache_key] = explanation
        return explanation
    except Exception as e:
        return f"Could not generate explanation: {e}"

# --- Collaborative Filtering (optional Surprise) ---
try:
    from surprise import Dataset as _SurpriseDataset, Reader as _SurpriseReader, SVD as _SurpriseSVD
    _SURPRISE_AVAILABLE = True
except Exception:
    _SURPRISE_AVAILABLE = False
    _SurpriseDataset = _SurpriseReader = _SurpriseSVD = None

_collaborative_model = None

def _get_user_favorites(user_doc):
    """Normalize favorites entries; returns list of dicts with keys: type, itemId."""
    out = []
    for fav in user_doc.get('favorites', []):
        out.append({
            "type": fav.get("type") or fav.get("itemType"),
            "itemId": str(fav.get("itemId") or ""),
        })
    return out

def train_collaborative_model():
    """Train a simple SVD model from user favorites if Surprise is available."""
    global _collaborative_model
    if not _SURPRISE_AVAILABLE:
        print("Surprise not available; skipping collaborative model training.")
        _collaborative_model = None
        return
    try:
        all_users = list(users_collection.find({}, {"_id": 1, "favorites": 1}))
        ratings = []
        for u in all_users:
            uid = str(u["_id"])
            for fav in _get_user_favorites(u):
                if fav["type"] == "movie" and fav["itemId"]:
                    ratings.append({"userID": uid, "itemID": fav["itemId"], "rating": 1.0})
        if len(ratings) < 10:
            print("Not enough data to train collaborative model.")
            _collaborative_model = None
            return
        ratings_df = pd.DataFrame(ratings)
        reader = _SurpriseReader(rating_scale=(1, 1))
        data = _SurpriseDataset.load_from_df(ratings_df[['userID', 'itemID', 'rating']], reader)
        trainset = data.build_full_trainset()
        algo = _SurpriseSVD()
        algo.fit(trainset)
        _collaborative_model = algo
        print("Collaborative model trained.")
    except Exception as e:
        print(f"Collaborative training failed: {e}")
        _collaborative_model = None

def get_collaborative_recs(user_id: str, top_n: int = 10):
    """Get movie recommendations from collaborative model. Returns movie_df subset."""
    if not _collaborative_model:
        return movie_df.iloc[0:0]
    try:
        # All candidate movie ids (as strings)
        all_movie_ids = movie_df['tmdbId'].astype(str).unique()
        user = users_collection.find_one({"_id": ObjectId(user_id)}) or {}
        seen = {str(f.get('itemId')) for f in _get_user_favorites(user) if (f.get('type') == 'movie')}
        preds = []
        for mid in all_movie_ids:
            if mid not in seen:
                est = _collaborative_model.predict(str(user_id), mid).est
                preds.append((mid, est))
        preds.sort(key=lambda x: x[1], reverse=True)
        top_ids = [int(mid) for (mid, _) in preds[:top_n]]
        return movie_df[movie_df['tmdbId'].isin(top_ids)]
    except Exception:
        return movie_df.iloc[0:0]

# Train collaborative model on startup (if FastAPI supports events in env)
try:
    @app.on_event("startup")
    def _startup_train_collab():
        train_collaborative_model()
except Exception:
    # If 'app' not yet defined at import time, ignore (already defined above)
    pass

# --- Helper: content-based taste-profile per category ---
def _taste_profile_recs_for_category(user_id: str, cat: str, top_k: int = 50):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return pd.DataFrame()

    favs = _get_user_favorites(user)
    if cat == "movie":
        ids = [f["itemId"] for f in favs if f["type"] == "movie" and f["itemId"]]
        if not ids:
            return pd.DataFrame()
        emb_list = movie_df[movie_df["tmdbId"].isin(pd.Series(ids).dropna().astype(int))]["embedding"].tolist()
        if not emb_list:
            return pd.DataFrame()
        profile = np.mean(np.array(emb_list), axis=0).reshape(1, -1)
        sims = cosine_similarity(profile, np.stack(movie_df["embedding"].values)).flatten()
        idx = np.argsort(sims)[::-1][:top_k]
        # Exclude already-favorited
        seen = set(map(str, ids))
        kept = [i for i in idx if str(movie_df.iloc[i]["tmdbId"]) not in seen]
        return movie_df.iloc[kept]
    elif cat == "book":
        ids = [f["itemId"] for f in favs if f["type"] == "book" and f["itemId"]]
        if not ids:
            return pd.DataFrame()
        # ISBN is string; embeddings exist in book_df
        emb_list = book_df[book_df["isbn"].isin(ids)]["embedding"].tolist()
        if not emb_list:
            return pd.DataFrame()
        profile = np.mean(np.array(emb_list), axis=0).reshape(1, -1)
        sims = cosine_similarity(profile, np.stack(book_df["embedding"].values)).flatten()
        idx = np.argsort(sims)[::-1][:top_k]
        kept = [i for i in idx if str(book_df.iloc[i]["isbn"]) not in set(ids)]
        return book_df.iloc[kept]
    else:  # music
        ids = [f["itemId"] for f in favs if f["type"] == "music" and f["itemId"]]
        if not ids:
            return pd.DataFrame()
        emb_list = music_df[music_df["track_id"].isin(ids)]["embedding"].tolist()
        if not emb_list:
            return pd.DataFrame()
        profile = np.mean(np.array(emb_list), axis=0).reshape(1, -1)
        sims = cosine_similarity(profile, np.stack(music_df["embedding"].values)).flatten()
        idx = np.argsort(sims)[::-1][:top_k]
        kept = [i for i in idx if str(music_df.iloc[i]["track_id"]) not in set(ids)]
        return music_df.iloc[kept]

# --- For-You endpoints per category ---
@app.get("/recommend/for-you/book")
def get_for_you_books(token: str):
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = decoded['user']['id']
        df = _taste_profile_recs_for_category(user_id, "book").head(5)
        if df.empty:
            return {"error": "No book recommendations available. Add more favorite books."}
        res = df.copy()
        res['coverUrl'] = res['isbn'].apply(fetch_book_cover)
        res = res.replace({np.nan: None})
        return {"recommendations": res.to_dict('records')}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}

@app.get("/recommend/for-you/music")
def get_for_you_music(token: str):
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = decoded['user']['id']
        df = _taste_profile_recs_for_category(user_id, "music").head(5)
        if df.empty:
            return {"error": "No music recommendations available. Add more favorite tracks."}
        res = df.copy().rename(columns={"track_name": "title"})
        res["embedding"] = res["embedding"].apply(list)
        res = res.replace({np.nan: None})
        return {"recommendations": res.to_dict('records')}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}

# --- Hybrid endpoint (content-based + collaborative for movies) ---
@app.get("/recommend/for-you/hybrid")
def get_hybrid_for_you_recommendations(token: str):
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = decoded['user']['id']

        content_recs = _taste_profile_recs_for_category(user_id, "movie").head(20)
        collab_recs = get_collaborative_recs(user_id, top_n=20)

        if content_recs.empty and (collab_recs is None or collab_recs.empty):
            return {"error": "Could not generate recommendations. Add more favorites!"}

        # Combine, drop duplicates by tmdbId, take top 10, then attach posters
        hybrid = pd.concat([content_recs, collab_recs]).drop_duplicates(subset=['tmdbId']).head(10)
        res = hybrid.copy()
        res['posterUrl'] = res['tmdbId'].apply(fetch_poster)
        res = res.replace({np.nan: None})
        return {"recommendations": res.to_dict('records')}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}

# --- Random-from-favorites endpoint (per category) ---
@app.get("/recommend/favorites/random/{category}")
def get_random_from_favorites(category: str, token: str, limit: int = 10):
    """
    Samples random picks from the top-N nearest items to the user's taste profile for the given category.
    """
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = decoded['user']['id']
        cat = category.lower()
        if cat not in ("movie", "book", "music"):
            return {"error": "Invalid category."}
        df = _taste_profile_recs_for_category(user_id, cat).head(100)  # wider pool
        if df.empty:
            return {"error": f"No {cat} recommendations available yet."}

        sample_n = min(limit, len(df))
        sampled = df.sample(n=sample_n, random_state=np.random.randint(0, 1_000_000))
        if cat == "movie":
            sampled = sampled.copy()
            sampled['posterUrl'] = sampled['tmdbId'].apply(fetch_poster)
            sampled = sampled.replace({np.nan: None})
            return {"recommendations": sampled.to_dict('records')}
        if cat == "book":
            sampled = sampled.copy()
            sampled['coverUrl'] = sampled['isbn'].apply(fetch_book_cover)
            sampled = sampled.replace({np.nan: None})
            return {"recommendations": sampled.to_dict('records')}
        # music
        sampled = sampled.copy().rename(columns={"track_name": "title"})
        sampled["embedding"] = sampled["embedding"].apply(list)
        sampled = sampled.replace({np.nan: None})
        return {"recommendations": sampled.to_dict('records')}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}



class VibeRequest(BaseModel):
    vibe_text: str

def find_movies_by_vibe(vibe_text: str, df: pd.DataFrame, top_n: int = 5):
    """Finds movies that match a text description using embeddings."""
    embedding_model = 'text-embedding-004'
    prompt = f"Represent this movie vibe for semantic search: {vibe_text}"
    embedding = genai.embed_content(model=embedding_model, content=prompt)
    query_embedding = embedding['embedding']
    query_embedding = np.array(query_embedding).reshape(1, -1)
    all_embeddings = np.stack(df['embedding'].values)
    similarities = cosine_similarity(query_embedding, all_embeddings).flatten()
    top_indices = np.argsort(similarities)[::-1][:top_n]
    return df.iloc[top_indices]


# --- API ENDPOINTS ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Recommender API!"}

@app.get("/search/movie/{query}")
def search_movies_api(query: str):
    if len(query) < 3: return {"results": []}
    search_term = process_title_for_search(query)
    matches = movie_df[movie_df['search_title'].str.contains(search_term, na=False)].head(10)
    return {"results": matches['title'].tolist()}

@app.get("/search/book/{query}")
def search_books_api(query: str):
    if len(query) < 3: return {"results": []}
    search_term = process_title_for_search(query)
    matches = book_df[book_df['search_title'].str.contains(search_term, na=False)].head(10)
    return {"results": matches['title'].tolist()}

@app.get("/search/music/{query}")
def search_music_api(query: str):
    if len(query) < 3: return {"results": []}
    
    search_term = process_title_for_search(query)
    
    # Search by track name
    name_matches = music_df[music_df['search_title'].str.contains(search_term, na=False)]
    
    # Search by artist name
    artist_matches = music_df[music_df['search_artist'].str.contains(search_term, na=False)]
    
    # Combine results and remove duplicates based on track_id
    matches = pd.concat([name_matches, artist_matches]).drop_duplicates(subset=['track_id']).head(10)
    
    # Format results as "Track Name - Artist Name"
    results = (matches['track_name'] + " - " + matches['artist_name']).tolist()
    
    return {"results": results}

@app.get("/recommend/movie/{movie_title}")
def get_movie_recommendations_api(movie_title: str):
    search_term = process_title_for_search(movie_title)
    original_movie_df = movie_df[movie_df['search_title'] == search_term]
    if original_movie_df.empty: return {"error": "Movie not found"}
    original_title = original_movie_df.iloc[0]['title']

    recommendations_df = get_movie_recommendations(movie_title, movie_df)
    if recommendations_df.empty: return {"error": "Could not find recommendations for this movie."} 
    
    results_df = recommendations_df.copy()
    # fetch_poster is now using OMDb
    results_df['posterUrl'] = results_df['tmdbId'].apply(fetch_poster) 
    results_df['embedding'] = results_df['embedding'].apply(list)
    results_df = results_df.replace({np.nan: None})
    
    top_rec_title = results_df.iloc[0]['title']
    explanation_text = get_explanation(original_title, top_rec_title, item_type='movie')
    
    recommendations_json = results_df.to_dict('records')
    return {"recommendations": recommendations_json, "explanation": explanation_text}

@app.post("/vibe")
def find_movies_by_vibe_api(request: VibeRequest):
    results_df = find_movies_by_vibe(request.vibe_text, movie_df)
    if results_df.empty: return {"error": "Could not find any matches."}
    
    response_df = results_df.copy()
    # fetch_poster is now using OMDb
    response_df['posterUrl'] = response_df['tmdbId'].apply(fetch_poster)
    response_df['embedding'] = response_df['embedding'].apply(list)
    response_df = response_df.replace({np.nan: None})
    return {"recommendations": response_df.to_dict('records')}

@app.get("/recommend/book/{book_title}")
def get_book_recommendations_api(book_title: str):
    search_term = process_title_for_search(book_title)
    original_book_df = book_df[book_df['search_title'] == search_term]
    if original_book_df.empty: return {"error": "Book not found"}
    original_title = original_book_df.iloc[0]['title']
    
    recommendations_df = get_book_recommendations(book_title, book_df)
    if recommendations_df.empty: return {"error": "Could not find recommendations for this book."}
    
    results_df = recommendations_df.copy()
    results_df['coverUrl'] = results_df['isbn'].apply(fetch_book_cover)
    results_df['embedding'] = results_df['embedding'].apply(list)
    results_df = results_df.replace({np.nan: None})
    
    top_rec_title = results_df.iloc[0]['title']
    explanation_text = get_explanation(original_title, top_rec_title, item_type='book')
    
    recommendations_json = results_df.to_dict('records')
    return {"recommendations": recommendations_json, "explanation": explanation_text}

@app.get("/recommend/music/{track_title}")
def get_music_recommendations_api(track_title: str):
    """
    Accepts either plain track title or 'Track - Artist' string.
    We match by normalized track_name.
    """
    # If in "Track - Artist" form, keep the left side for matching track title
    normalized_input = track_title.split(" - ")[0].strip()
    search_term = process_title_for_search(normalized_input)

    original_song_df = music_df[music_df["search_title"] == search_term]
    if original_song_df.empty:
        return {"error": "Track not found"}

    original_title = original_song_df.iloc[0]["track_name"]
    recommendations_df = get_music_recommendations(normalized_input, music_df)
    if recommendations_df.empty:
        return {"error": "Could not find recommendations for this track."}

    # Prepare response; keep fields the frontend uses
    results_df = recommendations_df.copy()
    # Provide consistent field names the UI can render
    results_df = results_df.rename(
        columns={"track_name": "title", "artist_name": "artist_name", "genre": "genre"}
    )
    results_df["embedding"] = results_df["embedding"].apply(list)
    results_df = results_df.replace({np.nan: None})

    top_rec_title = results_df.iloc[0]["title"]
    explanation_text = get_explanation(original_title, top_rec_title, item_type="music")

    return {"recommendations": results_df.to_dict("records"), "explanation": explanation_text}

@app.get("/recommend/genre/movie/{genre}")
def get_random_movies_by_genre(genre: str, limit: int = 10):
    """Returns random movies matching the specified genre."""
    genre_lower = genre.lower()
    # Filter movies that contain the genre in their genres field
    matches = movie_df[movie_df['genres'].str.lower().str.contains(genre_lower, na=False)]
    
    if matches.empty:
        return {"error": f"No movies found for genre: {genre}"}
    
    # Sample random movies
    sample_size = min(limit, len(matches))
    random_movies = matches.sample(n=sample_size)
    
    results_df = random_movies.copy()
    # fetch_poster is now using OMDb
    results_df['posterUrl'] = results_df['tmdbId'].apply(fetch_poster) 
    results_df['embedding'] = results_df['embedding'].apply(list)
    results_df = results_df.replace({np.nan: None})
    
    explanation_text = f"Here are {sample_size} random {genre} movies from our collection."
    
    return {"recommendations": results_df.to_dict('records'), "explanation": explanation_text}

@app.get("/recommend/genre/book/{genre}")
def get_random_books_by_genre(genre: str, limit: int = 10):
    """Returns random books matching the specified genre."""
    genre_lower = genre.lower()
    # Filter books that contain the genre in their category field
    matches = book_df[book_df['category'].str.lower().str.contains(genre_lower, na=False)]
    
    if matches.empty:
        return {"error": f"No books found for genre: {genre}"}
    
    # Sample random books
    sample_size = min(limit, len(matches))
    random_books = matches.sample(n=sample_size)
    
    results_df = random_books.copy()
    results_df['coverUrl'] = results_df['isbn'].apply(fetch_book_cover)
    results_df['embedding'] = results_df['embedding'].apply(list)
    results_df = results_df.replace({np.nan: None})
    
    explanation_text = f"Here are {sample_size} random {genre} books from our collection."
    
    return {"recommendations": results_df.to_dict('records'), "explanation": explanation_text}

@app.get("/recommend/genre/music/{genre}")
def get_random_music_by_genre(genre: str, limit: int = 10):
    """Returns random music tracks matching the specified genre."""
    genre_lower = genre.lower()
    # Filter music that contains the genre
    matches = music_df[music_df['genre'].str.lower().str.contains(genre_lower, na=False)]
    
    if matches.empty:
        return {"error": f"No music found for genre: {genre}"}
    
    # Sample random tracks
    sample_size = min(limit, len(matches))
    random_tracks = matches.sample(n=sample_size)
    
    results_df = random_tracks.copy()
    results_df = results_df.rename(
        columns={"track_name": "title", "artist_name": "artist_name", "genre": "genre"}
    )
    results_df['embedding'] = results_df['embedding'].apply(list)
    results_df = results_df.replace({np.nan: None})
    
    explanation_text = f"Here are {sample_size} random {genre} tracks from our collection."
    
    return {"recommendations": results_df.to_dict('records'), "explanation": explanation_text}

# --- NEW: "FOR YOU" RECOMMENDATION ENDPOINT ---
@app.get("/recommend/for-you")
def get_for_you_recommendations(token: str):
    """Generates personalized recommendations based on a user's favorites across movies, books, and music."""
    try:
        # 1. Decode the token to get the user's ID
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = decoded['user']['id']
        
        # 2. Get the user's favorites from the database
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user or not user.get('favorites'):
            return {"error": "No favorites found to generate recommendations."}

        # 3. Collect embeddings for all favorite types
        favorite_items = _get_user_favorites(user)
        all_embeddings = []

        # Movies
        movie_ids = [f["itemId"] for f in favorite_items if f["type"] == "movie" and f["itemId"]]
        if movie_ids:
            movie_embeds = movie_df[movie_df['tmdbId'].isin(pd.Series(movie_ids).dropna().astype(int))]['embedding'].tolist()
            all_embeddings.extend(movie_embeds)

        # Books
        book_ids = [f["itemId"] for f in favorite_items if f["type"] == "book" and f["itemId"]]
        if book_ids:
            book_embeds = book_df[book_df['isbn'].isin(book_ids)]['embedding'].tolist()
            all_embeddings.extend(book_embeds)

        # Music
        music_ids = [f["itemId"] for f in favorite_items if f["type"] == "music" and f["itemId"]]
        if music_ids:
            music_embeds = music_df[music_df['track_id'].isin(music_ids)]['embedding'].tolist()
            all_embeddings.extend(music_embeds)

        if not all_embeddings:
            return {"error": "No favorite items with embeddings found."}

        # 4. Calculate the user's "Taste Profile" as the mean of all embeddings
        taste_profile = np.mean(np.array(all_embeddings), axis=0).reshape(1, -1)

        # 5. Generate recommendations for each category
        all_recommendations = []
        seen_ids = set()  # To avoid duplicates across categories

        # Movie recommendations
        if movie_df is not None:
            movie_sims = cosine_similarity(taste_profile, np.stack(movie_df['embedding'].values)).flatten()
            movie_indices = np.argsort(movie_sims)[::-1][:20]
            movie_recs = movie_df.iloc[movie_indices]
            movie_recs = movie_recs[~movie_recs['tmdbId'].astype(str).isin(set(map(str, movie_ids)))]
            all_recommendations.extend(movie_recs.to_dict('records'))
            seen_ids.update(movie_recs['tmdbId'].astype(str))

        # Book recommendations
        if book_df is not None:
            book_sims = cosine_similarity(taste_profile, np.stack(book_df['embedding'].values)).flatten()
            book_indices = np.argsort(book_sims)[::-1][:20]
            book_recs = book_df.iloc[book_indices]
            book_recs = book_recs[~book_recs['isbn'].isin(set(book_ids))]
            all_recommendations.extend(book_recs.to_dict('records'))
            seen_ids.update(book_recs['isbn'])

        # Music recommendations
        if music_df is not None:
            music_sims = cosine_similarity(taste_profile, np.stack(music_df['embedding'].values)).flatten()
            music_indices = np.argsort(music_sims)[::-1][:20]
            music_recs = music_df.iloc[music_indices]
            music_recs = music_recs[~music_recs['track_id'].isin(set(music_ids))]
            music_recs = music_recs.rename(columns={"track_name": "title", "artist_name": "artist"})
            all_recommendations.extend(music_recs.to_dict('records'))
            seen_ids.update(music_recs['track_id'].astype(str))

        # 6. Sort all recommendations by similarity (using the first category's similarity as a proxy)
        # Note: This sorting logic can be complex and might need refinement depending on the final FE structure
        # A simple method is to interleave the top N of each. For now, we will keep the original sorting structure.
        if all_recommendations:
            # We sort by a proxy similarity score, prioritizing categories found first in the list.
            # This is a crude mix, but respects the original intent.
            def get_proxy_sim(x):
                if 'tmdbId' in x and 'movie_sims' in locals():
                    try:
                        # Find the original index of the movie in the movie_df
                        idx = movie_df[movie_df['tmdbId'] == x['tmdbId']].index[0]
                        return movie_sims[idx]
                    except:
                        return 0.0
                elif 'isbn' in x and 'book_sims' in locals():
                    try:
                        idx = book_df[book_df['isbn'] == x['isbn']].index[0]
                        return book_sims[idx]
                    except:
                        return 0.0
                elif 'track_id' in x and 'music_sims' in locals():
                    try:
                        idx = music_df[music_df['track_id'] == x['track_id']].index[0]
                        return music_sims[idx]
                    except:
                        return 0.0
                return 0.0

            all_recommendations.sort(key=get_proxy_sim, reverse=True)


        # 7. Prepare and return the top 5 recommendations
        final_recs = all_recommendations[:5]
        results_df = pd.DataFrame(final_recs)
        
        # Add posters/covers for movies and books
        if not results_df.empty:
            if 'tmdbId' in results_df.columns:
                results_df['posterUrl'] = results_df['tmdbId'].apply(fetch_poster) # Uses new OMDb fetcher
            if 'isbn' in results_df.columns:
                results_df['coverUrl'] = results_df['isbn'].apply(fetch_book_cover)
            
            # Ensure proper columns for the output (e.g., embedding needs to be a list)
            if 'embedding' in results_df.columns:
                 results_df['embedding'] = results_df['embedding'].apply(lambda x: x.tolist() if isinstance(x, np.ndarray) else x)

            results_df = results_df.replace({np.nan: None})


        return {"recommendations": results_df.to_dict('records')}

    except jwt.ExpiredSignatureError:
        return {"error": "Session expired. Please log in again."}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}