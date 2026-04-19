import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Loader2, CheckCircle, XCircle, UserCheck, Eye, Image as ImageIcon } from 'lucide-react';
import { adminService } from '../../utils/apiServices';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

export function AdminUsers() {
  const [pendingCreators, setPendingCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingCreators();
  }, []);

  const fetchPendingCreators = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPendingCreators();
      setPendingCreators(res.data || []);
    } catch (error) {
      console.error('Failed to fetch pending creators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (userId: number, action: 'approve' | 'reject') => {
    try {
      await adminService.verifyCreator(userId, action);
      toast.success(action === 'approve' ? 'Kreator berhasil disetujui!' : 'Pengajuan ditolak.');
      fetchPendingCreators();
    } catch (error) {
      toast.error('Gagal memproses pengajuan');
    }
  };

  const ImagePreview = ({ url, label }: { url: string; label: string }) => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-green-400 transition-all">
          <img src={url} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Eye className="w-5 h-5 text-white" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-3xl overflow-hidden p-0">
        <DialogHeader className="p-4 bg-white border-b">
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="p-2 bg-gray-50 flex justify-center">
          <img src={url} alt={label} className="max-w-full max-h-[80vh] rounded-xl shadow-lg" />
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Card className="rounded-2xl shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-green-800">Manajemen Pengguna & Kreator</CardTitle>
        <CardDescription>Kelola, verifikasi, atau suspend akun pengguna</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        ) : pendingCreators.length === 0 ? (
          <div className="text-center py-10">
            <UserCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500">Tidak ada pengajuan kreator yang menunggu</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingCreators.map((creator) => (
              <div key={creator.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gradient-to-r from-green-50 to-orange-50 rounded-2xl gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-orange-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {(creator.name || '??').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold text-lg">{creator.name}</p>
                    <p className="text-sm text-gray-600">{creator.email}</p>
                    <Badge className="mt-2 bg-yellow-100 text-yellow-800 border-yellow-200">Menunggu Verifikasi</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Foto KTP
                    </span>
                    <ImagePreview url={creator.ktp_image} label={`KTP - ${creator.name}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Selfie KTP
                    </span>
                    <ImagePreview url={creator.selfie_ktp_image} label={`Selfie KTP - ${creator.name}`} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button size="lg" onClick={() => handleVerify(creator.id, 'approve')} className="rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-md">
                    <CheckCircle className="w-4 h-4 mr-2" /> Setujui
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => handleVerify(creator.id, 'reject')} className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 bg-white">
                    <XCircle className="w-4 h-4 mr-2" /> Tolak
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
