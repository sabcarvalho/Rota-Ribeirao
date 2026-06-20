import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import AppRouter from './router/appRouter'

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main id="conteudo-principal">
        <AppRouter />
      </main>
    </AuthProvider>
  )
}
