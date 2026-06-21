import { getFavorites, getStorageCache, setStorageCache, toggleFavoritePlace } from '../services/placesService'

/**
 * Carrega a lista de IDs favoritados (do cache ou da API)
 */
export async function carregarFavoritos() {
  try {
    let ids = getStorageCache('favorites')
    if (ids === null) {
      ids = await getFavorites()
    }
    return ids || []
  } catch (error) {
    console.error("Erro ao carregar favoritos:", error)
    return []
  }
}

/**
 * Gerencia a ação de favoritar/desfavoritar
 */
export async function toggleFavorite({
  id,
  isFavorite,
  favoritesList,
  setFavoritesState,
  showToast
}) {
  const backup = [...favoritesList]
  
  // Atualização Otimista da UI (Rápida)
  const next = favoritesList.includes(id) 
    ? favoritesList.filter(f => f !== id) 
    : [...favoritesList, id]
    
  setFavoritesState(next)
  setStorageCache("favorites", next, 5)

  if (showToast) {
    showToast(
      isFavorite ? 'Removido dos favoritos.' : 'Lugar adicionado aos favoritos!',
      'success'
    )
  }

  try {
    await toggleFavoritePlace(id, !isFavorite)
  } catch (error) {
    // Reverte em caso de erro no servidor
    setStorageCache("favorites", backup, 5)
    setFavoritesState(backup)
    console.error("Erro ao sincronizar favorito com o servidor:", error)
    if (showToast) {
      showToast('Não foi possível salvar seu favorito. Tente novamente.', 'error')
    } else {
      alert('Não foi possível salvar seu favorito. Tente novamente.')
    }
    throw error
  }
}