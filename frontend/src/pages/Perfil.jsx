import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../services/authService'
import { getUserReviews } from '../services/reviewsService'
import { getPlaceById } from '../services/placesService'
import { carregarFavoritos, toggleFavorite } from '../utils/favoriteHelper'
import { getRecommendations } from '../services/recommendationsService'
import PlaceCard from '../components/PlaceCard'
import '../styles/buttons.css'
import '../styles/layout.css'
import './Perfil.css'

const BADGE_COLOR = {
  bar: 'badge--orange',
  cafe: 'badge--blue',
  restaurante: 'badge--green',
  mercado: 'badge--purple',
  evento: 'badge--red',
}

function formatarData(dataStr) {
  if (!dataStr) return ''
  const data = new Date(dataStr)
  if (isNaN(data)) return ''
  const diffDias = Math.floor((new Date() - data) / (1000 * 60 * 60 * 24))
  if (diffDias <= 0) return 'hoje'
  if (diffDias === 1) return 'ontem'
  if (diffDias < 7) return `há ${diffDias} dias`
  if (diffDias < 30) {
    const semanas = Math.floor(diffDias / 7)
    return `há ${semanas} semana${semanas > 1 ? 's' : ''}`
  }
  if (diffDias < 365) {
    const meses = Math.floor(diffDias / 30)
    return `há ${meses} ${meses > 1 ? 'meses' : 'mês'}`
  }
  return data.toLocaleDateString('pt-BR')
}

export default function Perfil() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [historico, setHistorico] = useState([])
  const [recomendacoes, setRecomendacoes] = useState([])
  const [favoritosIds, setFavoritosIds] = useState([])

  const [loading, setLoading] = useState(true)
  const [loadingRecs, setLoadingRecs] = useState(true)
  const [aberto, setAberto] = useState(null)
  const [verPrivacidade, setVerPrivacidade] = useState(false)

  useEffect(() => {
    if (!user) return

    let isMounted = true

    async function carregarPerfil() {
      setLoading(true)
      try {
        // Avaliações reais feitas pelo usuário
        const reviews = await getUserReviews(user.id).catch(() => [])

        // Favoritos reais (usa helper centralizado)
        const favs = await carregarFavoritos().catch(() => [])
        const favsArray = Array.isArray(favs) ? favs : []
        if (isMounted) setFavoritosIds(favsArray)

        // Busca os dados dos lugares avaliados (nome e categoria)
        const idsLugares = [...new Set((reviews || []).map(r => r.id_lugar))]
        const lugaresPorId = {}
        if (idsLugares.length > 0) {
          const lugares = await getPlaceById(idsLugares).catch(() => [])
          const lista = Array.isArray(lugares) ? lugares : [lugares].filter(Boolean)
          lista.forEach(l => { if (l) lugaresPorId[l.id] = l })
        }

        const itens = (reviews || []).map(r => {
          const lugar = lugaresPorId[r.id_lugar]
          return {
            id: r.id,
            placeId: r.id_lugar,
            name: lugar?.name || 'Lugar indisponível',
            category: lugar?.category || '',
            rating: r.rating,
            comment: r.comment,
            date: formatarData(r.date),
          }
        })
        setHistorico(itens)
      } catch (error) {
        console.error('Erro ao carregar o perfil:', error)
      } finally {
        setLoading(false)
      }

      // Carrega recomendações independentemente de possíveis falhas no histórico
      setLoadingRecs(true)
      try {
        const recs = await getRecommendations(user.id).catch(() => [])
        setRecomendacoes(Array.isArray(recs) ? recs : [])
      } catch (error) {
        console.error('Erro ao carregar recomendações:', error)
      } finally {
        setLoadingRecs(false)
      }
    }
    
    carregarPerfil()

    return () => { isMounted = false }
  }, [user])

  if (!user) {
    navigate('/login')
    return null
  }

  function handleLogout() {
    logout()
    setUser(null)
    navigate('/')
  }

  function toggleItem(id) {
    setAberto(prev => (prev === id ? null : id))
  }

  async function handleToggleFavorite(placeId, isCurrentlyFav) {
    try {
      await toggleFavorite({
        id: placeId,
        isFavorite: isCurrentlyFav,
        favoritesList: favoritosIds,
        setFavoritesState: setFavoritosIds,
        showToast: null,
      })
    } catch (error) {
      console.error("Erro ao favoritar:", error)
    }
  }

  async function recarregarRecomendacoes() {
    setLoadingRecs(true)
    // Destrói o cache local para forçar o serviço a ir na rede
    localStorage.removeItem(`recommendations_${user.id}`)
    try {
      const recs = await getRecommendations(user.id).catch(() => [])
      setRecomendacoes(Array.isArray(recs) ? recs : [])
    } catch (error) {
      console.error('Erro ao recarregar recomendações:', error)
    } finally {
      setLoadingRecs(false)
    }
  }

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  // Estatísticas reais
  const totalAvaliacoes = historico.length
  const notaMedia = totalAvaliacoes > 0
    ? (historico.reduce((s, i) => s + (i.rating || 0), 0) / totalAvaliacoes).toFixed(1)
    : '—'
  const categorias = [...new Set(historico.map(i => i.category).filter(Boolean))]


  return (
    <div className="page-wrapper profile-page">
      <div className="container">

        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-info">
            <h1>{user.name}</h1>
            <span className="profile-email">
              <i className="fa-solid fa-envelope"></i> {user.email}
            </span>
            {user.isAdmin && (
              <span className="badge badge--purple profile-admin-badge">
                <i className="fa-solid fa-shield-halved"></i> Admin
              </span>
            )}
          </div>
          <button className="btn btn--outline profile-logout" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i> Sair
          </button>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <i className="fa-solid fa-star"></i>
            <strong>{totalAvaliacoes}</strong>
            <span>Avaliações feitas</span>
          </div>
          <div className="profile-stat">
            <i className="fa-solid fa-heart"></i>
            <strong>{favoritosIds.length}</strong>
            <span>Favoritos salvos</span>
          </div>
          <div className="profile-stat">
            <i className="fa-solid fa-star-half-stroke"></i>
            <strong>{notaMedia}</strong>
            <span>Nota média dada</span>
          </div>
          <div className="profile-stat">
            <i className="fa-solid fa-shapes"></i>
            <strong>{categorias.length}</strong>
            <span>Categorias avaliadas</span>
          </div>
        </div>

        <div className="profile-section">
          <h2 className="section-title">Histórico recente</h2>
          <p className="section-subtitle">Lugares que você avaliou</p>

          {loading ? (
            <p className="profile-loading">
              <i className="fa-solid fa-spinner fa-spin"></i> Carregando...
            </p>
          ) : historico.length === 0 ? (
            <div className="profile-history">
              <div className="history-empty">Você ainda não fez nenhuma avaliação.</div>
            </div>
          ) : (
            <div className="profile-history">
              {historico.map(item => (
                <div key={item.id} className={`history-item${aberto === item.id ? ' open' : ''}`}>
                  <button className="history-item__row" onClick={() => toggleItem(item.id)}>
                    <div className="history-item__left">
                      {item.category && (
                        <span className={`badge ${BADGE_COLOR[item.category] || 'badge--blue'}`}>
                          {item.category}
                        </span>
                      )}
                      <span className="history-item__name">{item.name}</span>
                    </div>
                    <div className="history-item__right">
                      <span className="stars">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
                      <span className="history-item__date">{item.date}</span>
                      <i className="fa-solid fa-chevron-down history-item__chevron"></i>
                    </div>
                  </button>

                  {aberto === item.id && (
                    <div className="history-item__detail">
                      <div className="history-detail__rating">
                        <span className="stars">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
                        <span>{item.rating}/5</span>
                      </div>
                      <p className="history-detail__comment">
                        {item.comment ? item.comment : <em>Sem comentário.</em>}
                      </p>
                      <Link to={`/place/${item.placeId}`} className="history-detail__link">
                        Ver página do lugar <i className="fa-solid fa-arrow-right"></i>
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2 className="section-title">Recomendações</h2>
          <p className="section-subtitle">Lugares escolhidos pra você, com base no seu gosto</p>

          <div className="recommendations-banner">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <div className="recommendations-banner__text">
              <strong>Suas recomendações personalizadas</strong>
              <p>
                Analisamos suas avaliações e favoritos para sugerir
                os lugares perfeitos para o seu perfil.
              </p>
              <button
                className="recommendations-more"
                onClick={() => setVerPrivacidade(v => !v)}
                aria-expanded={verPrivacidade}
              >
                <i className="fa-solid fa-shield-halved"></i>
                Saiba mais sobre privacidade
                <i className={`fa-solid fa-chevron-${verPrivacidade ? 'up' : 'down'}`}></i>
              </button>
              {verPrivacidade && (
                <p className="recommendations-privacy">
                  Suas recomendações são geradas <strong>somente</strong> a partir da sua
                  atividade nesta conta (lugares que você avaliou e favoritou). Esses dados
                  não são compartilhados com terceiros e servem apenas para personalizar
                  as sugestões para você.
                </p>
              )}
            </div>
          </div>

          <div className="recommendations-actions">
            <button
              className="btn btn--dark"
              onClick={recarregarRecomendacoes}
              disabled={loadingRecs}
            >
              Recarregar recomendações
            </button>
          </div>

          

          {loadingRecs ? (
            <p className="profile-loading">
              <i className="fa-solid fa-spinner fa-spin"></i> Carregando recomendações...
            </p>
          ) : recomendacoes.length === 0 ? (
            <div className="profile-history">
              <div className="history-empty">Nenhuma recomendação disponível no momento. Avalie e favorite mais lugares!</div>
            </div>
          ) : (
            <div className="places-grid">
              {recomendacoes.map(lugar => (
                <PlaceCard
                  key={lugar.id}
                  place={lugar}
                  isFavorite={favoritosIds?.includes(lugar.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
