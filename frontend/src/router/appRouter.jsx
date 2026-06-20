import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import PlaceDetail from '../pages/PlaceDetail'
import Favorites from '../pages/Favorites'
import Admin from '../pages/Admin'
import Perfil from '../pages/Perfil'
import Sobre from '../pages/Sobre'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/place/:id" element={<PlaceDetail />} />
      <Route path="/sobre" element={<Sobre />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/perfil" element={
        <ProtectedRoute>
          <Perfil />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <Admin />
        </ProtectedRoute>
      } />
    </Routes>
  )
}
