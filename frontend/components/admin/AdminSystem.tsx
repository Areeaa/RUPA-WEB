import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Server, Database, Megaphone, AlertCircle } from 'lucide-react';

export function AdminSystem() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <Server className="w-5 h-5 mr-2" />
              Backup & Security
            </CardTitle>
            <CardDescription>Pengaturan keamanan sistem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full rounded-xl bg-green-500 hover:bg-green-600 text-white">
              <Database className="w-4 h-4 mr-2" />
              Backup Database Sekarang
            </Button>
            <Button variant="outline" className="w-full rounded-xl">
              View Security Logs
            </Button>
            <Button variant="outline" className="w-full rounded-xl">
              API Key Management
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <Megaphone className="w-5 h-5 mr-2" />
              Pengumuman Platform
            </CardTitle>
            <CardDescription>Kirim pesan ke semua pengguna</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
              <Megaphone className="w-4 h-4 mr-2" />
              Buat Pengumuman Baru
            </Button>
            <Button variant="outline" className="w-full rounded-xl">
              Lihat Riwayat Pengumuman
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800">Mode Maintenance</CardTitle>
          <CardDescription className="text-red-700">
            Aktifkan mode maintenance untuk melakukan pembaruan sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="rounded-xl">
            <AlertCircle className="w-4 h-4 mr-2" />
            Enable Maintenance Mode
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
