// DOM Elements
const loadingScreen = document.getElementById("loadingScreen")
const mainContent = document.getElementById("mainContent")
const categoryTabs = document.querySelectorAll(".category-tab")
const contentSections = document.querySelectorAll(".content-section")
const searchInput = document.getElementById("searchInput")
const recommendBtn = document.getElementById("recommendBtn")

// API base with safe default and optional override via window.API_BASE
const API_BASE = window.API_BASE || "http://localhost:8000"

// Function to show input error
function showInputError() {
  alert("Please enter a valid query.")
}

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
let selectedSuggestionIndex = -1

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
    zIndex: "9999",
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

    selectedSuggestionIndex = -1

    suggestionsEl.innerHTML = items
      .map(
        (txt) =>
          `<button type="button" class="suggestion-item" style="display:block;width:100%;text-align:left;padding:8px 10px;border-radius:6px;border:none;background:transparent;color:#e2e8f0;cursor:pointer;">${txt}</button>`,
      )
      .join("")

    suggestionsEl.style.display = "block"

    suggestionsEl.querySelectorAll(".suggestion-item").forEach((btn, index) => {
      btn.onclick = () => {
        searchInput.value = btn.textContent
        hideSearchSuggestions()
        // Trigger recommendation immediately
        recommendBtn.click()
      }
      btn.onmouseenter = () => {
        // Clear keyboard selection when hovering
        clearSuggestionHighlight()
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

function clearSuggestionHighlight() {
  if (!suggestionsEl) return
  suggestionsEl.querySelectorAll(".suggestion-item").forEach((btn) => {
    btn.style.background = "transparent"
  })
}

function highlightSuggestion(index) {
  if (!suggestionsEl) return
  const items = suggestionsEl.querySelectorAll(".suggestion-item")
  if (index < 0 || index >= items.length) return

  clearSuggestionHighlight()
  items[index].style.background = "rgba(78,205,196,0.2)"
  items[index].scrollIntoView({ block: "nearest", behavior: "smooth" })
}

function hideSearchSuggestions() {
  if (suggestionsEl) {
    suggestionsEl.style.display = "none"
    selectedSuggestionIndex = -1
  }
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

searchInput.addEventListener("keydown", (e) => {
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
      // Select the highlighted suggestion
      items[selectedSuggestionIndex].click()
    } else {
      // No selection, just trigger recommendation with current input
      recommendBtn.click()
    }
  } else if (e.key === "Escape") {
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
    showNotFoundError("Music recommendations coming soon!")
    return
  }

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

  try {
    const res = await fetch(endpoint, { credentials: "omit" })

    if (!res.ok) {
      if (res.status === 404) {
        showNotFoundError(`"${query}" not found. Try another ${category === "movies" ? "movie" : "book"}.`)
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

    // Optionally use explanation from API (kept to console to preserve exact UI)
    if (data.explanation) {
      console.log("[ORO] Explanation:", data.explanation)
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
    // --- Get all UI elements ---
    const searchInput = document.getElementById("searchInput");
    const recommendBtn = document.getElementById("recommendBtn");
    const categoryTabs = document.querySelectorAll(".category-tab");
    const suggestionsBox = document.createElement('div');
    suggestionsBox.className = 'suggestions-box';
    searchInput.parentElement.appendChild(suggestionsBox); // Append suggestions box

    let activeCategory = 'movies';

    // --- Tab Switching ---
    categoryTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            activeCategory = tab.dataset.category;
            categoryTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            // Update resultsGrid to the new active section
            const newGrid = document.querySelector(`#${activeCategory}Section .content-grid`);
            if (newGrid) newGrid.innerHTML = '';
            searchInput.value = '';
            suggestionsBox.innerHTML = '';
        });
    });

    // --- Helper Functions ---
    function debounce(func, delay = 350) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // --- Autocomplete Logic ---
    const handleSearchInput = async () => {
        const query = searchInput.value;
        if (query.length < 3) {
            suggestionsBox.innerHTML = '';
            suggestionsBox.style.display = 'none';
            return;
        }
        try {
            // --- THIS IS THE FIX ---
            const apiType = activeCategory === 'movies' ? 'movie' : 'book';
            const response = await fetch(`http://127.0.0.1:8001/search/${apiType}/${query}`);
            const data = await response.json();
            suggestionsBox.innerHTML = '';
            if (data.results && data.results.length > 0) {
                data.results.forEach(title => {
                    const item = document.createElement('div');
                    item.className = 'suggestion-item';
                    item.textContent = title;
                    item.addEventListener('click', () => {
                        searchInput.value = title;
                        suggestionsBox.innerHTML = '';
                        suggestionsBox.style.display = 'none';
                        recommendBtn.click();
                    });
                    suggestionsBox.appendChild(item);
                });
                suggestionsBox.style.display = 'block';
            } else {
                suggestionsBox.style.display = 'none';
            }
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            suggestionsBox.style.display = 'none';
        }
    };
    searchInput.addEventListener('input', debounce(handleSearchInput));

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!suggestionsBox.contains(e.target) && e.target !== searchInput) {
            suggestionsBox.innerHTML = '';
            suggestionsBox.style.display = 'none';
        }
    });

    // --- Recommendation Button Logic ---
    recommendBtn.addEventListener("click", async () => {
        const query = searchInput.value.trim();
        if (!query) return;

        const originalBtnHTML = recommendBtn.innerHTML;
        recommendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Analyzing...</span>';
        recommendBtn.disabled = true;

        try {
            // --- THIS IS THE FIX ---
            const apiType = activeCategory === 'movies' ? 'movie' : 'book';
            const endpoint = `http://127.0.0.1:8001/recommend/${apiType}/${query}`;
            const response = await fetch(endpoint);
            const data = await response.json();

            // Find the correct grid for the active section
            const grid = document.querySelector(`#${activeCategory}Section .content-grid`);
            if (grid) {
                grid.innerHTML = '';
                if (data.recommendations && data.recommendations.length > 0) {
                    data.recommendations.forEach(rec => {
                        const card = document.createElement('div');
                        card.className = "col-lg-4 col-md-6";
                        card.innerHTML = `
                            <div class="recommendation-card">
                                <div class="card-content">
                                    <div class="${apiType === 'movie' ? 'movie-poster' : 'book-cover'}"
                                        style="background-image:url('${apiType === 'movie' ? rec.posterUrl : rec.coverUrl || ''}');background-size:cover;background-position:center;">
                                    </div>
                                    <h3>${rec.title || ''}</h3>
                                    <p>${apiType === 'movie' ? (rec.genres || '') : (rec.authors || '')}</p>
                                </div>
                            </div>
                        `;
                        grid.appendChild(card);
                    });
                } else {
                    grid.innerHTML = `<div class="col-12"><p class="error-message">No recommendations found.</p></div>`;
                }
            }
        } catch (error) {
            console.error("Error fetching recommendations:", error);
        } finally {
            recommendBtn.innerHTML = originalBtnHTML;
            recommendBtn.disabled = false;
        }
    });
    function displayResults(items, type) {
        resultsGrid.innerHTML = '';
        if (!Array.isArray(items) || items.length === 0) {
            resultsGrid.innerHTML = `<p class="text-muted text-center">No results found.</p>`;
            return;
        }

        items.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6 mb-4';

            const posterSrc = item.posterUrl || item.coverUrl || 'https://via.placeholder.com/500x750.png?text=No+Image';
            const itemTitle = item.title || item.track_name;
            const itemSubtitle = item.genres || item.authors || item.artist_name || '';

            // Create the card element
            const card = document.createElement('div');
            card.className = 'recommendation-card';
            card.innerHTML = `
                <div class="card-glow"></div>
                <div class="movie-poster" style="background-image: url('${posterSrc}'); background-size: cover; background-position: center;">
                    <i class="fas fa-play play-overlay"></i>
                </div>
                <div class="card-content">
                    <h3>${itemTitle}</h3>
                    <p>${itemSubtitle}</p>
                </div>
            `;

            // --- NEW: FAVORITE BUTTON ---
            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = 'favorite-btn';
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>'; // Font Awesome heart icon

            // Add the click logic for the button
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevents other clicks from firing
                favoriteBtn.classList.toggle('favorited');
                console.log(`Toggled favorite for: ${itemTitle}`);
                // Later, we will add an API call here to save this to the database
            });

            // Add the button to the card
            card.appendChild(favoriteBtn);
            col.appendChild(card);
            resultsGrid.appendChild(col);
        });

        // Re-initialize Feather Icons to render the new heart icons
        feather.replace();

        // --- NEW: Add event listeners to the new favorite buttons ---
        document.querySelectorAll('.favorite-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevents other clicks from firing
                button.classList.toggle('favorited');
                const title = button.dataset.title;
                console.log(`Toggled favorite for: ${title}`);
                // Later, we will add an API call here to save this to the database
            });
        });
    }

});

// --- THIS IS THE CORRECTED FUNCTION ---
function showRecommendationResults(query, category) {
    const activeSection = document.querySelector(".content-section.active");
    const grid = activeSection.querySelector(".content-grid");

    // Clear previous results
    grid.innerHTML = "";

    // Simulate API call and display results
    setTimeout(() => {
        // This is where you would normally get data from your API
        const dummyData = [
            { title: "Recommendation 1", genres: "Genre A" },
            { title: "Recommendation 2", genres: "Genre B" },
            { title: "Recommendation 3", genres: "Genre C" },
            { title: "Recommendation 4", genres: "Genre D" },
            { title: "Recommendation 5", genres: "Genre E" },
        ];

        if (dummyData.length === 0) {
            grid.innerHTML = `<p class="text-muted text-center">No recommendations found.</p>`;
            return;
        }

        dummyData.forEach(rec => {
            const cardCol = createRecommendationCard(rec, category);

            // --- FAVORITE BUTTON LOGIC ---
            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = 'favorite-btn';
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>'; // Font Awesome Icon

            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                favoriteBtn.classList.toggle('favorited');
                console.log(`Toggled favorite for: ${rec.title}`);
                // Later, we will add an API call here to save this
            });

            // Append the button to the card inside the column
            cardCol.querySelector('.recommendation-card').appendChild(favoriteBtn);

            grid.appendChild(cardCol);

            // Animate the new card
            setTimeout(() => {
                cardCol.style.opacity = "1";
                cardCol.style.transform = "translateY(0)";
            }, 100);
        });
    }, 1000); // Simulate 1s loading time
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
