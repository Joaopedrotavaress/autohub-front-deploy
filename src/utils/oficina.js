export function getValue(source, keys, fallback = '') {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key]
    }
  }

  return fallback
}

const WORKSHOP_PAYLOAD_KEYS = ['oficina', 'Oficina', 'workshop', 'Workshop', 'data', 'Data', 'dados', 'Dados', 'result', 'Result', 'item', 'Item', 'value', 'Value']
const WORKSHOP_ID_KEYS = ['id', 'Id', 'uid', 'Uid']
const WORKSHOP_NAME_KEYS = ['nome', 'Nome', 'name', 'Name']
const WORKSHOP_CEP_KEYS = [
  'cep',
  'Cep',
  'CEP',
  'zipCode',
  'ZipCode',
  'zipcode',
  'zip_code',
  'postalCode',
  'PostalCode',
  'postal_code',
  'codigoPostal',
  'CodigoPostal',
  'cepOficina',
  'CepOficina',
]

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function looksLikeWorkshopPayload(value) {
  return isPlainObject(value)
    && (
      getValue(value, WORKSHOP_NAME_KEYS, null) != null
      || getValue(value, WORKSHOP_CEP_KEYS, null) != null
      || getValue(value, ['endereco', 'Endereco', 'address', 'Address'], null) != null
      || getValue(value, ['cnpj', 'Cnpj'], null) != null
    )
}

function resolveWorkshopPayload(source) {
  let current = source

  for (let index = 0; index < 4; index += 1) {
    if (!isPlainObject(current) || looksLikeWorkshopPayload(current)) {
      return current
    }

    const next = WORKSHOP_PAYLOAD_KEYS
      .map((key) => current[key])
      .find((value) => isPlainObject(value))

    if (!next) {
      return current
    }

    current = next
  }

  return current
}

function findNestedValue(source, keys, fallback = '', depth = 0) {
  if (!isPlainObject(source) || depth > 4) {
    return fallback
  }

  const directValue = getValue(source, keys, null)
  if (directValue != null) {
    return directValue
  }

  for (const value of Object.values(source)) {
    if (isPlainObject(value)) {
      const nestedValue = findNestedValue(value, keys, null, depth + 1)
      if (nestedValue != null) {
        return nestedValue
      }
    }
  }

  return fallback
}

export function getPhoneDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 11)
}

export function formatBrazilianPhone(value) {
  const digits = getPhoneDigits(value)
  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function isValidBrazilianMobilePhone(value) {
  return getPhoneDigits(value).length === 11
}

export function normalizeCoordinates(latitude, longitude) {
  const parsedLatitude = Number(latitude)
  const parsedLongitude = Number(longitude)

  if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
    return { latitude: null, longitude: null }
  }

  if (parsedLatitude < -90 || parsedLatitude > 90 || parsedLongitude < -180 || parsedLongitude > 180) {
    return { latitude: null, longitude: null }
  }

  if (parsedLatitude === 0 && parsedLongitude === 0) {
    return { latitude: null, longitude: null }
  }

  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude,
  }
}

export function hasValidCoordinates(latitude, longitude) {
  const normalized = normalizeCoordinates(latitude, longitude)
  return normalized.latitude != null && normalized.longitude != null
}

export function parseWorkshopImageUrls(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item
        return getValue(item, ['url', 'Url', 'imagemUrl', 'ImagemUrl', 'imageUrl', 'ImageUrl'], '')
      })
      .map((url) => String(url || '').trim())
      .filter(Boolean)
  }

  const rawValue = String(value || '').trim()
  if (!rawValue) return []

  try {
    const parsed = JSON.parse(rawValue)
    if (Array.isArray(parsed)) {
      return parsed.map((url) => String(url || '').trim()).filter(Boolean)
    }
  } catch (error) {
    // A API legada também pode retornar apenas uma URL simples.
  }

  if (rawValue.includes(',') && !rawValue.startsWith('http')) {
    return rawValue.split(',').map((url) => url.trim()).filter(Boolean)
  }

  return [rawValue]
}

function getWorkshopImageUrls(oficina) {
  const possibleValues = [
    getValue(oficina, ['imagensUrls', 'ImagensUrls'], null),
    getValue(oficina, ['imagemUrls', 'ImagemUrls'], null),
    getValue(oficina, ['imageUrls', 'ImageUrls'], null),
    getValue(oficina, ['imagens', 'Imagens'], null),
    getValue(oficina, ['images', 'Images'], null),
    getValue(oficina, ['fotos', 'Fotos'], null),
    getValue(oficina, ['fotosUrls', 'FotosUrls'], null),
    getValue(oficina, ['urlsImagens', 'UrlsImagens'], null),
    getValue(oficina, ['imagemUrl', 'ImagemUrl'], null),
  ]

  return Array.from(new Set(possibleValues.flatMap(parseWorkshopImageUrls)))
}

export function serializeWorkshopImageUrls(urls = []) {
  const normalizedUrls = Array.from(new Set(urls.map((url) => String(url || '').trim()).filter(Boolean)))
  if (normalizedUrls.length === 0) return ''
  if (normalizedUrls.length === 1) return normalizedUrls[0]
  return JSON.stringify(normalizedUrls)
}

export function normalizePhoneNumber(value) {
  return String(value || '').replace(/\D/g, '')
}

export function buildWhatsAppLink(oficina) {
  if (!oficina) return ''

  const directLink = String(
    getValue(oficina, ['whatsappUrl', 'WhatsappUrl', 'whatsappLink', 'WhatsappLink', 'linkWhatsapp', 'LinkWhatsapp'], ''),
  ).trim()

  if (directLink) {
    return /^https?:\/\//i.test(directLink) ? directLink : `https://${directLink}`
  }

  const phoneNumber = normalizePhoneNumber(
    getValue(oficina, ['whatsapp', 'WhatsApp', 'telefone', 'Telefone', 'celular', 'Celular', 'phone', 'Phone'], ''),
  )

  if (!phoneNumber) return ''

  return `https://wa.me/${phoneNumber}`
}

export function normalizeOficina(oficina) {
  const source = resolveWorkshopPayload(oficina)
  const coordinates = normalizeCoordinates(
    getValue(source, ['latitude', 'Latitude'], null),
    getValue(source, ['longitude', 'Longitude'], null),
  )
  const imagensUrls = getWorkshopImageUrls(source)

  return {
    id: String(getValue(source, WORKSHOP_ID_KEYS, '')).trim(),
    nome: String(getValue(source, WORKSHOP_NAME_KEYS, 'Oficina cadastrada')).trim(),
    cep: String(getValue(source, WORKSHOP_CEP_KEYS, findNestedValue(oficina, WORKSHOP_CEP_KEYS, ''))).trim(),
    endereco: String(getValue(source, ['endereco', 'Endereco', 'address', 'Address'], '')).trim(),
    cnpj: String(getValue(source, ['cnpj', 'Cnpj'], '')).trim(),
    telefone: formatBrazilianPhone(getValue(source, ['telefone', 'Telefone'], '')),
    descricao: String(getValue(source, ['descricao', 'Descricao', 'description', 'Description'], '')).trim(),
    imagemUrl: imagensUrls[0] || '',
    imagensUrls,
    whatsapp: String(getValue(source, ['whatsapp', 'WhatsApp', 'telefone', 'Telefone', 'celular', 'Celular', 'phone', 'Phone'], '')).trim(),
    whatsappUrl: String(
      getValue(source, ['whatsappUrl', 'WhatsappUrl', 'whatsappLink', 'WhatsappLink', 'linkWhatsapp', 'LinkWhatsapp'], ''),
    ).trim(),
    mediaAvaliacoes: Number(getValue(source, ['mediaAvaliacoes', 'MediaAvaliacoes'], 0)) || 0,
    quantidadeAvaliacoes: Number(getValue(source, ['quantidadeAvaliacoes', 'QuantidadeAvaliacoes'], 0)) || 0,
    distanciaKm: getValue(source, ['distanciaKm', 'DistanciaKm'], null),
    faixaPrecoMinima: (() => {
      const valor = getValue(source, ['faixaPrecoMinima', 'FaixaPrecoMinima'], null)
      return valor != null ? Number(valor) : null
    })(),
    faixaPrecoMaxima: (() => {
      const valor = getValue(source, ['faixaPrecoMaxima', 'FaixaPrecoMaxima'], null)
      return valor != null ? Number(valor) : null
    })(),
    especialidades: Array.isArray(getValue(source, ['especialidades', 'Especialidades'], []))
      ? getValue(source, ['especialidades', 'Especialidades'], []).filter(Boolean)
      : [],
    servicosOferecidos: Array.isArray(getValue(source, ['servicosOferecidos', 'ServicosOferecidos'], []))
      ? getValue(source, ['servicosOferecidos', 'ServicosOferecidos'], []).filter(Boolean)
      : [],
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  }
}

export function formatCurrency(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 'Sob consulta'

  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatDistance(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue < 0) return 'Distancia indisponivel'

  return `${numericValue.toFixed(1).replace('.', ',')} km`
}

export function getPriceRangeLabel(oficina) {
  if (!oficina) return 'Faixa de preco indisponivel'

  if (oficina.faixaPrecoMinima == null && oficina.faixaPrecoMaxima == null) {
    return 'Faixa de preco indisponivel'
  }

  if (oficina.faixaPrecoMinima != null && oficina.faixaPrecoMaxima != null) {
    return `${formatCurrency(oficina.faixaPrecoMinima)} ate ${formatCurrency(oficina.faixaPrecoMaxima)}`
  }

  return formatCurrency(oficina.faixaPrecoMinima ?? oficina.faixaPrecoMaxima)
}

export function normalizeWorkshopFilters(filters = {}) {
  return {
    termo: String(filters.termo || '').trim().toLowerCase(),
    especialidade: String(filters.especialidade || '').trim().toLowerCase(),
    raioKm: Number(filters.raioKm) || 25,
    avaliacaoMinima: filters.avaliacaoMinima ? Number(filters.avaliacaoMinima) : null,
    precoMin: filters.precoMin ? Number(filters.precoMin) : null,
    precoMax: filters.precoMax ? Number(filters.precoMax) : null,
  }
}

export function filterWorkshops(workshops, filters = {}) {
  const normalizedFilters = normalizeWorkshopFilters(filters)

  return workshops.filter((workshop) => {
    const matchesTerm = !normalizedFilters.termo
      || workshop.nome.toLowerCase().includes(normalizedFilters.termo)
      || workshop.endereco.toLowerCase().includes(normalizedFilters.termo)
      || workshop.descricao.toLowerCase().includes(normalizedFilters.termo)

    const matchesSpeciality = !normalizedFilters.especialidade
      || workshop.especialidades.some((speciality) => speciality.toLowerCase().includes(normalizedFilters.especialidade))

    const withinRadius = workshop.distanciaKm == null || Number(workshop.distanciaKm) <= normalizedFilters.raioKm

    const meetsMinRating = normalizedFilters.avaliacaoMinima == null 
      || workshop.mediaAvaliacoes >= normalizedFilters.avaliacaoMinima

    // Filtra oficinas cuja faixa de preço se sobrepõe com o intervalo do filtro
    // Se oficina não tem preço definido, é sempre exibida
    const withinPriceRange = (normalizedFilters.precoMin == null && normalizedFilters.precoMax == null)
      || (workshop.faixaPrecoMinima == null && workshop.faixaPrecoMaxima == null)
      || (
        (normalizedFilters.precoMin == null || (workshop.faixaPrecoMaxima && workshop.faixaPrecoMaxima >= normalizedFilters.precoMin))
        && (normalizedFilters.precoMax == null || (workshop.faixaPrecoMinima && workshop.faixaPrecoMinima <= normalizedFilters.precoMax))
      )

    return matchesTerm && matchesSpeciality && withinRadius && meetsMinRating && withinPriceRange
  })
}

export function getWorkshopStorageKey(userId) {
  return `autohub.active-oficina:${userId}`
}

export function getDistinctSpecialities(workshops) {
  return Array.from(new Set(workshops.flatMap((workshop) => workshop.especialidades).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

export function isValidGuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim())
}
