import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Sparkles, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

const GOOGLE_CLIENT_ID = '24822636459-0nl718o3a8agpthdnekoji3rpniq6mvs.apps.googleusercontent.com';

export function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, googleLogin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Password tidak cocok!');
      return;
    }

    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Mohon lengkapi semua field!');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
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
          document.getElementById('google-signup-btn'),
          { 
            theme: 'outline', 
            size: 'large', 
            width: '100%',
            text: 'signup_with',
            shape: 'pill',
          }
        );
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGoogle();
    } else {
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
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-orange-400 flex items-center justify-center shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-green-800">Bergabung dengan RUPA</CardTitle>
          <CardDescription className="text-orange-700">
            Ruang Unggulan Para Anak Bangsa
          </CardDescription>
          <p className="text-sm text-gray-600">
            Platform untuk karya inovasi sosial & lingkungan anak Indonesia
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  className="pl-10 rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="pl-10 rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  className="pl-10 rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">Konfirmasi Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Konfirmasi password"
                  className="pl-10 rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white shadow-lg"
            >
              {isSubmitting ? 'Mendaftar...' : 'Daftar Sekarang'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Atau daftar dengan</span>
            </div>
          </div>

          {/* Google Sign-Up Button */}
          <div id="google-signup-btn" className="flex justify-center"></div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-green-600 hover:text-green-700 hover:underline"
              >
                Masuk di sini
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
