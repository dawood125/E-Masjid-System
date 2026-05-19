// Color Constants
export const COLORS = {
  primary: '#047857',
  primaryDark: '#065f46',
  primaryLight: '#d1fae5',
  accent: '#d4af37',
  accentLight: '#fef3c7',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb',
  white: '#ffffff',
  dark: '#111827',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
}

// User Roles
export const USER_ROLES = {
  COMMUNITY: 'community',
  ADMIN: 'admin',
  SCHOLAR: 'scholar',
  MANAGER: 'manager',
  COMMITTEE: 'committee',
}

// Donation Types
export const DONATION_TYPES = {
  ZAKAT: 'Zakat',
  SADAQAH: 'Sadaqah',
  MOSQUE_FUND: 'Mosque Fund',
  RAMADAN: 'Ramadan',
  WEDDING: 'Wedding',
}

// Prayer Names
export const PRAYER_NAMES = {
  FAJR: 'Fajr',
  ZUHR: 'Zuhr',
  ASR: 'Asr',
  MAGHRIB: 'Maghrib',
  ISHA: 'Isha',
  JUMMAH: 'Jummah',
}

// Statuses
export const STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

// Expense Categories
export const EXPENSE_CATEGORIES = [
  'Maintenance',
  'Utilities',
  'Salary',
  'Events',
  'Charity',
  'Renovation',
  'Education',
  'Equipment',
  'Other',
]

// Routes
export const ROUTES = {
  // User Routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  PRAYER_TIMES: '/prayer-times',
  EVENTS: '/events',
  DONATE: '/donate',
  NIKAH_BOOKING: '/nikah-booking',
  MY_BOOKINGS: '/my-bookings',
  ANNOUNCEMENTS: '/announcements',
  TRANSPARENCY: '/transparency',
  FUND_REQUEST: '/fund-request',
  MY_REQUESTS: '/my-requests',

  // Admin Routes
  ADMIN_LOGIN: '/admin/login',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_DONATIONS: '/admin/donations',
  ADMIN_PRAYER_TIMES: '/admin/prayer-times',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_ANNOUNCEMENTS: '/admin/announcements',
  ADMIN_SCHOLARS: '/admin/scholars',
  ADMIN_COMMITTEE: '/admin/committee',
  ADMIN_FUND_REQUESTS: '/admin/fund-requests',

  // Manager Routes
  MANAGER_LOGIN: '/manager/login',
  MANAGER: '/manager',
  MANAGER_DASHBOARD: '/manager',
  MANAGER_MOSQUES: '/manager/mosques',

  // Committee Routes
  COMMITTEE_LOGIN: '/committee/login',
  COMMITTEE: '/committee',
  COMMITTEE_DASHBOARD: '/committee',

  // Scholar Routes
  SCHOLAR: '/scholar',
  SCHOLAR_DASHBOARD: '/scholar',
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [5, 10, 25, 50],
}

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MMM DD, YYYY',
  LONG: 'MMMM DD, YYYY',
  TIME: 'HH:mm',
  DATE_TIME: 'MMM DD, YYYY HH:mm',
}

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email address',
  PASSWORD_MISMATCH: 'Passwords do not match',
  NETWORK_ERROR: 'Network error. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Unauthorized access. Please login.',
  NOT_FOUND: 'Resource not found.',
}

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGGED_IN: 'Successfully logged in',
  LOGGED_OUT: 'Successfully logged out',
  REGISTERED: 'Successfully registered',
  CREATED: 'Successfully created',
  UPDATED: 'Successfully updated',
  DELETED: 'Successfully deleted',
  DONATED: 'Donation received. Thank you!',
  BOOKING_SUBMITTED: 'Booking request submitted',
}

// API Endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  DONATIONS: '/api/donations',
  EXPENSES: '/api/expenses',
  PRAYER_TIMES: '/api/prayer-times',
  EVENTS: '/api/events',
  ANNOUNCEMENTS: '/api/announcements',
  NIKAH_BOOKINGS: '/api/nikah-bookings',
  SCHOLARS: '/api/scholars',
  MOSQUES: '/api/mosques',
  FUND_REQUESTS: '/api/fund-requests',
  COMMITTEE: '/api/committee',
}

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'user',
  AUTH_TOKEN: 'authToken',
  THEME: 'theme',
  LANGUAGE: 'language',
}
