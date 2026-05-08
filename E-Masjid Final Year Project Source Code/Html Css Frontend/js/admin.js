/* ============================================
   E-MASJID ADMIN PANEL JAVASCRIPT
   ============================================ */

// ============================================
// 1. DOM ELEMENTS
// ============================================
const sidebar = document.getElementById("sidebar");
const sidebarClose = document.getElementById("sidebarClose");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuToggle = document.getElementById("menuToggle");

// ============================================
// 2. SIDEBAR TOGGLE (Mobile)
// ============================================
if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    sidebar.classList.add("active");
    sidebarOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  });
}

if (sidebarClose) {
  sidebarClose.addEventListener("click", closeSidebar);
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", closeSidebar);
}

function closeSidebar() {
  sidebar.classList.remove("active");
  sidebarOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

// Close sidebar on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sidebar.classList.contains("active")) {
    closeSidebar();
  }
});

// ============================================
// 3. SET CURRENT DATE
// ============================================
const currentDateElement = document.getElementById("currentDate");
if (currentDateElement) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  currentDateElement.textContent = new Date().toLocaleDateString(
    "en-US",
    options
  );
}

// ============================================
// 4. ACTIVE NAV LINK
// ============================================
function setActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".sidebar-link");

  navLinks.forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    if (href === currentPage || (currentPage === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });
}

setActiveNavLink();

// ============================================
// 5. TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = "info") {
  // Remove existing toasts
  const existingToast = document.querySelector(".admin-toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast
  const toast = document.createElement("div");
  toast.className = `admin-toast admin-toast-${type}`;

  // Icon based on type
  const icons = {
    success: "check_circle",
    error: "error",
    warning: "warning",
    info: "info",
  };

  toast.innerHTML = `
        <i class="material-icons-round">${icons[type] || icons.info}</i>
        <span>${message}</span>
        <button class="toast-close">
            <i class="material-icons-round">close</i>
        </button>
    `;

  document.body.appendChild(toast);

  // Show toast
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // Close button
  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  });

  // Auto hide after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// Make showToast globally available
window.showToast = showToast;

// ============================================
// 6. CONFIRM DIALOG
// ============================================
function confirmAction(message, onConfirm) {
  if (confirm(message)) {
    onConfirm();
  }
}

window.confirmAction = confirmAction;

// ============================================
// 7. FORMAT CURRENCY
// ============================================
function formatCurrency(amount) {
  return "PKR " + amount.toLocaleString("en-PK");
}

window.formatCurrency = formatCurrency;

// ============================================
// 8. CONSOLE MESSAGE
// ============================================
console.log(
  "%c🕌 E-Masjid Admin Panel",
  "color: #047857; font-size: 20px; font-weight: bold;"
);
console.log(
  "%cMasjid Al-Noor, Sheikhupura",
  "color: #6B7280; font-size: 12px;"
);


