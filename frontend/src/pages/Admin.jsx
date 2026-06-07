import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MOCK_PLACES, createPlace, deletePlace, getPlaces } from '../services/placesService'
import './Admin.css'

const EMPTY_FORM = {
  name: '', category: 'restaurante', street: '', number: '', district: '', cep: '',
  rating: 4.0, priceLevel: 2, occasion: [], description: '', type: 'fixo', image: ' ',
}

export default function Admin() {
  const { user, loading}                  = useAuth()
  const navigate                  = useNavigate()
  const [places, setPlaces]       = useState([])
  const [form, setForm]           = useState(EMPTY_FORM)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    // SÓ redireciona se o loading já terminou E o usuário realmente NÃO for admin
    if (!loading && !user?.isAdmin) {
      navigate('/')
      console.log(user)
    }
    getPlaces({category: '', priceLevel: '', occasion: '', minRating: '',})
      .then(data => {
        setPlaces(data)
      })
      .catch(err => console.error("Erro ao buscar lugares:", err))
  }, [user, navigate])

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
    const backupPlaces = [...places]
    try {
      const newPlace = await createPlace(form)
      setPlaces(prev => [...prev, newPlace])
      setForm(EMPTY_FORM)
      setShowForm(false)
      setSuccessMsg('Lugar adicionado com sucesso!')
      setTimeout(() => setSuccessMsg(''), 3000)
    }catch (error){
      console.error("Não foi possível remover o lugar do servidor:", error)
      setPlaces(backupPlaces)
      alert("Erro ao adicionar lugar. Tente novamente.")
    }finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover este lugar?')) return
  
    const backupPlaces = [...places]
    const nextPlaces = places.filter(p => p.id !== id)

    setPlaces(nextPlaces)

    try {
      await deletePlace(id)
    } catch (error) {
      console.error("Não foi possível remover o lugar do servidor:", error)
      setPlaces(backupPlaces)
      alert("Erro ao remover lugar. Tente novamente.")
    }
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

              <div className="admin-form__row">
                <div className="form-group" style={{ flex: 3 }}>
                  <label>Rua / Avenida</label>
                  <input name="street" value={form.street || ''} onChange={handleChange} required placeholder="Ex: Av. Professor João Fiúsa" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Número</label>
                  <input name="number" value={form.number || ''} onChange={handleChange} required placeholder="Ex: 1200" />
                </div>
              </div>

              <div className="admin-form__row">
                <div className="form-group">
                  <label>Bairro</label>
                  <input name="district" value={form.district || ''} onChange={handleChange} required placeholder="Ex: Jardim Botânico" />
                </div>
                <div className="form-group">
                  <label>CEP</label>
                  <input name="cep" value={form.cep || ''} onChange={handleChange} required placeholder="Ex: 14020-000" />
                </div>
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

              <div className="admin-form__row">
                <div className="form-group">
                  <label>Tipo</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="fixo">Fixo</option>
                    <option value="evento">Evento</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>URL da Imagem</label>
                  <input name="image" value={form.image || ''} onChange={handleChange} placeholder="Ex: https://linkdaimagem.com/foto.jpg" />
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
