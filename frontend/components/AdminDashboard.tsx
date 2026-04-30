import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Flag,
  LogOut,
  FileText,
  Shield,
  Loader2,
  Menu,
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

const adminTabs = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'users', label: 'Pengguna', icon: Users },
  { value: 'analytics', label: 'Analytics', icon: TrendingUp },
  { value: 'licenses', label: 'Lisensi', icon: FileText },
  { value: 'categories', label: 'Kategori', icon: Flag },
] as const;

export function AdminDashboard({ onLogout, adminData }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <Shield className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl">Admin Dashboard RUPA</h1>
                <p className="text-sm text-green-100">Penjaga Karya Anak Bangsa</p>
              </div>
            </div>

            <div className="hidden md:block">
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

            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/30 bg-white/10 px-3 text-white hover:bg-white/20"
                    aria-label="Buka menu admin"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] border-0 p-0 sm:max-w-[300px]">
                  <div className="flex h-full flex-col bg-gradient-to-b from-green-700 via-green-600 to-orange-500 text-white">
                    <SheetHeader className="border-b border-white/15 px-6 py-5 text-left">
                      <SheetTitle className="text-white">Menu Admin</SheetTitle>
                      <SheetDescription className="text-white/80">
                        Pilih halaman yang ingin Anda buka.
                      </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 space-y-2 px-4 py-4">
                      {adminTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.value;

                        return (
                          <Button
                            key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            variant="ghost"
                            className={`h-12 w-full justify-start rounded-xl px-4 ${
                              isActive ? 'bg-white text-green-700 shadow-sm hover:bg-white/90' : 'text-white hover:bg-white/20'
                            }`}
                          >
                            <Icon className="mr-3 h-4 w-4" />
                            {tab.label}
                          </Button>
                        );
                      })}
                    </div>

                    {onLogout && (
                      <div className="border-t border-white/15 p-4">
                        <Button
                          onClick={onLogout}
                          variant="outline"
                          className="w-full rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Keluar
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="grid gap-6 md:min-h-[calc(100vh-112px)] md:grid-cols-[240px_minmax(0,1fr)] md:gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="hidden border-r border-green-100 bg-white md:block">
              <div className="sticky top-0 flex min-h-[calc(100vh-112px)] flex-col px-4 py-8">
                <TabsList className="flex h-auto w-full flex-col gap-2 bg-transparent p-0 shadow-none">
                  {adminTabs.map((tab) => {
                    const Icon = tab.icon;

                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="justify-start rounded-xl px-4 py-3 text-left data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        <span>{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
            </aside>

            <div className="min-w-0 md:px-6 md:py-8 lg:px-8">
              <TabsContent value="overview" className="mt-0">
                {isLoadingStats ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  </div>
                ) : (
                  <AdminOverview adminData={adminData} systemStats={systemStats} topCreators={topCreators} />
                )}
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <AdminUsers />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
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

              <TabsContent value="licenses" className="mt-0">
                <AdminLicenses />
              </TabsContent>

              <TabsContent value="categories" className="mt-0">
                <AdminCategories />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
