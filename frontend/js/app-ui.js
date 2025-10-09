// DOM Elements
const loadingScreen = document.getElementById("loadingScreen")
const mainContent = document.getElementById("mainContent")
const categoryTabs = document.querySelectorAll(".category-tab")
const contentSections = document.querySelectorAll(".content-section")
const searchInput = document.getElementById("searchInput")
const recommendBtn = document.getElementById("recommendBtn")
const genreInput = document.getElementById("genreInput")
const genreRecommendBtn = document.getElementById("genreRecommendBtn")
const resultsGrid = document.getElementById("results-grid")
const suggestionsBox = document.getElementById("suggestions-box")
const explanationContainer = document.getElementById("explanation-container")

// API base with safe default and optional override via window.API_BASE
const DEFAULT_API_BASE = "http://127.0.0.1:8001"
const RAW_API_BASE = (typeof window !== "undefined" && window.API_BASE) || ""
const API_BASE = /^https?:\/\//.test(RAW_API_BASE) ? RAW_API_BASE.replace(/\/$/, "") : DEFAULT_API_BASE

const AUTH_API_BASE = (window.AUTH_API_BASE || "http://localhost:8081").replace(/\/$/, "")

let activeCategory = "movies"
let selectedSuggestionIndex = -1

function getAuthToken() {
  try {
    return localStorage.getItem("auth_token")
  } catch {
    return null
  }
}

function getCurrentUser() {
  const userStr = localStorage.getItem("currentUser")
  return userStr ? JSON.parse(userStr) : null
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user))
  } else {
    localStorage.removeItem("currentUser")
  }
}

function updateHeaderForUser() {
  const user = getCurrentUser()
  const navLinks = document.querySelector(".nav-links")

  if (user && navLinks) {
    navLinks.innerHTML = `
      <a href="index.html" class="nav-link active">Home</a>
      <a href="favorites.html" class="nav-link">Favorites</a>
      <div class="user-profile-nav" style="display: flex; align-items: center; gap: 12px;">
        <span style="color: rgba(226, 232, 240, 0.8); font-size: 0.95rem;">Hi, ${user.name || user.email}</span>
        <a href="profile.html" class="nav-link" style="display: flex; align-items: center; gap: 6px;">
          <i class="fas fa-user-circle" style="font-size: 1.5rem;"></i>
          <span>Profile</span>
        </a>
      </div>
    `
  }
}

function showToast(message, isRemoved = false) {
  const toast = document.createElement("div")
  toast.className = `toast-notification ${isRemoved ? "removed-toast" : ""}`
  toast.innerHTML = `
    <i class="fas ${isRemoved ? "fa-heart-broken" : "fa-heart"}"></i>
    <span>${message}</span>
  `
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.classList.add("removing")
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }, 3000)
}

async function toggleFavorite(item, category) {
  const token = getAuthToken()

  // Check for token - redirect to login if not found
  if (!token) {
    alert("Please log in to save favorites!")
    window.location.href = "login.html"
    return
  }

  const itemId = category === "movies" ? item.tmdbId : category === "books" ? item.isbn : item.track_id
  const title = item.title || item.track_name || "Untitled"
  const posterUrl = category === "movies" ? item.posterUrl : category === "books" ? item.coverUrl : ""

  try {
    // Send POST request with Authorization header
    const res = await fetch(`${AUTH_API_BASE}/api/auth/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        itemType: categoryToPath(category),
        itemId: String(itemId || ""),
        title,
        posterUrl,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.action === "added") {
        showToast("Added to favorites!")
        return true
      } else {
        showToast("Removed from favorites", true)
        return false
      }
    } else {
      console.error("[ORO] Favorite error:", await res.text())
      return null
    }
  } catch (e) {
    console.error("[ORO] Favorite error:", e)
    return null
  }
}

// Function to show input error
function showInputError() {
  alert("Please enter a valid query.")
}

// Loading Screen Animation
window.addEventListener("load", () => {
  updateHeaderForUser()

  setTimeout(() => {
    loadingScreen.style.opacity = "0"
    loadingScreen.style.transform = "translateY(-100%)"

    setTimeout(() => {
      loadingScreen.style.display = "none"
      mainContent.style.display = "block"
      mainContent.style.opacity = "0"

      setTimeout(() => {
        mainContent.style.opacity = "1"
        mainContent.style.transition = "opacity 0.5s ease"
      }, 100)
    }, 500)
  }, 3000)
})

// Category Switching
categoryTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetCategory = tab.dataset.category

    activeCategory = targetCategory

    // Remove active class from all tabs
    categoryTabs.forEach((t) => t.classList.remove("active"))

    // Add active class to clicked tab
    tab.classList.add("active")

    // Hide all content sections
    contentSections.forEach((section) => {
      section.classList.remove("active")
    })

    // Show target section with animation
    const targetSection = document.getElementById(`${targetCategory}Section`)
    if (targetSection) {
      setTimeout(() => {
        targetSection.classList.add("active")
      }, 300)
    }

    // Update search placeholder based on category
    updateSearchPlaceholder(targetCategory)

    // Trigger category-specific animations
    triggerCategoryAnimations(targetCategory)
  })
})

// Update search placeholder
function updateSearchPlaceholder(category) {
  const placeholders = {
    movies: "e.g., Inception, The Dark Knight, Interstellar...",
    books: "e.g., 1984, The Alchemist, Dune...",
    music: "e.g., Bohemian Rhapsody, Hotel California...",
  }

  searchInput.placeholder = placeholders[category] || "Search for recommendations..."
}

// Trigger category-specific animations
function triggerCategoryAnimations(category) {
  const animations = {
    movies: animateMovieEffects,
    books: animateBookEffects,
    music: animateMusicEffects,
  }

  if (animations[category]) {
    animations[category]()
  }
}

// Movie-specific animations
function animateMovieEffects() {
  const projectorBeam = document.querySelector(".light-beam")
  const filmParticles = document.querySelector(".film-particles")

  if (projectorBeam) {
    projectorBeam.style.animation = "none"
    setTimeout(() => {
      projectorBeam.style.animation = "projectorBeam 4s ease-in-out infinite"
    }, 100)
  }

  // Create dynamic film particles
  createFilmParticles()
}

// Book-specific animations
function animateBookEffects() {
  const floatingPages = document.querySelector(".floating-pages")
  const readingLight = document.querySelector(".reading-light")

  if (floatingPages) {
    floatingPages.style.animation = "none"
    setTimeout(() => {
      floatingPages.style.animation = "pageFlip 5s ease-in-out infinite"
    }, 100)
  }

  // Create floating text particles
  createTextParticles()
}

// Music-specific animations
function animateMusicEffects() {
  const waves = document.querySelectorAll(".wave")
  const notes = document.querySelectorAll(".note")

  waves.forEach((wave, index) => {
    wave.style.animation = "none"
    setTimeout(() => {
      wave.style.animation = `soundWave 1.5s ease-in-out infinite ${index * 0.1}s`
    }, 100)
  })

  // Create floating music notes
  createMusicNotes()
}

// Create film particles for movies
function createFilmParticles() {
  const container = document.querySelector(".film-particles")
  if (!container) return

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const particle = document.createElement("div")
      particle.innerHTML = "🎬"
      particle.style.cssText = `
                position: absolute;
                font-size: 2rem;
                animation: particleFloat 15s linear forwards;
                left: ${Math.random() * 100}%;
                opacity: 0;
            `

      container.appendChild(particle)

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle)
        }
      }, 15000)
    }, i * 3000)
  }
}

// Create text particles for books
function createTextParticles() {
  const container = document.querySelector(".floating-pages")
  if (!container) return

  const words = ["📖", "✨", "📚", "💭", "🖋️"]

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const particle = document.createElement("div")
      particle.innerHTML = words[i % words.length]
      particle.style.cssText = `
                position: absolute;
                font-size: 2rem;
                animation: particleFloat 15s linear forwards;
                left: ${Math.random() * 100}%;
                opacity: 0;
            `

      container.appendChild(particle)

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle)
        }
      }, 15000)
    }, i * 3000)
  }
}

// Create music notes
function createMusicNotes() {
  const container = document.querySelector(".music-notes")
  if (!container) return

  const notes = ["♪", "♫", "♬", "🎵", "🎶"]

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const particle = document.createElement("div")
      particle.innerHTML = notes[i % notes.length]
      particle.className = "note"
      particle.style.cssText = `
                position: absolute;
                font-size: 2rem;
                animation: particleFloat 15s linear forwards;
                left: ${Math.random() * 100}%;
                opacity: 0;
            `

      container.appendChild(particle)

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle)
        }
      }, 15000)
    }, i * 3000)
  }
}

// Particle float animation
const particleFloatCSS = `
@keyframes particleFloat {
    0% { 
        transform: translateY(100vh) translateX(0) rotate(0deg); 
        opacity: 0; 
    }
    10% { 
        opacity: 1; 
    }
    90% { 
        opacity: 1; 
    }
    100% { 
        transform: translateY(-100px) translateX(${Math.random() * 200 - 100}px) rotate(360deg); 
        opacity: 0; 
    }
}
`

// Add the CSS to the document
const style = document.createElement("style")
style.textContent = particleFloatCSS
document.head.appendChild(style)

// Helper to create suggestions element if not present
function createSuggestionsEl() {
  const el = document.createElement("div")
  el.id = "searchSuggestions"
  el.className = "search-suggestions"
  Object.assign(el.style, {
    position: "fixed",
    zIndex: "10002", // ensure above any other UI
    left: "0px",
    top: "0px",
    width: "0px",
    display: "none",
  })
  document.body.appendChild(el)
  return el
}

// Helper to get suggestions element safely
function getSuggestionsEl() {
  return document.getElementById("searchSuggestions") || null
}

// Helper to hide suggestions element
function hideSearchSuggestions() {
  const el = getSuggestionsEl()
  if (!el) return
  el.style.display = "none"
  el.innerHTML = ""
  selectedSuggestionIndex = -1
}

// Helper to highlight a suggestion item
function highlightSuggestion(index) {
  const el = getSuggestionsEl()
  if (!el) return
  const items = el.querySelectorAll(".suggestion-item")
  items.forEach((item, i) => {
    item.style.background = i === index ? "rgba(78,205,196,0.12)" : "transparent"
  })
}

// Helper to position the floating suggestions under the search input
function positionSuggestionsEl() {
  const el = getSuggestionsEl()
  if (!el || !searchInput) return
  const rect = searchInput.getBoundingClientRect()
  // 8px gap to match styles.css
  el.style.left = `${Math.round(rect.left)}px`
  el.style.top = `${Math.round(rect.bottom + 8)}px`
  el.style.width = `${Math.round(rect.width)}px`
}

// Search functionality
async function showSearchSuggestions(query) {
  const suggestionsEl = document.getElementById("searchSuggestions") || createSuggestionsEl()
  positionSuggestionsEl()
  const makeUrl = (base) => `${base}/search/${categoryToPath(activeCategory)}/${encodeURIComponent(query)}`
  const endpoint = makeUrl(API_BASE)

  try {
    let res = await fetch(endpoint)
    let ct = res.headers.get("content-type") || ""
    if (!res.ok || !ct.includes("application/json")) {
      // retry once against the default API in case API_BASE was misconfigured
      if (API_BASE !== DEFAULT_API_BASE) {
        res = await fetch(makeUrl(DEFAULT_API_BASE))
        ct = res.headers.get("content-type") || ""
      }
    }
    if (!res.ok || !ct.includes("application/json")) {
      throw new Error(`Suggestions fetch failed: ${res.status} ${ct}`)
    }
    const data = await res.json()
    const items = (data.results || []).slice(0, 10)
    if (!items.length) {
      hideSearchSuggestions()
      return
    }
    suggestionsEl.innerHTML = items
      .map(
        (txt) =>
          `<button type="button" class="suggestion-item" style="display:block;width:100%;text-align:left;padding:8px 10px;border-radius:6px;border:none;background:transparent;color:#e2e8f0;cursor:pointer;">${txt}</button>`,
      )
      .join("")
    positionSuggestionsEl()
    suggestionsEl.style.display = "block"
    selectedSuggestionIndex = -1
    suggestionsEl.querySelectorAll(".suggestion-item").forEach((btn) => {
      btn.onclick = () => {
        searchInput.value = btn.textContent
        hideSearchSuggestions()
        recommendBtn.click()
      }
      btn.onmouseenter = () => (btn.style.background = "rgba(78,205,196,0.12)")
      btn.onmouseleave = () => (btn.style.background = "transparent")
    })
  } catch (e) {
    console.error("[ORO] suggestions error:", e)
    hideSearchSuggestions()
  }
}

// Close suggestions when clicking outside
document.addEventListener("click", (e) => {
  const suggestionsEl = getSuggestionsEl()
  if (!suggestionsEl) return
  if (e.target === searchInput || suggestionsEl.contains(e.target)) return
  hideSearchSuggestions()
})

searchInput.addEventListener("input", (e) => {
  const query = e.target.value

  if (query.length > 2) {
    // Add search suggestions or live filtering here
    showSearchSuggestions(query)
  } else {
    hideSearchSuggestions()
  }
})

searchInput.addEventListener("keydown", (e) => {
  const suggestionsEl = getSuggestionsEl()
  if (!suggestionsEl || suggestionsEl.style.display === "none") return
  const items = suggestionsEl.querySelectorAll(".suggestion-item")
  if (!items.length) return

  if (e.key === "ArrowDown") {
    e.preventDefault()
    selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, items.length - 1)
    highlightSuggestion(selectedSuggestionIndex)
  } else if (e.key === "ArrowUp") {
    e.preventDefault()
    selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0)
    highlightSuggestion(selectedSuggestionIndex)
  } else if (e.key === "Enter") {
    e.preventDefault()
    if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < items.length) {
      items[selectedSuggestionIndex].click()
    } else {
      recommendBtn.click()
    }
  } else if (e.key === "Escape") {
    hideSearchSuggestions()
  }
})

// Recommend button functionality
recommendBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim()
  if (!query) {
    showInputError()
    return
  }
  await fetchAndRenderRecommendations(query, activeCategory)
})

async function fetchAndRenderRecommendations(query, category) {
  const activeSection = document.querySelector(".content-section.active")
  const grid = activeSection?.querySelector(".content-grid")
  if (!grid) return
  const endpoint = `${API_BASE}/recommend/${categoryToPath(category)}/${encodeURIComponent(query)}`

  // Show loading state
  grid.innerHTML = `
    <div class="col-12 text-center" style="padding: 60px 20px;">
      <div style="display: inline-block; animation: spin 1s linear infinite;">
        <i class="fas fa-spinner" style="font-size: 3rem; color: rgba(78,205,196,0.8);"></i>
      </div>
      <p style="margin-top: 20px; color: rgba(226,232,240,0.7); font-size: 1.1rem;">
        Loading recommendations...
      </p>
    </div>
  `

  if (explanationContainer) {
    explanationContainer.style.display = "none"
    explanationContainer.innerHTML = ""
  }

  try {
    const res = await fetch(endpoint, { credentials: "omit" })

    if (!res.ok) {
      if (res.status === 404) {
        showNotFoundError(
          `"${query}" not found. Try another ${category === "movies" ? "movie" : category === "books" ? "book" : "track"}.`,
        )
        grid.innerHTML = ""
        return
      }
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()

    if (data.error) {
      console.warn("[ORO] API returned error:", data.error)
      showNotFoundError(data.error)
      grid.innerHTML = ""
      return
    }

    const recs = data.recommendations || []

    if (recs.length === 0) {
      showNotFoundError(`No recommendations found for "${query}".`)
      grid.innerHTML = ""
      return
    }

    // Clear loading state and render fresh results
    grid.innerHTML = ""
    recs.forEach((rec, index) => {
      const card = createAPICard(rec, category)
      grid.appendChild(card)
      // Staggered animation
      setTimeout(() => {
        card.style.opacity = "1"
        card.style.transform = "translateY(0)"
      }, index * 100)
    })

    if (data.explanation && explanationContainer) {
      explanationContainer.innerHTML = `
        <div class="explanation-text">
          <i class="fas fa-lightbulb" style="margin-right: 8px; color: rgba(78,205,196,0.9);"></i>
          ${data.explanation}
        </div>
      `
      explanationContainer.style.display = "block"
    }
  } catch (e) {
    console.error("[ORO] recommendation error:", e)
    showNotFoundError("Failed to load recommendations. Please try again.")
    grid.innerHTML = ""
  }
}

function showNotFoundError(message) {
  const activeSection = document.querySelector(".content-section.active")
  const grid = activeSection?.querySelector(".content-grid")
  if (!grid) return

  grid.innerHTML = `
    <div class="col-12 text-center" style="padding: 60px 20px;">
      <div style="font-size: 4rem; margin-bottom: 20px;">
        <i class="fas fa-exclamation-circle" style="color: rgba(255,107,107,0.6);"></i>
      </div>
      <p style="color: rgba(226,232,240,0.9); font-size: 1.2rem; margin-bottom: 10px;">
        ${message}
      </p>
      <p style="color: rgba(226,232,240,0.5); font-size: 0.95rem;">
        Try searching for something else
      </p>
    </div>
  `
}

// Card builder using API payload (posterUrl/coverUrl + title)
function createAPICard(rec, category) {
  const col = document.createElement("div")
  col.className = "col-lg-4 col-md-6"
  col.style.cssText = "opacity:0; transform: translateY(30px); transition: all 0.5s ease;"

  const imageUrl = category === "movies" ? rec.posterUrl : category === "books" ? rec.coverUrl : "" // music - optional cover
  const title = category === "music" ? rec.title || rec.track_name || "Track" : rec.title || "Recommendation"
  const subtitle =
    category === "movies"
      ? (rec.genres || "").toString()
      : category === "books"
        ? (rec.authors || "").toString()
        : [rec.artist_name, rec.genre].filter(Boolean).join(" • ") // music

  const mediaClass = category === "movies" ? "movie-poster" : category === "books" ? "book-cover" : "album-cover"
  const iconClass =
    category === "movies" ? "play-overlay" : category === "books" ? "bookmark-overlay" : "headphone-overlay"
  const leadingIcon =
    category === "movies" ? "fas fa-star" : category === "books" ? "fas fa-bookmark" : "fas fa-headphones"

  col.innerHTML = `
    <div class="recommendation-card" style="position: relative;">
      <div class="card-glow"></div>
      <button class="favorite-btn" style="position: absolute; top: 16px; right: 16px; z-index: 10; background: rgba(0,0,0,0.6); border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; transition: all 0.3s; backdrop-filter: blur(4px);">
        <i class="fas fa-heart" style="color: rgba(255,107,107,0.8); font-size: 1.2rem; transition: all 0.3s;"></i>
      </button>
      <div class="card-content">
        <div class="${mediaClass}" style="${
          imageUrl ? `background-image:url('${imageUrl}');background-size:cover;background-position:center;` : ""
        }">
          <i class="${leadingIcon} ${iconClass}"></i>
        </div>
        <h3>${title}</h3>
        <p>${subtitle ? String(subtitle).slice(0, 80) : "AI-picked just for you."}</p>
        <div class="genre-tags">
          <span class="tag">AI-Powered</span>
          <span class="tag">${category === "books" ? "Books" : category === "movies" ? "Movies" : "Music"}</span>
        </div>
      </div>
    </div>
  `

  const favBtn = col.querySelector(".favorite-btn")
  const heartIcon = favBtn.querySelector(".fa-heart")

  favBtn.addEventListener("click", async (e) => {
    e.stopPropagation()
    const result = await toggleFavorite(rec, category)

    if (result === true) {
      // Added to favorites - make heart solid red
      heartIcon.style.color = "rgba(255,77,77,1)"
      heartIcon.classList.remove("far")
      heartIcon.classList.add("fas")
      favBtn.style.transform = "scale(1.2)"
      setTimeout(() => (favBtn.style.transform = "scale(1)"), 200)
    } else if (result === false) {
      // Removed from favorites - make heart outlined
      heartIcon.style.color = "rgba(255,107,107,0.8)"
      heartIcon.classList.remove("fas")
      heartIcon.classList.add("far")
    }
  })

  favBtn.addEventListener("mouseenter", () => {
    favBtn.style.transform = "scale(1.1)"
    heartIcon.style.color = "rgba(255,77,77,1)"
  })

  favBtn.addEventListener("mouseleave", () => {
    favBtn.style.transform = "scale(1)"
    if (!heartIcon.classList.contains("fas")) {
      heartIcon.style.color = "rgba(255,107,107,0.8)"
    }
  })

  return col
}

// Trigger recommendation animation
function triggerRecommendationAnimation() {
  recommendBtn.style.transform = "scale(0.95)"
  recommendBtn.style.filter = "brightness(1.2)"

  setTimeout(() => {
    recommendBtn.style.transform = ""
    recommendBtn.style.filter = ""
  }, 200)

  const originalHTML = recommendBtn.innerHTML
  recommendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Analyzing...</span>'
  recommendBtn.disabled = true

  // Reset after 10 seconds as fallback
  setTimeout(() => {
    recommendBtn.innerHTML = originalHTML
    recommendBtn.disabled = false
  }, 10000)
}

// Card hover effects
document.addEventListener("mouseover", (e) => {
  if (e.target.closest(".recommendation-card")) {
    const card = e.target.closest(".recommendation-card")
    createHoverParticles(card)
  }
})

// Create hover particles
function createHoverParticles(card) {
  for (let i = 0; i < 3; i++) {
    const particle = document.createElement("div")
    particle.innerHTML = "✨"
    particle.style.cssText = `
            position: absolute;
            font-size: 1rem;
            color: rgba(76, 205, 196, 0.8);
            pointer-events: none;
            animation: sparkle 1s ease-out forwards;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            z-index: 10;
        `

    card.style.position = "relative"
    card.appendChild(particle)

    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle)
      }
    }, 1000)
  }
}

// Add sparkle animation
const sparkleCSS = `
@keyframes sparkle {
    0% { 
        transform: scale(0) rotate(0deg); 
        opacity: 1; 
    }
    50% { 
        transform: scale(1) rotate(180deg); 
        opacity: 1; 
    }
    100% { 
        transform: scale(0) rotate(360deg); 
        opacity: 0; 
    }
}
`

// Add the CSS to the document
style.textContent += sparkleCSS

// Add spin animation for loading spinner
const spinCSS = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`

style.textContent += spinCSS

// Lightweight styles for suggestions dropdown
style.textContent += `
.search-suggestions { box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
.search-suggestions .suggestion-item { font-size: 0.95rem; }
`

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  // --- UI Elements --- (already defined above)
  // --- Loading Screen Animation --- (already defined above)
  // --- Tab Switching --- (already defined above)
  // --- Autocomplete Logic --- (already defined above)
  // --- Recommendation Button Logic --- (already defined above)

  if (genreRecommendBtn) {
    genreRecommendBtn.addEventListener("click", async () => {
      const genre = genreInput.value.trim()
      if (!genre) {
        alert("Please enter a genre (e.g., Action, Romance, Jazz)")
        return
      }
      await fetchGenreRecommendations(genre, activeCategory)
    })
  }
})

async function fetchGenreRecommendations(genre, category) {
  const activeSection = document.querySelector(".content-section.active")
  const grid = activeSection?.querySelector(".content-grid")
  if (!grid) return

  const endpoint = `${API_BASE}/recommend/genre/${categoryToPath(category)}/${encodeURIComponent(genre)}`

  // Show loading state
  grid.innerHTML = `
    <div class="col-12 text-center" style="padding: 60px 20px;">
      <div style="display: inline-block; animation: spin 1s linear infinite;">
        <i class="fas fa-spinner" style="font-size: 3rem; color: rgba(255,107,107,0.8);"></i>
      </div>
      <p style="margin-top: 20px; color: rgba(226,232,240,0.7); font-size: 1.1rem;">
        Finding ${genre} ${category}...
      </p>
    </div>
  `

  if (explanationContainer) {
    explanationContainer.style.display = "none"
    explanationContainer.innerHTML = ""
  }

  try {
    const res = await fetch(endpoint, { credentials: "omit" })

    if (!res.ok) {
      if (res.status === 404) {
        showNotFoundError(`No ${category} found for genre: ${genre}. Try another genre.`)
        grid.innerHTML = ""
        return
      }
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()

    if (data.error) {
      console.warn("[ORO] API returned error:", data.error)
      showNotFoundError(data.error)
      grid.innerHTML = ""
      return
    }

    const recs = data.recommendations || []

    if (recs.length === 0) {
      showNotFoundError(`No ${category} found for genre: ${genre}.`)
      grid.innerHTML = ""
      return
    }

    // Clear loading state and render fresh results
    grid.innerHTML = ""
    recs.forEach((rec, index) => {
      const card = createAPICard(rec, category)
      grid.appendChild(card)
      // Staggered animation
      setTimeout(() => {
        card.style.opacity = "1"
        card.style.transform = "translateY(0)"
      }, index * 100)
    })

    if (data.explanation && explanationContainer) {
      explanationContainer.innerHTML = `
        <div class="explanation-text">
          <i class="fas fa-random" style="margin-right: 8px; color: rgba(255,107,107,0.9);"></i>
          ${data.explanation}
        </div>
      `
      explanationContainer.style.display = "block"
    }
  } catch (e) {
    console.error("[ORO] genre recommendation error:", e)
    showNotFoundError("Failed to load genre recommendations. Please try again.")
    grid.innerHTML = ""
  }
}

// Performance optimization
let animationFrameId

function optimizedAnimation() {
  // Only run animations when tab is visible
  if (!document.hidden) {
    // Update particle positions, etc.
  }

  animationFrameId = requestAnimationFrame(optimizedAnimation)
}

// Start optimized animations
optimizedAnimation()

// Pause animations when tab is hidden
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAnimationFrame(animationFrameId)
  } else {
    optimizedAnimation()
  }
})

// Map category to correct API path (fixes music -> musi bug)
const categoryToPath = (cat) => (cat === "movies" ? "movie" : cat === "books" ? "book" : "music")

// Keep dropdown aligned on focus/resize/scroll while visible
searchInput.addEventListener("focus", () => {
  const el = getSuggestionsEl()
  if (el && el.style.display !== "none") positionSuggestionsEl()
})

window.addEventListener("resize", () => {
  const el = getSuggestionsEl()
  if (el && el.style.display !== "none") positionSuggestionsEl()
})

window.addEventListener("scroll", () => {
  const el = getSuggestionsEl()
  if (el && el.style.display !== "none") positionSuggestionsEl()
})
