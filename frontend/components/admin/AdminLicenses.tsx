import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Play, CheckCircle2, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { adminService } from '../../utils/apiServices';
import { toast } from 'sonner';

export function AdminLicenses() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingLicenses();
  }, []);

  const fetchPendingLicenses = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPendingLicenses();
      setLicenses(res.data || []);
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (id: number, action: 'approve' | 'reject') => {
    try {
      await adminService.verifyLicense(id, action);
      toast.success(action === 'approve' ? 'Lisensi disetujui!' : 'Lisensi ditolak.');
      fetchPendingLicenses();
    } catch (error) {
      toast.error('Gagal memproses lisensi');
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200 rounded-xl">
        <FileText className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Kelola semua pengajuan lisensi untuk karya anak bangsa. Pastikan setiap proses lisensi berjalan lancar dan transparan. 📄
        </AlertDescription>
      </Alert>

      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-green-800">License Application Reports</CardTitle>
          <CardDescription>Daftar lengkap pengajuan lisensi</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : licenses.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada pengajuan lisensi</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>License Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((app: any) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.applicant || app.user?.name || '-'}</TableCell>
                    <TableCell>{app.productName || app.product?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-800">
                        {app.licenseType || app.license_type || 'Standard'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {app.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => handleVerify(app.id, 'approve')} className="rounded-lg bg-green-500 hover:bg-green-600 text-white">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleVerify(app.id, 'reject')} className="rounded-lg text-red-600">
                              Reject
                            </Button>
                          </>
                        )}
                        {app.status !== 'pending' && (
                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Selesai
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
