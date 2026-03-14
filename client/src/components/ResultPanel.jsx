import { useState } from 'react'
import SeverityBadge from './SeverityBadge'
import { normalizeSeverity } from '../utils/severity'

function getCopyableResultText(result) {
  return `Root Cause: ${result.rootCause}\n\nFix:\n${result.suggestedFix}\n\nExplanation: ${result.explanation}`
}

function getConfidenceWidth(score) {
  return `${score}%`
}

export default function ResultPanel({ result }) {
  const [copied, setCopied] = useState(false)
  const severity = normalizeSeverity(result.severity)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getCopyableResultText(result))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6 fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Analysis Results</h2>

      {/* Severity */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Severity Level</h3>
        <SeverityBadge severity={severity} />
      </div>

      {/* Root Cause */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Root Cause</h3>
        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">
          {result.rootCause}
        </p>
      </div>

      {/* Suggested Fix */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Suggested Fix</h3>
        <pre className="rounded-lg overflow-auto">
          <code>{result.suggestedFix}</code>
        </pre>
      </div>

      {/* Explanation */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Fix Strategy</h3>
        <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200 leading-relaxed">
          {result.explanation}
        </p>
      </div>

      {/* Confidence Score */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Confidence Score</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-500"
              style={{ width: getConfidenceWidth(result.confidenceScore) }}
            ></div>
          </div>
          <span className="text-2xl font-bold text-gray-800">{result.confidenceScore}%</span>
        </div>
      </div>

      {/* Copy to Clipboard */}
      <button
        onClick={handleCopy}
        className="w-full mt-4 bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        Copy Results
      </button>

      {copied && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          Results copied to clipboard.
        </p>
      )}
    </div>
  )
}
