import { api } from './api'
import { refreshToken } from './authService'


function mapPlaceToFrontend(backendPlace) {
  if (!backendPlace) return null

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


// Ordenação alfabética por nome (ignora maiúsculas e acentos, regra pt-BR)
function ordenarPorNome(a, b) {
  return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' })
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
    return response.map(mapPlaceToFrontend).sort(ordenarPorNome)
  } catch (error) {
    console.warn("Usando fallback de dados mockados para listagem de lugares", error)

    let places = [...MOCK_PLACES]
    if (filters.category)  places = places.filter(p => p.category === filters.category)
    if (filters.priceLevel) places = places.filter(p => p.priceLevel <= Number(filters.priceLevel))
    if (filters.occasion)  places = places.filter(p => p.occasion.includes(filters.occasion))
    if (filters.minRating) places = places.filter(p => p.rating >= Number(filters.minRating))
    return places.sort(ordenarPorNome)
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
  let response = null
  console.log(isFav)
  if(isFav){
    response = await api.post('admin', `/favorites/${id_place}`, {})
  }else{
    response = await api.delete('admin', `/favorites/${id_place}`)
  }
  
  return response
}
export async function getPlacesAdmin(){
  const response = await api.get('places', `/admin/places`)
  return response.map(mapPlaceToFrontend)
}

export async function getFavorites() {
  const response = await api.get('admin', `/favorites`)
  let apenasIds = []
  if(response)
    apenasIds = response.map(item => item.place_id)
  setStorageCache("favorites", apenasIds, 30)
  return apenasIds
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
  const response = await api.post('places', '/places', new_data)
  return  mapPlaceToFrontend(response)
}
export async function updatePlace(id_place, data) {
  const new_data = mapPlaceToBackend(data)
  const response = await api.patch('places', `/places/${id_place}`, new_data)
  return mapPlaceToFrontend(response)
}
export async function startSearchPlaces(type_place) {
  return await api.post('admin', `/crawlers/places/${type_place}`, {})
}
export async function startSearchEvents() {
  return await api.post('admin', '/crawlers/events', {})
}

export async function deletePlace(id) {
  return await api.delete('places', `/places/${id}`)
}
export async function updateStatusPlace(id, newStatus) {
  if(newStatus)
    return await api.post('places', `/places/${id}/activate`, {})
  else
    return await api.post('places', `/places/${id}/deactivate`, {})
}
