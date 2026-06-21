import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import AppRouter from './router/appRouter'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Navbar />
        <main id="conteudo-principal">
          <AppRouter />
        </main>
      </ToastProvider>
    </AuthProvider>
  )
}
