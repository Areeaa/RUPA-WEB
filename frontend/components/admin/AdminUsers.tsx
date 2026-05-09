import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Loader2, CheckCircle, XCircle, UserCheck, Eye, Image as ImageIcon, Shield, Mail, Plus } from 'lucide-react';
import { adminService } from '../../utils/apiServices';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

export function AdminUsers() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [adminForm, setAdminForm] = useState({ name: '', email: '' });
  const [pendingCreators, setPendingCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [resettingAdminId, setResettingAdminId] = useState<number | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [adminsRes, creatorsRes] = await Promise.all([
        adminService.getAdmins(),
        adminService.getPendingCreators(),
      ]);

      setAdmins(adminsRes.data || []);
      setPendingCreators(creatorsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch admin users data:', error);
      toast.error('Gagal memuat data admin dan kreator');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!adminForm.name.trim() || !adminForm.email.trim()) {
      toast.error('Nama dan email admin wajib diisi');
      return;
    }

    setIsCreatingAdmin(true);
    try {
      await adminService.createAdmin({
        name: adminForm.name.trim(),
        email: adminForm.email.trim(),
      });
      toast.success('Admin baru dibuat. Email pengaturan password telah dikirim.');
      setAdminForm({ name: '', email: '' });
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat admin baru');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleSendPasswordReset = async (adminId: number) => {
    setResettingAdminId(adminId);
    try {
      await adminService.sendAdminPasswordReset(adminId);
      toast.success('Email ganti password admin berhasil dikirim');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengirim email ganti password');
    } finally {
      setResettingAdminId(null);
    }
  };

  const handleVerify = async (userId: number, action: 'approve' | 'reject') => {
    try {
      await adminService.verifyCreator(userId, action);
      toast.success(action === 'approve' ? 'Kreator berhasil disetujui!' : 'Pengajuan ditolak.');
      fetchAdminData();
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
    <div className="space-y-6">
      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-green-800">Manajemen Admin</CardTitle>
          <CardDescription>Tambah admin baru dan kirim email pengaturan password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleCreateAdmin} className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Nama Admin</Label>
              <Input
                id="admin-name"
                value={adminForm.name}
                onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })}
                placeholder="Nama lengkap"
                className="rounded-xl bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email Admin</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminForm.email}
                onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })}
                placeholder="admin@rupa.id"
                className="rounded-xl bg-white"
              />
            </div>
            <Button type="submit" disabled={isCreatingAdmin} className="h-10 rounded-xl bg-green-600 text-white hover:bg-green-700">
              {isCreatingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Tambah
            </Button>
          </form>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : admins.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Shield className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p>Belum ada data admin</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
                          {(admin.name || 'AD').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{admin.name}</p>
                          <Badge className="mt-1 bg-emerald-100 text-emerald-800">Admin</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>{new Date(admin.createdAt).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        disabled={resettingAdminId === admin.id}
                        onClick={() => handleSendPasswordReset(admin.id)}
                      >
                        {resettingAdminId === admin.id ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-3.5 w-3.5" />
                        )}
                        Kirim Email Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-green-800">Manajemen Pengguna & Kreator</CardTitle>
          <CardDescription>Kelola dan verifikasi pengajuan kreator</CardDescription>
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
    </div>
  );
}
