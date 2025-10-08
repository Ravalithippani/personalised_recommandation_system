// Profile Page JavaScript

const AUTH_API_BASE = (window.AUTH_API_BASE || "http://localhost:8081").replace(/\/$/, "")

function getAuthToken() {
  try {
    return localStorage.getItem("auth_token")
  } catch {
    return null
  }
}

function clearAuth() {
  try {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("currentUser")
  } catch {}
}

// Check if user is logged in
async function checkAuth() {
  const token = getAuthToken()
  if (!token) {
    window.location.href = "login.html"
    return null
  }

  try {
    const res = await fetch(`${AUTH_API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      clearAuth()
      window.location.href = "login.html"
      return null
    }

    const user = await res.json()
    return user
  } catch (e) {
    console.error("[Profile] Auth check failed:", e)
    clearAuth()
    window.location.href = "login.html"
    return null
  }
}

// Load user info
async function loadUserInfo() {
  const user = await checkAuth()
  if (!user) return

  document.getElementById("userName").textContent = user.name || "User"
  document.getElementById("userEmail").textContent = user.email || ""
}

// Load favorites
async function loadFavorites(filter = "all") {
  const token = getAuthToken()
  if (!token) return

  const grid = document.getElementById("favoritesGrid")
  grid.innerHTML =
    '<div class="loading-favorites"><i class="fas fa-spinner fa-spin"></i><p>Loading your favorites...</p></div>'

  try {
    const res = await fetch(`${AUTH_API_BASE}/api/auth/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      throw new Error("Failed to load favorites")
    }

    const data = await res.json()
    let favorites = data.favorites || []

    // Filter favorites
    if (filter !== "all") {
      favorites = favorites.filter((fav) => fav.itemType === filter)
    }

    // Sort by most recent
    favorites.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))

    // Render favorites
    if (favorites.length === 0) {
      grid.innerHTML = `
        <div class="empty-favorites">
          <i class="fas fa-heart-broken"></i>
          <h3>No favorites yet</h3>
          <p>Start exploring and add items to your favorites!</p>
        </div>
      `
      return
    }

    grid.innerHTML = ""
    favorites.forEach((fav) => {
      const card = createFavoriteCard(fav)
      grid.appendChild(card)
    })
  } catch (e) {
    console.error("[Profile] Failed to load favorites:", e)
    grid.innerHTML = `
      <div class="empty-favorites">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Failed to load favorites</h3>
        <p>Please try again later</p>
      </div>
    `
  }
}

// Create favorite card
function createFavoriteCard(fav) {
  const card = document.createElement("div")
  card.className = "favorite-card"
  card.dataset.type = fav.itemType

  const metadata = fav.metadata || {}
  const imageUrl = fav.itemType === "movie" ? metadata.posterUrl : fav.itemType === "book" ? metadata.coverUrl : ""
  const icon = fav.itemType === "movie" ? "fas fa-film" : fav.itemType === "book" ? "fas fa-book" : "fas fa-music"

  card.innerHTML = `
    <div class="favorite-image" style="${imageUrl ? `background-image: url('${imageUrl}');` : ""}">
      ${!imageUrl ? `<i class="${icon}"></i>` : ""}
      <button class="remove-favorite-btn" data-id="${fav._id}">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="favorite-content">
      <h3 class="favorite-title">${fav.title}</h3>
      <span class="favorite-type">${fav.itemType}</span>
    </div>
  `

  // Remove favorite handler
  const removeBtn = card.querySelector(".remove-favorite-btn")
  removeBtn.addEventListener("click", async (e) => {
    e.stopPropagation()
    await removeFavorite(fav._id)
    card.style.opacity = "0"
    card.style.transform = "scale(0.8)"
    setTimeout(() => {
      card.remove()
      // Check if grid is empty
      const remaining = document.querySelectorAll(".favorite-card")
      if (remaining.length === 0) {
        const currentFilter = document.querySelector(".filter-btn.active").dataset.filter
        loadFavorites(currentFilter)
      }
    }, 300)
  })

  return card
}

// Remove favorite
async function removeFavorite(id) {
  const token = getAuthToken()
  if (!token) return

  try {
    const res = await fetch(`${AUTH_API_BASE}/api/auth/favorites/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      console.log("[Profile] Removed from favorites")
    }
  } catch (e) {
    console.error("[Profile] Failed to remove favorite:", e)
  }
}

// Change password
document.getElementById("changePasswordForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const currentPassword = document.getElementById("currentPassword").value
  const newPassword = document.getElementById("newPassword").value
  const confirmNewPassword = document.getElementById("confirmNewPassword").value
  const messageEl = document.getElementById("passwordMessage")

  if (newPassword !== confirmNewPassword) {
    messageEl.textContent = "New passwords do not match"
    messageEl.className = "message error"
    messageEl.style.display = "block"
    return
  }

  if (newPassword.length < 6) {
    messageEl.textContent = "Password must be at least 6 characters"
    messageEl.className = "message error"
    messageEl.style.display = "block"
    return
  }

  const token = getAuthToken()
  if (!token) return

  try {
    const res = await fetch(`${AUTH_API_BASE}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    const data = await res.json()

    if (res.ok) {
      messageEl.textContent = "Password changed successfully!"
      messageEl.className = "message success"
      messageEl.style.display = "block"
      document.getElementById("changePasswordForm").reset()
    } else {
      messageEl.textContent = data.msg || "Failed to change password"
      messageEl.className = "message error"
      messageEl.style.display = "block"
    }
  } catch (e) {
    console.error("[Profile] Password change failed:", e)
    messageEl.textContent = "Failed to change password. Please try again."
    messageEl.className = "message error"
    messageEl.style.display = "block"
  }
})

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  clearAuth()
  window.location.href = "login.html"
})

// Filter favorites
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"))
    btn.classList.add("active")
    loadFavorites(btn.dataset.filter)
  })
})

// Initialize profile page
document.addEventListener("DOMContentLoaded", async () => {
  await loadUserInfo()
  await loadFavorites("all")
})
