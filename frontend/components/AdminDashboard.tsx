import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Flag, 
  Settings, 
  LogOut,
  FileText,
  Shield,
  Loader2
} from 'lucide-react';
import type { UserData } from '../types';
import { toast } from 'sonner';
import { adminService } from '../utils/apiServices';

// Import sub-components
import { AdminOverview } from './admin/AdminOverview';
import { AdminUsers } from './admin/AdminUsers';
import { AdminAnalytics } from './admin/AdminAnalytics';
import { AdminLicenses } from './admin/AdminLicenses';
import { AdminCategories } from './admin/AdminCategories';

type AdminDashboardProps = {
  onLogout?: () => void;
  adminData?: UserData;
};

export function AdminDashboard({ onLogout, adminData }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Fallback if adminData is not provided
  const currentUser: UserData = adminData || {
    id: 1,
    name: 'Admin',
    username: 'admin',
    email: 'admin@rupa.id',
    role: 'admin',
    phoneNumber: '081234567890',
    address: 'Jakarta',
    language: 'id',
    themeColor: 'green'
  };

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [systemStats, setSystemStats] = useState({
    uptime: '99.8%',
    activeUsers: 0,
    totalDonations: 'Rp 0',
    totalTransactions: 0,
    pendingReports: 0,
    serverHealth: 98,
  });

  const [topCreators, setTopCreators] = useState<any[]>([]);
  const [dailyTransactions, setDailyTransactions] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, creatorsRes, dailyRes, categoriesRes] = await Promise.all([
          adminService.getSystemStats(),
          adminService.getTopCreators(),
          adminService.getDailyTransactions(),
          adminService.getTopProductsPerCategory()
        ]);
        
        setSystemStats(statsRes.data);
        
        // Normalize backend creator data to frontend component expected shape
        const mappedCreators = (creatorsRes.data || []).map((c: any) => ({
          name: c.name,
          works: c.products ? c.products.length : 0, 
          revenue: `Rp ${Number(c.total_income || 0).toLocaleString('id-ID')}`
        }));
        setTopCreators(mappedCreators);
        setDailyTransactions(dailyRes.data);
        setTopCategories(categoriesRes.data);
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

  const [licenseApplications, setLicenseApplications] = useState([
    { 
      id: 1, 
      applicant: 'PT Inovasi Hijau', 
      productName: 'Tas Ramah Lingkungan dari Sampah Plastik',
      licenseType: 'Commercial License',
      submittedDate: '25 Okt 2025',
      status: 'Pending'
    },
    { 
      id: 2, 
      applicant: 'CV Teknologi Nusantara', 
      productName: 'Lampu Tenaga Surya Portable',
      licenseType: 'Educational License',
      submittedDate: '23 Okt 2025',
      status: 'Processing'
    },
    { 
      id: 3, 
      applicant: 'Yayasan Lingkungan Bersih', 
      productName: 'Pupuk Organik dari Kompos',
      licenseType: 'Non-Profit License',
      submittedDate: '20 Okt 2025',
      status: 'Completed'
    },
    { 
      id: 4, 
      applicant: 'Koperasi Kreasi Anak Bangsa', 
      productName: 'Kerajinan Anyaman Tradisional Modern',
      licenseType: 'Commercial License',
      submittedDate: '18 Okt 2025',
      status: 'Processing'
    },
    { 
      id: 5, 
      applicant: 'Startup Eco Indonesia', 
      productName: 'Botol Minum Eco-Friendly',
      licenseType: 'Commercial License',
      submittedDate: '15 Okt 2025',
      status: 'Pending'
    },
  ]);

  const handleMarkAsCompleted = (id: number) => {
    const application = licenseApplications.find(app => app.id === id);
    setLicenseApplications(prev => 
      prev.map(app => 
        app.id === id ? { ...app, status: 'Completed' } : app
      )
    );
    toast.success(`Pengajuan lisensi untuk "${application?.productName}" telah diselesaikan! ✅`);
  };

  const handleProcessApplication = (id: number) => {
    const application = licenseApplications.find(app => app.id === id);
    setLicenseApplications(prev => 
      prev.map(app => 
        app.id === id && app.status === 'Pending' ? { ...app, status: 'Processing' } : app
      )
    );
    toast.info(`Mulai memproses pengajuan lisensi untuk "${application?.productName}" 🔄`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl">Admin Dashboard RUPA</h1>
                <p className="text-green-100 text-sm">Penjaga Karya Anak Bangsa 🌱</p>
              </div>
            </div>
            {onLogout && (
              <Button 
                onClick={onLogout}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-8 bg-white rounded-xl p-2 shadow-md h-auto">
            <TabsTrigger value="overview" className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <LayoutDashboard className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <Users className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Pengguna</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="licenses" className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <FileText className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Lisensi</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <Flag className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Kategori</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {isLoadingStats ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              </div>
            ) : (
              <AdminOverview adminData={currentUser} systemStats={systemStats} topCreators={topCreators} />
            )}
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="analytics">
            {isLoadingStats ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
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
