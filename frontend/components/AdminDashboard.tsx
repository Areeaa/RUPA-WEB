import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Flag,
  LogOut,
  FileText,
  Shield,
  Loader2,
} from 'lucide-react';
import type { UserData } from '../types';
import { toast } from 'sonner';
import { adminService } from '../utils/apiServices';

import { AdminOverview } from './admin/AdminOverview';
import { AdminUsers } from './admin/AdminUsers';
import { AdminAnalytics } from './admin/AdminAnalytics';
import { AdminLicenses } from './admin/AdminLicenses';
import { AdminCategories } from './admin/AdminCategories';

type AdminDashboardProps = {
  onLogout?: () => void;
  adminData?: UserData;
};

type SystemStats = {
  activeUsers: number;
  totalDonations: string;
  totalTransactions: number;
};

export function AdminDashboard({ onLogout, adminData }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    activeUsers: 0,
    totalDonations: 'Rp 0',
    totalTransactions: 0,
  });
  const [topCreators, setTopCreators] = useState<any[]>([]);
  const [dailyTransactions, setDailyTransactions] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);

      try {
        const [statsRes, creatorsRes, dailyRes, categoriesRes] = await Promise.all([
          adminService.getSystemStats(),
          adminService.getTopCreators(),
          adminService.getDailyTransactions(),
          adminService.getTopProductsPerCategory(),
        ]);

        setSystemStats(statsRes.data);

        const mappedCreators = (creatorsRes.data || []).map((creator: any) => ({
          name: creator.name,
          works: Number(creator.total_products || 0),
          revenue: `Rp ${Number(creator.total_income || 0).toLocaleString('id-ID')}`,
        }));

        setTopCreators(mappedCreators);
        setDailyTransactions(dailyRes.data || []);
        setTopCategories(categoriesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        toast.error('Gagal memuat statistik dashboard');
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (activeTab === 'overview' || activeTab === 'analytics') {
      fetchStats();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl">Admin Dashboard RUPA</h1>
                <p className="text-sm text-green-100">Penjaga Karya Anak Bangsa</p>
              </div>
            </div>
            {onLogout && (
              <Button
                onClick={onLogout}
                variant="outline"
                className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-auto grid-cols-3 gap-2 rounded-xl bg-white p-2 shadow-md md:grid-cols-6">
            <TabsTrigger value="overview" className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <LayoutDashboard className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <Users className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Pengguna</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="licenses" className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <FileText className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Lisensi</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <Flag className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Kategori</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {isLoadingStats ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : (
              <AdminOverview adminData={adminData} systemStats={systemStats} topCreators={topCreators} />
            )}
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="analytics">
            {isLoadingStats ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : (
              <AdminAnalytics
                dailyTransactions={dailyTransactions}
                systemStats={systemStats}
                topCategories={topCategories}
              />
            )}
          </TabsContent>

          <TabsContent value="licenses">
            <AdminLicenses />
          </TabsContent>

          <TabsContent value="categories">
            <AdminCategories />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
