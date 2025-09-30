// DOM Elements
const loadingScreen = document.getElementById("loadingScreen")
const mainContent = document.getElementById("mainContent")
const categoryTabs = document.querySelectorAll(".category-tab")
const contentSections = document.querySelectorAll(".content-section")
const searchInput = document.getElementById("searchInput")
const recommendBtn = document.getElementById("recommendBtn")

// API base with safe default and optional override via window.API_BASE
const API_BASE = window.API_BASE || "http://localhost:8000"

// Loading Screen Animation
window.addEventListener("load", () => {
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

// Create dynamic film particles
function createFilmParticles() {
  const container = document.querySelector("#moviesSection .section-background")
  if (!container) return

  for (let i = 0; i < 5; i++) {
    const particle = document.createElement("div")
    particle.className = "dynamic-particle"
    particle.innerHTML = "🎬"
    particle.style.cssText = `
            position: absolute;
            font-size: 1.5rem;
            color: rgba(255, 107, 107, 0.6);
            pointer-events: none;
            animation: particleFloat 8s linear infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${i * 1.6}s;
        `

    container.appendChild(particle)

    // Remove particle after animation
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle)
      }
    }, 8000)
  }
}

// Create floating text particles
function createTextParticles() {
  const container = document.querySelector("#booksSection .section-background")
  if (!container) return

  const textSymbols = ["📖", "📚", "✍️", "📝", "📄"]

  for (let i = 0; i < 5; i++) {
    const particle = document.createElement("div")
    particle.className = "dynamic-particle"
    particle.innerHTML = textSymbols[Math.floor(Math.random() * textSymbols.length)]
    particle.style.cssText = `
            position: absolute;
            font-size: 1.5rem;
            color: rgba(76, 205, 196, 0.6);
            pointer-events: none;
            animation: particleFloat 8s linear infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${i * 1.6}s;
        `

    container.appendChild(particle)

    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle)
      }
    }, 8000)
  }
}

// Create floating music notes
function createMusicNotes() {
  const container = document.querySelector("#musicSection .section-background")
  if (!container) return

  const musicSymbols = ["🎵", "🎶", "🎤", "🎧", "🎸"]

  for (let i = 0; i < 5; i++) {
    const particle = document.createElement("div")
    particle.className = "dynamic-particle"
    particle.innerHTML = musicSymbols[Math.floor(Math.random() * musicSymbols.length)]
    particle.style.cssText = `
            position: absolute;
            font-size: 1.5rem;
            color: rgba(69, 183, 209, 0.6);
            pointer-events: none;
            animation: particleFloat 8s linear infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${i * 1.6}s;
        `

    container.appendChild(particle)

    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle)
      }
    }, 8000)
  }
}

// Add particle float animation
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

// Search functionality
let suggestionsEl
function ensureSuggestionsEl() {
  if (suggestionsEl) return
  suggestionsEl = document.createElement("div")
  suggestionsEl.id = "searchSuggestions"
  suggestionsEl.className = "search-suggestions"
  const wrapper = searchInput.parentElement || document.body
  wrapper.style.position = wrapper.style.position || "relative"
  Object.assign(suggestionsEl.style, {
    position: "absolute",
    top: "100%",
    left: "0",
    right: "0",
    zIndex: "50",
    background: "rgba(15,23,42,0.95)",
    border: "1px solid rgba(78,205,196,0.2)",
    borderRadius: "8px",
    backdropFilter: "blur(6px)",
    display: "none",
    padding: "6px",
    marginTop: "6px",
    maxHeight: "240px",
    overflowY: "auto",
  })
  wrapper.appendChild(suggestionsEl)
}

async function showSearchSuggestions(query) {
  ensureSuggestionsEl()
  const activeTab = document.querySelector(".category-tab.active")
  const category = activeTab ? activeTab.dataset.category : "movies"
  const endpoint =
    category === "movies"
      ? `${API_BASE}/search/movie/${encodeURIComponent(query)}`
      : category === "books"
        ? `${API_BASE}/search/book/${encodeURIComponent(query)}`
        : null

  if (!endpoint) {
    hideSearchSuggestions()
    return
  }

  try {
    const res = await fetch(endpoint, { credentials: "omit" })
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

    suggestionsEl.style.display = "block"
    suggestionsEl.querySelectorAll(".suggestion-item").forEach((btn) => {
      btn.onclick = () => {
        searchInput.value = btn.textContent
        hideSearchSuggestions()
      }
      btn.onmouseenter = () => {
        btn.style.background = "rgba(78,205,196,0.12)"
      }
      btn.onmouseleave = () => {
        btn.style.background = "transparent"
      }
    })
  } catch (e) {
    console.error("[ORO] suggestions error:", e)
    hideSearchSuggestions()
  }
}

function hideSearchSuggestions() {
  if (suggestionsEl) suggestionsEl.style.display = "none"
}

// Close suggestions when clicking outside
document.addEventListener("click", (e) => {
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

// Recommend button functionality
recommendBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim()
  const activeTab = document.querySelector(".category-tab.active")
  const category = activeTab ? activeTab.dataset.category : "movies"

  if (!query) {
    showInputError()
    return
  }

  // Button micro-interaction + temporary loading state
  triggerRecommendationAnimation()

  await fetchAndRenderRecommendations(query, category)
})

// Fetch recommendations from FastAPI and render into the active grid
async function fetchAndRenderRecommendations(query, category) {
  const activeSection = document.querySelector(".content-section.active")
  const grid = activeSection?.querySelector(".content-grid")
  if (!grid) return

  let endpoint = null
  if (category === "movies") {
    endpoint = `${API_BASE}/recommend/movie/${encodeURIComponent(query)}`
  } else if (category === "books") {
    endpoint = `${API_BASE}/recommend/book/${encodeURIComponent(query)}`
  } else {
    // Music not yet supported by backend; show gentle error animation
    showInputError()
    return
  }

  try {
    const res = await fetch(endpoint, { credentials: "omit" })
    const data = await res.json()
    if (data.error) {
      console.warn("[ORO] API returned error:", data.error)
      showInputError()
      return
    }
    const recs = data.recommendations || []

    // Clear existing results then render fresh ones
    grid.innerHTML = ""
    recs.forEach((rec) => {
      const card = createAPICard(rec, category)
      grid.appendChild(card)
      // Animate in
      requestAnimationFrame(() => {
        card.style.opacity = "1"
        card.style.transform = "translateY(0)"
      })
    })

    // Optionally use explanation from API (kept to console to preserve exact UI)
    if (data.explanation) {
      console.log("[ORO] Explanation:", data.explanation)
    }
  } catch (e) {
    console.error("[ORO] recommendation error:", e)
    showInputError()
  }
}

// Card builder using API payload (posterUrl/coverUrl + title)
function createAPICard(rec, category) {
  const col = document.createElement("div")
  col.className = "col-lg-4 col-md-6"
  col.style.cssText = "opacity:0; transform: translateY(30px); transition: all 0.5s ease;"

  const imageUrl = category === "movies" ? rec.posterUrl : category === "books" ? rec.coverUrl : ""
  const title = rec.title || "Recommendation"
  const subtitle =
    category === "movies" ? (rec.genres || "").toString() : category === "books" ? (rec.authors || "").toString() : ""

  const mediaClass = category === "movies" ? "movie-poster" : category === "books" ? "book-cover" : "album-cover"
  const iconClass =
    category === "movies" ? "play-overlay" : category === "books" ? "bookmark-overlay" : "headphone-overlay"
  const leadingIcon =
    category === "movies" ? "fas fa-star" : category === "books" ? "fas fa-bookmark" : "fas fa-headphones"

  col.innerHTML = `
    <div class="recommendation-card">
      <div class="card-glow"></div>
      <div class="card-content">
        <div class="${mediaClass}" style="${imageUrl ? `background-image:url('${imageUrl}');background-size:cover;background-position:center;` : ""}">
          <i class="${leadingIcon} ${iconClass}"></i>
        </div>
        <h3>${title}</h3>
        <p>${subtitle ? String(subtitle).slice(0, 80) : "AI-picked just for you."}</p>
        <div class="genre-tags">
          <span class="tag">AI-Powered</span>
          <span class="tag">${category === "books" ? "Books" : "Movies"}</span>
        </div>
      </div>
    </div>
  `
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

  // Add loading state to button
  const originalText = recommendBtn.innerHTML
  recommendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Analyzing...</span>'

  setTimeout(() => {
    recommendBtn.innerHTML = originalText
  }, 2000)
}

// Show input error
function showInputError() {
  searchInput.style.borderColor = "#ff6b6b"
  searchInput.style.boxShadow = "0 0 20px rgba(255, 107, 107, 0.3)"
  searchInput.placeholder = "Please enter a search term..."

  setTimeout(() => {
    searchInput.style.borderColor = ""
    searchInput.style.boxShadow = ""
    updateSearchPlaceholder(document.querySelector(".category-tab.active").dataset.category)
  }, 2000)
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

style.textContent += sparkleCSS

// Lightweight styles for suggestions dropdown
style.textContent += `
.search-suggestions { box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
.search-suggestions .suggestion-item { font-size: 0.95rem; }
`

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  // Set initial category
  updateSearchPlaceholder("movies")

  // Start background animations
  setTimeout(() => {
    triggerCategoryAnimations("movies")
  }, 3500)

  console.log("ORO Recommendation Engine Initialized")
})

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Enter key to trigger recommendation
  if (e.key === "Enter" && document.activeElement === searchInput) {
    recommendBtn.click()
  }

  // Tab switching with number keys
  if (e.key >= "1" && e.key <= "3") {
    const tabIndex = Number.parseInt(e.key) - 1
    const tabs = Array.from(categoryTabs)
    if (tabs[tabIndex]) {
      tabs[tabIndex].click()
    }
  }
})

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
