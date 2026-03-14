export default function LogInput({ value, onChange, placeholder = "Paste your error logs here..." }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        Error Logs
        <span className="text-red-500 ml-1">*</span>
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="panel-input h-36 resize-y font-mono text-sm"
      />
      <p className="text-xs text-slate-500">Include full error messages and stack traces for best results.</p>
    </div>
  )
}
