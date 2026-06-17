import { formatDate as formatBrazilDate } from './dateTime'

/**
 * Utilitários
 * Funções auxiliares reutilizáveis
 * Formatação, validação, conversão, etc.
 */

/**
 * Formata um número como moeda (BRL)
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Valida email
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Formata data (DD/MM/YYYY)
 */
export function formatDate(date) {
  return formatBrazilDate(date)
}

export default {
  formatCurrency,
  isValidEmail,
  formatDate,
}
