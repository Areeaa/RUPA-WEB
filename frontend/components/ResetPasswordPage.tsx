import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { authService } from '../utils/apiServices';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, LockKeyhole } from 'lucide-react';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.success('Password berhasil diperbarui. Silakan login kembali.');
      navigate('/adminlogin');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md border-0 bg-slate-800 text-white shadow-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-600 bg-slate-700">
              <LockKeyhole className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-emerald-400">Atur Password Baru</CardTitle>
          <CardDescription className="text-slate-400">
            Masukkan password baru untuk akun RUPA Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-slate-300">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="rounded-xl border-slate-700 bg-slate-900 text-white"
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
                className="rounded-xl border-slate-700 bg-slate-900 text-white"
                placeholder="Ulangi password baru"
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Simpan Password'}
            </Button>
          </form>
          <button
            onClick={() => navigate('/adminlogin')}
            className="mt-6 flex w-full items-center justify-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Login Admin
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
