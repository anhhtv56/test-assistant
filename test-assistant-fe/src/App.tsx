import { Routes, Route, useLocation, Link, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GeneratePage from './pages/GeneratePage'
import DashboardPage from './pages/DashboardPage'

function PrivateRoute({ children }: { children: React.JSX.Element }) {
  const token = true;
  if (token) {
    return children;
  } else {
    return <Navigate to="/login" replace />;
  }
}

function Layout({ children }: { children: React.JSX.Element }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  if (isAuthPage) {
    return children;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SDETPRO Test Assistant
              </h1>
            </div>

            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Generate
              </Link>
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/dashboard'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Dashboard
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                user@example.com
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function App() {


  return (
    <div>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={
          <Layout>
            <PrivateRoute>
              <GeneratePage />
            </PrivateRoute>
          </Layout>
        } />
        <Route path="/dashboard" element={
          <Layout>
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          </Layout>
        } />
      </Routes>
    </div>
  )
}

export default App
