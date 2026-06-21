import { useState, useEffect } from 'react'
import './FilterBar.css'

const CATEGORIES = [
  { value: '', label: 'Todos', icon: 'fa-th-large' },
  { value: 'restaurante', label: 'Restaurantes', icon: 'fa-utensils' },
  { value: 'bar', label: 'Bares', icon: 'fa-martini-glass' },
  { value: 'cafe', label: 'Cafés', icon: 'fa-mug-hot' },
  { value: 'evento', label: 'Eventos', icon: 'fa-calendar-days' },
  { value: 'mercado', label: 'Mercados', icon: 'fa-store' },
]

const PRICE_LEVELS = [
  { value: '', label: 'Qualquer preço' },
  { value: '1', label: '$' },
  { value: '2', label: '$$' },
  { value: '3', label: '$$$' },
  { value: '4', label: '$$$$' },
]

const OCCASIONS = [
  { value: '', label: 'Qualquer ocasião' },
  { value: 'familia', label: 'Família' },
  { value: 'encontro', label: 'Encontro' },
  { value: 'comemoracao', label: 'Comemoração' },
  { value: 'amigos', label: 'Amigos' },
]

export default function FilterBar({ filters, onFilter }) {
  // Campo de nome com debounce: só dispara a busca após o usuário parar de digitar
  const [nameInput, setNameInput] = useState(filters.name || '')

  useEffect(() => {
    const timer = setTimeout(() => {
      if (nameInput !== (filters.name || '')) {
        onFilter({ ...filters, name: nameInput })
      }
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameInput])

  // Mantém o input sincronizado quando os filtros são limpos por fora
  useEffect(() => {
    setNameInput(filters.name || '')
  }, [filters.name])

  function handleChange(key, value) {
    onFilter({ ...filters, [key]: value })
  }

  function clearFilters() {
    setNameInput('')
    onFilter({ name: '', category: '', priceLevel: '', occasion: '', minRating: '' })
  }

  const hasActiveFilter =
    filters.name || filters.category || filters.priceLevel || filters.occasion || filters.minRating

  return (
    <div className="filter-bar">
      <div className="filter-bar__search">
        <label htmlFor="filtro-nome" className="sr-only">Buscar lugar por nome</label>
        <i className="fa-solid fa-magnifying-glass filter-search__icon"></i>
        <input
          id="filtro-nome"
          type="text"
          className="filter-search__input"
          placeholder="Buscar lugar pelo nome..."
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
        />
        {nameInput && (
          <button
            type="button"
            className="filter-search__clear"
            onClick={() => setNameInput('')}
            aria-label="Limpar busca"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>

      <div className="filter-bar__categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            className={`filter-cat-btn${filters.category === cat.value ? ' active' : ''}`}
            onClick={() => handleChange('category', cat.value)}
          >
            <i className={`fa-solid ${cat.icon}`}></i>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="filter-bar__selects">
        <label htmlFor="filtro-preco" className="sr-only">Filtrar por preço</label>
        <select
          id="filtro-preco"
          value={filters.priceLevel}
          onChange={e => handleChange('priceLevel', e.target.value)}
          className="filter-select"
        >
          {PRICE_LEVELS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        <label htmlFor="filtro-ocasiao" className="sr-only">Filtrar por ocasião</label>
        <select
          id="filtro-ocasiao"
          value={filters.occasion}
          onChange={e => handleChange('occasion', e.target.value)}
          className="filter-select"
        >
          {OCCASIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <label htmlFor="filtro-nota" className="sr-only">Filtrar por nota mínima</label>
        <select
          id="filtro-nota"
          value={filters.minRating}
          onChange={e => handleChange('minRating', e.target.value)}
          className="filter-select"
        >
          <option value="">Qualquer nota</option>
          <option value="3">3+ estrelas</option>
          <option value="4">4+ estrelas</option>
          <option value="4.5">4.5+ estrelas</option>
        </select>

        {hasActiveFilter && (
          <button className="filter-clear-btn" onClick={clearFilters}>
            <i className="fa-solid fa-xmark"></i> Limpar
          </button>
        )}
      </div>
    </div>
  )
}
