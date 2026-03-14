import { useState } from 'react'
import api from '../services/api'
import { getErrorMessage } from '../utils/errors'

const initialForm = {
  email: '',
  password: '',
}

export default function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.email.trim() || !form.password.trim()) {
      setError('Email and password are required')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const endpoint = mode === 'login' ? api.login : api.signup
      const response = await endpoint({
        email: form.email.trim(),
        password: form.password,
      })

      const { token, user } = response.data
      onAuthSuccess({ token, user })
      setForm(initialForm)
    } catch (err) {
      setError(getErrorMessage(err, 'Authentication failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">
        {mode === 'login' ? 'Login to FixBot' : 'Create your account'}
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        {mode === 'login'
          ? 'Sign in to analyze incidents and receive email reports.'
          : 'Use your email to sign up and get analysis reports by email.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="At least 6 characters"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign up'}
        </button>
      </form>

      <button
        type="button"
        className="mt-4 text-sm text-blue-600 hover:text-blue-800"
        onClick={() => {
          setMode((prev) => (prev === 'login' ? 'signup' : 'login'))
          setError('')
        }}
      >
        {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
      </button>
    </div>
  )
}
