import { api } from './api'
import { mapPlaceToFrontend } from './placesService'

const CACHE_PREFIX = 'recommendations_'
const TTL_MINUTES = 10

/**
 * Busca o cache atual do usuário no localStorage.
 */
export function getRecommendationsCache(userId) {
  const cacheRaw = localStorage.getItem(`${CACHE_PREFIX}${userId}`)
  
  if (!cacheRaw) return null
  
  const cacheData = JSON.parse(cacheRaw)
  const now = new Date()

  // Se o tempo de vida expirou, remove da memória e retorna null
  if (now.getTime() > cacheData.expiry) {
    localStorage.removeItem(`${CACHE_PREFIX}${userId}`)
    return null
  }
  
  return cacheData.value
}

/**
 * Salva a lista de recomendações com prazo de validade de 10 minutos.
 */
export function setRecommendationsCache(userId, value) {
  const now = new Date()
  
  const cacheData = {
    value: value,
    expiry: now.getTime() + (TTL_MINUTES * 60 * 1000) 
  }
  
  localStorage.setItem(`${CACHE_PREFIX}${userId}`, JSON.stringify(cacheData))
}


/**
 * Função principal consumida pela interface (Componentes React).
 */
export async function getRecommendations(userId, limit = 10) {
  if (!userId) {
    console.error("ID de usuário ausente ao buscar recomendações.")
    return []
  }

  // 1. Verifica no armazenamento local primeiro
  const cachedRecommendations = getRecommendationsCache(userId)
  
  // Se existir cache válido e não estiver vazio, retorna ele mesmo (poupando requisição)
  if (cachedRecommendations && cachedRecommendations.length > 0) {
    return cachedRecommendations
  }

  // 2. Se o cache falhar ou expirar, dispara a requisição usando o serviço 'recommendation'
  try {
    const rawResponse = await api.get('recommendation', `/recommendations/user/${userId}?limit=${limit}`)

    const formattedResponse = Array.isArray(rawResponse)
      ? rawResponse.map(mapPlaceToFrontend).filter(Boolean)
      : []

    // 3. Atualiza o cache com a nova lista e novo tempo de 10 minutos
    setRecommendationsCache(userId, formattedResponse)

    return formattedResponse

  } catch (error) {
    console.error("Erro ao processar as recomendações personalizadas: ", error)
    return [] // Retorna vazio em caso de falha de rede para não quebrar a UI
  }
}