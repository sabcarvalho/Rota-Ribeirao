import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PlaceCard from '../components/PlaceCard'
import { getPlaceById, toggleFavoritePlace, getFavorites, getStorageCache,setStorageCache} from '../services/placesService'
import './Favorites.css'

export default function Favorites() {
  const { user } = useAuth()
  const [favoritesIds, setFavoritesIds] = useState([]) 
  const [favoritePlaces, setFavoritePlaces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarFavoritos() {
      try {
        let ids = getStorageCache('favorites')

        if (ids === null) {
          console.log("Cache expirou ou não existe. Buscando do banco...")
          ids = await getFavorites()
        }
        setFavoritesIds(ids)

        if (ids.length > 0) {
          const lugares = await getPlaceById(ids)
          if(Array.isArray(lugares))
            setFavoritePlaces(lugares)
          else
            setFavoritePlaces([lugares])
          console.log(lugares)
        }
      } catch (error) {
        console.error("Erro ao carregar tela de favoritos:", error)
      } finally {
        setLoading(false)
      }
    }

    carregarFavoritos()
  }, [])

  async function handleRemoveFavorite(idLugar) {
    const backupIds = [...favoritesIds]
    const backupPlaces = [...favoritePlaces]

    const nextIds = favoritesIds.filter(id => id !== idLugar)
    const nextPlaces = favoritePlaces.filter(p => p.id !== idLugar)

    setFavoritesIds(nextIds)
    setFavoritePlaces(nextPlaces)
    setStorageCache('favorites', nextIds, 30) 

    try {
      await toggleFavoritePlace(idLugar, false)
    } catch (error) {
      console.error("Não foi possível remover o favorito do servidor:", error)
      setFavoritesIds(backupIds)
      setFavoritePlaces(backupPlaces)
      setStorageCache('favorites', backupIds, 30)
      alert("Erro ao remover favorito. Tente novamente.")
    }
  }

  if (!user) {
    return (
      <div className="page-wrapper favorites-page">
        <div className="container">
          <div className="empty-state">
            <i className="fa-solid fa-lock"></i>
            <p>Você precisa estar logado para ver seus favoritos.</p>
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
            <i className="fa-regular fa-heart"></i>
            <p>Explore lugares e clique no coração para salvar aqui.</p>
            <Link to="/" className="btn btn--primary">
              <i className="fa-solid fa-compass"></i> Explorar lugares
            </Link>
          </div>
        ) : (
          <div className="favorites-grid">
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
