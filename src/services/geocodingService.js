function buildNominatimQuery({ endereco, cep }) {
  const queryParts = [endereco, cep, 'Brasil'].filter(Boolean)
  return queryParts.join(', ')
}

function normalizeCep(cep) {
  return String(cep || '').replace(/\D/g, '').slice(0, 8)
}

export async function lookupCep(cep) {
  const cleanCep = normalizeCep(cep)

  if (cleanCep.length !== 8) {
    throw new Error('CEP deve conter 8 digitos.')
  }

  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
  const data = await response.json().catch(() => null)

  if (!response.ok || !data || data.erro) {
    throw new Error('CEP nao encontrado.')
  }

  const addressParts = [data.logradouro, data.bairro, data.localidade, data.uf].filter(Boolean)

  return {
    cep: cleanCep,
    endereco: addressParts.join(', '),
    bairro: data.bairro || '',
    cidade: data.localidade || '',
    uf: data.uf || '',
  }
}

export async function geocodeWorkshopAddress({ endereco, cep }) {
  const query = buildNominatimQuery({ endereco, cep })

  if (!query) {
    throw new Error('Informe um endereco para buscar as coordenadas da oficina.')
  }

  const searchParams = new URLSearchParams({
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'br',
    addressdetails: '1',
    q: query,
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${searchParams.toString()}`, {
    headers: {
      'Accept-Language': 'pt-BR',
    },
  })

  const data = await response.json().catch(() => [])
  const firstResult = Array.isArray(data) ? data[0] : null

  if (!response.ok || !firstResult) {
    throw new Error('Nao foi possivel localizar a oficina a partir do endereco informado.')
  }

  return {
    latitude: Number(firstResult.lat),
    longitude: Number(firstResult.lon),
    enderecoFormatado: firstResult.display_name || endereco,
  }
}

export async function reverseGeocodeCoordinates({ latitude, longitude }) {
  const searchParams = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '18',
    addressdetails: '1',
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${searchParams.toString()}`, {
    headers: {
      'Accept-Language': 'pt-BR',
    },
  })

  const data = await response.json().catch(() => null)
  const cep = normalizeCep(data?.address?.postcode)

  return {
    cep: cep || '',
    enderecoFormatado: data?.display_name || '',
  }
}

export default {
  lookupCep,
  geocodeWorkshopAddress,
  reverseGeocodeCoordinates,
}
