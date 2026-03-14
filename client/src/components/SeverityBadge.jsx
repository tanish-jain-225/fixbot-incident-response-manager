import { normalizeSeverity } from '../utils/severity'

export default function SeverityBadge({ severity }) {
  const severityConfig = {
    Critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    Warning: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    Minor: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  }

  const normalizedSeverity = normalizeSeverity(severity)
  const config = severityConfig[normalizedSeverity] || severityConfig.Minor

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border border-current/10 ${config.bg} ${config.text} font-semibold text-xs md:text-sm`}>
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      <span>{normalizedSeverity}</span>
    </span>
  )
}
