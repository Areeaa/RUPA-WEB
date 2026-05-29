import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { CheckCircle2, CheckCircle, FileText, Loader2, XCircle, Eye, CreditCard, Clock, Ban, ShieldCheck } from 'lucide-react';
import { adminService } from '../../utils/apiServices';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved_pending_payment: { label: 'Menunggu Bayar', color: 'bg-blue-100 text-blue-800', icon: CreditCard },
  waiting_verification: { label: 'Verifikasi Bayar', color: 'bg-orange-100 text-orange-800', icon: Eye },
  active: { label: 'Aktif', color: 'bg-green-100 text-green-800', icon: ShieldCheck },
  payment_rejected: { label: 'Bayar Ditolak', color: 'bg-red-100 text-red-800', icon: Ban },
  rejected: { label: 'Ditolak', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

const TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved_pending_payment', label: 'Menunggu Bayar' },
  { key: 'waiting_verification', label: 'Verifikasi Bayar' },
  { key: 'active', label: 'Aktif' },
  { key: 'rejected', label: 'Ditolak' },
];

export function AdminLicenses() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Approve modal state
  const [approveModal, setApproveModal] = useState<{ open: boolean; license: any | null }>({ open: false, license: null });
  const [approveForm, setApproveForm] = useState({ admin_fee: '', admin_note: '' });
  const [isApproving, setIsApproving] = useState(false);

  // Detail modal state
  const [detailModal, setDetailModal] = useState<{ open: boolean; license: any | null }>({ open: false, license: null });

  // Payment verification modal
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; license: any | null }>({ open: false, license: null });
  const [paymentNote, setPaymentNote] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => { fetchLicenses(); }, [activeTab]);

  const fetchLicenses = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getAllLicenses(activeTab === 'all' ? undefined : activeTab);
      setLicenses(res.data || []);
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Yakin ingin menolak pengajuan ini?')) return;
    try {
      await adminService.verifyLicense(id, 'reject', { admin_note: 'Pengajuan ditolak oleh admin.' });
      toast.success('Pengajuan lisensi ditolak.');
      fetchLicenses();
    } catch { toast.error('Gagal menolak pengajuan.'); }
  };

  const openApproveModal = (license: any) => {
    setApproveForm({ admin_fee: '', admin_note: '' });
    setApproveModal({ open: true, license });
  };

  const handleApproveSubmit = async () => {
    const fee = Number(approveForm.admin_fee);
    if (!fee || fee < 1000) {
      toast.error('Biaya lisensi minimal Rp 1.000!');
      return;
    }
    setIsApproving(true);
    try {
      await adminService.verifyLicense(approveModal.license.id, 'approve', {
        admin_fee: fee,
        admin_note: approveForm.admin_note || undefined,
      });
      toast.success('Pengajuan disetujui! Tagihan dikirim ke pengaju.');
      setApproveModal({ open: false, license: null });
      fetchLicenses();
    } catch { toast.error('Gagal menyetujui pengajuan.'); }
    finally { setIsApproving(false); }
  };

  const openPaymentModal = (license: any) => {
    setPaymentNote('');
    setPaymentModal({ open: true, license });
  };

  const handlePaymentVerify = async (action: 'approve' | 'reject') => {
    setIsVerifying(true);
    try {
      await adminService.verifyLicensePayment(paymentModal.license.id, action, paymentNote || undefined);
      toast.success(action === 'approve' ? 'Pembayaran diverifikasi! Lisensi aktif.' : 'Bukti pembayaran ditolak.');
      setPaymentModal({ open: false, license: null });
      fetchLicenses();
    } catch { toast.error('Gagal memverifikasi pembayaran.'); }
    finally { setIsVerifying(false); }
  };

  const formatRupiah = (num: number) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
    const Icon = cfg.icon;
    return (
      <Badge className={`${cfg.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" /> {cfg.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200 rounded-xl">
        <FileText className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Kelola semua pengajuan lisensi. Rekening pembayaran tetap: <strong>BNI 1859488855 a.n Fauzan Fadlullah</strong>
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => (
          <Button
            key={tab.key}
            size="sm"
            variant={activeTab === tab.key ? 'default' : 'outline'}
            className={`rounded-lg ${activeTab === tab.key ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-green-800">License Application Reports</CardTitle>
          <CardDescription>Daftar pengajuan lisensi — {TABS.find(t => t.key === activeTab)?.label}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : licenses.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Tidak ada pengajuan lisensi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pemohon</TableHead>
                    <TableHead>Nama Karya</TableHead>
                    <TableHead>Jenis / Durasi</TableHead>
                    <TableHead>Tagihan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((app: any) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{app.pemohon?.name || app.nama_pengaju || '-'}</p>
                          <p className="text-xs text-gray-500">{app.pemohon?.email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>{app.nama_karya || '-'}</TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-800">
                          {app.jenis_lisensi || '-'} / {app.durasi || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.admin_fee ? formatRupiah(app.admin_fee) : '-'}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {/* Pending: Approve + Reject */}
                          {app.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => openApproveModal(app)} className="rounded-lg bg-green-500 hover:bg-green-600 text-white">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleReject(app.id)} className="rounded-lg text-red-600">
                                Reject
                              </Button>
                            </>
                          )}
                          {/* Waiting verification: verify payment */}
                          {app.status === 'waiting_verification' && (
                            <Button size="sm" onClick={() => openPaymentModal(app)} className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
                              <Eye className="w-3 h-3 mr-1" /> Verifikasi Bayar
                            </Button>
                          )}
                          {/* Active badge */}
                          {app.status === 'active' && (
                            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Lisensi Aktif
                            </Badge>
                          )}
                          {/* Detail button for all */}
                          <Button size="sm" variant="outline" onClick={() => setDetailModal({ open: true, license: app })} className="rounded-lg">
                            <Eye className="w-3 h-3 mr-1" /> Detail
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== APPROVE MODAL ===== */}
      <Dialog open={approveModal.open} onOpenChange={(v) => !v && setApproveModal({ open: false, license: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setujui & Kirim Tagihan</DialogTitle>
            <DialogDescription>
              Pengajuan: <strong>{approveModal.license?.nama_karya}</strong> oleh {approveModal.license?.pemohon?.name || approveModal.license?.nama_pengaju}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              <p className="font-semibold mb-1">Rekening Pembayaran (Fixed):</p>
              <p>🏦 BNI — 1859488855</p>
              <p>a.n <strong>Fauzan Fadlullah</strong></p>
            </div>
            <div className="space-y-2">
              <Label>Biaya Lisensi (Rp) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                placeholder="Contoh: 2500000"
                value={approveForm.admin_fee}
                onChange={(e) => setApproveForm({ ...approveForm, admin_fee: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan Admin (Opsional)</Label>
              <Textarea
                placeholder="Instruksi tambahan untuk pengaju..."
                value={approveForm.admin_note}
                onChange={(e) => setApproveForm({ ...approveForm, admin_note: e.target.value })}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModal({ open: false, license: null })}>Batal</Button>
            <Button onClick={handleApproveSubmit} disabled={isApproving} className="bg-green-600 hover:bg-green-700 text-white">
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
              Setujui & Kirim Tagihan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== PAYMENT VERIFICATION MODAL ===== */}
      <Dialog open={paymentModal.open} onOpenChange={(v) => !v && setPaymentModal({ open: false, license: null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Verifikasi Bukti Pembayaran</DialogTitle>
            <DialogDescription>
              {paymentModal.license?.nama_karya} — Tagihan: {formatRupiah(paymentModal.license?.admin_fee)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {paymentModal.license?.payment_proof && (
              <div className="space-y-2">
                <Label className="font-semibold">Bukti Pembayaran:</Label>
                <a href={paymentModal.license.payment_proof} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={paymentModal.license.payment_proof}
                    alt="Bukti Bayar"
                    className="max-h-64 rounded-xl border object-contain w-full bg-gray-50"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <p className="text-blue-600 text-sm mt-1 underline">Buka di tab baru →</p>
                </a>
              </div>
            )}
            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                placeholder="Alasan jika ditolak..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => handlePaymentVerify('reject')} disabled={isVerifying} className="text-red-600 border-red-200">
              <XCircle className="w-4 h-4 mr-1" /> Tolak
            </Button>
            <Button onClick={() => handlePaymentVerify('approve')} disabled={isVerifying} className="bg-green-600 hover:bg-green-700 text-white">
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Verifikasi Valid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DETAIL MODAL ===== */}
      <Dialog open={detailModal.open} onOpenChange={(v) => !v && setDetailModal({ open: false, license: null })}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan Lisensi</DialogTitle>
          </DialogHeader>
          {detailModal.license && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">Nama Karya:</span><p className="font-semibold">{detailModal.license.nama_karya}</p></div>
                <div><span className="text-gray-500">Pengaju:</span><p className="font-semibold">{detailModal.license.pemohon?.name || detailModal.license.nama_pengaju}</p></div>
                <div><span className="text-gray-500">Jenis Lisensi:</span><p>{detailModal.license.jenis_lisensi}</p></div>
                <div><span className="text-gray-500">Durasi:</span><p>{detailModal.license.durasi}</p></div>
                <div className="col-span-2"><span className="text-gray-500">Tujuan:</span><p>{detailModal.license.tujuan}</p></div>
                <div className="col-span-2"><span className="text-gray-500">Deskripsi:</span><p>{detailModal.license.deskripsi_karya}</p></div>
              </div>
              <hr />
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">Status:</span>{getStatusBadge(detailModal.license.status)}</div>
                <div><span className="text-gray-500">Tagihan:</span><p className="font-semibold">{detailModal.license.admin_fee ? formatRupiah(detailModal.license.admin_fee) : '-'}</p></div>
              </div>
              {detailModal.license.admin_note && (
                <div><span className="text-gray-500">Catatan Admin:</span><p className="bg-gray-50 p-2 rounded">{detailModal.license.admin_note}</p></div>
              )}
              {detailModal.license.payment_proof && (
                <div>
                  <span className="text-gray-500">Bukti Bayar:</span>
                  <a href={detailModal.license.payment_proof} target="_blank" rel="noopener noreferrer">
                    <img src={detailModal.license.payment_proof} alt="Bukti" className="max-h-48 rounded-lg border mt-1 object-contain bg-gray-50" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </a>
                </div>
              )}
              <div className="text-xs text-gray-400 space-y-1">
                <p>Diajukan: {new Date(detailModal.license.createdAt).toLocaleString('id-ID')}</p>
                {detailModal.license.approved_at && <p>Disetujui: {new Date(detailModal.license.approved_at).toLocaleString('id-ID')}</p>}
                {detailModal.license.payment_proof_at && <p>Bukti diupload: {new Date(detailModal.license.payment_proof_at).toLocaleString('id-ID')}</p>}
                {detailModal.license.verified_at && <p>Terverifikasi: {new Date(detailModal.license.verified_at).toLocaleString('id-ID')}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
