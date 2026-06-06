import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MOCK_PLACES, createPlace, deletePlace } from '../services/placesService'
import './Admin.css'

const EMPTY_FORM = {
  name: '', category: 'restaurante', address: '',
  rating: 4.0, priceLevel: 2, occasion: [], description: '',
}

export default function Admin() {
  const { user, loading}                  = useAuth()
  const navigate                  = useNavigate()
  const [places, setPlaces]       = useState(MOCK_PLACES)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    // SÓ redireciona se o loading já terminou E o usuário realmente NÃO for admin
    if (!loading && !user?.isAdmin) {
      navigate('/')
    }
  }, [user, loading, navigate])

  // Enquanto estiver checando o token, mostra uma tela amigável
  if (loading) {
    return <div className="loading-screen">Verificando permissões...</div>
  }

  // Se o loading acabou e não é admin, barra a renderização da página
  if (!user?.isAdmin) {
    return null
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    if (name === 'occasion') {
      setForm(f => ({
        ...f,
        occasion: checked
          ? [...f.occasion, value]
          : f.occasion.filter(o => o !== value),
      }))
    } else {
      setForm(f => ({ ...f, [name]: type === 'number' ? Number(value) : value }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const newPlace = await createPlace(form).catch(() => ({
        ...form, id: Date.now(),
      }))
      setPlaces(prev => [...prev, newPlace])
      setForm(EMPTY_FORM)
      setShowForm(false)
      setSuccessMsg('Lugar adicionado com sucesso!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover este lugar?')) return
    await deletePlace(id).catch(() => {})
    setPlaces(prev => prev.filter(p => p.id !== id))
  }

  const OCCASIONS_LIST = ['familia', 'encontro', 'comemoracao', 'amigos']

  return (
    <div className="page-wrapper admin-page">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1 className="section-title">
              <i className="fa-solid fa-gear"></i> Painel Admin
            </h1>
            <p className="section-subtitle">Gerencie os lugares cadastrados na plataforma</p>
          </div>
          <button className="btn btn--primary" onClick={() => setShowForm(f => !f)}>
            <i className={`fa-solid fa-${showForm ? 'xmark' : 'plus'}`}></i>
            {showForm ? 'Cancelar' : 'Novo Lugar'}
          </button>
        </div>

        {successMsg && (
          <div className="admin-success">
            <i className="fa-solid fa-circle-check"></i> {successMsg}
          </div>
        )}

        {showForm && (
          <div className="admin-form-card">
            <h2>Adicionar Novo Lugar</h2>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form__row">
                <div className="form-group">
                  <label>Nome do local</label>
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="Ex: Restaurante X" />
                </div>
                <div className="form-group">
                  <label>Categoria</label>
                  <select name="category" value={form.category} onChange={handleChange}>
                    <option value="restaurante">Restaurante</option>
                    <option value="bar">Bar</option>
                    <option value="cafe">Café</option>
                    <option value="evento">Evento</option>
                    <option value="mercado">Mercado</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Endereço</label>
                <input name="address" value={form.address} onChange={handleChange} required placeholder="Rua, número - Bairro" />
              </div>

              <div className="admin-form__row">
                <div className="form-group">
                  <label>Nota inicial (1-5)</label>
                  <input name="rating" type="number" min="1" max="5" step="0.1" value={form.rating} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Faixa de preço (1-4)</label>
                  <input name="priceLevel" type="number" min="1" max="4" value={form.priceLevel} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Ocasiões</label>
                <div className="admin-checkboxes">
                  {OCCASIONS_LIST.map(o => (
                    <label key={o} className="admin-checkbox">
                      <input
                        type="checkbox"
                        name="occasion"
                        value={o}
                        checked={form.occasion.includes(o)}
                        onChange={handleChange}
                      />
                      {o}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Descreva o local..."
                />
              </div>

              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar lugar'}
              </button>
            </form>
          </div>
        )}

        <div className="admin-table-card">
          <h2>Lugares Cadastrados ({places.length})</h2>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Nota</th>
                  <th>Preço</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {places.map(p => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/place/${p.id}`} className="admin-place-link">
                        {p.name}
                      </Link>
                    </td>
                    <td>
                      <span className="badge badge--orange">{p.category}</span>
                    </td>
                    <td>
                      <span className="stars">{'★'.repeat(Math.round(p.rating))}</span>
                      {' '}{p.rating?.toFixed(1)}
                    </td>
                    <td>{'$'.repeat(p.priceLevel)}</td>
                    <td>
                      <button
                        className="admin-delete-btn"
                        onClick={() => handleDelete(p.id)}
                      >
                        <i className="fa-solid fa-trash"></i> Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
