;(() => {
  const API_BASE = (window.AUTH_API_BASE || "").replace(/\/$/, "") || "/api/auth"
  const MAIN_PAGE = window.MAIN_PAGE || "/" // change to '/index.html' if needed
  const messageEl = document.getElementById("auth-message")

  function showMessage(msg, type = "info") {
    if (!messageEl) return
    messageEl.textContent = msg
    messageEl.className = `auth-message ${type}`
  }

  async function api(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include", // send/receive httpOnly cookies
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    })
    let data = null
    try {
      data = await res.json()
    } catch (_) {}
    return { ok: res.ok, status: res.status, data }
  }

  async function checkSession() {
    const { ok, data } = await api("/me")
    if (ok && data && data.user) {
      showMessage("You are already signed in", "success")
      setTimeout(() => {
        window.location.href = MAIN_PAGE
      }, 800)
      return true
    }
    return false
  }

  // Handle Login
  async function wireLoginForm() {
    const form = document.getElementById("login-form")
    if (!form) return

    form.addEventListener("submit", async (e) => {
      e.preventDefault()
      showMessage("Signing in...", "info")

      const formData = new FormData(form)
      const email = String(formData.get("email") || "").trim()
      const password = String(formData.get("password") || "")

      if (!email || !password) {
        showMessage("Please enter email and password", "error")
        return
      }

      const { ok, status, data } = await api("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      if (ok) {
        showMessage(data?.message || "Signed in", "success")
        setTimeout(() => {
          window.location.href = MAIN_PAGE
        }, 500)
        return
      }

      if (status === 401) {
        showMessage("Invalid email or password", "error")
        return
      }
      if (status === 409) {
        showMessage("Account already exists", "warn")
        return
      }
      showMessage(data?.message || "Something went wrong", "error")
    })
  }

  // Handle Sign Up (if your page has a signup form with id="signup-form")
  async function wireSignupForm() {
    const form = document.getElementById("signup-form")
    if (!form) return

    form.addEventListener("submit", async (e) => {
      e.preventDefault()
      showMessage("Creating account...", "info")

      const formData = new FormData(form)
      const email = String(formData.get("email") || "").trim()
      const password = String(formData.get("password") || "")
      const name = String(formData.get("name") || "").trim()

      if (!email || !password) {
        showMessage("Please provide an email and password", "error")
        return
      }

      const { ok, status, data } = await api("/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      })

      if (ok) {
        showMessage(data?.message || "Account created", "success")
        setTimeout(() => {
          window.location.href = MAIN_PAGE
        }, 600)
        return
      }

      if (status === 409) {
        showMessage("Account already exists", "warn")
        return
      }
      if (status === 400) {
        showMessage("Please check your inputs", "error")
        return
      }
      showMessage(data?.message || "Something went wrong", "error")
    })
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // If already signed in, inform and redirect
    const already = await checkSession()
    if (already) return

    // Wire forms without causing page refresh
    await wireLoginForm()
    await wireSignupForm()
  })
})()
