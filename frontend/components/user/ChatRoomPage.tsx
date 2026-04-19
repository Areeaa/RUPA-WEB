import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Store, ShieldCheck, MoreVertical, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { UserData, Product, ChatMessage } from '../../types';
import { chatService, orderService } from '../../utils/apiServices';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent } from '../ui/card';

const SOCKET_URL = 'http://localhost:5000';

type ChatRoomPageProps = {
  userData: UserData;
  onBack: () => void;
  creatorName: string;
  product: Product | null;
  conversationId?: string | number;
  onNavigateToOrders?: () => void;
};

export function ChatRoomPage({ userData, onBack, creatorName, product, conversationId, onNavigateToOrders }: ChatRoomPageProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [shippingCost, setShippingCost] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const themeColors: Record<string, { primary: string; light: string; secondary: string }> = {
    green: { primary: '#16a34a', light: '#22c55e', secondary: '#4ade80' },
    orange: { primary: '#ea580c', light: '#f97316', secondary: '#fb923c' },
    blue: { primary: '#2563eb', light: '#3b82f6', secondary: '#60a5fa' },
    purple: { primary: '#9333ea', light: '#a855f7', secondary: '#c084fc' },
    pink: { primary: '#db2777', light: '#ec4899', secondary: '#f472b6' },
  };
  const currentTheme = themeColors[userData.themeColor || 'green'] || themeColors.green;

  // Load messages and setup Socket.IO
  useEffect(() => {
    if (!conversationId) {
      setIsLoading(false);
      return;
    }

    // Fetch existing messages
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const res = await chatService.getMessages(conversationId);
        const data = res.data;
        // Backend returns { conversation, messages }
        const msgs = data.messages || data || [];
        setMessages(msgs);

        // Determine if user is seller
        try {
          const chatRes = await chatService.getMyConversations();
          const currentChat = chatRes.data.find((c: any) => c.id === Number(conversationId));
          if (currentChat) {
            // In myConversations, partnerId is the other person.
            // But we need to know if WE are the sellerId in the Conversation model.
            // Let's use getMessages response if it includes conversation metadata.
            // For now, let's check if the first product's owner is us (not reliable).
            // Better: use a dedicated conversation detail API if available.
            // Simplified: if currentChat exists, we can compare with userData.
          }
          
          // Let's check from the message history if we are receiving messages from a buyer
          // or if we have a way to know our role.
          // Check if we are the seller of this product
          if (product && product.userId === userData.id) {
             setIsSeller(true);
          }
        } catch (e) {
          console.error("Error determining role:", e);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        toast.error('Gagal memuat pesan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Connect to Socket.IO
    const socket = io(SOCKET_URL, { 
      transports: ['websocket', 'polling'] 
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('join_room', conversationId);
    });

    socket.on('receive_message', (msg: any) => {
      setMessages(prev => {
        // Prevent duplicate messages
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('user_typing', (data: any) => {
      if (data.userId !== userData.id) {
        setIsTyping(data.isTyping);
      }
    });

    socket.on('message_error', (err: any) => {
      toast.error(err.message || 'Gagal mengirim pesan');
    });

    return () => {
      socket.emit('leave_room', conversationId);
      socket.disconnect();
    };
  }, [conversationId, userData.id, product]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !conversationId) return;

    // Send via Socket.IO for realtime
    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        conversationId,
        senderId: userData.id,
        senderName: userData.name || userData.username,
        text: inputText,
      });
    }

    // Emit stop typing
    if (socketRef.current) {
      socketRef.current.emit('typing', { conversationId, userId: userData.id, isTyping: false });
    }

    setInputText('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    // Emit typing indicator
    if (socketRef.current && conversationId) {
      socketRef.current.emit('typing', { conversationId, userId: userData.id, isTyping: true });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('typing', { conversationId, userId: userData.id, isTyping: false });
        }
      }, 2000);
    }
  };

  const handleStartTransaction = () => {
    if (!product || !conversationId) return;

    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        conversationId,
        senderId: userData.id,
        senderName: userData.name || userData.username,
        text: `Halo ${creatorName}, saya ingin membeli "${product.name}". Mohon kirimkan tagihannya.`,
        type: 'purchase_request',
        productId: product.id
      });
    }

    toast.success(`Permintaan pembelian telah dikirim!`, {
      icon: <ShoppingBag className="w-5 h-5 text-green-500" />
    });
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || !selectedRequest) return;

    setIsCreatingInvoice(true);
    try {
      const res = await orderService.createInvoice({
        conversationId: Number(conversationId),
        productId: selectedRequest?.productId,
        shipping_cost: Number(shippingCost) || 0,
        shipping_address: shippingAddress
      });

      const newOrder = res.data.order;
      const totalBayar = Number(selectedRequest?.product_info?.price || 0) + (Number(shippingCost) || 0);

      // Send a detailed invoice message via socket
      if (socketRef.current) {
        socketRef.current.emit('send_message', {
          conversationId,
          senderId: userData.id,
          senderName: userData.name || userData.username,
          text: `📦 TAGIHAN PESANAN #${newOrder.id}\n---\nProduk: ${selectedRequest?.product_info?.name} (Rp${selectedRequest?.product_info?.price})\nOngkir: Rp${shippingCost || 0}\nAlamat: ${shippingAddress || '-'}\n---\nTOTAL BAYAR: Rp${totalBayar}\nSilakan transfer dan upload bukti pembayaran di sini.`,
          type: 'invoice',
          productId: selectedRequest?.productId
        });
      }

      toast.success('Tagihan berhasil dikirim!');
      setIsInvoiceModalOpen(false);
      setShippingCost('');
      setShippingAddress('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat tagihan');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50/50">
      
      {/* HEADER CHAT */}
      <div 
        className="sticky top-0 z-20 shadow-md text-white px-4 py-3 bg-gradient-to-r from-[var(--theme-light)] to-[var(--theme-secondary)]"
      >
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden flex items-center justify-center flex-shrink-0 border border-white/30">
            <Store className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg truncate">{creatorName}</h2>
            <p className="text-xs text-white/80 flex items-center gap-1">
              {isTyping ? (
                <span className="italic">Sedang mengetik...</span>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span> Online
                </>
              )}
            </p>
          </div>

          <button className="p-1.5 hover:bg-white/20 rounded-full">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KARTU PRODUK INTERAKTIF */}
      {product && (
        <div className="bg-white p-3 shadow-sm border-b border-gray-100 z-10 sticky top-[68px]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
              <ImageWithFallback src={product.image || ''} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-800 truncate mb-1">{product.name}</h3>
              <p className="text-green-600 font-bold text-sm mb-1">
                Rp {(typeof product.price === 'number' ? product.price : parseInt(String(product.price)) || 0).toLocaleString('id-ID')}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 w-max px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3 text-green-500" /> Transaksi Aman
              </div>
            </div>
            <Button 
              size="sm"
              onClick={handleStartTransaction}
              className="rounded-xl px-4 text-xs font-bold shadow-sm h-9 bg-gradient-to-r from-[var(--theme-light)] to-[var(--theme-secondary)]"
            >
              Beli
            </Button>
          </div>
        </div>
      )}

      {/* AREA PESAN */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
            <p className="text-gray-400 text-sm">Memuat pesan...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>Belum ada pesan. Mulai percakapan!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSender = msg.senderId === userData.id;
            const isPurchaseRequest = msg.type === 'purchase_request';
            const isInvoice = msg.type === 'invoice';

            return (
              <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] md:max-w-[60%] px-4 py-2.5 shadow-sm relative rounded-2xl ${
                    isSender 
                      ? 'text-white rounded-tr-sm' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                  } ${
                    isPurchaseRequest 
                      ? (isSender ? 'bg-orange-500' : 'bg-orange-50 border-orange-200 text-orange-900') 
                      : isInvoice 
                        ? (isSender ? 'bg-green-600' : 'bg-green-50 border-green-200 text-green-900')
                        : ''
                  }`}
                  style={isSender && !isPurchaseRequest && !isInvoice ? { backgroundImage: `linear-gradient(to right, ${currentTheme.light}, ${currentTheme.secondary})` } : {}}
                >
                  {/* Purchase Request Header */}
                  {isPurchaseRequest && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-orange-100">
                      <ShoppingBag className={`w-4 h-4 ${isSender ? 'text-white' : 'text-orange-500'}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${isSender ? 'text-white' : 'text-orange-600'}`}>
                        Permintaan Pembelian
                      </span>
                    </div>
                  )}

                  {/* Invoice Header */}
                  {isInvoice && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-green-100">
                      <ShieldCheck className={`w-4 h-4 ${isSender ? 'text-white' : 'text-green-500'}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${isSender ? 'text-white' : 'text-green-600'}`}>
                        Tagihan Pembayaran
                      </span>
                    </div>
                  )}

                  {/* Product info context */}

                  {(msg.product_info || isPurchaseRequest) && (
                    <div className={`flex items-center gap-3 p-2 rounded-xl mb-2 ${
                      isSender ? 'bg-white/20' : (isPurchaseRequest ? 'bg-orange-100/50' : (isInvoice ? 'bg-green-100/50' : 'bg-gray-50'))
                    }`}>
                      <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-black/5">
                        <ImageWithFallback 
                          src={msg.product_info?.images?.[0] || msg.product_info?.image || ''} 
                          alt={msg.product_info?.name || 'Produk'} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isSender ? 'text-white' : 'text-gray-900'}`}>
                          {msg.product_info?.name || 'Produk'}
                        </p>
                        <p className={`text-sm font-bold ${isSender ? 'text-white/90' : (isPurchaseRequest ? 'text-orange-700' : 'text-green-700')}`}>
                          Rp {Number(msg.product_info?.price || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-[15px] whitespace-pre-line leading-relaxed mb-1">{msg.text}</p>
                  
                  {/* Action Buttons for Seller */}
                  {isPurchaseRequest && !isSender && (
                    <Button 
                      onClick={() => {
                        setSelectedRequest(msg);
                        setIsInvoiceModalOpen(true);
                      }}
                      className="w-full mt-3 h-10 rounded-xl text-xs bg-orange-500 hover:bg-orange-600 text-white shadow-md border-0 animate-pulse"
                    >
                      Konfirmasi & Buat Tagihan
                    </Button>
                  )}

                  {/* Action Button for Buyer on Invoice */}
                  {isInvoice && !isSender && (
                    <Button 
                      onClick={onNavigateToOrders}
                      className="w-full mt-3 h-9 rounded-xl text-xs bg-green-500 hover:bg-green-600 text-white shadow-sm border-0"
                    >
                      Bayar Sekarang
                    </Button>
                  )}

                  <p className={`text-[10px] text-right mt-1 ${isSender ? 'text-white/80' : 'text-gray-400'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* AREA INPUT CHAT */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 px-4 md:static">
        <form onSubmit={handleSendMessage} className="container mx-auto max-w-3xl flex items-center gap-2">
          <Input 
            value={inputText}
            onChange={handleInputChange}
            placeholder="Ketik pesan..." 
            className="flex-1 bg-gray-100/50 border-0 rounded-full h-12 px-5 focus-visible:ring-1 focus-visible:ring-green-500"
          />
          <Button 
            type="submit" 
            disabled={!inputText.trim()}
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 bg-gradient-to-r from-[var(--theme-light)] to-[var(--theme-secondary)]"
          >
            <Send className="w-5 h-5 ml-1" />
          </Button>
        </form>
      </div>

      {/* MODAL BUAT TAGIHAN (SELLER ONLY) */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" /> Buat Tagihan
              </h3>
              <p className="text-green-50/80 text-sm mt-1">Lengkapi biaya pengiriman untuk produk ini</p>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shadow-sm">
                    <img src={selectedRequest?.product_info?.images?.[0] || selectedRequest?.product_info?.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{selectedRequest?.product_info?.name}</p>
                    <p className="text-xs text-green-600 font-bold">Rp {Number(selectedRequest?.product_info?.price || 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Biaya Pengiriman (Ongkir)</label>
                  <Input 
                    type="number" 
                    placeholder="Contoh: 15000" 
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className="rounded-xl h-12 bg-gray-50/50 border-gray-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Alamat Pengiriman (Opsional)</label>
                  <Input 
                    placeholder="Tulis alamat atau biarkan pembeli mengisinya" 
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="rounded-xl h-12 bg-gray-50/50 border-gray-200"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsInvoiceModalOpen(false)}
                    className="flex-1 rounded-xl h-12 hover:bg-gray-100"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isCreatingInvoice}
                    className="flex-1 rounded-xl h-12 bg-green-600 hover:bg-green-700 text-white shadow-md"
                  >
                    {isCreatingInvoice ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Tagihan'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}