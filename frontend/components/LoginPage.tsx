import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Sparkles, Lock, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

const GOOGLE_CLIENT_ID = '24822636459-0nl718o3a8agpthdnekoji3rpniq6mvs.apps.googleusercontent.com';

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const [userForm, setUserForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(userForm);
      navigate('/');
    } catch (error) {
      // Error handled in context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Sign-In callback
  const handleGoogleCallback = useCallback(async (response: any) => {
    try {
      await googleLogin(response.credential);
      navigate('/');
    } catch (error) {
      // Error handled in context
    }
  }, [googleLogin, navigate]);

  // Initialize Google Sign-In
  useEffect(() => {
    const initGoogle = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { 
            theme: 'outline', 
            size: 'large', 
            width: '100%',
            text: 'continue_with',
            shape: 'pill',
          }
        );
      }
    };

    // Check if script already loaded
    if ((window as any).google?.accounts?.id) {
      initGoogle();
    } else {
      // Wait for script to load
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(timer);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(timer);
    }
  }, [handleGoogleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm relative">
        <button 
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 text-gray-400 hover:text-green-600 transition-colors flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <CardHeader className="text-center space-y-2 mt-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-orange-400 flex items-center justify-center shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-green-800 text-2xl">Masuk ke RUPA</CardTitle>
          <CardDescription className="text-orange-700">
            Lanjutkan perjalananmu mencari karya anak bangsa
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUserLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  className="pl-10 rounded-xl bg-white/50 border-gray-200 focus:border-green-500 transition-all"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="user-password"
                  type="password"
                  placeholder="Masukkan Password"
                  className="pl-10 rounded-xl border-gray-200"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white shadow-lg"
            >
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 px-2 text-gray-500">atau lanjutkan dengan</span>
            </div>
          </div>

          {/* Google Sign-In Button rendered by Google SDK */}
          <div id="google-signin-btn" className="flex justify-center"></div>
          
          {/* Fallback button if Google SDK not loaded */}
          <noscript>
            <Button type="button" variant="outline" className="w-full rounded-xl border-gray-300 hover:bg-gray-50 text-gray-700 mt-2">
              <GoogleIcon />
              Google
            </Button>
          </noscript>

          <div className="text-center pt-6">
            <p className="text-sm text-gray-600">
              Belum punya akun?{' '}
              <button onClick={() => navigate('/signup')} className="text-green-600 font-semibold hover:text-green-700 hover:underline">
                Daftar sekarang
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}