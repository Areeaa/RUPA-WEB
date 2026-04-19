import { useState, useMemo } from 'react';
import type { UserData } from '../types';
import { HomePage } from './user/HomePage';
// import { SearchPage } from './user/SearchPage';
import { ProfilePage } from './user/ProfilePage';
import { DonationPage } from './user/DonationPage';
import { LicensePage } from './user/LicensePage';
import { UploadPage } from './user/UploadPage';
import { SettingsPage } from './user/SettingsPage';
import { OrdersPage } from './user/OrdersPage';
import { ReturnPage } from './user/ReturnPage';
import { OnboardingTutorial } from './user/OnboardingTutorial';
import { ProductDetailPage } from './user/ProductDetailPage';
import type { Product } from '../types';
import { ChatListPage } from './user/ChatListPage'; 
import { ChatRoomPage } from './user/ChatRoomPage';
import { CreatorProfilePage } from './user/CreatorProfilePage';
import { Button } from './ui/button';
import { 
  Home, Search, User, Heart, FileText, Upload, Settings, Sparkles, Package, MessageCircle, 
  Store
} from 'lucide-react'; // Ikon ShoppingCart sudah dihapus
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
  const [viewingCreator, setViewingCreator] = useState<{id: number; name: string} | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [chatCreatorName, setChatCreatorName] = useState<string>('');
  const [chatContextProduct, setChatContextProduct] = useState<Product | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | number | undefined>(undefined);

  const currentTheme = userData && userData.themeColor 
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
    // { id: 'upload', label: t.upload, icon: Upload },
    // { id: 'search', label: t.search, icon: Search },
  ];

  const navItems = isGuest ? allNavItems.filter(item => ['home', 'profile'].includes(item.id)) : allNavItems;

  const handleMenuClick = (id: string) => {
    if (isGuest && (id === 'profile' || id === 'chat')) {
      if (id === 'chat') toast('Silakan masuk/daftar untuk melihat pesan', { icon: '🔒' });
      navigate('/login');
    } else {
      setActivePage(id);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gray-50/50"
      style={{
        '--theme-primary': currentTheme.primary,
        '--theme-light': currentTheme.light,
        '--theme-secondary': currentTheme.secondary,
        '--theme-accent': (currentTheme as any).accent || currentTheme.secondary,
      } as React.CSSProperties}
    >
      {showOnboarding && userData ? (
        <OnboardingTutorial username={userData.name || userData.username || ''} onComplete={handleOnboardingComplete} />
      ) : userData ? (
        <>
          <div className="text-white shadow-lg sticky top-0 z-50 bg-gradient-to-r from-[var(--theme-light)] to-[var(--theme-secondary)]">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl">RUPA</h1>
                    <p className="text-xs text-white/80">Karya Anak Bangsa</p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2 overflow-x-auto">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id || (activePage === 'product-detail' && item.id === 'home');
                    return (
                      <Button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        variant={isActive && !isGuest ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`rounded-xl ${isActive && (!isGuest || item.id !== 'profile') ? 'bg-white hover:bg-white/90 shadow-sm' : 'text-white hover:bg-white/20'}`}
                        style={isActive && (!isGuest || item.id !== 'profile') ? { color: currentTheme.primary } : {}}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.label}
                        {/* Indikator angka merah keranjang sudah dihapus */}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex md:hidden overflow-x-auto pb-2 gap-2">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id || (activePage === 'product-detail' && item.id === 'home');
                  return (
                    <Button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      variant={isActive && !isGuest ? 'secondary' : 'ghost'}
                      size="sm"
                      className={`rounded-xl flex-shrink-0 ${isActive && (!isGuest || item.id !== 'profile') ? 'bg-white' : 'text-white hover:bg-white/20'}`}
                      style={isActive && (!isGuest || item.id !== 'profile') ? { color: currentTheme.primary } : {}}
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="min-h-screen">
            {activePage === 'home' && (
              <HomePage 
                userData={userData} 
                onProductClick={handleProductClick}
                navigateToOrders={() => isGuest ? navigate('/login') : setActivePage('orders')} 
                isGuest={isGuest} 
                // addToCart={addToCart} sudah dihapus
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
                // addToCart={addToCart} sudah dihapus
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

            {/* {activePage === 'search' && <SearchPage favorites={[]} toggleFavorite={() => {}} userData={userData} />} */}
            {activePage === 'profile' && !isGuest && <ProfilePage userData={userData} updateUserData={updateUser} />}
            {activePage === 'orders' && <OrdersPage userData={userData} onNavigateToReturn={() => setActivePage('return')} />}
            
            {/* Halaman Keranjang (CartPage) sudah dihapus dari sini */}

            {activePage === 'donation' && <DonationPage userData={userData} />}
            {activePage === 'license' && <LicensePage userData={userData} />}
            {/* {activePage === 'upload' && <UploadPage userData={userData} />} */}
            {activePage === 'settings' && <SettingsPage userData={userData} updateUserData={updateUser} onLogout={logout} />}
            {activePage === 'return' && <ReturnPage userData={userData} />}
          </div>
        </>
      ) : null}
    </div>
  );
}