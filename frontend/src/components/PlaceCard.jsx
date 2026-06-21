import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './PlaceCard.css'

const CATEGORY_BADGE = {
  restaurante: 'badge--orange',
  bar:         'badge--blue',
  evento:      'badge--red',
  mercado:     'badge--green',
  cafe:        'badge--purple',
}

const CATEGORY_ICON = {
  restaurante: 'fa-utensils',
  bar:         'fa-martini-glass',
  evento:      'fa-calendar-days',
  mercado:     'fa-store',
  cafe:        'fa-mug-hot',
}

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) => (
    <i
      key={i}
      className={`fa-${i < Math.round(rating) ? 'solid' : 'regular'} fa-star`}
    ></i>
  ))
}

function renderPrice(level) {
  return Array.from({ length: 4 }, (_, i) => (
    <span
      key={i}
      className={`price-meter__unit${i < level ? '' : ' price-meter__unit--off'}`}
    >$</span>
  ))
}

export default function PlaceCard({ place, onToggleFavorite, isFavorite }) {
  const { user } = useAuth()

  return (
    <div className="place-card">
      <Link to={`/place/${place.id}`} className="place-card__image-link">
        <div className="place-card__image">
          <img
            className="place-card__photo"
            src={place.image || `https://picsum.photos/seed/${place.id}/400/250`}
            alt={place.name}
            loading="lazy"
          />
          <span className={`badge ${CATEGORY_BADGE[place.category] || 'badge--orange'}`}>
            <i className={`fa-solid ${CATEGORY_ICON[place.category] || 'fa-location-dot'}`}></i>
            {' '}{place.category}
          </span>
        </div>
      </Link>

      <div className="place-card__body">
        <div className="place-card__header">
          <Link to={`/place/${place.id}`}>
            <h3 className="place-card__name">{place.name}</h3>
          </Link>
          {user && (
            <button
              className={`place-card__fav${isFavorite ? ' active' : ''}`}
              onClick={() => onToggleFavorite?.(place.id, isFavorite)}
              aria-label="Favoritar"
            >
              <i className={`fa-${isFavorite ? 'solid' : 'regular'} fa-heart`}></i>
            </button>
          )}
        </div>

        <p className="place-card__address">
          <i className="fa-solid fa-location-dot"></i> {place.address}
        </p>

        {place.category === 'evento' && place.eventDate && (
          <p className="place-card__event-date">
            <i className="fa-solid fa-calendar-days"></i>{' '}
            {new Date(place.eventDate + 'T00:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric'
            })}
          </p>
        )}

        <div className="place-card__meta">
          {place.qntdReviews || place.rating ? (
            <>
              <span className="stars">{renderStars(place.rating)}</span>
              <span className="place-card__rating-num">{place.rating?.toFixed(1)}</span>
            </>
          ) : (
            <span className="place-card__no-reviews">Ainda não possui avaliações</span>
          )}
          <span className="place-card__price">{renderPrice(place.priceLevel)}</span>
        </div>
      </div>
    </div>
  )
}
