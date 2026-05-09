import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertTriangle, CheckCircle2, Eye, Flag, Loader2, ShieldOff, ShieldCheck, XCircle } from 'lucide-react';
import { adminService } from '../../utils/apiServices';
import { toast } from 'sonner';

type ProductReport = {
  id: number;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  resolution?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  product?: {
    id: number;
    name: string;
    status: 'active' | 'suspended';
    images?: string[];
    category?: { name: string };
    creator?: { id: number; name: string; email: string };
  };
  reporter?: { id: number; name: string; email: string };
  reviewer?: { id: number; name: string; email: string };
};

const reasonLabels: Record<string, string> = {
  fraud: 'Penipuan',
  counterfeit: 'Produk Tiruan',
  inappropriate: 'Konten Tidak Pantas',
  copyright: 'Hak Cipta',
  other: 'Lainnya',
};

const statusLabels: Record<ProductReport['status'], string> = {
  pending: 'Pending',
  reviewed: 'Direview',
  resolved: 'Selesai',
  rejected: 'Ditolak',
};

const statusClasses: Record<ProductReport['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export function AdminReports() {
  const [reports, setReports] = useState<ProductReport[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ProductReport | null>(null);
  const [resolution, setResolution] = useState('');

  const filteredReports = useMemo(() => {
    if (statusFilter === 'all') return reports;
    return reports.filter((report) => report.status === statusFilter);
  }, [reports, statusFilter]);

  const pendingCount = reports.filter((report) => report.status === 'pending').length;
  const suspendedCount = reports.filter((report) => report.product?.status === 'suspended').length;

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getProductReports();
      setReports(res.data || []);
    } catch (error) {
      console.error('Failed to fetch product reports:', error);
      toast.error('Gagal memuat laporan produk');
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

  const handleAction = async (
    report: ProductReport,
    action: 'review' | 'resolve' | 'reject' | 'suspend_product' | 'activate_product',
  ) => {
    setIsProcessing(true);
    try {
      await adminService.reviewProductReport(report.id, action, resolution || undefined);
      toast.success('Laporan berhasil diperbarui');
      setSelectedReport(null);
      setResolution('');
      fetchReports();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses laporan');
    } finally {
      setIsProcessing(false);
    }
  };

  const openReport = (report: ProductReport) => {
    setSelectedReport(report);
    setResolution(report.resolution || '');
  };

  return (
    <div className="space-y-6">
      <Alert className="rounded-xl border-orange-200 bg-orange-50">
        <Flag className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          Review laporan pengguna, tandai hasil investigasi, dan suspend produk yang melanggar.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-md">
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Total Laporan</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{reports.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-md">
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Menunggu Review</p>
            <p className="mt-2 text-3xl font-bold text-yellow-700">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-md">
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Produk Disuspend</p>
            <p className="mt-2 text-3xl font-bold text-red-700">{suspendedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-lg">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-green-800">Pelaporan Produk</CardTitle>
            <CardDescription>Kelola laporan dari pengguna marketplace</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full rounded-xl sm:w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Direview</SelectItem>
              <SelectItem value="resolved">Selesai</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p>Belum ada laporan produk untuk filter ini</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Pelapor</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="min-w-[180px]">
                        <p className="font-medium text-gray-900">{report.product?.name || 'Produk dihapus'}</p>
                        <p className="text-xs text-gray-500">oleh {report.product?.creator?.name || '-'}</p>
                        {report.product?.status === 'suspended' && (
                          <Badge className="mt-1 bg-red-100 text-red-800">Suspended</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{reasonLabels[report.reason] || report.reason}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-900">{report.reporter?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{report.reporter?.email || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(report.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={statusClasses[report.status]}>{statusLabels[report.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openReport(report)}>
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

      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
                  <Flag className="h-5 w-5 text-orange-500" />
                  Review Laporan Produk
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div className="grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Produk</p>
                    <p className="font-semibold text-gray-900">{selectedReport.product?.name || 'Produk dihapus'}</p>
                    <p className="text-sm text-gray-500">Kreator: {selectedReport.product?.creator?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Status Produk</p>
                    <Badge className={selectedReport.product?.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                      {selectedReport.product?.status === 'suspended' ? 'Suspended' : 'Active'}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">Alasan</p>
                    <p className="font-medium text-gray-900">{reasonLabels[selectedReport.reason] || selectedReport.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dilaporkan oleh</p>
                    <p className="font-medium text-gray-900">{selectedReport.reporter?.name || '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-gray-500">Detail laporan</p>
                  <p className="rounded-xl border bg-white p-4 text-sm leading-relaxed text-gray-700">{selectedReport.description}</p>
                </div>

                <div className="space-y-2">
                  <Label>Catatan admin</Label>
                  <Textarea
                    value={resolution}
                    onChange={(event) => setResolution(event.target.value)}
                    placeholder="Tambahkan alasan keputusan atau catatan tindak lanjut..."
                    className="min-h-[100px] rounded-xl"
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="flex gap-2">
                  {selectedReport.product?.status === 'suspended' ? (
                    <Button
                      variant="outline"
                      className="rounded-xl text-green-700"
                      disabled={isProcessing}
                      onClick={() => handleAction(selectedReport, 'activate_product')}
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Aktifkan
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="rounded-xl text-red-700"
                      disabled={isProcessing}
                      onClick={() => handleAction(selectedReport, 'suspend_product')}
                    >
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Suspend Produk
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={isProcessing}
                    onClick={() => handleAction(selectedReport, 'reject')}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak
                  </Button>
                  <Button
                    className="rounded-xl bg-green-600 text-white hover:bg-green-700"
                    disabled={isProcessing}
                    onClick={() => handleAction(selectedReport, selectedReport.status === 'pending' ? 'review' : 'resolve')}
                  >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    {selectedReport.status === 'pending' ? 'Tandai Direview' : 'Selesaikan'}
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
