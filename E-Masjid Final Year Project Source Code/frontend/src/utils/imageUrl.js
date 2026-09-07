import { API_BASE_URL } from './constants.js'

export function resolveImageUrl(path) {
  if (!path) return null
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`
}
