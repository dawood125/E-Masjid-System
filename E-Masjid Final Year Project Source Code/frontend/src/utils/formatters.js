// Currency Formatting (PKR)
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Date Formatting
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatTime = (timeString) => {
  if (!timeString) return ''
  const _parts = timeString.split(':')
  if (_parts.length < 2) return ''
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Truncate Text
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Capitalize First Letter
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Get Initials
export const getInitials = (name) => {
  if (!name) return ''
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Format Phone Number
export const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  return digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
}

// Get Time Status
export const getTimeStatus = (time) => {
  const [hours] = time.split(':')
  const hour = parseInt(hours)
  
  if (hour >= 5 && hour < 12) return 'Fajr'
  if (hour >= 12 && hour < 16) return 'Zuhr'
  if (hour >= 16 && hour < 18) return 'Asr'
  if (hour >= 18 && hour < 20) return 'Maghrib'
  if (hour >= 20) return 'Isha'
  return 'Unknown'
}

// Get Badge Color
export const getBadgeColor = (status) => {
  const colors = {
    pending: 'bg-warning-light text-warning',
    accepted: 'bg-success-light text-success',
    rejected: 'bg-error-light text-error',
    completed: 'bg-info-light text-info',
    active: 'bg-success-light text-success',
    inactive: 'bg-gray-100 text-gray-600',
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}

// Get Icon for Status
export const getStatusIcon = (status) => {
  const icons = {
    pending: 'schedule',
    accepted: 'check_circle',
    rejected: 'cancel',
    completed: 'done_all',
    active: 'check',
    inactive: 'close',
  }
  return icons[status] || 'info'
}
