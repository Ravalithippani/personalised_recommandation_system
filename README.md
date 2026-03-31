# 🤖 Recommendation System using Google Gemini

A multi-domain AI-powered recommendation engine for **Movies, Books, and Music**, built using Google Gemini embeddings, FastAPI, and a vanilla JavaScript frontend.

## ✨ Features

* Movie, Book, and Music recommendations in a single platform
* Google Gemini API for generating vector embeddings
* Cosine similarity search on precomputed embeddings
* Google Sign-In authentication (OAuth)
* User profile management with favourites (like/save feature)
* Precomputed embeddings stored as Parquet files for fast inference

## 🛠️ Tech Stack

**Backend:** Python, FastAPI
**AI/ML:** Google Gemini API, scikit-learn (cosine similarity)
**Authentication:** Google OAuth, Node.js
**Data Storage:** Parquet files, MongoDB
**Frontend:** HTML, CSS, Vanilla JavaScript
**Deployment:** Render
**APIs:** OMDb, TMDb, Google Books

## 📁 Project Structure

```
├── api.py
├── app.py
├── generate_embeddings.py
├── generate_book_embeddings.py
├── generate_music_embeddings.py
├── data/
│   ├── movie_embeddings.parquet
│   ├── book_embeddings.parquet
│   └── custom_embeddings.parquet
├── backend-auth/
│   ├── models/User.js
│   └── routes/auth.js
└── frontend/
    ├── index.html
    ├── profile.html
    └── js/ css/
```

## ⚙️ Setup & Run

### Backend

```bash
pip install -r requirements.txt
python app.py
```

### Auth Server

```bash
cd backend-auth
npm install
node index.js
```

### Environment Variables

```
GEMINI_API_KEY=your_key
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
MONGO_URI=your_mongodb_uri
```

## 🧠 How It Works

1. User provides a movie, book, or song input
2. Gemini API generates vector embeddings
3. Cosine similarity is computed against stored embeddings
4. Top matching items are returned as recommendations
5. User favourites are stored in MongoDB

## 👤 Author

**Gonnela Omkar**
GitHub: [https://github.com/GonnelaOmkar](https://github.com/GonnelaOmkar)
Email: [omkargonnela@gmail.com](mailto:omkargonnela@gmail.com)

