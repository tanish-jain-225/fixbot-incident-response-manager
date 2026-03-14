import { useEffect, useState } from 'react'
import Header from './components/Header'
import Home from './pages/Home'
import IncidentHistory from './components/IncidentHistory'
import AuthForm from './components/AuthForm'
import api from './services/api'
import { clearAuthSession, getStoredAuth, saveAuthSession, saveUserProfile } from './utils/session'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [auth, setAuth] = useState(getStoredAuth)

  useEffect(() => {
    const validateSession = async () => {
      if (!auth.token) return

      try {
        const response = await api.getProfile()
        setAuth((prev) => ({ ...prev, user: response.data.user }))
        saveUserProfile(response.data.user)
      } catch (error) {
        clearAuthSession()
        setAuth({ token: null, user: null })
      }
    }

    validateSession()
  }, [auth.token])

  const handleAuthSuccess = ({ token, user }) => {
    saveAuthSession({ token, user })
    setAuth({ token, user })
  }

  const handleLogout = () => {
    clearAuthSession()
    setAuth({ token: null, user: null })
    setCurrentPage('home')
  }

  if (!auth.token || !auth.user) {
    return (
      <div className="app-shell min-h-screen flex flex-col">
        <Header
          currentPage={'auth'}
          setCurrentPage={() => {}}
          user={null}
          onLogout={null}
        />
        <main className="flex-1 container mx-auto px-4 py-6 md:py-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <AuthForm onAuthSuccess={handleAuthSuccess} />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell min-h-screen">
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={auth.user}
        onLogout={handleLogout}
      />
      <main className="container mx-auto px-4 py-8 md:py-10 page-enter">
        {currentPage === 'home' && <Home />}
        {currentPage === 'history' && <IncidentHistory />}
      </main>
    </div>
  )
}

export default App
