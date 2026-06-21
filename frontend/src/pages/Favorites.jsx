import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PlaceCard from '../components/PlaceCard'
import { getPlaceById } from '../services/placesService'
import { carregarFavoritos, toggleFavorite } from '../utils/favoriteHelper'
import '../styles/layout.css'
import './Favorites.css'

export default function Favorites() {
  const { user } = useAuth()
  const [favoritesIds, setFavoritesIds] = useState([]) 
  const [favoritePlaces, setFavoritePlaces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let isMounted = true

    async function obterDados() {
      try {
        const ids = await carregarFavoritos().catch(() => [])
        const safeIds = Array.isArray(ids) ? ids : []
        if (safeIds.length > 0) {
          const lugares = await getPlaceById(safeIds)
          if (isMounted) {
            if (Array.isArray(lugares)) setFavoritePlaces(lugares)
            else if (lugares) setFavoritePlaces([lugares])
            setFavoritesIds(safeIds)
          }
        } else {
          if (isMounted) setFavoritesIds(safeIds)
        }
      } catch (error) {
        console.error("Erro ao carregar tela de favoritos:", error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    obterDados()

    return () => { isMounted = false }
  }, [user])

  async function handleRemoveFavorite(idLugar) {
    try {
      await toggleFavorite({
        id: idLugar,
        isFavorite: true,
        favoritesList: favoritesIds,
        setFavoritesState: setFavoritesIds,
        showToast: null,
      })
      setFavoritePlaces(prev => prev.filter(p => p.id !== idLugar))
    } catch (error) {
      console.error("Não foi possível remover o favorito do servidor:", error)
      alert("Erro ao remover favorito. Tente novamente.")
    }
  }

  if (!user) {
    return (
      <div className="page-wrapper favorites-page">
        <div className="container">
          <div className="empty-state">
            <p>Faça login para ter favoritos.</p>
            <Link to="/login" className="btn btn--primary">
              <i className="fa-solid fa-right-to-bracket"></i> Entrar
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper favorites-page">
      <div className="container">
        <div className="favorites-header">
          <h1 className="section-title">
            <i className="fa-solid fa-heart"></i> Meus Favoritos
          </h1>
          <p className="section-subtitle">
            {favoritePlaces.length === 0
              ? 'Você ainda não salvou nenhum lugar.'
              : `${favoritePlaces.length} lugar${favoritePlaces.length > 1 ? 'es' : ''} salvo${favoritePlaces.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {favoritePlaces.length === 0 ? (
          <div className="empty-state">
            <p>Explore lugares e clique no coração para salvar aqui.</p>
            <Link to="/" className="btn btn--primary">
              <i className="fa-solid fa-compass"></i> Explorar lugares
            </Link>
          </div>
        ) : (
          <div className="places-grid">
            {favoritePlaces.map(place => (
              <PlaceCard
                key={place.id}
                place={place}
                isFavorite={true}
                onToggleFavorite={handleRemoveFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
