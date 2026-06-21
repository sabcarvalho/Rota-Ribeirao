import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createPlace, 
        deletePlace, 
        getPlacesAdmin, 
        updateStatusPlace, 
        startSearchEvents, 
        updatePlace,
        startSearchPlaces } from '../services/placesService'
import './Admin.css'

const EMPTY_FORM = {
  name: '', category: 'restaurante', street: '', number: '', district: '', cep: '',
  rating: 4.0, priceLevel: 2, occasion: [], description: '', type: 'fixo', image: '',
  eventStartDate: '', eventFinishDate: '',
}

export default function Admin() {
  const { user, loading}                  = useAuth()
  const navigate                  = useNavigate()
  const [places, setPlaces]       = useState([])
  const [form, setForm]           = useState(EMPTY_FORM)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [crawlerType, setCrawlerType] = useState('bar')
  const [crawlerMsg, setCrawlerMsg]   = useState('')
  const [isCrawlerRunning, setIsCrawlerRunning] = useState(false)
  const fetchPlaces = () => {
    getPlacesAdmin()
      .then(data => {
        setPlaces(data)
      })
      .catch(err => console.error("Erro ao buscar lugares:", err))
  }
  useEffect(() => {
    if (user === undefined) return;
    if (!loading && !user?.isAdmin) {
      navigate('/')
    }
    fetchPlaces()
  }, [user, navigate])



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
  const handleToggleActive = async (id, isActivating, currentStatusObj) => {
    try {
      const novoStatusStr = isActivating ? 'ativo' : 'desativado'

      // Atualização otimista na tela
      setPlaces(prevPlaces => 
        prevPlaces.map(p => p.id === id ? { ...p, status: novoStatusStr } : p)
      )

      // Se a rota no backend espera um boolean:
      await updateStatusPlace(id, isActivating)

    } catch (error) {
      console.error("Erro ao alterar o status do lugar:", error)
      // Reverte em caso de erro
      setPlaces(prevPlaces => 
        prevPlaces.map(p => p.id === id ? { ...p, status: currentStatusObj } : p)
      )
      alert("Não foi possível alterar o status do lugar.")
    }
  }
crawlerMsg
  function handleEditClick(place) {
    setForm({
      ...place,
      // Garante que a string que vem do banco vire um array para as checkboxes
      occasion: Array.isArray(place.occasion) ? place.occasion : (place.occasion ? place.occasion.split(',') : []),
      // Formata a data (caso venha do banco com hora) para caber no input type="date"
      eventStartDate: place.eventStartDate ? place.eventStartDate.substring(0, 10) : '',
      eventFinishDate: place.eventFinishDate ? place.eventFinishDate.substring(0, 10) : ''
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }


  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    
    // Converte o array das checkboxes de volta para string delimitada para enviar ao back-end
    const payload = { 
      ...form,
      occasion: Array.isArray(form.occasion) ? form.occasion.join(',') : form.occasion,
      status: "ativo"
    }

    if (payload.type === 'evento') {
      if (!payload.eventStartDate || !payload.eventFinishDate) {
        alert("Por favor, preencha as datas de início e término do evento.");
        setSaving(false);
        return; 
      }

      const dataInicio = new Date(payload.eventStartDate);
      const dataFim = new Date(payload.eventFinishDate);

      if (dataInicio > dataFim) {
        alert("Erro: A data de início não pode ser posterior à data de término!");
        setSaving(false);
        return;
      }
      if(payload.category !== "evento"){
        payload.category = "evento"
      }
    }

    try {
      if (form.id) {
        // Se tem ID, é Edição
        const updatedPlace = await updatePlace(form.id, payload)
        setPlaces(prev => prev.map(p => p.id === updatedPlace.id ? updatedPlace : p))
        setSuccessMsg('Lugar atualizado com sucesso!')
      } else {
        // Se não tem ID, é Criação Nova
        const newPlace = await createPlace(payload)
        setPlaces(prev => [...prev, newPlace])
        setSuccessMsg('Lugar adicionado com sucesso!')
      }
      setForm(EMPTY_FORM)
      setShowForm(false)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (error){
      console.error("Não foi possível processar a requisição no servidor:", error)
      alert("Erro ao salvar os dados. Tente novamente.")
    } finally {
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

  const handleRunCrawlerPlaces = async () => {
    setIsCrawlerRunning(true)
    setCrawlerMsg('Iniciando robô de lugares... Isso ocorre em segundo plano.')
    try {
      await startSearchPlaces(crawlerType)
      setCrawlerMsg(`Sucesso! O robô está à procura de ${crawlerType}s.`)
    } catch (err) {
      console.error(err)
      setCrawlerMsg('Erro ao disparar robô de lugares.')
    } finally {
      setIsCrawlerRunning(false)
      setTimeout(() => setCrawlerMsg(''), 5000)
    }
  }

  const handleRunCrawlerEvents = async () => {
    setIsCrawlerRunning(true)
    setCrawlerMsg('Iniciando robôs de eventos (Ingresse e Ticketmaster)...')
    try {
      await startSearchEvents()
      setCrawlerMsg('Sucesso! A procura de eventos começou em segundo plano.')
    } catch (err) {
      console.error(err)
      setCrawlerMsg('Erro ao disparar robôs de eventos.')
    } finally {
      setIsCrawlerRunning(false)
      setTimeout(() => setCrawlerMsg(''), 5000)
    }
  }

  const pendingPlaces = places.filter(p => p.status === 'pendente')
  const registeredPlaces = places.filter(p => p.status !== 'pendente')
  const OCCASIONS_LIST = ['familia', 'encontro', 'comemoracao', 'amigos']

  return (
    <div className="page-wrapper admin-page">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1 className="section-title">
              <i className="fa-solid fa-gear"></i> Painel Admin
            </h1>
            <p className="section-subtitle">Aprovação, moderação e robôs de curadoria</p>
          </div>
          <button className="btn btn--primary" onClick={() => {
            setForm(EMPTY_FORM);
            setShowForm(f => !f);
          }}>
            <i className={`fa-solid fa-${showForm ? 'xmark' : 'plus'}`}></i>
            {showForm ? 'Cancelar' : 'Novo Lugar Manual'}
          </button>
        </div>

        {/* MENSAGENS DE FEEDBACK */}
        {successMsg && (
          <div className="admin-success">
            <i className="fa-solid fa-circle-check"></i> {successMsg}
          </div>
        )}
        {crawlerMsg && (
          <div className="admin-info">
            <i className="fa-solid fa-robot"></i> {crawlerMsg}
          </div>
        )}

        {/* MÓDULO DOS ROBÔS */}
        <div className="admin-crawler-card">
          <h2 className="admin-crawler-title"><i className="fa-solid fa-bolt"></i> Automação Rota Ribeirão</h2>
          <div className="admin-crawler-actions">
            <div className="form-group form-group--crawler-select">
              <label>Buscar Novos Lugares (Overpass)</label>
              <select value={crawlerType} onChange={e => setCrawlerType(e.target.value)} className="admin-crawler-select">
                <option value="bar">Bares, Pubs e Baladas</option>
                <option value="restaurante">Restaurantes e Sorveterias</option>
                <option value="cafe">Cafeterias</option>
                <option value="mercado">Mercadões / Galerias</option>
              </select>
            </div>
            <button className="btn btn--primary" onClick={handleRunCrawlerPlaces} disabled={isCrawlerRunning}>
              <i className="fa-solid fa-search"></i> Buscar Lugares
            </button>
            <div className="admin-crawler-divider"></div>
            <button className="btn btn--purple" onClick={handleRunCrawlerEvents} disabled={isCrawlerRunning}>
              <i className="fa-solid fa-ticket"></i> Buscar Eventos (Ticketmaster/Ingresse)
            </button>
            <button className="btn btn--secondary" onClick={fetchPlaces} title="Atualizar a lista de locais abaixo">
               <i className="fa-solid fa-rotate"></i> Refresh
            </button>
          </div>
        </div>

        {/* FORMULÁRIO DE CRIAÇÃO/EDIÇÃO */}
        {showForm && (
          <div className="admin-form-card">
            <h2>{form.id ? 'Editar Informações' : 'Adicionar Novo Lugar'}</h2>
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
                <div className="form-group form-group--lg">
                  <label>Rua / Avenida</label>
                  <input name="street" value={form.street || ''} onChange={handleChange} required placeholder="Ex: Av. Professor João Fiúsa" />
                </div>
                <div className="form-group form-group--sm">
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
                  <input name="rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Faixa de preço (1-4)</label>
                  <input name="priceLevel" type="number" min="1" max="4" value={form.priceLevel} onChange={handleChange} />
                </div>
              </div>

              <div className="admin-form__row">
                <div className="form-group">
                  <label>Tipo</label>
                  <select name="type" value={form.type} onChange={(e) => {handleChange(e);
                        if (e.target.value === 'fixo') {
                          setForm(prev => ({
                            ...prev,
                            eventStartDate: '',
                            eventFinishDate: ''
                          }));
                        }
                      }}>
                    <option value="fixo">Fixo</option>
                    <option value="evento">Evento</option>
                  </select>
                </div>
                <div className="form-group form-group--sm">
                  <label>URL da Imagem</label>
                  <input name="image" value={form.image || ''} onChange={handleChange} placeholder="Ex: https://linkdaimagem.com/foto.jpg" />
                  {form.image && (
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                      <img 
                        src={form.image} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }} // Oculta se a URL for quebrada
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {form.type === 'evento' && (
              <div className="admin-form__row">
                <div className="form-group">
                  <label>Data de Início (Evento)</label>
                  <input name="eventStartDate" type="date" value={form.eventStartDate || ''} onChange={handleChange} />
                </div>
                <div className="form-group form-group--sm">
                  <label>Data de Fim (Evento)</label>
                  <input name="eventFinishDate" type="date" value={form.eventFinishDate || ''} onChange={handleChange} />
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
                      <span className="admin-checkbox-label">{o}</span>
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
                {saving ? 'A Guardar...' : form.id ? 'Atualizar Lugar' : 'Salvar Novo Lugar'}
              </button>
            </form>
          </div>
        )}

        {/* TABELA 1: LUGARES PENDENTES */}
        <div className="admin-table-card admin-table-card--pending">
          <h2>Pendentes para Aprovação ({pendingPlaces.length})</h2>
          <p className="admin-table-desc">Estes lugares foram trazidos pelos robôs e aguardam a sua curadoria.</p>
          
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria / Tipo</th>
                  <th>Ações de Moderação</th>
                </tr>
              </thead>
              <tbody>
                {pendingPlaces.length === 0 ? (
                  <tr><td colSpan="3" className="admin-table-empty">Nenhum lugar pendente na fila.</td></tr>
                ) : (
                  pendingPlaces.map(p => (
                    <tr key={p.id} className="admin-table-row admin-table-row--pending">
                      <td>
                        <strong>{p.name}</strong><br/>
                        <small>{p.street}, {p.number} - {p.district}</small>
                      </td>
                      <td>
                        <span className="badge badge--orange">{p.category}</span>
                        <small className="admin-type-label">{p.type}</small>
                      </td>
                      <td className="admin-table-actions">
                        <button className="admin-status-btn admin-status-btn--activate" onClick={() => handleToggleActive(p.id, true, p.status)}>
                          <i className="fa-solid fa-check"></i> Aprovar
                        </button>
                        <button className="btn btn--secondary btn--sm" onClick={() => handleEditClick(p)}>
                          <i className="fa-solid fa-pen"></i> Editar
                        </button>
                        <button className="admin-delete-btn" onClick={() => handleDelete(p.id)}>
                          <i className="fa-solid fa-trash"></i> Descartar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABELA 2: LUGARES CADASTRADOS (ATIVOS E DESATIVADOS) */}
        <div className="admin-table-card admin-table-card--registered">
          <h2>Base de Dados Cadastrada ({registeredPlaces.length})</h2>
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
                {registeredPlaces.map(p => (
                  <tr key={p.id} className={p.status === 'desativado' ? "admin-table-row admin-table-row--disabled" : "admin-table-row"}>
                    <td>
                      <Link to={`/place/${p.id}`} className="admin-place-link">
                        {p.name}
                      </Link>
                      {p.status === 'desativado' && (
                        <span className="admin-place-status">
                          (Desativado)
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge--orange">{p.category}</span>
                    </td>
                    <td>
                      <span className="stars">{'★'.repeat(Math.round(p.rating || 0))}</span>
                      {' '}{p.rating?.toFixed(1)}
                    </td>
                    <td>{'$'.repeat(p.priceLevel || 1)}</td>
                    <td className="admin-table-actions">
                      <button
                        className={p.status === 'ativo' ? "admin-status-btn admin-status-btn--deactivate" : "admin-status-btn admin-status-btn--activate"}
                        onClick={() => handleToggleActive(p.id, p.status === 'desativado', p.status)}>
                        <i className={p.status === 'ativo' ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>{' '}
                        {p.status === 'ativo' ? "Desativar" : "Ativar"}
                      </button>
                      <button className="btn btn--secondary btn--sm" onClick={() => handleEditClick(p)}>
                          <i className="fa-solid fa-pen"></i> Editar
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
      </div>
    </div>
  )
}