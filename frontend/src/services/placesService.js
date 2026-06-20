import { api } from './api'
import { refreshToken } from './authService'

// Dados mock para desenvolvimento sem backend
export const MOCK_PLACES = [
  {
    id: 1,
    name: 'Restaurante Sinhá Moça',
    category: 'restaurante',
    address: 'Av. Costábile Romano, 2201 - Ribeirânia',
    rating: 4.7,
    priceLevel: 3,
    occasion: ['familia', 'comemoracao'],
    description: 'Tradicional restaurante de culinária brasileira, famoso pelos pratos mineiros e o ambiente aconchegante.',
    reviews: [
      { id: 1, author: 'Maria S.', rating: 5, comment: 'Comida incrível! O frango com quiabo é imperdível.', date: '2025-05-10' },
      { id: 2, author: 'João P.', rating: 4, comment: 'Ótimo atendimento, lugar espaçoso para a família.', date: '2025-04-22' },
    ],
  },
  {
    id: 2,
    name: 'Barão Bar',
    category: 'bar',
    address: 'Rua Duque de Caxias, 780 - Centro',
    rating: 4.4,
    priceLevel: 2,
    occasion: ['encontro', 'amigos'],
    description: 'Bar animado no centro com boa seleção de cervejas artesanais e petiscos.',
    reviews: [
      { id: 1, author: 'Lucas M.', rating: 4, comment: 'Ótimas cervejas artesanais e ambiente descontraído.', date: '2025-05-18' },
    ],
  },
  {
    id: 3,
    name: 'Choperia Americana',
    category: 'bar',
    address: 'R. Visconde de Inhaúma, 392 - Centro',
    rating: 4.2,
    priceLevel: 2,
    occasion: ['amigos', 'comemoracao'],
    description: 'Clássica choperia do centro, ponto de encontro ribeirão-pretano há décadas.',
    reviews: [],
  },
  {
    id: 4,
    name: 'Café Colonial Sabores',
    category: 'cafe',
    address: 'Rua Álvares Cabral, 1450 - Jardim América',
    rating: 4.8,
    priceLevel: 2,
    occasion: ['encontro', 'familia'],
    description: 'Café charmoso com decoração acolhedora, famoso pelos bolos caseiros e café especial.',
    reviews: [
      { id: 1, author: 'Ana C.', rating: 5, comment: 'Melhor café da cidade! Bolo de laranja divino.', date: '2025-05-01' },
    ],
  },
  {
    id: 5,
    name: 'Festival de Jazz de Ribeirão',
    category: 'evento',
    address: 'Parque Curupira - Ribeirão Preto',
    rating: 4.9,
    priceLevel: 3,
    occasion: ['comemoracao', 'encontro', 'amigos'],
    eventDate: '2025-08-15',
    description: 'Festival anual de jazz que reúne artistas nacionais e internacionais no Parque Curupira.',
    reviews: [
      { id: 1, author: 'Pedro A.', rating: 5, comment: 'Experiência incrível! Já é tradição na minha agenda.', date: '2025-03-15' },
    ],
  },
  {
    id: 6,
    name: 'Mercado Municipal de RP',
    category: 'mercado',
    address: 'Av. Jerônimo Gonçalves, 80 - Centro',
    rating: 4.3,
    priceLevel: 1,
    occasion: ['familia'],
    description: 'Mercado tradicional com feiras de produtos frescos, artesanato e comidas típicas da região.',
    reviews: [],
  },
  {
    id: 7,
    name: 'Restaurante Panelão',
    category: 'restaurante',
    address: 'R. General Osório, 560 - Centro',
    rating: 4.1,
    priceLevel: 1,
    occasion: ['familia', 'amigos'],
    description: 'Self-service com variedade de pratos caseiros e preço acessível no coração da cidade.',
    reviews: [],
  },
  {
    id: 8,
    name: 'The Pub Ribeirão',
    category: 'bar',
    address: 'Shopping Iguatemi - Av. Nações Unidas, 3501',
    rating: 4.0,
    priceLevel: 3,
    occasion: ['encontro', 'amigos'],
    description: 'Bar estilo pub inglês com menu variado de drinques e hambúrgueres artesanais.',
    reviews: [],
  },
]

function mapPlaceToFrontend(backendPlace) {
  if (!backendPlace) return null

  if(backendPlace.event)
    console.log(backendPlace.event)

  return {
    id: backendPlace.id,
    name: backendPlace.name,                               
    category: backendPlace.category.toLowerCase(), 
    image: backendPlace.image, 
    address: `${backendPlace.street}, ${backendPlace.number} - ${backendPlace.district}, CEP: ${backendPlace.cep}` || 'Endereço não informado', 
    description: backendPlace.description,
    rating: backendPlace.rating,
    priceLevel: backendPlace.priceLevel,
    eventDate: backendPlace.event ? backendPlace.event.eventStartDate.slice(0, 10) : '',
    eventStartDate: backendPlace.event ? backendPlace.event.eventStartDate.slice(0, 10) : '',
    eventFinishDate: backendPlace.event ? backendPlace.event.eventFinishDate.slice(0, 10) : '',
    occasion: backendPlace.occasion.split(",") || [],
    status: backendPlace.status,
    street: backendPlace.street,
    number: backendPlace.number,
    district: backendPlace.district,
    cep: backendPlace.cep,
    type: backendPlace.type
  }
}
function mapPlaceToBackend(frontendPlace) {
  if (!frontendPlace) return null

  const startDate = frontendPlace.type === 'evento' && frontendPlace.eventStartDate
    ? `${frontendPlace.eventStartDate}T00:00:00`
    : null;

  const finishDate = frontendPlace.type === 'evento' && frontendPlace.eventFinishDate
    ? `${frontendPlace.eventFinishDate}T23:59:59`
    : null;

  return {
    name: frontendPlace.name ?  frontendPlace.name.trim() : null,                               
    category: frontendPlace.category ?  frontendPlace.category.toLowerCase()  : null, 
    image: frontendPlace.image ?  frontendPlace.image.trim(): null, 
    street: frontendPlace.street ?  frontendPlace.street.trim(): null,
    number: frontendPlace.number? frontendPlace.number.trim(): null,
    district: frontendPlace.district? frontendPlace.district.trim(): null,
    cep: frontendPlace.cep ? frontendPlace.cep.trim(): null,
    description: frontendPlace.description? frontendPlace.description.trim(): null,
    rating: frontendPlace.rating ? frontendPlace.rating: null, 
    priceLevel: frontendPlace.priceLevel ? frontendPlace.priceLevel: null,
    occasion: frontendPlace.occasion ? frontendPlace.occasion: null,
    type: frontendPlace.type ?frontendPlace.type : null,
    eventStartDate: startDate,
    eventFinishDate: finishDate,
    status: frontendPlace.status ? frontendPlace.status : null,
  }
}


export async function getPlaces(filters = {}) {
  try {
    const params = new URLSearchParams()
    
    if (filters.name)        params.set('name',        filters.name)
    if (filters.eventType)        params.set('event_type',        filters.eventType)
    if (filters.category)    params.set('category',    filters.category)
    if (filters.occasion)    params.set('occasion',    filters.occasion)
    if (filters.priceLevel)  params.set('price_level', filters.priceLevel)
    if (filters.minRating)   params.set('min_rating',  filters.minRating)

    const response = await api.get('places', `/places?${params}`)
    return response.map(mapPlaceToFrontend)
  } catch (error) {
    console.warn("Usando fallback de dados mockados para listagem de lugares", error)
    
    let places = [...MOCK_PLACES]
    if (filters.category)  places = places.filter(p => p.category === filters.category)
    if (filters.priceLevel) places = places.filter(p => p.priceLevel <= Number(filters.priceLevel))
    if (filters.occasion)  places = places.filter(p => p.occasion.includes(filters.occasion))
    if (filters.minRating) places = places.filter(p => p.rating >= Number(filters.minRating))
    return places
  }
}

export async function getPlaceById(id) {
  if (!id || id === 'undefined') {
    console.error("getPlaceById foi chamada com um ID inválido:", id)
    return null
  }
  const idList = Array.isArray(id) ? id : [id]

  const queryString = idList.map(e => `ids=${e}`).join('&')
  const search = `?${queryString}`

  try {
    const response = await api.get('places', `/places${search}`)
    const placesMapeados = response.map(lugar => mapPlaceToFrontend(lugar))

    return Array.isArray(id) ? placesMapeados : (placesMapeados[0] || null)

  } catch (error) {
    console.error("Erro ao buscar lugar por ID, usando Mock", error)
    return MOCK_PLACES.find(p => p.id === Number(id)) || null
  }
}

export async function toggleFavoritePlace(id_place, isFav) {
  try {
    let response = null
    console.log(isFav)
    if(isFav){
      response = await api.post('admin', `/favorites/${id_place}`, {})
    }else{
      response = await api.delete('admin', `/favorites/${id_place}`)
    }
    
    return response

  } catch (error) {
    if (error.detail?.code === "TOKEN_EXPIRED") {
      try {
        await refreshToken(); 
        if(isFav){
          response = await api.post('admin', `/favorites/${id_place}`, {})
        }else{
          response = await api.delete('admin', `/favorites/${id_place}`)
        }
        return response
      } catch (refreshErr) {
        console.error("Refresh token também expirou. Forçando logout.");
        throw refreshErr;
      }
    } else{
      console.error("Erro ao favoritar o lugar: ", error)
      throw error
    }
    
  }
}
export async function getPlacesAdmin(){
  try {

    const response = await api.get('places', `/admin/places`)
    return response.map(mapPlaceToFrontend)
  } catch (error) {
    console.warn("Usando fallback de dados mockados para listagem de lugares", error)
    
    let places = [...MOCK_PLACES]
    return places
  }
}

export async function getFavorites() {
  try {
    const response = await api.get('admin', `/favorites`)
    let apenasIds = []
    if(response)
      apenasIds = response.map(item => item.place_id)
    setStorageCache("favorites", apenasIds, 30)
    return apenasIds
  } catch (error) {
    if (error.detail?.code === "TOKEN_EXPIRED") {
      try {
        await refreshToken(); 
        const response = await api.get('admin', `/favorites`)
        let apenasIds = []
        if(response)
          apenasIds = response.map(item => item.place_id)
        setStorageCache("favorites", apenasIds, 30)
        return apenasIds;
      } catch (refreshErr) {
        console.error("Refresh token também expirou. Forçando logout.");
        throw refreshErr;
      }
    } else{
      console.error("Erro ao favoritar o lugar: ", error)
      throw error
    }
  }
}

export function setStorageCache(key, value, ttlInMinutes) {
  const now = new Date()
  
  const cacheData = {
    value: value,
    expiry: now.getTime() + (ttlInMinutes * 60 * 1000) 
  }
  
  localStorage.setItem(key, JSON.stringify(cacheData))
}

export function getStorageCache(key) {
  const cacheRaw = localStorage.getItem(key)
  
  if (!cacheRaw) return null
  
  const cacheData = JSON.parse(cacheRaw)
  const now = new Date()

  if (!cacheData) return null
  
  if (now.getTime() > cacheData.expiry) {
    localStorage.removeItem(key)
    return null
  }
  
  return cacheData.value
}

export async function createPlace(data) {
  const new_data = mapPlaceToBackend(data)
  try {
    
    const response = await api.post('places', '/places', new_data)
    return  mapPlaceToFrontend(response)

  } catch (error) {
    if (error.status === 401) {
      try {
        await refreshToken(); 
        const response = await api.post('places', '/places', new_data)
        return  mapPlaceToFrontend(response)
      } catch (refreshErr) {
        console.error("Refresh token também expirou. Forçando logout.");
        throw refreshErr;
      }
    } else{
      console.error("Erro ao criar o lugar: ", error)
      throw error
    }
  }
}
export async function updatePlace(id_place, data) {
  const new_data = mapPlaceToBackend(data)
  try {
    const response = await api.patch('places', `/places/${id_place}`, new_data)
    return  mapPlaceToFrontend(response)
  } catch (error) {
    if (error.status === 401) {
      try {
        await refreshToken(); 
        const response = await api.patch('places', `/places/${id_place}`, new_data)
        return  mapPlaceToFrontend(response)
      } catch (refreshErr) {
        console.error("Refresh token também expirou. Forçando logout.");
        throw refreshErr;
      }
    } else{
      console.error("Erro ao criar o lugar: ", error)
      throw error
    }
  }
}
export async function startSearchPlaces(type_place) {
  try {
    const response = await api.post('admin', `/crawlers/places/${type_place}`, {})
    return response
  } catch (error) {
    if (error.status === 401) {
      try {
        await refreshToken(); 
        const response = await api.post('admin',`/crawlers/places/${type_place}`, {})
        return response
      } catch (refreshErr) {
        console.error("Refresh token também expirou. Forçando logout.");
        throw refreshErr;
      }
    } else{
      console.error("Erro ao disparar busca de lugares: ", error)
      throw error
    }
  }
}
export async function startSearchEvents() {
  try {
    const response = await api.post('admin', '/crawlers/events', {})
    return response
  } catch (error) {
    if (error.status === 401) {
      try {
        await refreshToken(); 
        const response = await api.post('admin','/crawlers/events', {})
        return response
      } catch (refreshErr) {
        console.error("Refresh token também expirou. Forçando logout.");
        throw refreshErr;
      }
    } else{
      console.error("Erro ao disparar busca de eventos: ", error)
      throw error
    }
  }
}

export async function deletePlace(id) {
  try {
    return await api.delete('places', `/places/${id}`)
  } catch (error) {
    if (error.status === 401) {
      try {
        await refreshToken(); 
        return await api.delete('places', `/places/${id}`)
      } catch (refreshErr) {
        console.error("Refresh token também expirou. Forçando logout.");
        throw refreshErr;
      }
    } else{
      console.error("Erro ao deletar o lugar: ", error)
      throw error
    }
  }
}
export async function updateStatusPlace(id, newStatus) {
  try {
    if(newStatus)
      return await api.post('places', `/places/${id}/activate`, {})
    else
      return await api.post('places', `/places/${id}/deactivate`, {})
  } catch (error) {
    if (error.status === 401) {
      try {
        await refreshToken(); 
        if(newStatus)
      return await api.post('places', `/places/${id}/activate`, {})
    else
      return await api.post('places', `/places/${id}/deactivate`, {})
      } catch (refreshErr) {
        console.error("Refresh token também expirou. Forçando logout.");
        throw refreshErr;
      }
    } else{
      console.error("Erro ao deletar o lugar: ", error)
      throw error
    }
  }
}
