import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPlaceById, toggleFavoritePlace, getFavorites, getStorageCache,setStorageCache } from '../services/placesService'
import { getPlaceReviews, addReview, calculateNewAverageRating } from '../services/reviewsService'
import { useAuth } from '../context/AuthContext'
import './PlaceDetail.css'

function renderStars(rating, size = '1rem') {
  return Array.from({ length: 5 }, (_, i) => (
    <i
      key={i}
      className={`fa-${i < Math.round(rating) ? 'solid' : 'regular'} fa-star`}
      style={{ fontSize: size, color: 'var(--star)' }}
    ></i>
  ))
}

export default function PlaceDetail() {
  const { id }                  = useParams()
  const navigate                = useNavigate()
  const { user }                = useAuth()
  const [place, setPlace]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [isFav, setIsFav]       = useState(false)
  const [reviewRating, setReviewRating]   = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [sending, setSending]             = useState(false)
  const [reviews, setReviews]             = useState([])

  useEffect(() => {
    // Busca dados essenciais
    async function fetchPlaceDetails() {
      try {
        const data = await getPlaceById(id);
        if (!data) { navigate('/'); return; }
        
        setPlace(data);
        setLoading(false); // Libera o HTML principal

        let favs = getStorageCache('favorites');
        if (favs === null) {
          try {
            favs = await getFavorites();
            setStorageCache('favorites', favs, 30);
          } catch (error) {
            favs = [];
          }
        }
        if (favs) setIsFav(favs.includes(data.id));

      } catch (err) {
        setLoading(false);
      }
    }

    // Busca avaliações de forma independente
    async function fetchReviews() {
      try {
        const reviewsData = await getPlaceReviews(id);
        setReviews(reviewsData || []);
      } catch (error) {
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    }

    // Executa ambas paralelamente
    fetchPlaceDetails();
    fetchReviews();
    
  }, [id, navigate]);

  async function toggleFavorite() {
    const estadoAnterior = isFav
    let favs = getStorageCache('favorites')
    try {
      if (favs === null) {
        favs = await getFavorites()
      }
      const next = isFav ? favs.filter(f => f !== place.id) : [...favs, place.id]
      setStorageCache("favorites", next, 30)
      setIsFav(!isFav)
      
      await toggleFavoritePlace(place.id, !isFav)
      setStorageCache('favorites', next, 30)
      
    } catch (error) {
      console.log(error)
      setIsFav(estadoAnterior)
      setStorageCache("favorites", favs, 30)
      alert("Não foi possível salvar seu favorito. Tente novamente.")
      
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault()
    if (!reviewComment.trim()) return
    setSending(true)
    try {
      const payload = { rating: reviewRating, comment: reviewComment }
      const newReview = await addReview(place.id, payload)
      
      // Atualização otimista: insere a avaliação e calcula nova nota
      setReviews(prev => [newReview, ...prev])
      
      const novaNota = calculateNewAverageRating(place.rating, reviews.length, reviewRating)
      setPlace(prev => ({ ...prev, rating: novaNota }))
      
      setReviewComment('')
      setReviewRating(5)
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error)
      alert("Erro ao salvar avaliação. Tente novamente.")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
      </div>
    )
  }

  if (!place) return null

  return (
    <div className="page-wrapper">
      <div className="detail-hero" style={{
        backgroundImage: `linear-gradient(rgba(26,26,46,0.7),rgba(26,26,46,0.85)), url(${place.image})`
      }}>
        <div className="container">
          <button className="detail-back" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <div className="detail-hero__content">
            <span className="badge badge--orange">{place.category}</span>
            <h1>{place.name}</h1>
            <p className="detail-address">
              <i className="fa-solid fa-location-dot"></i> {place.address}
            </p>
            <div className="detail-meta">
              <span className="stars">{renderStars(place.rating, '1.1rem')}</span>
              <strong>{place.rating?.toFixed(1) || '0.0'}</strong>
              <span className="detail-reviews-count">({reviews.length} avaliações)</span>
              <span className="detail-price">
                {Array.from({ length: 4 }, (_, i) => (
                  <span key={i} style={{ opacity: i < place.priceLevel ? 1 : 0.3 }}>$</span>
                ))}
              </span>
              {user && (
                <button
                  className={`detail-fav-btn${isFav ? ' active' : ''}`}
                  onClick={toggleFavorite}
                >
                  <i className={`fa-${isFav ? 'solid' : 'regular'} fa-heart`}></i>
                  {isFav ? 'Salvo' : 'Favoritar'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container detail-body">
        <div className="detail-grid">
          <div className="detail-main">
            <section className="detail-section">
              <h2>Sobre o local</h2>
              <p>{place.description}</p>
            </section>

            <section className="detail-section">
              <h2>
                <i className="fa-solid fa-comments"></i> Avaliações
                {reviews.length > 0 && <span className="reviews-count">{reviews.length}</span>}
              </h2>

              {loadingReviews ? (
                <p className="loading-reviews"><i className="fa-solid fa-spinner fa-spin"></i> Carregando avaliações...</p>
              ) : reviews.length === 0 ? (
                <p className="no-reviews">Ainda não há avaliações. Seja o primeiro!</p>
              ) : (
                <div className="reviews-list">
                  {reviews.map(review => (
                    <div key={review.id} className="review-card">
                      <div className="review-card__header">
                        <div className="review-avatar">
                          {review.author?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <strong>{review.author}</strong>
                          <span className="review-date">{review.date}</span>
                        </div>
                        <span className="stars review-stars">
                          {renderStars(review.rating)}
                        </span>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {user ? (
                <form className="review-form" onSubmit={handleReviewSubmit}>
                  <h3>Deixe sua avaliação</h3>
                  <div className="form-group">
                    <label>Nota</label>
                    <div className="star-selector">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          className={`star-btn${reviewRating >= n ? ' active' : ''}`}
                          onClick={() => setReviewRating(n)}
                        >
                          <i className="fa-solid fa-star"></i>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Comentário</label>
                    <textarea
                      rows={3}
                      placeholder="Conte sua experiência..."
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn--primary" disabled={sending}>
                    {sending ? 'Enviando...' : 'Publicar avaliação'}
                  </button>
                </form>
              ) : (
                <p className="review-login-prompt">
                  <i className="fa-solid fa-lock"></i>{' '}
                  <a href="/login">Faça login</a> para deixar uma avaliação.
                </p>
              )}
            </section>
          </div>

          <aside className="detail-sidebar">
            <div className="detail-info-card">
              <h3>Informações</h3>
              <ul>
                <li><i className="fa-solid fa-tag"></i> <strong>Categoria:</strong> {place.category}</li>
                {place.category === 'evento' && place.eventDate && (
                  <li>
                    <i className="fa-solid fa-calendar-days"></i> <strong>Data:</strong>{' '}
                    {new Date(place.eventDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </li>
                )}
                <li><i className="fa-solid fa-dollar-sign"></i> <strong>Preço:</strong>
                  {' '}{'$'.repeat(place.priceLevel)}
                </li>
                <li><i className="fa-solid fa-star"></i> <strong>Nota:</strong> {place.rating?.toFixed(1) || '0.0'} / 5</li>
                <li>
                  <i className="fa-solid fa-users"></i> <strong>Ocasiões:</strong>
                  <div className="detail-occasions">
                    {place.occasion?.map(o => (
                      <span key={o} className="badge badge--blue">{o}</span>
                    ))}
                  </div>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
