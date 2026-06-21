import { useState, useEffect } from 'react'
import PlaceCard from '../components/PlaceCard'
import { useAuth } from '../context/AuthContext'
import FilterBar from '../components/FilterBar'
import { getPlaces, getFavorites, getStorageCache, setStorageCache, toggleFavoritePlace} from '../services/placesService'
import { getReviewsCount } from '../services/reviewsService'
import { useToast } from '../components/Toast'
import './Home.css'

export default function Home() {
  const {user} = useAuth()
  const { showToast } = useToast()
  const [places, setPlaces]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [favorites, setFavorites]   = useState([])
  const [filters, setFilters] = useState({
    name: '', category: '', priceLevel: '', occasion: '', minRating: '',
  })
  const [stats, setStats] = useState({ restaurantes: 0, bares: 0, cafes: 0, eventos: 0, mercados: 0, avaliacoes: 0 })

  useEffect(() => {
    async function carregarStats() {
      try {
        const [todos, totalAvaliacoes] = await Promise.all([
          getPlaces({}),
          getReviewsCount(),
        ])
        setStats({
          restaurantes: todos.filter(p => p.category === 'restaurante').length,
          bares:        todos.filter(p => p.category === 'bar').length,
          cafes:        todos.filter(p => p.category === 'cafe' || p.category === 'café').length,
          eventos:      todos.filter(p => p.category === 'evento').length,
          mercados:     todos.filter(p => p.category === 'mercado').length,
          avaliacoes:   totalAvaliacoes,
        })
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      }
    }
    carregarStats()
  }, [])

  useEffect(() => {
    let cancelado = false

    async function carregarLugares() {
      setLoading(true)
      try {
        const dadosLugares = await getPlaces(filters)
        if (!cancelado) setPlaces(dadosLugares)
      } catch (error) {
        console.error("Erro ao carregar os lugares:", error)
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    // Os lugares carregam independentemente dos favoritos (não bloqueiam a grade)
    carregarLugares()

    if (!user) {
      setFavorites([])
      return () => { cancelado = true }
    }

    async function carregarFavoritos() {
      try {
        let ids = getStorageCache('favorites')
        if (ids === null) {
          ids = await getFavorites()
        }
        if (!cancelado) setFavorites(ids || [])
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error)
      }
    }
    carregarFavoritos()

    return () => { cancelado = true }
  }, [filters, user])

  async function toggleFavorite(id, isFavorite) {
    let favs = favorites
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      setStorageCache("favorites", next, 30)
      return next
    })
    try {
      await toggleFavoritePlace(id, !isFavorite)
      showToast(
        isFavorite ? 'Removido dos favoritos.' : 'Lugar adicionado aos favoritos!',
        'success'
      )
    } catch (error) {
      setStorageCache("favorites", favs, 30)
      setFavorites(favorites)
      console.log(error)
      showToast('Não foi possível salvar seu favorito. Tente novamente.', 'error')
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
              <strong>{stats.restaurantes}</strong>
              <span>Restaurantes</span>
            </div>
            <div className="stat-item">
              <i className="fa-solid fa-martini-glass"></i>
              <strong>{stats.bares}</strong>
              <span>Bares & Pubs</span>
            </div>
            <div className="stat-item">
              <i className="fa-solid fa-mug-hot"></i>
              <strong>{stats.cafes}</strong>
              <span>Cafés</span>
            </div>
            <div className="stat-item">
              <i className="fa-solid fa-calendar-days"></i>
              <strong>{stats.eventos}</strong>
              <span>Eventos</span>
            </div>
            <div className="stat-item">
              <i className="fa-solid fa-store"></i>
              <strong>{stats.mercados}</strong>
              <span>Mercados</span>
            </div>
            <div className="stat-item">
              <i className="fa-solid fa-star"></i>
              <strong>{stats.avaliacoes}</strong>
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
                onClick={() => setFilters({ name: '', category: '', priceLevel: '', occasion: '', minRating: '' })}
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
                  isFavorite={favorites?.includes(place.id)}
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
