import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Heart, Loader2, CheckCircle2, XCircle, Send, Eye } from 'lucide-react';
import { adminService } from '../../utils/apiServices';
import { toast } from 'sonner';

type Donation = {
  id: number;
  amount: number;
  message?: string | null;
  status: 'pending' | 'approved' | 'distributed' | 'rejected';
  adminNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  distributedAt?: string | null;
  donor?: { id: number; name: string; email: string };
  creator?: { id: number; name: string; email: string };
  reviewer?: { id: number; name: string; email: string };
};

const statusLabels: Record<Donation['status'], string> = {
  pending: 'Pending',
  approved: 'Disetujui',
  distributed: 'Didistribusikan',
  rejected: 'Ditolak',
};

const statusClasses: Record<Donation['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  distributed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export function AdminDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const filteredDonations = useMemo(() => {
    if (statusFilter === 'all') return donations;
    return donations.filter((donation) => donation.status === statusFilter);
  }, [donations, statusFilter]);

  const pendingAmount = donations
    .filter((donation) => donation.status === 'pending')
    .reduce((total, donation) => total + Number(donation.amount || 0), 0);
  const distributedAmount = donations
    .filter((donation) => donation.status === 'distributed')
    .reduce((total, donation) => total + Number(donation.amount || 0), 0);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getDonations();
      setDonations(res.data || []);
    } catch (error) {
      console.error('Failed to fetch donations:', error);
      toast.error('Gagal memuat data donasi');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  };

  const handleAction = async (donation: Donation, action: 'approve' | 'reject' | 'distribute') => {
    setIsProcessing(true);
    try {
      await adminService.reviewDonation(donation.id, action, adminNote || undefined);
      toast.success('Status donasi berhasil diperbarui');
      setSelectedDonation(null);
      setAdminNote('');
      fetchDonations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses donasi');
    } finally {
      setIsProcessing(false);
    }
  };

  const openDonation = (donation: Donation) => {
    setSelectedDonation(donation);
    setAdminNote(donation.adminNote || '');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-md">
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Total Pengajuan</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{donations.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-md">
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Menunggu Distribusi</p>
            <p className="mt-2 text-2xl font-bold text-pink-700">Rp {pendingAmount.toLocaleString('id-ID')}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-md">
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Sudah Didistribusikan</p>
            <p className="mt-2 text-2xl font-bold text-green-700">Rp {distributedAmount.toLocaleString('id-ID')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-lg">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-green-800">Review Donasi Kreator</CardTitle>
            <CardDescription>Tinjau donasi pengguna sebelum didistribusikan ke kreator</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full rounded-xl sm:w-[190px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="distributed">Didistribusikan</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              <Heart className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p>Belum ada donasi untuk filter ini</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donatur</TableHead>
                  <TableHead>Kreator</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell>
                      <p className="font-medium text-gray-900">{donation.donor?.name || '-'}</p>
                      <p className="text-xs text-gray-500">{donation.donor?.email || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-gray-900">{donation.creator?.name || '-'}</p>
                      <p className="text-xs text-gray-500">{donation.creator?.email || '-'}</p>
                    </TableCell>
                    <TableCell className="font-semibold text-pink-700">
                      Rp {Number(donation.amount || 0).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>{formatDate(donation.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={statusClasses[donation.status]}>{statusLabels[donation.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openDonation(donation)}>
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedDonation} onOpenChange={(open) => !open && setSelectedDonation(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          {selectedDonation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Detail Donasi
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div className="grid gap-4 rounded-xl bg-pink-50 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase text-pink-600">Nominal</p>
                    <p className="font-bold text-pink-900">Rp {Number(selectedDonation.amount || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-pink-600">Donatur</p>
                    <p className="font-semibold text-gray-900">{selectedDonation.donor?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-pink-600">Kreator</p>
                    <p className="font-semibold text-gray-900">{selectedDonation.creator?.name || '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-gray-500">Pesan donatur</p>
                  <p className="rounded-xl border bg-white p-4 text-sm text-gray-700">
                    {selectedDonation.message || 'Tidak ada pesan.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Catatan admin</Label>
                  <Textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    placeholder="Catatan distribusi atau alasan penolakan..."
                    className="min-h-[100px] rounded-xl"
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  variant="outline"
                  className="rounded-xl text-red-700"
                  disabled={isProcessing || selectedDonation.status === 'distributed'}
                  onClick={() => handleAction(selectedDonation, 'reject')}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Tolak
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl text-blue-700"
                    disabled={isProcessing || selectedDonation.status === 'distributed'}
                    onClick={() => handleAction(selectedDonation, 'approve')}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Setujui
                  </Button>
                  <Button
                    className="rounded-xl bg-green-600 text-white hover:bg-green-700"
                    disabled={isProcessing || selectedDonation.status === 'distributed'}
                    onClick={() => handleAction(selectedDonation, 'distribute')}
                  >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Distribusikan
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
