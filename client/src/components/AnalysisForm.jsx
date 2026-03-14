import { useState } from 'react'
import LogInput from './LogInput'
import CodeInput from './CodeInput'
import api from '../services/api'
import LoadingSpinner from './LoadingSpinner'
import ResultPanel from './ResultPanel'
import { getErrorMessage } from '../utils/errors'

function trimInput(value) {
  return String(value || '').trim()
}

function buildAnalyzePayload(logText, codeSnippet) {
  return {
    logText: trimInput(logText),
    codeSnippet: trimInput(codeSnippet),
  }
}

function clearInputs(setLogText, setCodeSnippet) {
  setLogText('')
  setCodeSnippet('')
}

export default function AnalysisForm() {
  const [logText, setLogText] = useState('')
  const [codeSnippet, setCodeSnippet] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)

    const payload = buildAnalyzePayload(logText, codeSnippet)
    if (!payload.logText || !payload.codeSnippet) {
      setError('Please provide both error logs and code snippet')
      return
    }

    setLoading(true)

    try {
      const response = await api.analyzeIncident(payload)

      setResult(response.data)
      clearInputs(setLogText, setCodeSnippet)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to analyze incident. Please try again.'))
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    // Keep form reset in one place so success and manual clear behave identically.
    clearInputs(setLogText, setCodeSnippet)
    setError('')
    setResult(null)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="panel p-6 md:p-7 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Submit Incident Context</h2>
            <p className="text-sm text-slate-600 mt-1">Add full error logs and the code section around the failure.</p>
          </div>
          <span className="text-xs bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-1 rounded-full font-semibold">
            AI Analysis
          </span>
        </div>

        <LogInput value={logText} onChange={(e) => setLogText(e.target.value)} />
        <CodeInput value={codeSnippet} onChange={(e) => setCodeSnippet(e.target.value)} />

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 font-semibold">Analysis failed</p>
            <p className="text-red-700 text-sm mt-1 leading-relaxed">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="brand-button flex-1 py-3 px-4"
          >
            {loading ? 'Analyzing...' : 'Analyze Incident'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-6 bg-slate-100 text-slate-700 border border-slate-200 font-semibold py-3 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </form>

      {loading && <LoadingSpinner />}

      {result && (
        <div className="animate-fadeIn">
          <ResultPanel result={result} />
        </div>
      )}
    </div>
  )
}
