import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Users, DollarSign, ShoppingCart, AlertCircle } from 'lucide-react';
import type { UserData } from '../../types';

type AdminOverviewProps = {
  adminData?: UserData;
  systemStats: {
    activeUsers: number;
    totalDonations: string;
    totalTransactions: number;
  };
  topCreators: Array<{
    name: string;
    works: number;
    revenue: string;
  }>;
};

export function AdminOverview({ adminData, systemStats, topCreators }: AdminOverviewProps) {
  return (
    <div className="space-y-6">
      <Alert className="rounded-xl border-green-200 bg-green-50">
        <AlertCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Selamat datang, {adminData?.username || adminData?.name || 'Admin'}! Ringkasan di bawah ini mengambil data terbaru langsung dari backend RUPA.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-blue-700">
              <Users className="mr-2 h-4 w-4" />
              Pengguna Aktif
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-blue-900">{systemStats.activeUsers}</div>
            <p className="mt-1 text-xs text-blue-600">Total pengguna terdaftar</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-green-700">
              <DollarSign className="mr-2 h-4 w-4" />
              Total Donasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-900">{systemStats.totalDonations}</div>
            <p className="mt-1 text-xs text-green-600">Akumulasi transaksi berstatus valid</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-orange-700">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Total Transaksi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-orange-900">{systemStats.totalTransactions}</div>
            <p className="mt-1 text-xs text-orange-600">Jumlah seluruh order yang tercatat</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-green-800">Kreator Teratas</CardTitle>
          <CardDescription>Berdasarkan pendapatan yang tercatat di backend</CardDescription>
        </CardHeader>
        <CardContent>
          {topCreators.length > 0 ? (
            <div className="space-y-4">
              {topCreators.map((creator, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-gradient-to-r from-green-50 to-orange-50 p-3">
                  <div>
                    <p className="text-gray-900">{creator.name}</p>
                    <p className="text-sm text-gray-600">{creator.works} karya</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-700">{creator.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Belum ada data kreator dengan transaksi tercatat.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
