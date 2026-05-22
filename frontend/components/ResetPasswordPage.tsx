import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { authService } from '../utils/apiServices';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, LockKeyhole, CheckCircle2 } from 'lucide-react';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast.error('Token reset password tidak ditemukan');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak sama');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(token, newPassword);
      toast.success('Password berhasil diperbarui!');
      setIsSuccess(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-0 bg-slate-800/90 backdrop-blur-sm text-white shadow-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full border shadow-lg transition-all duration-500 ${
              isSuccess 
                ? 'border-emerald-400 bg-emerald-600/20' 
                : 'border-slate-600 bg-slate-700'
            }`}>
              {isSuccess ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-400 animate-in fade-in zoom-in" />
              ) : (
                <LockKeyhole className="h-8 w-8 text-emerald-400" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl text-emerald-400">
            {isSuccess ? 'Password Diperbarui!' : 'Atur Password Baru'}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {isSuccess
              ? 'Password Anda telah berhasil diubah. Silakan login dengan password baru.'
              : 'Masukkan password baru untuk akun RUPA Anda.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            /* === SUCCESS STATE === */
            <div className="space-y-4">
              <Button
                onClick={() => navigate('/login')}
                className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Masuk sebagai User
              </Button>
              <Button
                onClick={() => navigate('/adminlogin')}
                variant="outline"
                className="w-full rounded-xl border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Masuk sebagai Admin
              </Button>
            </div>
          ) : (
            /* === RESET FORM === */
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-slate-300">Password Baru</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="rounded-xl border-slate-700 bg-slate-900 text-white focus:border-emerald-400 focus:ring-emerald-400"
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-slate-300">Konfirmasi Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="rounded-xl border-slate-700 bg-slate-900 text-white focus:border-emerald-400 focus:ring-emerald-400"
                    placeholder="Ulangi password baru"
                    required
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Simpan Password'}
                </Button>
              </form>
              <button
                onClick={() => navigate('/login')}
                className="mt-6 flex w-full items-center justify-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Login
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
