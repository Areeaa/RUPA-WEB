import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Input } from '../ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  CreditCard, 
  CheckCircle,
  Clock,
  ExternalLink,
  Star,
  MessageSquare,
  RotateCcw,
  AlertCircle,
  XCircle,
  FileVideo,
  Image as ImageIcon,
  Eye,
  History,
  User,
  Mail,
  Palette,
  Upload,
  X,
  Check,
  ArrowLeft,
  CheckCircle2,
  Download,
  Printer,
  Copy,
  Share2,
  HelpCircle,
  FileText,
  Info,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { SuccessConfetti } from '../ui/success-confetti';
import type { UserData } from '../../types';
import { getTranslation, type Language } from '../../utils/translations';

import { OrderStatus, OrderItem, Order, ReturnStatus, ReturnRecord, UploadedFile } from '../../types/orders';
import { orderService, reviewService } from '../../utils/apiServices';
import { OrderReturnForm } from './orders/OrderReturnForm';

type OrdersPageProps = {
  userData: UserData;
  onNavigateToReturn?: (orderId: string) => void;
};

// Map backend status to display
function mapStatus(status: string) {
  const statusMap: Record<string, string> = {
    'pending': 'Menunggu Pembayaran',
    'waiting_verification': 'Menunggu Verifikasi',
    'processing': 'Diproses',
    'shipped': 'Dikirim',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan',
  };
  return statusMap[status] || status;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'waiting_verification': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusProgress(status: string) {
  switch (status) {
    case 'pending': return 10;
    case 'waiting_verification': return 30;
    case 'processing': return 50;
    case 'shipped': return 75;
    case 'completed': return 100;
    default: return 0;
  }
}

function getReturnStatusColor(status: string) {
  switch (status) {
    case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Approved': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Received': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function OrdersPage({ userData, onNavigateToReturn }: OrdersPageProps) {
  const t = getTranslation((userData.language as Language) || 'id');
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnHistory, setReturnHistory] = useState<ReturnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Record<string, { rating: number; comment: string }>>({});
  const [currentReview, setCurrentReview] = useState({ rating: 5, comment: '' });
  const [selectedEvidence, setSelectedEvidence] = useState<ReturnRecord | null>(null);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const [paymentOrderId, setPaymentOrderId] = useState<number | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);

  const [selectedReviewItem, setSelectedReviewItem] = useState<{orderId: number, productId: number, productName: string} | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const ordersRes = await orderService.getMyOrders();
      setOrders(ordersRes.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Gagal mengambil data pesanan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentOrderId || !paymentFile) return;
    setIsUploadingPayment(true);
    try {
      const formData = new FormData();
      formData.append('payment_proof', paymentFile);
      await orderService.confirmPayment(paymentOrderId, formData);
      toast.success('Bukti pembayaran berhasil diunggah! Mohon tunggu verifikasi penjual.');
      setPaymentOrderId(null);
      setPaymentFile(null);
      fetchOrders();
    } catch (error) {
      toast.error('Gagal mengunggah bukti pembayaran');
    } finally {
      setIsUploadingPayment(false);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewItem || !currentReview.rating) return;
    if (!selectedReviewItem) return;
    setIsSubmittingReview(true);
    try {
      await reviewService.create({
        orderId: selectedReviewItem.orderId,
        productId: selectedReviewItem.productId,
        rating: currentReview.rating,
        comment: currentReview.comment
      });
      toast.success('Ulasan berhasil dikirim! Terima kasih.');
      setSelectedReviewItem(null);
      setCurrentReview({ rating: 5, comment: '' });
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengirim ulasan');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleConfirmReceipt = async (orderId: number) => {
    try {
      await orderService.completeOrder(orderId);
      toast.success('Pesanan selesai! Terima kasih telah berbelanja.');
      fetchOrders();
    } catch (error) {
      toast.error('Gagal menyelesaikan pesanan');
    }
  };

  // Return submission form states
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedReturnId, setGeneratedReturnId] = useState('');
  const [submittedReturn, setSubmittedReturn] = useState<ReturnRecord | null>(null);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null);
  const [selectedItemForReturn, setSelectedItemForReturn] = useState<OrderItem | null>(null);


  const handleTrackPackage = (order: Order) => {
    toast.success('Lacak Paket', {
      description: `Nomor resi: ${order.tracking_number}`,
    });
  };

  const handleSubmitReview = (itemId: string) => {
    setReviews({ ...reviews, [itemId]: currentReview });
    toast.success(t.reviewSubmitted);
    setCurrentReview({ rating: 5, comment: '' });
  };

  const handleStartReturn = (order: any, item: any) => {
    setSelectedOrderForReturn(order);
    setSelectedItemForReturn(item);
    setShowReturnForm(true);
  };

  const getReturnStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCopyReturnId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success(t.returnIdCopied);
  };

  const currentTheme = { primary: '#16a34a', light: '#dcfce7', secondary: '#4ade80' };

  if (showReturnForm && selectedOrderForReturn && selectedItemForReturn) {
    return (
      <OrderReturnForm 
        userData={userData} 
        order={selectedOrderForReturn} 
        item={selectedItemForReturn} 
        onCancel={() => setShowReturnForm(false)} 
        onSuccess={(newReturn) => {
          setGeneratedReturnId(newReturn.returnId);
          setSubmittedReturn(newReturn);
          setShowReturnForm(false);
          setShowSuccessDialog(true);
          setActiveTab('returns');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl text-gray-800 mb-2">{t.myOrders}</h1>
          <p className="text-gray-600">{t.ordersDesc}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 rounded-xl">
            <TabsTrigger value="orders" className="rounded-xl">
              <Package className="w-4 h-4 mr-2" />
              {t.myOrders}
            </TabsTrigger>
            <TabsTrigger value="returns" className="rounded-xl">
              <History className="w-4 h-4 mr-2" />
              {t.returnHistory}
            </TabsTrigger>
            <TabsTrigger value="submit" className="rounded-xl">
              <RotateCcw className="w-4 h-4 mr-2" />
              {t.submitNewReturn}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-lg">
                <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
                <p className="text-gray-500">Memuat pesanan Anda...</p>
              </div>
            ) : orders.length === 0 ? (
              <Card className="rounded-2xl shadow-lg border-0 text-center p-12">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100">
                    <Package className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl text-gray-800 mb-2">Belum Ada Pesanan</h3>
                  <p className="text-gray-600 mb-6">Mulai dukung inovator muda Indonesia dengan berbelanja karya mereka</p>
                  <Button className="rounded-xl text-white bg-green-600 hover:bg-green-700">Jelajahi Karya</Button>
                </div>
              </Card>
            ) : (
              orders.map((order: any) => (
                <Card key={order.id} className="rounded-2xl shadow-lg border-0 overflow-hidden">
                  <CardHeader className="text-white bg-gradient-to-r from-green-600 to-green-400">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <CardTitle className="text-white">Order #{order.id}</CardTitle>
                        <CardDescription className="text-white/90 flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          Dipesan pada: {new Date(order.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(order.status)} border`}>{mapStatus(order.status)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <Progress value={getStatusProgress(order.status)} className="h-2" />
                    </div>

                    {order.status === 'pending' && (
                      <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-4 flex items-center gap-3 text-red-700">
                        <Clock className="w-5 h-5 animate-pulse" />
                        <div className="text-xs">
                          <p className="font-bold">Batas Waktu Pembayaran</p>
                          <p>Selesaikan pembayaran sebelum {new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000).toLocaleString('id-ID', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} atau pesanan akan dibatalkan otomatis.</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Harga</p>
                        <p className="text-xl font-bold text-gray-800">Rp {Number(order.total_price || 0).toLocaleString('id-ID')}</p>
                      </div>
                      {order.tracking_number && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">No. Resi</p>
                          <p className="font-mono text-sm font-bold">{order.tracking_number}</p>
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />
                    
                    <div className="space-y-4 mb-6">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                            <ImageWithFallback src={item.Product?.images?.[0]} alt={item.Product?.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800 line-clamp-1">{item.Product?.name}</h4>
                            <p className="text-sm text-gray-500">Rp {item.price.toLocaleString('id-ID')} x {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-100">
                      {order.status === 'pending' && (
                        <div className="w-full space-y-3">
                          <Label className="text-sm font-bold text-orange-600">Unggah Bukti Transfer</Label>
                          <form onSubmit={handleUploadPayment} className="flex flex-col md:flex-row gap-2">
                            <Input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                setPaymentOrderId(order.id);
                                setPaymentFile(e.target.files?.[0] || null);
                              }}
                              className="rounded-xl flex-1 h-10 py-1.5"
                            />
                            <Button 
                              type="submit" 
                              disabled={isUploadingPayment || paymentOrderId !== order.id || !paymentFile}
                              className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white h-10 px-6 shadow-md"
                            >
                              {isUploadingPayment && paymentOrderId === order.id ? <Loader2 className="animate-spin w-4 h-4" /> : 'Unggah'}
                            </Button>
                          </form>
                          <p className="text-[10px] text-gray-500 italic">Lihat info rekening di chat atau detail pesanan.</p>
                        </div>
                      )}

                      {order.status === 'shipped' && (
                        <Button 
                          onClick={() => handleConfirmReceipt(order.id)}
                          className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md h-12 text-lg font-bold"
                        >
                          Selesaikan Pesanan & Konfirmasi Diterima
                        </Button>
                      )}

                      {order.status === 'completed' && (
                        <div className="w-full space-y-2">
                          {order.items?.map((item: any) => (
                            <Button 
                              key={item.id}
                              variant="outline"
                              onClick={() => setSelectedReviewItem({ 
                                orderId: order.id, 
                                productId: item.productId,
                                productName: item.Product?.name || 'Produk' 
                              })}
                              className="w-full rounded-xl border-green-200 text-green-700 hover:bg-green-50 h-10 text-xs"
                            >
                              <Star className="w-4 h-4 mr-2" /> Beri Ulasan: {item.Product?.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="returns" className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-lg">
                <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
                <p className="text-gray-500">Memuat riwayat pengembalian...</p>
              </div>
            ) : returnHistory.length === 0 && !submittedReturn ? (
              <Card className="rounded-2xl shadow-lg border-0 text-center p-12">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-100">
                    <History className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl text-gray-800 mb-2">{t.returnHistoryEmpty}</h3>
                  <p className="text-gray-600">{t.returnHistoryEmptyDesc}</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {submittedReturn && (
                   <Card className="rounded-2xl shadow-lg border-4 border-green-400 overflow-hidden">
                     <CardHeader className="bg-green-500 text-white">
                       <CardTitle>Baru Diajukan: {submittedReturn.returnId}</CardTitle>
                     </CardHeader>
                     <CardContent className="p-6">
                       <p>{submittedReturn.productName}</p>
                       <p className="text-sm text-gray-600">Status: Pending</p>
                     </CardContent>
                   </Card>
                )}
                {returnHistory.map((ret) => (
                  <Card key={ret.returnId} className="rounded-2xl shadow-lg border-0 overflow-hidden">
                    <CardHeader className="bg-gray-100">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-gray-800">Retur #{ret.returnId}</CardTitle>
                        <Badge className={getReturnStatusColor(ret.returnStatus)}>{ret.returnStatus}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                          <ImageWithFallback src={ret.productImage} alt={ret.productName} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-medium">{ret.productName}</h4>
                          <p className="text-sm text-gray-600">{ret.returnReason}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submit">
             <Card className="rounded-2xl shadow-lg border-0 text-center p-12">
                <h3 className="text-xl mb-4">Pilih produk dari tab Pesanan Saya untuk melakukan retur</h3>
                <Button onClick={() => setActiveTab('orders')} className="bg-green-600 text-white rounded-xl">Ke Pesanan Saya</Button>
             </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          {showSuccessDialog && <SuccessConfetti />}
          <DialogContent className="rounded-3xl max-w-md text-center">
            <div className="py-6">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Retur Berhasil Diajukan</h2>
              <p className="text-gray-600 mb-6">ID Retur: {generatedReturnId}</p>
              <Button onClick={() => setShowSuccessDialog(false)} className="w-full bg-green-600 text-white rounded-xl">Selesai</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL BERI ULASAN */}
        <Dialog open={!!selectedReviewItem} onOpenChange={() => setSelectedReviewItem(null)}>
          <DialogContent className="rounded-3xl max-w-md">
            <DialogHeader>
              <DialogTitle>Beri Ulasan Produk</DialogTitle>
              <DialogDescription>Bagikan pengalaman Anda tentang {selectedReviewItem?.productName}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateReview} className="space-y-6 pt-4">
              <div className="flex flex-col items-center gap-3">
                <Label className="text-gray-700 font-bold">Rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCurrentReview({ ...currentReview, rating: star })}
                      className={`transition-all transform hover:scale-125 ${star <= currentReview.rating ? 'text-yellow-400 scale-110' : 'text-gray-300'}`}
                    >
                      <Star className="w-8 h-8" fill={star <= currentReview.rating ? 'currentColor' : 'transparent'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-bold">Komentar</Label>
                <Textarea 
                  placeholder="Ceritakan detail barangnya..." 
                  value={currentReview.comment}
                  onChange={(e) => setCurrentReview({ ...currentReview, comment: e.target.value })}
                  className="rounded-xl min-h-[100px] bg-gray-50 border-0"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setSelectedReviewItem(null)}
                  className="flex-1 rounded-xl h-12"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmittingReview || !currentReview.rating}
                  className="flex-1 rounded-xl h-12 bg-green-600 hover:bg-green-700 text-white shadow-md font-bold"
                >
                  {isSubmittingReview ? <Loader2 className="animate-spin" /> : 'Kirim Ulasan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
