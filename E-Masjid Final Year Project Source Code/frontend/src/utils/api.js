import { API_BASE_URL } from './constants.js'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    this.NO_REDIRECT_ENDPOINTS = ['/api/auth/login', '/api/auth/forgot-password']
  }

  getToken() {
    return localStorage.getItem('authToken')
  }

  getHeaders(isJson = true) {
    const headers = {}
    if (isJson) headers['Content-Type'] = 'application/json'
    const token = this.getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  }

  async request(method, endpoint, body = null) {
    const options = {
      method,
      headers: this.getHeaders(),
    }
    if (body) options.body = JSON.stringify(body)

    const response = await fetch(`${this.baseURL}${endpoint}`, options)
    const data = await response.json()

    // (we keep /api/auth/reset-password/:token below — handled per-call)
    if (response.status === 401 && !this.NO_REDIRECT_ENDPOINTS.includes(endpoint) && !endpoint.startsWith('/api/auth/reset-password/')) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')

      const path = window.location.pathname
      let redirectPath = '/login'
      if (path.startsWith('/admin')) redirectPath = '/admin/login'
      else if (path.startsWith('/manager')) redirectPath = '/manager/login'
      else if (path.startsWith('/committee')) redirectPath = '/committee/login'

      window.location.href = redirectPath
      throw new Error(data.message || 'Session expired')
    }

    if (!response.ok) {
      throw new Error(data.message || 'Request failed')
    }
    return data
  }

  // Auth
  login(email, password) { return this.request('POST', '/api/auth/login', { email, password }) }
  register(data) { return this.request('POST', '/api/auth/register', data) }
  forgotPassword(email) { return this.request('POST', '/api/auth/forgot-password', { email }) }
  resetPassword(token, data) { return this.request('POST', `/api/auth/reset-password/${token}`, data) }
  getMe() { return this.request('GET', '/api/auth/me') }
  refreshToken() { return this.request('POST', '/api/auth/refresh-token') }

  // Donations
  getDonations(params = '') { return this.request('GET', `/api/donations${params ? '?' + params : ''}`) }
  getTopDonors(params = '') { return this.request('GET', `/api/donations/top-donors${params ? '?' + params : ''}`) }
  getDonationSummary(params = '') { return this.request('GET', `/api/donations/summary${params ? '?' + params : ''}`) }
  createDonation(data) { return this.request('POST', '/api/donations', data) }
  updateDonation(id, data) { return this.request('PUT', `/api/donations/${id}`, data) }
  deleteDonation(id) { return this.request('DELETE', `/api/donations/${id}`) }
  createOnlineDonation(data) { return this.request('POST', '/api/donations/online', data) }

  // Expenses
  getExpenses(params = '') { return this.request('GET', `/api/expenses${params ? '?' + params : ''}`) }
  getExpenseSummary(params = '') { return this.request('GET', `/api/expenses/summary${params ? '?' + params : ''}`) }
  createExpense(data) { return this.request('POST', '/api/expenses', data) }
  updateExpense(id, data) { return this.request('PUT', `/api/expenses/${id}`, data) }
  deleteExpense(id) { return this.request('DELETE', `/api/expenses/${id}`) }

  async uploadRequest(method, endpoint, formData) {
    const options = {
      method,
      headers: {},
      body: formData,
    }
    const token = this.getToken()
    if (token) options.headers['Authorization'] = `Bearer ${token}`
    const response = await fetch(`${this.baseURL}${endpoint}`, options)
    const data = await response.json()
    if (response.status === 401 && !this.NO_REDIRECT_ENDPOINTS.includes(endpoint) && !endpoint.startsWith('/api/auth/reset-password/')) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      const path = window.location.pathname
      let redirectPath = '/login'
      if (path.startsWith('/admin')) redirectPath = '/admin/login'
      else if (path.startsWith('/manager')) redirectPath = '/manager/login'
      else if (path.startsWith('/committee')) redirectPath = '/committee/login'
      window.location.href = redirectPath
      throw new Error(data.message || 'Session expired')
    }
    if (!response.ok) throw new Error(data.message || 'Request failed')
    return data
  }

  // Events
  getEvents(params = '') { return this.request('GET', `/api/events${params ? '?' + params : ''}`) }
  getEvent(id) { return this.request('GET', `/api/events/${id}`) }
  createEvent(data) { return this.request('POST', '/api/events', data) }
  createEventWithImage(formData) { return this.uploadRequest('POST', '/api/events', formData) }
  updateEvent(id, data) { return this.request('PUT', `/api/events/${id}`, data) }
  updateEventWithImage(id, formData) { return this.uploadRequest('PUT', `/api/events/${id}`, formData) }
  deleteEvent(id) { return this.request('DELETE', `/api/events/${id}`) }
  registerForEvent(id) { return this.request('POST', `/api/events/${id}/register`) }

  // Announcements
  getAnnouncements(params = '') { return this.request('GET', `/api/announcements${params ? '?' + params : ''}`) }
  createAnnouncement(data) { return this.request('POST', '/api/announcements', data) }
  updateAnnouncement(id, data) { return this.request('PUT', `/api/announcements/${id}`, data) }
  deleteAnnouncement(id) { return this.request('DELETE', `/api/announcements/${id}`) }

  // Prayer Times
  getPrayerTimes(params = '') { return this.request('GET', `/api/prayer-times${params ? '?' + params : ''}`) }
  updatePrayerTimes(data) { return this.request('PUT', '/api/prayer-times', data) }

  // Nikah Bookings
  getNikahBookings() { return this.request('GET', '/api/nikah-bookings') }
  createNikahBooking(data) { return this.request('POST', '/api/nikah-bookings', data) }
  updateNikahBooking(id, data) { return this.request('PUT', `/api/nikah-bookings/${id}`, data) }

  // Scholars
  getScholars() { return this.request('GET', '/api/scholars') }
  createScholar(data) { return this.request('POST', '/api/scholars', data) }
  updateScholar(id, data) { return this.request('PUT', `/api/scholars/${id}`, data) }

  // Mosques
  getMosques() { return this.request('GET', '/api/mosques') }
  getPublicMosques() { return this.request('GET', '/api/mosques/public') }
  getMosque(id) { return this.request('GET', `/api/mosques/${id}`) }
  createMosque(data) { return this.request('POST', '/api/mosques', data) }
  updateMosque(id, data) { return this.request('PUT', `/api/mosques/${id}`, data) }
  updateMosqueModules(id, modules) { return this.request('PUT', `/api/mosques/${id}/modules`, { enabledModules: modules }) }

  // Fund Requests
  getFundRequests(params = '') { return this.request('GET', `/api/fund-requests${params ? '?' + params : ''}`) }
  createFundRequest(data) { return this.request('POST', '/api/fund-requests', data) }
  reviewFundRequest(id, data) { return this.request('PUT', `/api/fund-requests/${id}`, data) }

  // Committee
  getCommitteeMembers() { return this.request('GET', '/api/committee') }
  createCommitteeMember(data) { return this.request('POST', '/api/committee', data) }
  updateCommitteeMember(id, data) { return this.request('PUT', `/api/committee/${id}`, data) }
  deleteCommitteeMember(id) { return this.request('DELETE', `/api/committee/${id}`) }
}

const api = new ApiService()
export default api
