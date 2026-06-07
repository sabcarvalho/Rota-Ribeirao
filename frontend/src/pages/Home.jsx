import { useState, useEffect } from 'react'
import PlaceCard from '../components/PlaceCard'
import { useAuth } from '../context/AuthContext'
import FilterBar from '../components/FilterBar'
import { getPlaces, getFavorites, getStorageCache} from '../services/placesService'
import './Home.css'

export default function Home() {
  const {user} = useAuth()
  const [places, setPlaces]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [favorites, setFavorites]   = useState([])
  const [filters, setFilters] = useState({
    category: '', priceLevel: '', occasion: '', minRating: '',
  })

  useEffect(() => {
    async function carregarFavoritos() {
      try {
        let ids = getStorageCache('favorites')

        if (ids === null) {
          console.log("Cache expirou ou não existe. Buscando do banco...")
          ids = await getFavorites()
        }
        setFavorites(ids)
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error)
        setFavorites([])
      } finally {
        setLoading(false)
        setFavorites([]) 
      }
    }
    setLoading(true)

    getPlaces(filters)
      .then(data => {
        setPlaces(data)
      })
      .catch(err => console.error("Erro ao buscar lugares:", err))
      .finally(() => {
        if (!user) {
          setFavorites([]) 
          setLoading(false)
        }
      })

    if (user) {
      carregarFavoritos()
    } else {
      setFavorites([]) 
    }
      
  }, [filters, user])

  // function toggleFavorite(id) {
  //   setFavorites(prev => {
  //     const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
  //     localStorage.setItem('favorites', JSON.stringify(next))
  //     return next
  //   })
  // }
  async function toggleFavorite(id) {
    let favs = favorites
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem('favorites', JSON.stringify(next))
      return next
    })
    try {
      const response = await toggleFavoritePlace(id, true)
      
    } catch (error) {
      localStorage.setItem('favorites', JSON.stringify(favs))
      setFavorites(favorites)
      alert("Não foi possível salvar seu favorito. Tente novamente.")
    }
  }

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section className="hero">
        <div className="hero__overlay">
          <div className="hero__content">
            <span className="hero__eyebrow">
              <i className="fa-solid fa-location-dot"></i> Ribeirão Preto, SP
            </span>
            <h1 className="hero__title">
              Descubra o melhor de <span>Ribeirão Preto</span>
            </h1>
            <p className="hero__subtitle">
              Restaurantes, bares, cafés e eventos, tudo em um só lugar.
              Explore, avalie e salve seus favoritos.
            </p>
            <a href="#lugares" className="btn btn--primary hero__cta">
              <i className="fa-solid fa-compass"></i> Explorar Agora
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="home-stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <i className="fa-solid fa-utensils"></i>
              <strong>200+</strong>
              <span>Restaurantes</span>
            </div>
            <div className="stat-item">
              <i className="fa-solid fa-martini-glass"></i>
              <strong>80+</strong>
              <span>Bares & Pubs</span>
            </div>
            <div className="stat-item">
              <i className="fa-solid fa-calendar-days"></i>
              <strong>50+</strong>
              <span>Eventos / mês</span>
            </div>
            <div className="stat-item">
              <i className="fa-solid fa-star"></i>
              <strong>5.000+</strong>
              <span>Avaliações</span>
            </div>
          </div>
        </div>
      </section>

      {/* Lugares */}
      <section id="lugares" className="home-places">
        <div className="container">
          <h2 className="section-title">Explorar Lugares</h2>
          <p className="section-subtitle">Filtre e encontre o local perfeito para cada momento</p>

          <FilterBar filters={filters} onFilter={setFilters} />

          {loading ? (
            <div className="loading-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          ) : places.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-magnifying-glass"></i>
              <p>Nenhum lugar encontrado com esses filtros.</p>
              <button
                className="btn btn--primary"
                onClick={() => setFilters({ category: '', priceLevel: '', occasion: '', minRating: '' })}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="places-grid">
              {places.map(place => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  isFavorite={favorites.includes(place.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
