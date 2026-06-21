import { useState, useEffect } from 'react'
import PlaceCard from '../components/PlaceCard'
import { useAuth } from '../context/AuthContext'
import FilterBar from '../components/FilterBar'
import { getPlaces } from '../services/placesService'
import { carregarFavoritos, toggleFavorite as toggleFavoriteUtil } from '../utils/favoriteHelper'
import { getReviewsCount } from '../services/reviewsService'
import { useToast } from '../components/Toast'
import '../styles/layout.css'
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
    let isMounted = true

    async function carregarLugares() {
      setLoading(true)
      try {
        const dadosLugares = await getPlaces(filters)
        if (isMounted) setPlaces(dadosLugares)
      } catch (error) {
        console.error("Erro ao carregar os lugares:", error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    // Os lugares carregam independentemente dos favoritos
    carregarLugares()

    if (!user) {
      setFavorites([])
      return () => { isMounted = false }
    }

    // carregar favoritos usando helper centralizado
    ;(async () => {
      try {
        const ids = await carregarFavoritos().catch(() => [])
        if (isMounted) setFavorites(ids || [])
      } catch (err) {
        console.error('Erro ao carregar favoritos:', err)
      }
    })()

    return () => { isMounted = false }
  }, [filters, user])

  async function toggleFavorite(id, isFavorite) {
    try {
      await toggleFavoriteUtil({
        id,
        isFavorite,
        favoritesList: favorites,
        setFavoritesState: setFavorites,
        showToast,
      })
    } catch (error) {
      console.error('Erro ao alternar favorito:', error)
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
            <button
              type="button"
              className="btn btn--primary hero__cta"
              onClick={() => document.getElementById('lugares')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <i className="fa-solid fa-compass"></i> Explorar Agora
            </button>
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
