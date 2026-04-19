import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Users, DollarSign, ShoppingCart, Activity, AlertCircle } from 'lucide-react';
import type { UserData } from '../../types';

type AdminOverviewProps = {
  adminData: UserData;
  systemStats: any;
  topCreators: any[];
};

export function AdminOverview({ adminData, systemStats, topCreators }: AdminOverviewProps) {
  return (
    <div className="space-y-6">
      <Alert className="bg-green-50 border-green-200 rounded-xl">
        <AlertCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Selamat datang, {adminData.username}! Sistem RUPA beroperasi normal. Semua karya anak bangsa terlindungi dengan baik. 🇮🇩
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-blue-700">
              <Users className="w-4 h-4 mr-2" />
              Pengguna Aktif
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-blue-900">{systemStats.activeUsers}</div>
            <p className="text-xs text-blue-600 mt-1">+12% dari bulan lalu</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-green-700">
              <DollarSign className="w-4 h-4 mr-2" />
              Total Donasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-900">{systemStats.totalDonations}</div>
            <p className="text-xs text-green-600 mt-1">+18% dari bulan lalu</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-orange-700">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Total Transaksi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-orange-900">{systemStats.totalTransactions}</div>
            <p className="text-xs text-orange-600 mt-1">+8% dari bulan lalu</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center text-purple-700">
              <Activity className="w-4 h-4 mr-2" />
              Server Uptime
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-purple-900">{systemStats.uptime}</div>
            <p className="text-xs text-purple-600 mt-1">Sangat stabil</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-green-800">Kreator Teratas Bulan Ini</CardTitle>
            <CardDescription>Berdasarkan revenue dan jumlah karya</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCreators.map((creator, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-orange-50 rounded-xl">
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
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-green-800">Kesehatan Server</CardTitle>
            <CardDescription>Monitoring infrastruktur RUPA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-700">CPU Usage</span>
                <span className="text-sm text-green-700">45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-700">Memory</span>
                <span className="text-sm text-green-700">62%</span>
              </div>
              <Progress value={62} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-700">Database</span>
                <span className="text-sm text-green-700">38%</span>
              </div>
              <Progress value={38} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-700">API Response Time</span>
                <span className="text-sm text-green-700">142ms</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
