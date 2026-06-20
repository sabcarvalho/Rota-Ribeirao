import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createPlace, deletePlace, getPlacesAdmin, updateStatusPlace } from '../services/placesService'
import { api } from '../services/api'
import './Admin.css'

const EMPTY_FORM = {
  name: '', category: 'restaurante', street: '', number: '', district: '', cep: '',
  rating: 4.0, priceLevel: 2, occasion: [], description: '', type: 'fixo', image: '',
  eventStartDate: '', eventFinishDate: '',
}

export default function Admin() {
  const { user, loading }             = useAuth()
  const navigate                      = useNavigate()
  const [places, setPlaces]           = useState([])
  // TODO: adicionar endpoint de lugares pendentes
  const [pendingPlaces, setPendingPlaces] = useState([])
  const [form, setForm]               = useState(EMPTY_FORM)
  const [showForm, setShowForm]       = useState(false)
  const [saving, setSaving]           = useState(false)
  const [successMsg, setSuccessMsg]   = useState('')
  const [scraping, setScraping]       = useState(false)
  const [scrapingMsg, setScrapingMsg] = useState('')

  useEffect(() => {
    if (user === undefined) return;
    if (!loading && !user?.isAdmin) {
      navigate('/')
    }
    getPlacesAdmin()
      .then(data => setPlaces(data))
      .catch(err => console.error("Erro ao buscar lugares:", err))
  }, [user, navigate])

  if (loading) {
    return <div className="loading-screen">Verificando permissões...</div>
  }

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

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const novoStatus = !currentStatus
      setPlaces(prevPlaces =>
        prevPlaces.map(p => p.id === id ? { ...p, active: novoStatus } : p)
      )
      await updateStatusPlace(id, novoStatus)
    } catch (error) {
      console.error("Erro ao alterar o status do lugar:", error)
      setPlaces(prevPlaces =>
        prevPlaces.map(p => p.id === id ? { ...p, active: currentStatus } : p)
      )
      alert("Não foi possível alterar o status do lugar.")
    }
  }

  async function handleScraping() {
    setScraping(true)
    setScrapingMsg('')
    try {
      await api.post('places', '/scraping/start', {})
      setScrapingMsg('Scraping iniciado com sucesso!')
    } catch {
      setScrapingMsg('Scraping iniciado!')
    } finally {
      setScraping(false)
      setTimeout(() => setScrapingMsg(''), 4000)
    }
  }

  async function handleApprovePending(id) {
    const backup = [...pendingPlaces]
    const approved = pendingPlaces.find(p => p.id === id)
    setPendingPlaces(prev => prev.filter(p => p.id !== id))
    try {
      await updateStatusPlace(id, true)
      if (approved) setPlaces(prev => [...prev, { ...approved, active: true }])
    } catch (error) {
      console.error("Erro ao aprovar lugar:", error)
      setPendingPlaces(backup)
      alert("Erro ao aprovar lugar. Tente novamente.")
    }
  }

  async function handleDenyPending(id) {
    const backup = [...pendingPlaces]
    setPendingPlaces(prev => prev.filter(p => p.id !== id))
    try {
      await deletePlace(id)
    } catch (error) {
      console.error("Erro ao negar lugar:", error)
      setPendingPlaces(backup)
      alert("Erro ao negar lugar. Tente novamente.")
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    const payload = { ...form }
    if (payload.type === 'evento') {
      if (!payload.eventStartDate || !payload.eventFinishDate) {
        alert("Por favor, preencha as datas de início e término do evento.")
        setSaving(false)
        return
      }
      const dataInicio = new Date(payload.eventStartDate)
      const dataFim    = new Date(payload.eventFinishDate)
      if (dataInicio > dataFim) {
        alert("Erro: A data de início não pode ser posterior à data de término!")
        setSaving(false)
        return
      }
      if (payload.category !== 'evento') {
        payload.category = 'evento'
      }
    }
    try {
      const newPlace = await createPlace(payload)
      setPlaces(prev => [...prev, newPlace])
      setForm(EMPTY_FORM)
      setShowForm(false)
      setSuccessMsg('Lugar adicionado com sucesso!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (error) {
      console.error("Não foi possível adicionar o lugar no servidor:", error)
      alert("Erro ao adicionar lugar. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover este lugar?')) return

    const backupPlaces = [...places]
    setPlaces(places.filter(p => p.id !== id))

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
        </div>

        <div className="admin-scraping-bar">
          <button
            className="btn btn--primary admin-scraping-btn"
            onClick={handleScraping}
            disabled={scraping}
          >
            {scraping
              ? <><i className="fa-solid fa-spinner fa-spin"></i> Iniciando...</>
              : <>🤖 Iniciar Web Scraping</>
            }
          </button>
          {scrapingMsg && (
            <span className="admin-scraping-msg">
              <i className="fa-solid fa-circle-check"></i> {scrapingMsg}
            </span>
          )}
        </div>

        {successMsg && (
          <div className="admin-success">
            <i className="fa-solid fa-circle-check"></i> {successMsg}
          </div>
        )}

        <div className="admin-table-card admin-pending-card">
          <h2>Lugares Pendentes de Aprovação</h2>
          {pendingPlaces.length === 0 ? (
            <p className="admin-empty-msg">Nenhum lugar aguardando aprovação.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Categoria</th>
                    <th>Endereço</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPlaces.map(p => (
                    <tr key={p.id} className="admin-table-row">
                      <td>{p.name}</td>
                      <td><span className="badge badge--orange">{p.category}</span></td>
                      <td>{p.address}</td>
                      <td>
                        <button
                          className="admin-approve-btn"
                          onClick={() => handleApprovePending(p.id)}
                        >
                          ✅ Aprovar
                        </button>
                        <button
                          className="admin-delete-btn"
                          onClick={() => handleDenyPending(p.id)}
                        >
                          ❌ Negar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
                  <tr key={p.id} className={!p.active ? "admin-table-row admin-table-row--disabled" : "admin-table-row"}>
                    <td>
                      <Link to={`/place/${p.id}`} className="admin-place-link">
                        {p.name}
                      </Link>
                      {!p.active && (
                        <span className="admin-place-status">(Desativado)</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge--orange">{p.category}</span>
                    </td>
                    <td>
                      <span className="stars">{'★'.repeat(Math.round(p.rating || 0))}</span>
                      {' '}{p.rating?.toFixed(1)}
                    </td>
                    <td>{'$'.repeat(p.priceLevel)}</td>
                    <td>
                      <button
                        className={p.active ? "admin-status-btn admin-status-btn--deactivate" : "admin-status-btn admin-status-btn--activate"}
                        onClick={() => handleToggleActive(p.id, p.active)}
                      >
                        <i className={p.active ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>{' '}
                        {p.active ? "Desativar" : "Ativar"}
                      </button>
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

        <div className="admin-new-place-section">
          <button
            className="btn btn--primary"
            onClick={() => setShowForm(f => !f)}
          >
            <i className={`fa-solid fa-${showForm ? 'xmark' : 'plus'}`}></i>
            {showForm ? ' Cancelar' : ' Novo Lugar'}
          </button>

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
                    <select name="type" value={form.type} onChange={(e) => {
                      handleChange(e)
                      if (e.target.value === 'fixo') {
                        setForm(prev => ({ ...prev, eventStartDate: '', eventFinishDate: '' }))
                      }
                    }}>
                      <option value="fixo">Fixo</option>
                      <option value="evento">Evento</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>URL da Imagem</label>
                    <input name="image" value={form.image || ''} onChange={handleChange} placeholder="Ex: https://linkdaimagem.com/foto.jpg" />
                  </div>
                </div>

                {form.type === 'evento' && (
                  <div className="admin-form__row">
                    <div className="form-group">
                      <label>Data de Início (Evento)</label>
                      <input name="eventStartDate" type="date" value={form.eventStartDate || ''} onChange={handleChange} min="2026-01-01" max="2030-12-31" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Data de Fim (Evento)</label>
                      <input name="eventFinishDate" type="date" value={form.eventFinishDate || ''} onChange={handleChange} min="2026-01-01" max="2030-12-31" />
                    </div>
                  </div>
                )}

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
        </div>
      </div>
    </div>
  )
}
