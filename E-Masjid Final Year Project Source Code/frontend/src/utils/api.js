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
      credentials: 'include',
    }
    if (body) options.body = JSON.stringify(body)

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

      try {
        sessionStorage.setItem('logoutNotice', data.message || 'Session expired')
      } catch (e) {}

      window.location.href = redirectPath
      throw new Error(data.message || 'Session expired')
    }

    if (!response.ok) {
      const err = new Error(data.message || 'Request failed')
      err.errors = Array.isArray(data.errors) ? data.errors : null
      err.status = response.status
      throw err
    }
    return data
  }

  login(email, password) { return this.request('POST', '/api/auth/login', { email, password }) }
  register(data) { return this.request('POST', '/api/auth/register', data) }
  forgotPassword(email) { return this.request('POST', '/api/auth/forgot-password', { email }) }
  resetPassword(token, data) { return this.request('POST', `/api/auth/reset-password/${token}`, data) }
  getMe() { return this.request('GET', '/api/auth/me') }
  refreshToken() { return this.request('POST', '/api/auth/refresh-token') }
  logout() { return this.request('POST', '/api/auth/logout') }

  getDonations(params = '') { return this.request('GET', `/api/donations${params ? '?' + params : ''}`) }
  getAdminDonations(params = '') { return this.request('GET', `/api/donations/admin${params ? '?' + params : ''}`) }
  getTopDonors(params = '') { return this.request('GET', `/api/donations/top-donors${params ? '?' + params : ''}`) }
  getDonationSummary(params = '') { return this.request('GET', `/api/donations/summary${params ? '?' + params : ''}`) }
  getDonationBySession(sessionId) { return this.request('GET', `/api/donations/by-session/${sessionId}`) }
  createDonation(data) { return this.request('POST', '/api/donations', data) }
  updateDonation(id, data) { return this.request('PUT', `/api/donations/${id}`, data) }
  deleteDonation(id) { return this.request('DELETE', `/api/donations/${id}`) }
  createOnlineDonation(data) { return this.request('POST', '/api/donations/online', data) }

  getExpenses(params = '') { return this.request('GET', `/api/expenses${params ? '?' + params : ''}`) }
  getAdminExpenses(params = '') { return this.request('GET', `/api/expenses/admin${params ? '?' + params : ''}`) }
  getExpenseSummary(params = '') { return this.request('GET', `/api/expenses/summary${params ? '?' + params : ''}`) }
  createExpense(data) { return this.request('POST', '/api/expenses', data) }
  updateExpense(id, data) { return this.request('PUT', `/api/expenses/${id}`, data) }
  deleteExpense(id) { return this.request('DELETE', `/api/expenses/${id}`) }

  async uploadRequest(method, endpoint, formData) {
    const options = {
      method,
      headers: {},
      body: formData,
      credentials: 'include',
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
      try {
        sessionStorage.setItem('logoutNotice', data.message || 'Session expired')
      } catch (e) {}
      window.location.href = redirectPath
      throw new Error(data.message || 'Session expired')
    }
    if (!response.ok) {
      const err = new Error(data.message || 'Request failed')
      err.errors = Array.isArray(data.errors) ? data.errors : null
      err.status = response.status
      throw err
    }
    return data
  }

  getEvents(params = '') { return this.request('GET', `/api/events${params ? '?' + params : ''}`) }
  getAdminEvents(params = '') { return this.request('GET', `/api/events/admin${params ? '?' + params : ''}`) }
  getEvent(id) { return this.request('GET', `/api/events/${id}`) }
  createEvent(data) { return this.request('POST', '/api/events', data) }
  createEventWithImage(formData) { return this.uploadRequest('POST', '/api/events', formData) }
  updateEvent(id, data) { return this.request('PUT', `/api/events/${id}`, data) }
  updateEventWithImage(id, formData) { return this.uploadRequest('PUT', `/api/events/${id}`, formData) }
  deleteEvent(id) { return this.request('DELETE', `/api/events/${id}`) }
  registerForEvent(id) { return this.request('POST', `/api/events/${id}/register`) }

  getAnnouncements(params = '') { return this.request('GET', `/api/announcements${params ? '?' + params : ''}`) }
  getAdminAnnouncements(params = '') { return this.request('GET', `/api/announcements/admin${params ? '?' + params : ''}`) }
  createAnnouncement(data) { return this.request('POST', '/api/announcements', data) }
  updateAnnouncement(id, data) { return this.request('PUT', `/api/announcements/${id}`, data) }
  deleteAnnouncement(id) { return this.request('DELETE', `/api/announcements/${id}`) }

  getPrayerTimes(params = '') { return this.request('GET', `/api/prayer-times${params ? '?' + params : ''}`) }
  updatePrayerTimes(data) { return this.request('PUT', '/api/prayer-times', data) }

  getMarketingStats(mosqueId) {
    const p = mosqueId ? `?mosqueId=${encodeURIComponent(mosqueId)}` : ''
    return this.request('GET', `/api/marketing/stats${p}`)
  }
  getMarketingImpact(mosqueId) {
    const p = mosqueId ? `?mosqueId=${encodeURIComponent(mosqueId)}` : ''
    return this.request('GET', `/api/marketing/impact${p}`)
  }
  getMarketingFeaturedCampaign(mosqueId) {
    const p = mosqueId ? `?mosqueId=${encodeURIComponent(mosqueId)}` : ''
    return this.request('GET', `/api/marketing/featured-campaign${p}`)
  }
  getMarketingCampaigns(mosqueId) {
    const p = mosqueId ? `?mosqueId=${encodeURIComponent(mosqueId)}` : ''
    return this.request('GET', `/api/marketing/campaigns${p}`)
  }
  getMarketingTestimonials(mosqueId) {
    const p = mosqueId ? `?mosqueId=${encodeURIComponent(mosqueId)}` : ''
    return this.request('GET', `/api/marketing/testimonials${p}`)
  }
  getMarketingHeroSlides(mosqueId) {
    const p = mosqueId ? `?mosqueId=${encodeURIComponent(mosqueId)}` : ''
    return this.request('GET', `/api/marketing/hero-slides${p}`)
  }

  adminListCampaigns() { return this.request('GET', '/api/admin/marketing/campaigns') }
  adminCreateCampaign(data) { return this.request('POST', '/api/admin/marketing/campaigns', data) }
  adminUpdateCampaign(id, data) { return this.request('PUT', `/api/admin/marketing/campaigns/${id}`, data) }
  adminDeleteCampaign(id) { return this.request('DELETE', `/api/admin/marketing/campaigns/${id}`) }
  adminListTestimonials() { return this.request('GET', '/api/admin/marketing/testimonials') }
  adminCreateTestimonial(data) { return this.request('POST', '/api/admin/marketing/testimonials', data) }
  adminUpdateTestimonial(id, data) { return this.request('PUT', `/api/admin/marketing/testimonials/${id}`, data) }
  adminDeleteTestimonial(id) { return this.request('DELETE', `/api/admin/marketing/testimonials/${id}`) }
  adminListHeroSlides() { return this.request('GET', '/api/admin/marketing/hero-slides') }
  adminCreateHeroSlide(data) { return this.request('POST', '/api/admin/marketing/hero-slides', data) }
  adminUpdateHeroSlide(id, data) { return this.request('PUT', `/api/admin/marketing/hero-slides/${id}`, data) }
  adminDeleteHeroSlide(id) { return this.request('DELETE', `/api/admin/marketing/hero-slides/${id}`) }

  getNikahBookings() { return this.request('GET', '/api/nikah-bookings') }
  getNikahAvailability(from, to) {
    return this.request('GET', `/api/nikah-bookings/availability?from=${from}&to=${to}`)
  }
  createNikahBooking(data) { return this.request('POST', '/api/nikah-bookings', data) }
  updateNikahBooking(id, data) { return this.request('PUT', `/api/nikah-bookings/${id}`, data) }
  assignNikahBooking(id, scholarId) { return this.request('PUT', `/api/nikah-bookings/${id}/assign`, { scholarId }) }
  cancelNikahBooking(id) { return this.request('PUT', `/api/nikah-bookings/${id}/cancel`) }

  getScholars() { return this.request('GET', '/api/scholars') }
  createScholar(data) { return this.request('POST', '/api/scholars', data) }
  updateScholar(id, data) { return this.request('PUT', `/api/scholars/${id}`, data) }
  resetScholarPassword(id, password) { return this.request('POST', `/api/scholars/${id}/reset-password`, { password }) }

  getMosques() { return this.request('GET', '/api/mosques') }
  getPublicMosques() { return this.request('GET', '/api/mosques/public') }
  searchMosques(params = '') { return this.request('GET', `/api/mosques/search${params ? '?' + params : ''}`) }
  getMosque(id) { return this.request('GET', `/api/mosques/${id}`) }
  createMosque(data) { return this.request('POST', '/api/mosques', data) }
  updateMosque(id, data) { return this.request('PUT', `/api/mosques/${id}`, data) }

  getSuperAdminMosques() { return this.request('GET', '/api/super-admin/mosques') }
  getSuperAdminAdmins() { return this.request('GET', '/api/super-admin/admins') }
  getSuperAdminUsers(role = '') {
    return this.request('GET', `/api/super-admin/users${role ? '?role=' + role : ''}`)
  }
  createSuperAdminAdmin(mosqueId, data) {
    return this.request('POST', `/api/super-admin/mosques/${mosqueId}/admin`, data)
  }
  createSuperAdminUser(data) {
    return this.request('POST', '/api/super-admin/users', data)
  }

  getFundRequests(params = '') { return this.request('GET', `/api/fund-requests${params ? '?' + params : ''}`) }
  createFundRequest(data) { return this.request('POST', '/api/fund-requests', data) }
  reviewFundRequest(id, data) { return this.request('PUT', `/api/fund-requests/${id}`, data) }
  voteFundRequest(id, data) { return this.request('POST', `/api/fund-requests/${id}/vote`, data) }
  finalizeFundRequest(id, data) { return this.request('POST', `/api/fund-requests/${id}/finalize`, data) }

  getCommitteeMembers() { return this.request('GET', '/api/committee') }
  createCommitteeMember(data) { return this.request('POST', '/api/committee', data) }
  updateCommitteeMember(id, data) { return this.request('PUT', `/api/committee/${id}`, data) }
  deleteCommitteeMember(id) { return this.request('DELETE', `/api/committee/${id}`) }
}

const api = new ApiService()
export default api
