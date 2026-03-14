import { useEffect, useState } from 'react'
import Header from './components/Header'
import Home from './pages/Home'
import IncidentHistory from './components/IncidentHistory'
import AuthForm from './components/AuthForm'
import api from './services/api'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem(api.TOKEN_KEY)
    const rawUser = localStorage.getItem('fixbot_user')

    return {
      token,
      user: rawUser ? JSON.parse(rawUser) : null,
    }
  })

  useEffect(() => {
    const validateSession = async () => {
      if (!auth.token) return

      try {
        const response = await api.getProfile()
        setAuth((prev) => ({ ...prev, user: response.data.user }))
        localStorage.setItem('fixbot_user', JSON.stringify(response.data.user))
      } catch (error) {
        localStorage.removeItem(api.TOKEN_KEY)
        localStorage.removeItem('fixbot_user')
        setAuth({ token: null, user: null })
      }
    }

    validateSession()
  }, [auth.token])

  const handleAuthSuccess = ({ token, user }) => {
    localStorage.setItem(api.TOKEN_KEY, token)
    localStorage.setItem('fixbot_user', JSON.stringify(user))
    setAuth({ token, user })
  }

  const handleLogout = () => {
    localStorage.removeItem(api.TOKEN_KEY)
    localStorage.removeItem('fixbot_user')
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
