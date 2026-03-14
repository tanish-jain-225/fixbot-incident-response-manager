import { useEffect, useState } from 'react'
import api from '../services/api'
import LoadingSpinner from './LoadingSpinner'
import SeverityBadge from './SeverityBadge'
import { getErrorMessage } from '../utils/errors'
import { normalizeSeverity, SEVERITY_LEVELS } from '../utils/severity'

const ALL_FILTER = 'All'

export default function IncidentHistory() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState(ALL_FILTER)

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.getIncidents()
      setIncidents(response.data?.data || [])
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load incident history. Please try again.'))
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredIncidents = incidents.filter(
    (incident) => filter === ALL_FILTER || normalizeSeverity(incident.severity) === filter
  )

  const handleClearAll = async () => {
    const confirmed = window.confirm('Clear all incident history for your account?')
    if (!confirmed) return

    setClearing(true)
    setError('')

    try {
      await api.clearIncidents()
      setIncidents([])
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to clear incident history. Please try again.'))
      console.error('Clear history error:', err)
    } finally {
      setClearing(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-semibold">⚠️ {error}</p>
      </div>
    )
  }

  return (
    <div className="panel p-6 md:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-2xl font-bold text-slate-900">Incident History</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchIncidents}
            className="brand-button px-4 py-2.5 text-sm"
            disabled={clearing}
          >
            Refresh
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2.5 text-sm rounded-xl font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={clearing || incidents.length === 0}
          >
            {clearing ? 'Clearing...' : 'Clear All'}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[ALL_FILTER, ...SEVERITY_LEVELS].map((severity) => (
          <button
            key={severity}
            onClick={() => setFilter(severity)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors border ${
              filter === severity
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {severity}
          </button>
        ))}
      </div>

      {/* Flex list */}
      {filteredIncidents.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredIncidents.map((incident) => (
            <article
              key={incident._id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 md:p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <SeverityBadge severity={incident.severity} />
                  <span className="text-xs md:text-sm text-slate-500">
                    {new Date(incident.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Confidence</span>
                  <span className="font-bold text-slate-800">{incident.confidenceScore}%</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-wide text-slate-500">Root cause</p>
                <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                  {incident.rootCause || 'No root cause available'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
                <span className="truncate">Incident ID: {incident._id}</span>
                <span className="truncate">Email: {incident.userEmail || 'Not available'}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <p>No incidents found</p>
        </div>
      )}
    </div>
  )
}
