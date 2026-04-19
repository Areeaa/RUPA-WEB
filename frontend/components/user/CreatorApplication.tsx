import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Upload, FileCheck, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../utils/apiServices';
import type { UserData } from '../../types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type CreatorApplicationProps = {
  userData: UserData;
  onApplicationSuccess: () => void;
};

export function CreatorApplication({ userData, onApplicationSuccess }: CreatorApplicationProps) {
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ktpInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const themeColors: Record<string, { primary: string; light: string; secondary: string }> = {
    green: { primary: '#16a34a', light: '#22c55e', secondary: '#4ade80' },
    orange: { primary: '#ea580c', light: '#f97316', secondary: '#fb923c' },
    blue: { primary: '#2563eb', light: '#3b82f6', secondary: '#60a5fa' },
  };
  const currentTheme = themeColors[userData.themeColor || 'green'] || themeColors.green;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ktpFile || !selfieFile) {
      toast.error('Mohon unggah Foto KTP dan Foto Selfie dengan KTP!');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ktp_image', ktpFile);
      formData.append('selfie_image', selfieFile);

      await authService.applyForCreator(formData);
      toast.success('Pengajuan berhasil dikirim! Menunggu persetujuan admin.');
      onApplicationSuccess();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal mengirim pengajuan';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userData.creator_status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Alert className="bg-yellow-50 border-yellow-200">
          <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
          <AlertTitle className="text-yellow-800 font-bold ml-2">Pengajuan Sedang Diproses</AlertTitle>
          <AlertDescription className="text-yellow-700 ml-2 mt-1">
            Terima kasih telah mendaftar sebagai Kreator RUPA. Admin kami sedang meninjau dokumen Anda. Mohon tunggu maksimal 2x24 jam kerja.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {userData.creator_status === 'rejected' && (
        <Alert className="bg-red-50 border-red-200 mb-6">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 font-bold ml-2">Pengajuan Ditolak</AlertTitle>
          <AlertDescription className="text-red-700 ml-2 mt-1">
            Mohon maaf, pengajuan kreator Anda sebelumnya ditolak. Silakan ajukan kembali dengan dokumen yang lebih jelas dan valid.
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-3xl shadow-xl border-0 overflow-hidden bg-white">
        <div className="h-32 text-white p-8" style={{ backgroundImage: `linear-gradient(to right, ${currentTheme.light}, ${currentTheme.secondary})` }}>
          <h2 className="text-3xl font-bold">Menjadi Kreator RUPA</h2>
          <p className="mt-2 text-white/90">Bagikan karya terbaikmu dan jadilah bagian dari revolusi ekonomi kreatif.</p>
        </div>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* KTP Upload */}
              <div className="space-y-4">
                <Label className="text-base font-semibold text-gray-800">Foto KTP Asli</Label>
                <p className="text-sm text-gray-500">Pastikan seluruh bagian KTP terlihat jelas, tidak terpotong, dan tulisan terbaca.</p>
                <div 
                  onClick={() => ktpInputRef.current?.click()}
                  className={`h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${ktpFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  {ktpFile ? (
                    <div className="text-center text-green-600">
                      <FileCheck className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-medium">{ktpFile.name}</p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                      <p className="font-medium">Klik untuk unggah KTP</p>
                      <p className="text-xs mt-1">Format: JPG, PNG (Maks. 5MB)</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={ktpInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => setKtpFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* Selfie with KTP Upload */}
              <div className="space-y-4">
                <Label className="text-base font-semibold text-gray-800">Selfie dengan KTP</Label>
                <p className="text-sm text-gray-500">Pegang KTP Anda di dekat wajah. Pastikan wajah dan KTP terlihat jelas.</p>
                <div 
                  onClick={() => selfieInputRef.current?.click()}
                  className={`h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${selfieFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  {selfieFile ? (
                    <div className="text-center text-green-600">
                      <FileCheck className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-medium">{selfieFile.name}</p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                      <p className="font-medium">Klik untuk unggah Selfie</p>
                      <p className="text-xs mt-1">Format: JPG, PNG (Maks. 5MB)</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={selfieInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-6 text-lg font-bold rounded-2xl shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ backgroundImage: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.light})`, color: 'white' }}
              disabled={isSubmitting || !ktpFile || !selfieFile}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" /> Sedang Mengirim...
                </>
              ) : 'Kirim Pengajuan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
