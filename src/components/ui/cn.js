function normalizeClassName(value) {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value.flatMap(normalizeClassName)
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([className]) => className)
  }

  return [String(value)]
}

export function cn(...values) {
  return values.flatMap(normalizeClassName).join(' ')
}

export default cn