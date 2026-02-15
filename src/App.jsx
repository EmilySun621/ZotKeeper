import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import SearchPage from './pages/SearchPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <AuthProvider>
      <div className="app-bg relative min-h-screen font-sans">
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="recipe/:id" element={<RecipeDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="login" element={<LoginPage />} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  )
}
