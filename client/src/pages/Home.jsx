import AnalysisForm from '../components/AnalysisForm'

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="panel p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-8 w-32 h-32 rounded-full bg-cyan-100 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-orange-100 blur-2xl" />
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 font-semibold mb-3">Production Incident Studio</p>
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-3 leading-tight">
          Debug Faster,
          <span className="text-cyan-700"> ship calmer.</span>
        </h2>
        <p className="text-base md:text-lg text-slate-600 max-w-3xl">
          Paste your logs and code, get AI root cause analysis, fix strategy, and confidence scoring in one clean workflow.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-slate-700">Email-aware history</span>
          <span className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-slate-700">Severity classification</span>
          <span className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-slate-700">Copy-ready remediation</span>
        </div>
      </div>

      {/* Analysis Form */}
      <AnalysisForm />

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="panel p-5">
          <p className="text-cyan-700 text-xs uppercase tracking-wider font-bold">Root Cause</p>
          <h3 className="font-bold text-slate-800 text-lg mt-1">Signal From Noise</h3>
          <p className="text-sm text-slate-600 mt-2">AI isolates the likely break-point from stack traces and surrounding code context.</p>
        </div>
        <div className="panel p-5">
          <p className="text-orange-700 text-xs uppercase tracking-wider font-bold">Remediation</p>
          <h3 className="font-bold text-slate-800 text-lg mt-1">Practical Fixes</h3>
          <p className="text-sm text-slate-600 mt-2">Get direct, actionable fix snippets and strategy notes you can test immediately.</p>
        </div>
        <div className="panel p-5">
          <p className="text-emerald-700 text-xs uppercase tracking-wider font-bold">Decision</p>
          <h3 className="font-bold text-slate-800 text-lg mt-1">Confidence Meter</h3>
          <p className="text-sm text-slate-600 mt-2">Understand certainty at a glance before rolling fixes into production.</p>
        </div>
      </div>
    </div>
  )
}
