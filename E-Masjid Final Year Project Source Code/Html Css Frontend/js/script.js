/* ============================================
   E-MASJID SYSTEM - Main JavaScript
   Version: 1.0
   For: All Community User Pages
   ============================================ */

// ============================================
// 1. DOM ELEMENTS
// ============================================
const navbar = document.getElementById("navbar");
const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");

// ============================================
// 2. NAVBAR SCROLL EFFECT
// ============================================
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// ============================================
// 3. MOBILE MENU TOGGLE
// ============================================
if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");

    // Toggle icon
    const icon = menuToggle.querySelector("i");
    if (mobileMenu.classList.contains("active")) {
      icon.textContent = "close";
    } else {
      icon.textContent = "menu";
    }
  });

  // Close menu when clicking on a link
  const mobileLinks = mobileMenu.querySelectorAll(".nav-link");
  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      menuToggle.querySelector("i").textContent = "menu";
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
      mobileMenu.classList.remove("active");
      menuToggle.querySelector("i").textContent = "menu";
    }
  });
}

// ============================================
// 4. SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// ============================================
// 5. ANIMATION ON SCROLL (Intersection Observer)
// ============================================
const animateOnScroll = () => {
  const elements = document.querySelectorAll(
    ".animate-fade-in-up, .animate-fade-in, .animate-slide-in-left, .animate-slide-in-right"
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0) translateX(0)";
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  elements.forEach((el) => {
    el.style.opacity = "0";
    if (el.classList.contains("animate-fade-in-up")) {
      el.style.transform = "translateY(30px)";
    } else if (el.classList.contains("animate-slide-in-left")) {
      el.style.transform = "translateX(-30px)";
    } else if (el.classList.contains("animate-slide-in-right")) {
      el.style.transform = "translateX(30px)";
    }
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });
};

// Initialize animations when DOM is loaded
document.addEventListener("DOMContentLoaded", animateOnScroll);

// ============================================
// 6. ACTIVE NAV LINK HIGHLIGHT
// ============================================
const setActiveNavLink = () => {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("active");
    }
  });
};

document.addEventListener("DOMContentLoaded", setActiveNavLink);

// ============================================
// 7. PRAYER TIME HIGHLIGHT (Next Prayer)
// ============================================
const highlightNextPrayer = () => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Prayer times in minutes from midnight (example times - should be dynamic)
  const prayers = [
    { name: "fajr", time: 4 * 60 + 15 }, // 4:15 AM
    { name: "dhuhr", time: 12 * 60 + 30 }, // 12:30 PM
    { name: "asr", time: 17 * 60 }, // 5:00 PM
    { name: "maghrib", time: 19 * 60 + 25 }, // 7:25 PM
    { name: "isha", time: 21 * 60 }, // 9:00 PM
  ];

  // Find next prayer
  let nextPrayer = prayers.find((p) => p.time > currentTime);
  if (!nextPrayer) {
    nextPrayer = prayers[0]; // If past Isha, next is Fajr
  }

  // This would highlight the correct prayer - implementation depends on your structure
  // console.log('Next prayer:', nextPrayer.name);
};

document.addEventListener("DOMContentLoaded", highlightNextPrayer);

// ============================================
// 8. FORM VALIDATION HELPERS
// ============================================
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const re = /^(03[0-9]{2})[0-9]{7}$/;
  return re.test(phone.replace(/-/g, ""));
};

const showError = (input, message) => {
  const formGroup = input.closest(".form-group");
  if (formGroup) {
    formGroup.classList.add("error");
    const errorDiv =
      formGroup.querySelector(".error-message") ||
      document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    if (!formGroup.querySelector(".error-message")) {
      formGroup.appendChild(errorDiv);
    }
  }
};

const clearError = (input) => {
  const formGroup = input.closest(".form-group");
  if (formGroup) {
    formGroup.classList.remove("error");
    const errorDiv = formGroup.querySelector(".error-message");
    if (errorDiv) {
      errorDiv.remove();
    }
  }
};

// ============================================
// 9. TOAST NOTIFICATIONS
// ============================================
const showToast = (message, type = "success") => {
  // Remove existing toasts
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
        <i class="material-icons-round">${
          type === "success"
            ? "check_circle"
            : type === "error"
            ? "error"
            : "info"
        }</i>
        <span>${message}</span>
    `;

  // Add styles
  toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px 24px;
        background: ${
          type === "success"
            ? "#22C55E"
            : type === "error"
            ? "#DC2626"
            : "#2563EB"
        };
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
    `;

  document.body.appendChild(toast);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = "slideInRight 0.3s ease reverse";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// ============================================
// 10. LOADING SPINNER
// ============================================
const showLoader = () => {
  const loader = document.createElement("div");
  loader.id = "page-loader";
  loader.innerHTML = `
        <div class="loader-spinner"></div>
    `;
  loader.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(255,255,255,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

  const style = document.createElement("style");
  style.textContent = `
        .loader-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #E5E7EB;
            border-top-color: #047857;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
  document.head.appendChild(style);
  document.body.appendChild(loader);
};

const hideLoader = () => {
  const loader = document.getElementById("page-loader");
  if (loader) {
    loader.remove();
  }
};

// ============================================
// 11. UTILITY FUNCTIONS
// ============================================

// Format currency to PKR
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format date
const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ============================================
// 12. CONSOLE WELCOME MESSAGE
// ============================================
console.log(
  "%c🕌 E-Masjid System",
  "color: #047857; font-size: 24px; font-weight: bold;"
);
console.log(
  "%cMasjid Al-Noor, Sheikhupura",
  "color: #6B7280; font-size: 14px;"
);
console.log(
  "%cConnecting Community Through Faith",
  "color: #D4AF37; font-size: 12px; font-style: italic;"
);
