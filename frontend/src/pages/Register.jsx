import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register } from '../services/authService'
import './Auth.css'

export default function Register() {
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const { setUser }                 = useAuth()
  const navigate                    = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.')
      return
    }
    setLoading(true)
    try {
      const user = await register(name, email, password)
      setUser(user)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <i className="fa-solid fa-location-dot auth-logo-icon"></i>
          <h1>Rota Ribeirão</h1>
          <p>Crie sua conta e comece a explorar</p>
        </div>

        {error && (
          <div className="auth-error">
            <i className="fa-solid fa-circle-exclamation"></i> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Nome</label>
            <input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="Mínimo 4 caracteres"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirmar senha</label>
            <input
              id="confirm"
              type="password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError('') }}
              required
            />
          </div>

          <button type="submit" className="btn btn--primary auth-btn" disabled={loading}>
            {loading ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> Cadastrando...</>
            ) : (
              <><i className="fa-solid fa-user-plus"></i> Criar conta</>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Já tem conta?{' '}
          <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
