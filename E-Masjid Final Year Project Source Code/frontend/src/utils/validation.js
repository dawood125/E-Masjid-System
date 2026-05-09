import { z } from 'zod'

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// Form Schemas
export const donationSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  donationType: z.enum(['zakat', 'sadaqah', 'mosque-fund']),
  donorName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\d{10,}$/, 'Invalid phone number'),
})

export const nikahBookingSchema = z.object({
  preferredDate: z.string().min(1, 'Please select a date'),
  preferredTime: z.string().min(1, 'Please select a time'),
  groomName: z.string().min(2, 'Groom name is required'),
  brideName: z.string().min(2, 'Bride name is required'),
  contact: z.string().regex(/^\d{10,}$/, 'Invalid phone number'),
  details: z.string().optional(),
})

export const eventSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(2, 'Location is required'),
  maxParticipants: z.number().min(1, 'Max participants must be at least 1'),
})

export const prayerTimesSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  fajr: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  zuhr: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  asr: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  maghrib: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  isha: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  jummah: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format').optional(),
})

export const announcementSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  isUrgent: z.boolean().optional(),
})

export const scholarSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\d{10,}$/, 'Invalid phone number'),
  specialization: z.string().min(2, 'Specialization is required'),
})

export const expenseSchema = z.object({
  description: z.string().min(2, 'Description is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
})
