import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { ArrowLeft, Search, Check, CheckCheck, MessageCircle, Loader2 } from 'lucide-react';
import type { UserData, Conversation } from '../../types';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { chatService } from '../../utils/apiServices';
import { toast } from 'sonner';

type ChatListPageProps = {
  userData: UserData;
  onBack: () => void;
  onOpenChat: (chatId: string, creatorName: string) => void;
};

export function ChatListPage({ userData, onBack, onOpenChat }: ChatListPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const res = await chatService.getMyConversations();
        setConversations(res.data || []);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        toast.error('Gagal memuat daftar percakapan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const filteredChats = conversations.filter(chat =>
    chat.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Kemarin';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <div
        className="pb-16 pt-6 px-4 rounded-b-[40px] shadow-sm text-white bg-gradient-to-r from-[var(--theme-light)] to-[var(--theme-secondary)]"
      >
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold flex-1">Kotak Masuk</h1>
            <MessageCircle className="w-6 h-6 opacity-80" />
          </div>

          <div className="relative shadow-xl rounded-2xl transform translate-y-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Cari nama penjual atau pesan..."
              className="pl-12 pr-4 py-4 h-14 w-full rounded-2xl border-0 text-gray-800 text-lg bg-white focus-visible:ring-offset-0 focus-visible:ring-green-400 shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
            <p className="text-gray-500">Memuat percakapan...</p>
          </div>
        ) : filteredChats.length > 0 ? (
          <div className="space-y-3 mt-4">
            {filteredChats.map((chat) => (
              <Card
                key={chat.id}
                className="border-0 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer rounded-2xl overflow-hidden bg-white"
                onClick={() => onOpenChat(String(chat.id), chat.partnerName)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-50 shadow-sm">
                      {chat.partnerAvatar ? (
                        <ImageWithFallback src={chat.partnerAvatar} alt={chat.partnerName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-orange-400 text-white font-bold text-lg">
                          {chat.partnerName.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-gray-800 truncate text-lg">{chat.partnerName}</h3>
                      <span className="text-xs text-gray-400">
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {chat.lastSenderId === userData.id && (
                        <CheckCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                      <p className="truncate text-sm text-gray-500">
                        {chat.lastMessage || 'Belum ada pesan'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 mt-10">
            <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">
              {searchQuery ? 'Obrolan tidak ditemukan' : 'Belum ada percakapan'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Mulai chat dengan mengklik "Chat Penjual" di halaman produk
            </p>
          </div>
        )}
      </div>
    </div>
  );
}