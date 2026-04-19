import { Routes, Route, Navigate } from 'react-router-dom';
import { SignUpPage } from './components/SignUpPage';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginPage } from './components/AdminLoginPage';
import { UserDashboard } from './components/UserDashboard';
import { Toaster } from './components/ui/sonner';
import { useAuth } from './hooks/useAuth';
import { THEME_COLORS } from './data/constants';

export default function App() {
  const { authState, isLoading, manualAdminLogin, logout, updateUser } = useAuth();
  const { isAuthenticated, userType, userData } = authState;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Protect admin routes
  const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated || userType !== 'admin') {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  const currentTheme = userData?.themeColor 
    ? THEME_COLORS[userData.themeColor as keyof typeof THEME_COLORS] || THEME_COLORS.green
    : THEME_COLORS.green;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-orange-50"
      style={{
        '--theme-primary': currentTheme.primary,
        '--theme-secondary': currentTheme.secondary,
        '--theme-light': currentTheme.light,
      } as React.CSSProperties}
    >
      <Routes>
        {/* Public / Guest / User Route */}
        <Route 
          path="/" 
          element={
            <UserDashboard 
              isGuest={!isAuthenticated} 
            />
          } 
        />
        
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          } 
        />
        <Route 
          path="/signup" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <SignUpPage />
          } 
        />

        <Route 
          path="/adminlogin" 
          element={
            isAuthenticated && userType === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : (
              <AdminLoginPage 
                onBackToGuest={() => window.location.href = '/'}
              />
            )
          } 
        />

        {/* Admin Route */}
        <Route 
          path="/admin" 
          element={
            <RequireAdmin>
              <AdminDashboard onLogout={logout} adminData={userData || undefined} />
            </RequireAdmin>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <Toaster />
    </div>
  );
}