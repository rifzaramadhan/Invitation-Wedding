import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Public pages
import InvitationPage from './pages/public/InvitationPage'

// Admin pages
import LoginPage from './pages/admin/LoginPage'
import RegisterPage from './pages/admin/RegisterPage'
import DashboardPage from './pages/admin/DashboardPage'
import WeddingFormPage from './pages/admin/WeddingFormPage'
import GuestListPage from './pages/admin/GuestListPage'
import WishesPage from './pages/admin/WishesPage'

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />
    }

    return <>{children}</>
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Admin routes */}
                <Route path="/admin/login" element={<LoginPage />} />
                <Route path="/admin/register" element={<RegisterPage />} />
                <Route path="/admin" element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/wedding/new" element={
                    <ProtectedRoute>
                        <WeddingFormPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/wedding/:id" element={
                    <ProtectedRoute>
                        <WeddingFormPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/wedding/:id/guests" element={
                    <ProtectedRoute>
                        <GuestListPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin/wedding/:id/wishes" element={
                    <ProtectedRoute>
                        <WishesPage />
                    </ProtectedRoute>
                } />

                {/* Public invitation routes */}
                <Route path="/:slug" element={<InvitationPage />} />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/admin" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
