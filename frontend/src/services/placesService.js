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
    qntdReviews: backendPlace.qntd_reviews || 0,
    eventDate: backendPlace.evento ? backendPlace.evento.data_inicio.slice(0, 10) : '',
    occasion: backendPlace.occasion ? backendPlace.occasion.split(",") : [],
    active: backendPlace.active
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
    name: frontendPlace.name.trim(),                               
    category: frontendPlace.category.toLowerCase(), 
    image: frontendPlace.image.trim(), 
    street: frontendPlace.street.trim(),
    number: frontendPlace.number.trim(),
    district: frontendPlace.district.trim(),
    cep: frontendPlace.cep.trim(),
    description: frontendPlace.description.trim(),
    rating: frontendPlace.rating, 
    priceLevel: frontendPlace.priceLevel,
    occasion: frontendPlace.occasion.join(),
    type: frontendPlace.type,
    eventStartDate: startDate,
    eventFinishDate: finishDate,
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

    const response = await api.get('places', `/search_place?${params}`)
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
    const response = await api.get('places', `/search_place/${search}`)
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
    if(isFav){
      response = await api.post('admin', `/places/add_favorite/${id_place}`, {})
    }else{
      response = await api.delete('admin', `/places/delete_favorite/place/${id_place}`)
    }
    
    return response

  } catch (error) {
    if (error.status === 401) {
      try {
        await refreshToken(); 
        if(isFav){
          return await api.post('admin', `/places/add_favorite/${id_place}`, {})
        }else{
          return await api.delete('admin', `/places/delete_favorite/place/${id_place}`)
        }
      } catch (refreshErr) {
        if(refreshErr instanceof TokenExpiredError){
          console.error("Refresh token também expirou. Forçando logout.");
        }
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

    const response = await api.get('places', `/admin/search_places`)
    return response.map(mapPlaceToFrontend)
  } catch (error) {
    console.warn("Usando fallback de dados mockados para listagem de lugares", error)
    
    let places = [...MOCK_PLACES]
    return places
  }
}

export async function getFavorites() {
  try {
    const response = await api.get('admin', `/places/favorites`)
    let apenasIds = []
    if(response)
      apenasIds = response.map(item => item.place_id)
    setStorageCache("favorites", apenasIds, 30)
    return apenasIds
  } catch (error) {
    if (error.status === 401) {
      try {
        await refreshToken(); 
        const response = await api.get('admin', `/places/favorites`)
        let apenasIds = []
        if(response)
          apenasIds = response.map(item => item.place_id)
        setStorageCache("favorites", apenasIds, 30)
        return apenasIds;
      } catch (refreshErr) {
        if(refreshErr instanceof TokenExpiredError){
          console.error("Refresh token também expirou. Forçando logout.");
        }
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
    
    const response = await api.post('places', '/add_place', new_data)
    return response
  } catch (error) {
    if (error.status === 401) {
      try {
        await refreshToken(); 
        const response = await api.post('places', '/add_place', new_data)
        return response.id
      } catch (refreshErr) {
        if(refreshErr instanceof TokenExpiredError){
          console.error("Refresh token também expirou. Forçando logout.");
        }
        throw refreshErr;
      }
    } else{
      console.error("Erro ao criar o lugar: ", error)
      throw error
    }
  }
}

export async function deletePlace(id) {
  try {
    return await api.delete('places', `/delete_place/${id}`)
  } catch (error) {
    if (error.status === 401) {
      try {
        await refreshToken(); 
        return await api.delete('places', `/delete_place/${id}`)
      } catch (refreshErr) {
        if(refreshErr instanceof TokenExpiredError){
          console.error("Refresh token também expirou. Forçando logout.");
        }
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
      return await api.post('places', `/activate_place/${id}`, {})
    else
      return await api.post('places', `/deactivate_place/${id}`, {})
  } catch (error) {
    if (error.status === 401) {
      try {
        await refreshToken(); 
        if(newStatus)
          return await api.post('places', `/activate_place/${id}`, {})
        else
          return await api.post('places', `/deactivate_place/${id}`, {})
      } catch (refreshErr) {
        if(refreshErr instanceof TokenExpiredError){
          console.error("Refresh token também expirou. Forçando logout.");
        }
        throw refreshErr;
      }
    } else{
      console.error("Erro ao deletar o lugar: ", error)
      throw error
    }
  }
}
