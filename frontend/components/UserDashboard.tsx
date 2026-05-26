import { useEffect, useState, lazy, Suspense } from 'react';
import type { UserData, Product } from '../types';

// Lazy-loaded page components — hanya di-load saat pertama kali dikunjungi
const HomePage            = lazy(() => import('./user/HomePage').then(m => ({ default: m.HomePage })));
const ProfilePage         = lazy(() => import('./user/ProfilePage').then(m => ({ default: m.ProfilePage })));
const LicensePage         = lazy(() => import('./user/LicensePage').then(m => ({ default: m.LicensePage })));
const SettingsPage        = lazy(() => import('./user/SettingsPage').then(m => ({ default: m.SettingsPage })));
const OrdersPage          = lazy(() => import('./user/OrdersPage').then(m => ({ default: m.OrdersPage })));
const ReturnPage          = lazy(() => import('./user/ReturnPage').then(m => ({ default: m.ReturnPage })));
const OnboardingTutorial  = lazy(() => import('./user/OnboardingTutorial').then(m => ({ default: m.OnboardingTutorial })));
const ProductDetailPage   = lazy(() => import('./user/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const ChatListPage        = lazy(() => import('./user/ChatListPage').then(m => ({ default: m.ChatListPage })));
const ChatRoomPage        = lazy(() => import('./user/ChatRoomPage').then(m => ({ default: m.ChatRoomPage })));
const CreatorProfilePage  = lazy(() => import('./user/CreatorProfilePage').then(m => ({ default: m.CreatorProfilePage })));
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import {
  Home,
  FileText,
  Settings,

  Package,
  MessageCircle,
  Store,
  Menu,
} from 'lucide-react';
import { getTranslation, type Language } from '../utils/translations';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { THEME_COLORS } from '../data/constants';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../utils/apiServices';
import { UserFooter } from './user/UserFooter';

type UserDashboardProps = {
  isGuest?: boolean;
};

export function UserDashboard({ isGuest }: UserDashboardProps) {
  const { authState, logout, updateUser } = useAuth();
  const { userData } = authState;
  const navigate = useNavigate();

  // Safety net: Admin tidak boleh mengakses User Dashboard
  useEffect(() => {
    if (authState.userType === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [authState.userType, navigate]);

  // Jangan render apapun jika admin — redirect sedang berlangsung
  if (authState.userType === 'admin') {
    return null;
  }

  const displayUserData: UserData = userData || {
    name: 'Pengunjung',
    email: '',
    language: 'id',
    themeColor: 'green',
  };
  const [activePage, setActivePage] = useState<string>('home');
  const [showOnboarding, setShowOnboarding] = useState(userData ? !userData.hasSeenTutorial && !isGuest : false);
  const [viewingCreator, setViewingCreator] = useState<{ id: number; name: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [chatCreatorName, setChatCreatorName] = useState<string>('');
  const [chatContextProduct, setChatContextProduct] = useState<Product | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | number | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activePage]);

  useEffect(() => {
    if (isGuest && !['home', 'license', 'product-detail', 'creator-profile'].includes(activePage)) {
      setActivePage('home');
    }
  }, [activePage, isGuest]);

  const currentTheme =
    displayUserData.themeColor
      ? THEME_COLORS[displayUserData.themeColor as keyof typeof THEME_COLORS] || THEME_COLORS.green
      : THEME_COLORS.green;

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    updateUser({ hasSeenTutorial: true });
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setActivePage('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const t = getTranslation((displayUserData.language as Language) || 'id');

  const allNavItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'chat', label: 'Pesan', icon: MessageCircle },
    { id: 'orders', label: t.orders, icon: Package },
    { id: 'profile', label: isGuest ? 'Masuk / Daftar' : 'Toko Saya', icon: Store },
    { id: 'license', label: t.license, icon: FileText },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const navItems = isGuest ? allNavItems.filter((item) => ['home', 'profile'].includes(item.id)) : allNavItems;

  const handleMenuClick = (id: string) => {
    if (isGuest && (id === 'profile' || id === 'chat' || id === 'settings')) {
      if (id === 'chat') {
        toast('Silakan masuk/daftar untuk melihat pesan', { icon: '🔒' });
      }

      setIsMobileMenuOpen(false);
      navigate('/login');
      return;
    }

    setActivePage(id);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  const handleLogout = () => {
    setActivePage('home');
    setIsMobileMenuOpen(false);
    logout();
  };

  return (
    <div
      className="min-h-screen bg-gray-50/50"
      style={
        {
          '--theme-primary': currentTheme.primary,
          '--theme-light': currentTheme.light,
          '--theme-secondary': currentTheme.secondary,
          '--theme-accent': currentTheme.accent || currentTheme.secondary,
        } as React.CSSProperties
      }
    >
      {showOnboarding && userData && !isGuest ? (
        <Suspense fallback={null}>
          <OnboardingTutorial username={userData.name || userData.username || ''} onComplete={handleOnboardingComplete} />
        </Suspense>
      ) : (
        <>
          <div className="sticky top-0 z-50 bg-gradient-to-r from-[var(--theme-light)] to-[var(--theme-secondary)] text-white shadow-lg">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur overflow-hidden">
                    <img src="/ic_rupa.svg" alt="Logo RUPA" className="h-7 w-7 object-contain" />
                  </div>
                  <div>
                    <h1 className="text-xl">RUPA</h1>
                    <p className="text-xs text-white/80">Karya Anak Bangsa</p>
                  </div>
                </div>

                <div className="hidden items-center gap-2 overflow-x-auto lg:flex">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id || (activePage === 'product-detail' && item.id === 'home');

                    return (
                      <Button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        variant={isActive && !isGuest ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`rounded-xl ${
                          isActive && (!isGuest || item.id !== 'profile')
                            ? 'bg-white shadow-sm hover:bg-white/90'
                            : 'text-white hover:bg-white/20'
                        }`}
                        style={isActive && (!isGuest || item.id !== 'profile') ? { color: currentTheme.primary } : {}}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    );
                  })}
                </div>

                <div className="lg:hidden">
                  <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl text-white hover:bg-white/20"
                        aria-label="Buka menu navigasi"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[280px] border-0 p-0 sm:max-w-[280px]">
                      <div
                        className="flex h-full flex-col"
                        style={{
                          backgroundImage: `linear-gradient(to bottom, ${currentTheme.light}, ${currentTheme.secondary})`,
                        }}
                      >
                        <SheetHeader className="border-b border-white/20 px-6 py-5 text-left">
                          <SheetTitle className="text-white">Menu</SheetTitle>
                          <SheetDescription className="text-white/80">
                            Pilih halaman yang ingin Anda buka.
                          </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 space-y-2 px-4 py-4">
                          {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activePage === item.id || (activePage === 'product-detail' && item.id === 'home');

                            return (
                              <Button
                                key={item.id}
                                onClick={() => handleMenuClick(item.id)}
                                variant="ghost"
                                className={`h-12 w-full justify-start rounded-xl px-4 ${
                                  isActive ? 'bg-white text-gray-900 shadow-sm hover:bg-white/90' : 'text-white hover:bg-white/20'
                                }`}
                                style={isActive ? { color: currentTheme.primary } : {}}
                              >
                                <Icon className="mr-3 h-4 w-4" />
                                {item.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-screen">
            <Suspense fallback={
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="h-10 w-10 animate-spin rounded-full border-4 border-transparent"
                    style={{ borderTopColor: 'var(--theme-primary)' }}
                  />
                  <p className="text-sm text-gray-400">Memuat halaman…</p>
                </div>
              </div>
            }>
              {activePage === 'home' && (
                <HomePage
                  userData={displayUserData}
                  onProductClick={handleProductClick}
                  navigateToOrders={() => (isGuest ? navigate('/login') : setActivePage('orders'))}
                  isGuest={isGuest}
                />
              )}

              {activePage === 'creator-profile' && (
                <CreatorProfilePage
                  userData={displayUserData}
                  creatorId={viewingCreator?.id || 0}
                  creatorName={viewingCreator?.name || ''}
                  onBack={() => setActivePage('product-detail')}
                  onProductClick={handleProductClick}
                  isGuest={isGuest}
                  onNavigateToAuth={() => navigate('/login')}
                  onChatSeller={async (product) => {
                    if (isGuest) {
                      toast('Silakan masuk/daftar untuk mengirim pesan', { icon: '🔒' });
                      navigate('/login');
                      return;
                    }

                    try {
                      const res = await chatService.startChat(product.id);
                      const conv = res.data;
                      setChatCreatorName(product.creator || 'Kreator');
                      setChatContextProduct(product);
                      setCurrentConversationId(conv.conversationId || conv.id);
                      setActivePage('chat-room');
                    } catch (error: any) {
                      toast.error(error.response?.data?.message || 'Gagal memulai chat');
                    }
                  }}
                />
              )}

              {activePage === 'product-detail' && selectedProduct && (
                <ProductDetailPage
                  product={selectedProduct}
                  userData={displayUserData}
                  onBack={() => setActivePage('home')}
                  isGuest={isGuest}
                  onNavigateToAuth={() => navigate('/login')}
                  onChatSeller={async (product) => {
                    if (isGuest) {
                      toast('Silakan masuk/daftar untuk mengirim pesan', { icon: '🔒' });
                      navigate('/login');
                      return;
                    }

                    try {
                      const res = await chatService.startChat(product.id);
                      const conv = res.data;
                      setChatCreatorName(product.creator || 'Kreator');
                      setChatContextProduct(product);
                      setCurrentConversationId(conv.conversationId || conv.id);
                      setActivePage('chat-room');
                    } catch (error: any) {
                      toast.error(error.response?.data?.message || 'Gagal memulai chat');
                    }
                  }}
                  onViewCreator={(creatorId, creatorName) => {
                    setViewingCreator({ id: creatorId, name: creatorName });
                    setActivePage('creator-profile');
                  }}
                  onProductClick={(product) => {
                    setSelectedProduct(product);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {activePage === 'chat' && !isGuest && userData && (
                <ChatListPage
                  userData={userData}
                  onBack={() => setActivePage('home')}
                  onOpenChat={(chatId, creatorName) => {
                    setChatCreatorName(creatorName);
                    setChatContextProduct(null);
                    setCurrentConversationId(chatId);
                    setActivePage('chat-room');
                  }}
                />
              )}

              {activePage === 'chat-room' && !isGuest && userData && (
                <ChatRoomPage
                  userData={userData}
                  onBack={() => setActivePage(chatContextProduct ? 'product-detail' : 'chat')}
                  onNavigateToOrders={() => setActivePage('orders')}
                  creatorName={chatCreatorName}
                  product={chatContextProduct}
                  conversationId={currentConversationId}
                />
              )}

              {activePage === 'profile' && !isGuest && userData && <ProfilePage userData={userData} updateUserData={updateUser} />}
              {activePage === 'orders' && !isGuest && userData && <OrdersPage userData={userData} onNavigateToReturn={() => setActivePage('return')} />}
              {activePage === 'license' && <LicensePage userData={displayUserData} />}
              {activePage === 'settings' && !isGuest && userData && <SettingsPage userData={userData} updateUserData={updateUser} onLogout={handleLogout} />}
              {activePage === 'return' && !isGuest && userData && <ReturnPage userData={userData} />}
            </Suspense>
          </div>

          {/* Footer — hanya muncul di halaman yang relevan, bukan di chat/detail */}
          {!['chat', 'chat-room', 'product-detail', 'creator-profile'].includes(activePage) && (
            <UserFooter isGuest={isGuest} onNavigate={handleMenuClick} />
          )}
        </>
      )}
    </div>
  );
}
