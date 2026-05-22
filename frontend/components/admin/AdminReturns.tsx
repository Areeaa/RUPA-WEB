import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Loader2, RotateCcw, Eye, CheckCircle2, XCircle, PackageCheck } from 'lucide-react';
import { adminService } from '../../utils/apiServices';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_review: 'Direview',
  approved: 'Disetujui',
  processing: 'Diproses',
  completed: 'Selesai',
  rejected: 'Ditolak',
};

const statusClasses: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export function AdminReturns() {
  const [returns, setReturns] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  const filteredReturns = useMemo(() => {
    if (statusFilter === 'all') return returns;
    return returns.filter((ret) => ret.status === statusFilter);
  }, [returns, statusFilter]);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getReturns(statusFilter);
      setReturns(res.data || []);
    } catch (error) {
      toast.error('Gagal memuat data retur');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const formatDate = (value?: string) => value
    ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
    : '-';

  const openReturn = (ret: any) => {
    setSelectedReturn(ret);
    setAdminNote(ret.admin_notes || '');
    setRefundAmount(ret.refund_amount ? String(ret.refund_amount) : '');
  };

  const handleAction = async (action: 'review' | 'approve' | 'reject' | 'process' | 'complete') => {
    if (!selectedReturn) return;
    setIsProcessing(true);
    try {
      await adminService.reviewReturn(selectedReturn.id, action, {
        adminNote,
        rejectionReason: action === 'reject' ? adminNote : undefined,
        refundAmount: refundAmount ? Number(refundAmount) : undefined,
      });
      toast.success('Status retur berhasil diperbarui');
      setSelectedReturn(null);
      fetchReturns();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses retur');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <RotateCcw className="h-5 w-5" />
              Retur & Refund
            </CardTitle>
            <CardDescription>Review bukti unboxing dan proses refund/replacement</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full rounded-xl sm:w-[190px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_review">Direview</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="processing">Diproses</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              <RotateCcw className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p>Belum ada pengajuan retur untuk filter ini</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Retur</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Pembeli</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell className="font-mono text-xs">{ret.return_code}</TableCell>
                    <TableCell>
                      <p className="font-medium text-gray-900">{ret.product?.name || '-'}</p>
                      <p className="text-xs text-gray-500">Order #{ret.orderId}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-900">{ret.buyer?.name || '-'}</p>
                      <p className="text-xs text-gray-500">{ret.buyer?.email || '-'}</p>
                    </TableCell>
                    <TableCell>{ret.return_type === 'refund' ? 'Refund' : 'Replacement'}</TableCell>
                    <TableCell>{formatDate(ret.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={statusClasses[ret.status] || 'bg-gray-100 text-gray-800'}>
                        {statusLabels[ret.status] || ret.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openReturn(ret)}>
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

      <Dialog open={!!selectedReturn} onOpenChange={(open) => !open && setSelectedReturn(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          {selectedReturn && (
            <>
              <DialogHeader>
                <DialogTitle>Review Retur {selectedReturn.return_code}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div className="rounded-xl bg-orange-50 p-4">
                  <p className="font-semibold text-orange-950">{selectedReturn.product?.name || '-'}</p>
                  <p className="text-sm text-orange-700">Alasan: {selectedReturn.reason}</p>
                  <p className="mt-2 text-sm text-gray-700">{selectedReturn.description}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedReturn.video_evidence && (
                    <a href={selectedReturn.video_evidence} target="_blank" rel="noreferrer" className="rounded-xl border p-3 text-sm text-blue-700 hover:bg-blue-50">
                      Buka video bukti
                    </a>
                  )}
                  {(selectedReturn.photo_evidence || []).map((photo: string, index: number) => (
                    <a key={photo} href={photo} target="_blank" rel="noreferrer" className="rounded-xl border p-3 text-sm text-blue-700 hover:bg-blue-50">
                      Buka foto bukti {index + 1}
                    </a>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nominal refund</Label>
                    <Input
                      type="number"
                      value={refundAmount}
                      onChange={(event) => setRefundAmount(event.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status saat ini</Label>
                    <Badge className={`w-fit ${statusClasses[selectedReturn.status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[selectedReturn.status] || selectedReturn.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Catatan admin</Label>
                  <Textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    placeholder="Catatan hasil review atau alasan penolakan..."
                    className="min-h-[100px] rounded-xl"
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button variant="outline" className="rounded-xl text-red-700" disabled={isProcessing} onClick={() => handleAction('reject')}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Tolak
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-xl" disabled={isProcessing} onClick={() => handleAction('review')}>
                    Review
                  </Button>
                  <Button variant="outline" className="rounded-xl text-blue-700" disabled={isProcessing} onClick={() => handleAction('approve')}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Setujui
                  </Button>
                  <Button variant="outline" className="rounded-xl text-purple-700" disabled={isProcessing} onClick={() => handleAction('process')}>
                    Proses
                  </Button>
                  <Button className="rounded-xl bg-green-600 text-white hover:bg-green-700" disabled={isProcessing} onClick={() => handleAction('complete')}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
                    Selesai
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
