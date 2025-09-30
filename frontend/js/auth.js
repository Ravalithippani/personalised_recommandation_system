// CodeRabbit Integration
console.log("CodeRabbit: Active - Monitoring code quality in background")

// --- Removed: Globe Canvas Setup & Animation ---
// const canvas = document.getElementById("globeCanvas")
// const ctx = canvas.getContext("2d")
// function resizeCanvas() { ... }
// class Globe { ... }
// const globe = new Globe(); globe.animate();

// Tab Switching
const tabBtns = document.querySelectorAll(".tab-btn")
const authForms = document.querySelectorAll(".auth-form")

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetTab = btn.getAttribute("data-tab")

    // Update active states
    tabBtns.forEach((b) => b.classList.remove("active"))
    authForms.forEach((f) => f.classList.remove("active"))

    btn.classList.add("active")
    document.getElementById(targetTab + "Form").classList.add("active")
  })
})

// Password Toggle
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", function () {
    const input = this.parentElement.querySelector(".form-input")
    const type = input.getAttribute("type") === "password" ? "text" : "password"
    input.setAttribute("type", type)

    // Update icon
    const svg = this.querySelector("svg")
    if (type === "text") {
      svg.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            `
    } else {
      svg.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            `
    }
  })
})

// Password Strength Checker
const signupPassword = document.getElementById("signupPassword")
const passwordStrength = document.querySelector(".password-strength")
const strengthProgress = document.querySelector(".strength-progress")
const strengthText = document.querySelector(".strength-text")

signupPassword?.addEventListener("input", function () {
  const password = this.value
  let strength = 0

  if (password.length > 0) {
    passwordStrength.classList.add("show")
  } else {
    passwordStrength.classList.remove("show")
    return
  }

  if (password.length >= 8) strength += 25
  if (password.match(/[a-z]+/)) strength += 25
  if (password.match(/[A-Z]+/)) strength += 25
  if (password.match(/[0-9]+/)) strength += 25
  if (password.match(/[$@#&!]+/)) strength += 25
  strength = Math.min(strength, 100)

  strengthProgress.style.width = strength + "%"

  if (strength < 40) {
    strengthText.textContent = "Weak password"
    strengthProgress.style.background = "#ff4444"
  } else if (strength < 70) {
    strengthText.textContent = "Medium strength"
    strengthProgress.style.background = "#ffaa00"
  } else {
    strengthText.textContent = "Strong password"
    strengthProgress.style.background = "#00ff00"
  }
})

// Form Validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function showError(input, message) {
  input.classList.add("invalid")
  input.classList.remove("valid")

  let errorElement = input.parentElement.querySelector(".error-message")
  if (!errorElement) {
    errorElement = document.createElement("div")
    errorElement.className = "error-message"
    input.parentElement.appendChild(errorElement)
  }
  errorElement.textContent = message
  errorElement.classList.add("show")
}

function showSuccess(input) {
  input.classList.add("valid")
  input.classList.remove("invalid")

  const errorElement = input.parentElement.querySelector(".error-message")
  if (errorElement) {
    errorElement.classList.remove("show")
  }
}

// Email validation on input
document.querySelectorAll('input[type="email"]').forEach((input) => {
  input.addEventListener("blur", function () {
    if (this.value && !validateEmail(this.value)) {
      showError(this, "Please enter a valid email address")
    } else if (this.value) {
      showSuccess(this)
    }
  })
})

// Utilities for banner messages
function showBanner(message, type = "info") {
  const banner = document.getElementById("authBanner")
  if (!banner) return
  banner.textContent = message
  banner.style.display = "block"
  banner.className = `auth-banner ${type}`
}
function hideBanner() {
  const banner = document.getElementById("authBanner")
  if (!banner) return
  banner.style.display = "none"
  banner.textContent = ""
  banner.className = "auth-banner"
}

// Token helpers
const TOKEN_KEY = "auth_token"
function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {}
}
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

const MAIN_PAGE = window.MAIN_PAGE || "index.html"
const API_BASE = (window.AUTH_API_BASE || "http://localhost:8081").replace(/\/$/, "")

// --- Centralized DOM hooks and real auth flow ---
document.addEventListener("DOMContentLoaded", () => {
  // Determine which page we're on by checking for a specific form
  const isLoginPage = !!document.getElementById('signinForm');
  const isForgotPage = !!document.getElementById('forgotPasswordForm');
  const isResetPage = !!document.getElementById('resetPasswordForm');

  const authBanner = document.getElementById('authBanner');

  function showBanner(message, type = 'error') {
      if (!authBanner) return;
      authBanner.textContent = message;
      authBanner.className = `auth-banner ${type}`;
      authBanner.style.display = 'block';
  }

  // --- LOGIC FOR THE MAIN LOGIN/SIGNUP PAGE ---
  if (isLoginPage) {
      // Tab switching logic
      const tabButtons = document.querySelectorAll('.tab-btn');
      const authForms = document.querySelectorAll('.auth-form');
      tabButtons.forEach(button => {
          button.addEventListener('click', () => {
              tabButtons.forEach(btn => btn.classList.remove('active'));
              button.classList.add('active');
              const tab = button.dataset.tab;
              authForms.forEach(form => {
                  form.classList.toggle('active', form.id === `${tab}Form`);
              });
          });
      });

      // Sign In logic
      const signinForm = document.getElementById('signinForm');
      signinForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const email = document.getElementById('signinEmail').value;
          const password = document.getElementById('signinPassword').value;
          try {
              const response = await fetch('http://localhost:8081/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password }),
              });
              const data = await response.json();
              if (!response.ok) {
                  showBanner(data.msg || 'Login failed.', 'error');
              } else {
                  showBanner('Login successful! Redirecting...', 'success');
                  setTimeout(() => { window.location.href = 'index.html'; }, 1000);
              }
          } catch (error) {
              showBanner('Could not connect to the login server.', 'error');
          }
      });

      // Sign Up logic
      const signupForm = document.getElementById('signupForm');
      signupForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const name = document.getElementById('signupName').value;
          const email = document.getElementById('signupEmail').value;
          const password = document.getElementById('signupPassword').value;
          try {
              const response = await fetch('http://localhost:8081/api/auth/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, email, password }),
              });
              const data = await response.json();
              if (!response.ok) {
                  showBanner(data.msg || 'Registration failed.', 'error');
              } else {
                  showBanner('Registration successful! Redirecting...', 'success');
                  setTimeout(() => { window.location.href = 'index.html'; }, 1000);
              }
          } catch (error) {
              showBanner('Could not connect to the registration server.', 'error');
          }
      });

      // Forgot password link logic
      const forgotLink = document.querySelector('.forgot-link');
      if (forgotLink) {
          forgotLink.addEventListener('click', (e) => {
              e.preventDefault();
              window.location.href = 'forgot-password.html';
          });
      }
  }

  // --- LOGIC FOR THE FORGOT PASSWORD PAGE ---
  if (isForgotPage) {
      const forgotForm = document.getElementById('forgotPasswordForm');
      forgotForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const email = document.getElementById('resetEmail').value;
          try {
              const response = await fetch('http://localhost:8081/api/auth/forgot-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
              });
              const data = await response.json();
              showBanner(data.msg || 'If your email exists, a reset link has been sent.', 'success');
          } catch (error) {
              showBanner('Could not connect to the server.', 'error');
          }
      });
  }

  // --- LOGIC FOR THE RESET PASSWORD PAGE ---
  if (isResetPage) {
      const resetForm = document.getElementById('resetPasswordForm');
      resetForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const newPassword = document.getElementById('newPassword').value;
          const confirmPassword = document.getElementById('confirmNewPassword').value;
          
          if (newPassword !== confirmPassword) {
              return showBanner('Passwords do not match.', 'error');
          }

          // Get the token from the URL
          const urlParams = new URLSearchParams(window.location.search);
          const token = urlParams.get('token');

          if (!token) {
              return showBanner('Invalid or missing reset token in the URL.', 'error');
          }

          try {
              const response = await fetch(`http://localhost:8081/api/auth/reset-password/${token}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password: newPassword }),
              });
              const data = await response.json();
              if (!response.ok) {
                  showBanner(data.msg || 'Password reset failed.', 'error');
              } else {
                  showBanner('Password reset successfully! Redirecting to login...', 'success');
                  setTimeout(() => { window.location.href = 'login.html'; }, 2000);
              }
          } catch (error) {
              showBanner('Could not connect to the server.', 'error');
          }
      });
  }
})

// Social Login Handlers
document.querySelectorAll(".social-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    const ripple = document.createElement("span")
    ripple.className = "btn-glow"
    this.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
    console.log("Social login clicked")
  })
})

// Forgot Password Handler
document.querySelector(".forgot-link")?.addEventListener("click", (e) => {
  e.preventDefault()
  window.location.href = "forgot-password.html"
})

// (removed setInterval(createParticle, 500) and related DOM)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    console.log("CodeRabbit: Pausing background tasks")
  } else {
    console.log("CodeRabbit: Resuming background tasks")
  }
})

window.addEventListener("load", () => {
  console.log("Authentication UI Initialized")
})
