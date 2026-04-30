import { useState } from 'react';
import type { UserData, Product } from '../types';
import { HomePage } from './user/HomePage';
import { ProfilePage } from './user/ProfilePage';
import { DonationPage } from './user/DonationPage';
import { LicensePage } from './user/LicensePage';
import { SettingsPage } from './user/SettingsPage';
import { OrdersPage } from './user/OrdersPage';
import { ReturnPage } from './user/ReturnPage';
import { OnboardingTutorial } from './user/OnboardingTutorial';
import { ProductDetailPage } from './user/ProductDetailPage';
import { ChatListPage } from './user/ChatListPage';
import { ChatRoomPage } from './user/ChatRoomPage';
import { CreatorProfilePage } from './user/CreatorProfilePage';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import {
  Home,
  Heart,
  FileText,
  Settings,
  Sparkles,
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

type UserDashboardProps = {
  isGuest?: boolean;
};

export function UserDashboard({ isGuest }: UserDashboardProps) {
  const { authState, logout, updateUser } = useAuth();
  const { userData } = authState;
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<string>('home');
  const [showOnboarding, setShowOnboarding] = useState(userData ? !userData.hasSeenTutorial && !isGuest : false);
  const [viewingCreator, setViewingCreator] = useState<{ id: number; name: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [chatCreatorName, setChatCreatorName] = useState<string>('');
  const [chatContextProduct, setChatContextProduct] = useState<Product | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | number | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentTheme =
    userData && userData.themeColor
      ? THEME_COLORS[userData.themeColor as keyof typeof THEME_COLORS] || THEME_COLORS.green
      : THEME_COLORS.green;

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    updateUser({ hasSeenTutorial: true });
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setActivePage('product-detail');
  };

  const t = getTranslation((userData?.language as Language) || 'id');

  const allNavItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'chat', label: 'Pesan', icon: MessageCircle },
    { id: 'orders', label: t.orders, icon: Package },
    { id: 'profile', label: isGuest ? 'Masuk / Daftar' : 'Toko Saya', icon: Store },
    { id: 'donation', label: t.donation, icon: Heart },
    { id: 'license', label: t.license, icon: FileText },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const navItems = isGuest ? allNavItems.filter((item) => ['home', 'profile'].includes(item.id)) : allNavItems;

  const handleMenuClick = (id: string) => {
    if (isGuest && (id === 'profile' || id === 'chat')) {
      if (id === 'chat') {
        toast('Silakan masuk/daftar untuk melihat pesan', { icon: '🔒' });
      }

      setIsMobileMenuOpen(false);
      navigate('/login');
      return;
    }

    setActivePage(id);
    setIsMobileMenuOpen(false);
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
      {showOnboarding && userData ? (
        <OnboardingTutorial username={userData.name || userData.username || ''} onComplete={handleOnboardingComplete} />
      ) : userData ? (
        <>
          <div className="sticky top-0 z-50 bg-gradient-to-r from-[var(--theme-light)] to-[var(--theme-secondary)] text-white shadow-lg">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl">RUPA</h1>
                    <p className="text-xs text-white/80">Karya Anak Bangsa</p>
                  </div>
                </div>

                <div className="hidden items-center gap-2 overflow-x-auto md:flex">
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

                <div className="md:hidden">
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
            {activePage === 'home' && (
              <HomePage
                userData={userData}
                onProductClick={handleProductClick}
                navigateToOrders={() => (isGuest ? navigate('/login') : setActivePage('orders'))}
                isGuest={isGuest}
              />
            )}

            {activePage === 'creator-profile' && (
              <CreatorProfilePage
                userData={userData}
                creatorId={viewingCreator?.id || 0}
                creatorName={viewingCreator?.name || ''}
                onBack={() => setActivePage('product-detail')}
                onProductClick={handleProductClick}
                onChatSeller={async (product) => {
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
                userData={userData}
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
              />
            )}

            {activePage === 'chat' && (
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

            {activePage === 'chat-room' && (
              <ChatRoomPage
                userData={userData}
                onBack={() => setActivePage(chatContextProduct ? 'product-detail' : 'chat')}
                onNavigateToOrders={() => setActivePage('orders')}
                creatorName={chatCreatorName}
                product={chatContextProduct}
                conversationId={currentConversationId}
              />
            )}

            {activePage === 'profile' && !isGuest && <ProfilePage userData={userData} updateUserData={updateUser} />}
            {activePage === 'orders' && <OrdersPage userData={userData} onNavigateToReturn={() => setActivePage('return')} />}
            {activePage === 'donation' && <DonationPage userData={userData} />}
            {activePage === 'license' && <LicensePage userData={userData} />}
            {activePage === 'settings' && <SettingsPage userData={userData} updateUserData={updateUser} onLogout={logout} />}
            {activePage === 'return' && <ReturnPage userData={userData} />}
          </div>
        </>
      ) : null}
    </div>
  );
}
