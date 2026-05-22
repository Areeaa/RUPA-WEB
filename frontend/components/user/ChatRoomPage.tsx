import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Store, ShieldCheck, MoreVertical, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { UserData, Product, ChatMessage } from '../../types';
import { chatService, orderService, authService } from '../../utils/apiServices';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent } from '../ui/card';
import { Banknote, QrCode, Copy } from 'lucide-react';

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
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [shippingCost, setShippingCost] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [sellerPaymentInfo, setSellerPaymentInfo] = useState<any>(null);
  const [showQrisInvoice, setShowQrisInvoice] = useState(false);
  const [invoiceQuantity, setInvoiceQuantity] = useState('1');
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
        const msgs = data.messages || data || [];
        setMessages(msgs);

        // Simpan alamat pembeli dari response untuk auto-fill invoice
        if (data.buyer?.address) {
          setBuyerAddress(data.buyer.address);
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
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('token'),
      },
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

    socket.on('connect_error', (err: any) => {
      toast.error(err.message || 'Gagal terhubung ke chat realtime');
    });

    return () => {
      socket.emit('leave_room', conversationId);
      socket.disconnect();
    };
  }, [conversationId, userData.id, product]);

  const parseProductPrice = (value: string | number | undefined) => {
    if (typeof value === 'number') return value;
    return Number(String(value || '').replace(/[^\d]/g, '') || 0);
  };

  const parsedInvoiceQuantity = Math.max(Number(invoiceQuantity) || 1, 1);
  const invoiceUnitPrice = parseProductPrice(selectedRequest?.product_info?.price);
  const invoiceSubtotal = invoiceUnitPrice * parsedInvoiceQuantity;
  const invoiceTotal = invoiceSubtotal + (Number(shippingCost) || 0);

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

    const invoiceProductId = Number(selectedRequest?.productId || selectedRequest?.product_info?.id);
    const quantity = Math.max(Number(invoiceQuantity) || 1, 1);

    if (!invoiceProductId) {
      toast.error('Produk pada permintaan beli tidak valid');
      return;
    }

    setIsCreatingInvoice(true);
    try {
      // Fetch seller payment info
      let paymentInfo: any = null;
      try {
        const paymentRes = await authService.getPaymentInfo(userData.id!);
        paymentInfo = paymentRes.data;
      } catch (e) {
        console.warn('No payment info found');
      }

      const res = await orderService.createInvoice({
        conversationId: Number(conversationId),
        productId: invoiceProductId,
        quantity,
        shipping_cost: Number(shippingCost) || 0,
        shipping_address: shippingAddress
      });

      const newOrder = res.data.order;
      const orderItems = newOrder?.items || [];
      const itemLines = orderItems.length > 0
        ? orderItems.map((item: any) => {
          const name = item.Product?.name || 'Produk';
          const price = Number(item.price || 0);
          const quantity = Number(item.quantity || 1);
          return `- ${name}: Rp${price.toLocaleString('id-ID')} x ${quantity} = Rp${(price * quantity).toLocaleString('id-ID')}`;
        }).join('\n')
        : `- ${selectedRequest?.product_info?.name || 'Produk'}: Rp${invoiceUnitPrice.toLocaleString('id-ID')} x ${quantity} = Rp${(invoiceUnitPrice * quantity).toLocaleString('id-ID')}`;
      const totalBayar = Number(newOrder?.total_price || invoiceSubtotal) + Number(newOrder?.shipping_cost || shippingCost || 0);

      let paymentText = '';
      if (paymentInfo?.bank_name && paymentInfo?.bank_account_number) {
        paymentText = `\n\nINFO TRANSFER:\nBank: ${paymentInfo.bank_name}\nNo. Rek: ${paymentInfo.bank_account_number}\na.n. ${paymentInfo.bank_account_holder || '-'}`;
        if (paymentInfo.qris_image) {
          paymentText += `\n\nQRIS tersedia di detail tagihan`;
        }
      }

      if (socketRef.current) {
        socketRef.current.emit('send_message', {
          conversationId,
          senderId: userData.id,
          senderName: userData.name || userData.username,
          text: `TAGIHAN PESANAN #${newOrder.id}\n---\nBarang:\n${itemLines}\nOngkir: Rp${Number(newOrder?.shipping_cost || shippingCost || 0).toLocaleString('id-ID')}\nAlamat: ${shippingAddress || '-'}\n---\nTOTAL BAYAR: Rp${totalBayar.toLocaleString('id-ID')}\nSilakan transfer dan upload bukti pembayaran di halaman Pesanan.${paymentText}`,
          type: 'invoice',
          productId: invoiceProductId,
          invoice_items: orderItems.length > 0 ? orderItems.map((item: any) => ({
            productId: item.productId,
            name: item.Product?.name || 'Produk',
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
          })) : [{
            productId: invoiceProductId,
            name: selectedRequest?.product_info?.name || 'Produk',
            quantity,
            price: invoiceUnitPrice,
          }],
          payment_info: paymentInfo ? {
            bank_name: paymentInfo.bank_name,
            bank_account_number: paymentInfo.bank_account_number,
            bank_account_holder: paymentInfo.bank_account_holder,
            qris_image: paymentInfo.qris_image,
          } : null,
        });
      }

      toast.success('Tagihan berhasil dikirim!');
      setIsInvoiceModalOpen(false);
      setShippingCost('');
      setShippingAddress('');
      setInvoiceQuantity('1');
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

  const isSameDay = (firstDateStr?: string, secondDateStr?: string) => {
    if (!firstDateStr || !secondDateStr) return false;
    const firstDate = new Date(firstDateStr);
    const secondDate = new Date(secondDateStr);

    return (
      firstDate.getFullYear() === secondDate.getFullYear() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getDate() === secondDate.getDate()
    );
  };

  const formatDateDivider = (dateStr: string) => {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(dateStr, today.toISOString())) return 'Hari ini';
    if (isSameDay(dateStr, yesterday.toISOString())) return 'Kemarin';

    const includeYear = date.getFullYear() !== today.getFullYear();
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      ...(includeYear ? { year: 'numeric' } : {}),
    });
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
              <ImageWithFallback src={product.image || ''} alt={product.name} preset="thumbnail" className="w-full h-full object-cover" />
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
          messages.map((msg, index) => {
            const isSender = msg.senderId === userData.id;
            const isPurchaseRequest = msg.type === 'purchase_request';
            const isInvoice = msg.type === 'invoice';
            const previousMessage = messages[index - 1];
            const shouldShowDateDivider = !previousMessage || !isSameDay(previousMessage.createdAt, msg.createdAt);

            return (
              <div key={msg.id} className="space-y-3">
                {shouldShowDateDivider && (
                  <div className="flex items-center justify-center py-2">
                    <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
                      {formatDateDivider(msg.createdAt)}
                    </span>
                  </div>
                )}

                <div className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
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
                          setInvoiceQuantity('1');
                          // Auto-fill alamat pengiriman dari profil pembeli
                          setShippingAddress(buyerAddress || '');
                          setIsInvoiceModalOpen(true);
                        }}
                        className="w-full mt-3 h-10 rounded-xl text-xs bg-orange-500 hover:bg-orange-600 text-white shadow-md border-0 animate-pulse"
                      >
                        Konfirmasi & Buat Tagihan
                      </Button>
                    )}

                    {/* Action Button for Buyer on Invoice */}
                    {isInvoice && !isSender && (
                      <div className="space-y-2 mt-3">
                        {/* Show payment info if available */}
                        {msg.payment_info?.bank_name && (
                          <div className="bg-white/90 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-2 text-green-800">
                              <Banknote className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-wider">Info Transfer</span>
                            </div>
                            <div className="text-sm text-green-900">
                              <p className="font-bold">{msg.payment_info.bank_name} - {msg.payment_info.bank_account_number}</p>
                              <p className="text-xs">a.n. {msg.payment_info.bank_account_holder}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.payment_info?.bank_account_number || '');
                                  toast.success('Nomor rekening disalin!');
                                }}
                                className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors"
                              >
                                <Copy className="w-3 h-3" /> Salin No. Rek
                              </button>
                              {msg.payment_info.qris_image && (
                                <button
                                  onClick={() => {
                                    setSellerPaymentInfo(msg.payment_info);
                                    setShowQrisInvoice(true);
                                  }}
                                  className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors"
                                >
                                  <QrCode className="w-3 h-3" /> Lihat QRIS
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        <Button 
                          onClick={onNavigateToOrders}
                          className="w-full h-9 rounded-xl text-xs bg-green-500 hover:bg-green-600 text-white shadow-sm border-0"
                        >
                          Bayar Sekarang
                        </Button>
                      </div>
                    )}

                    <p className={`text-[10px] text-right mt-1 ${isSender ? 'text-white/80' : 'text-gray-400'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
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
          <Card className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" /> Buat Tagihan
              </h3>
              <p className="text-green-50/80 text-sm mt-1">Atur jumlah barang dan biaya pengiriman</p>
            </div>
            <CardContent className="p-6 max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0">
                      <img
                        src={selectedRequest?.product_info?.images?.[0] || selectedRequest?.product_info?.image || ''}
                        alt={selectedRequest?.product_info?.name || 'Produk'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 truncate">{selectedRequest?.product_info?.name || 'Produk'}</p>
                      <p className="text-xs text-green-600 font-bold">Rp {invoiceUnitPrice.toLocaleString('id-ID')}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr] sm:items-end">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Jumlah</label>
                      <Input
                        type="number"
                        min={1}
                        value={invoiceQuantity}
                        onChange={(event) => setInvoiceQuantity(String(Math.max(Number(event.target.value) || 1, 1)))}
                        className="rounded-xl bg-white"
                        required
                      />
                    </div>
                    <div className="rounded-xl bg-white p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">Subtotal barang</span>
                        <span className="font-bold text-green-700">Rp {invoiceSubtotal.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
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
                  <label className="text-sm font-semibold text-gray-700">Alamat Pengiriman</label>
                  {buyerAddress && (
                    <p className="text-xs text-gray-500 -mt-1">📍 Otomatis terisi dari profil pembeli</p>
                  )}
                  <Input 
                    placeholder="Tulis alamat pengiriman" 
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="rounded-xl h-12 bg-gray-50/50 border-gray-200"
                  />
                </div>

                <div className="rounded-2xl border border-green-100 bg-green-50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700">Subtotal Barang</span>
                    <span className="font-bold text-green-900">Rp {invoiceSubtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700">Ongkir</span>
                    <span className="font-bold text-green-900">Rp {(Number(shippingCost) || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-green-200 pt-2">
                    <span className="font-semibold text-green-800">Total Bayar</span>
                    <span className="text-lg font-bold text-green-900">Rp {invoiceTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => {
                      setIsInvoiceModalOpen(false);
                      setInvoiceQuantity('1');
                    }}
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
      {/* QRIS Preview Dialog from Invoice */}
      {showQrisInvoice && sellerPaymentInfo?.qris_image && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowQrisInvoice(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><QrCode className="w-5 h-5" /> QRIS Pembayaran</h3>
              <button onClick={() => setShowQrisInvoice(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="flex justify-center">
              <img src={sellerPaymentInfo.qris_image} alt="QRIS" className="max-w-full max-h-[350px] object-contain rounded-xl" />
            </div>
            <div className="text-center text-sm text-gray-600">
              <p className="font-bold">{sellerPaymentInfo.bank_name} - {sellerPaymentInfo.bank_account_number}</p>
              <p>a.n. {sellerPaymentInfo.bank_account_holder}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
