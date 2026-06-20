import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../services/authService'
import './NavbarStyles.css'

const BASE_ITEMS = [
  { title: 'Home',      url: '/',          icon: 'fa-solid fa-house' },
  { title: 'Favoritos', url: '/favorites', icon: 'fa-solid fa-heart' },
  { title: 'Sobre',     url: '/sobre',     icon: 'fa-solid fa-circle-info' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    setUser(null)
    navigate('/')
    setOpen(false)
  }

  const userItem = !user
    ? { title: 'Cadastrar', url: '/register', icon: 'fa-solid fa-user-plus' }
    : user.isAdmin
    ? { title: 'Admin',  url: '/admin',   icon: 'fa-solid fa-gear' }
    : { title: 'Perfil', url: '/perfil', icon: 'fa-solid fa-user' }

  const navItems = [...BASE_ITEMS, userItem]

  return (
    <nav className='NavbarItems'>
      <Link to='/' className='navbar-logo-link' onClick={() => setOpen(false)}>
        <h1 className='navbar-logo'>Rota Ribeir&#227;o</h1>
      </Link>

      <div className='menu-icon' onClick={() => setOpen(o => !o)}>
        <i className={open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'}></i>
      </div>

      <ul className={open ? 'nav-menu active' : 'nav-menu'}>
        {navItems.map((item) => (
          <li key={item.url}>
            <Link to={item.url} className='nav-links' onClick={() => setOpen(false)}>
              <i className={item.icon}></i> {item.title}
            </Link>
          </li>
        ))}
        {user && (
          <li>
            <button className='nav-links' onClick={handleLogout}>
              <i className='fa-solid fa-right-from-bracket'></i> Sair
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}
