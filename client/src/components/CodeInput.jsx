export default function CodeInput({ value, onChange, placeholder = "Paste the relevant code snippet here..." }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        Code Snippet
        <span className="text-red-500 ml-1">*</span>
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="panel-input h-36 resize-y font-mono text-sm"
      />
      <p className="text-xs text-slate-500">Include the exact code region related to the failing stack frame.</p>
    </div>
  )
}
