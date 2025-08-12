import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

export function generateLedgerId() {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `BNG-LGR-${timestamp}${random}`
}

export function generateBatchNumber() {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
  const sequence = Math.floor(Math.random() * 999) + 1
  return `BN${dateStr}${sequence.toString().padStart(3, '0')}`
}

export function generateChallanNumber() {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
  const sequence = Math.floor(Math.random() * 999) + 1
  return `BNG-CH-${dateStr}-${sequence.toString().padStart(3, '0')}`
}