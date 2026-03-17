const PAGE_HOME = 'home'
const PAGE_HISTORY = 'history'

function getNavButtonClass(isActive, isAuthenticated) {
  return `px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
    isActive
      ? 'bg-cyan-600 text-white'
      : 'text-slate-700 hover:bg-white'
  } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}`
}

export default function Header({ currentPage, setCurrentPage, user, onLogout }) {
  const isAuthenticated = Boolean(user)

  return (
    <header className="pt-4 md:pt-6">
      <div className="container mx-auto px-4">
        <div className="glass rounded-2xl px-4 py-4 md:px-6 md:py-5 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
              <img
                src="/support.ico"
                alt="FixBot logo"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">FixBot Console</h1>
              <p className="text-sm text-slate-600">
                {isAuthenticated
                  ? 'AI incident analysis with account-scoped history'
                  : 'Sign in to start analyzing incidents'}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 w-fit">
              {isAuthenticated ? user?.email : 'Not signed in'}
            </p>
            <nav className="flex gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => isAuthenticated && setCurrentPage(PAGE_HOME)}
                disabled={!isAuthenticated}
                className={getNavButtonClass(currentPage === PAGE_HOME, isAuthenticated)}
              >
                Analyze
              </button>
              <button
                onClick={() => isAuthenticated && setCurrentPage(PAGE_HISTORY)}
                disabled={!isAuthenticated}
                className={getNavButtonClass(currentPage === PAGE_HISTORY, isAuthenticated)}
              >
                History
              </button>
            </nav>
            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-lg font-semibold text-sm text-slate-700 border border-slate-200 hover:bg-white transition-colors"
              >
                Logout
              </button>
            ) : (
              <span className="px-4 py-2 rounded-lg font-semibold text-sm text-cyan-700 border border-cyan-200 bg-cyan-50">
                Login / Signup
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
