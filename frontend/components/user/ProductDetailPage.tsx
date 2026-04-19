import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { UserData, Product } from '../../types';
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Flag, 
  ArrowLeft,
  MessageCircle, 
  ShieldAlert,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { getTranslation, type Language } from '../../utils/translations';
import { productService } from '../../utils/apiServices';
import { normalizeProduct } from './HomePage';
import { toast } from 'sonner';
import { ReviewSection } from './ReviewSection';

type ProductDetailPageProps = {
  product: any;
  onBack: () => void;
  userData: UserData;
  isGuest?: boolean;
  onNavigateToAuth?: () => void;
  onChatSeller: (product: any) => void; 
  onViewCreator: (creatorId: number, creatorName: string) => void;
};

export function ProductDetailPage({ product: initialProduct, onBack, userData, isGuest, onViewCreator, onNavigateToAuth, onChatSeller }: ProductDetailPageProps) {
  const t = getTranslation((userData.language as Language) || 'id');
  const [product, setProduct] = useState(initialProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const [reportCategory, setReportCategory] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchFullDetails = async () => {
      setIsLoading(true);
      try {
        const res = await productService.getById(initialProduct.id);
        const normalized = normalizeProduct(res.data);
        setProduct(normalized);
      } catch (error) {
        console.error('Failed to fetch product details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (initialProduct.id) {
      fetchFullDetails();
    }
  }, [initialProduct.id]);

  const themeColors: Record<string, { primary: string; light: string; secondary: string }> = {
    green: { primary: '#16a34a', light: '#22c55e', secondary: '#4ade80' },
    orange: { primary: '#ea580c', light: '#f97316', secondary: '#fb923c' },
    blue: { primary: '#2563eb', light: '#3b82f6', secondary: '#60a5fa' },
    purple: { primary: '#9333ea', light: '#a855f7', secondary: '#c084fc' },
    pink: { primary: '#db2777', light: '#ec4899', secondary: '#f472b6' },
  };
  const currentTheme = themeColors[userData.themeColor || 'green'] || themeColors.green;

  // Build images array from product
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image || 'https://placehold.co/800x800?text=No+Image'];

  const nextImage = () => setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
  const prevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));

  const getPrice = () => {
    const p = product.price;
    return typeof p === 'number' ? p : parseInt(String(p)) || 0;
  };

  const handleSendReport = () => {
    if (!reportCategory || !reportDescription) {
      toast.error('Harap lengkapi kategori dan deskripsi laporan');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsReportModalOpen(false);
      setReportCategory('');
      setReportDescription('');
      toast.success('Laporan berhasil dikirim. Terima kasih atas masukan Anda.', {
        icon: <ShieldAlert className="w-5 h-5 text-red-500" />
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-orange-50 pb-12">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={onBack} className="mb-6 hover:bg-white/50 rounded-xl">
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t.back || 'Kembali'}
        </Button>

        <Card className="rounded-3xl shadow-xl border-0 overflow-hidden bg-white min-h-[500px] flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
              <p className="text-gray-500">Memuat detail produk...</p>
            </div>
          ) : (
            <CardContent className="p-0 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              
              {/* Bagian Kiri: Slider Foto */}
              <div className="relative bg-gray-100 group aspect-square">
                <ImageWithFallback src={productImages[currentImageIndex]} alt={product.name} className="w-full h-full object-cover transition-all duration-500" />
                {productImages.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full">
                      {productImages.map((_: any, idx: number) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all ${currentImageIndex === idx ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Bagian Kanan: Detail */}
              <div className="p-8 md:p-12 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <Badge className="bg-green-100 text-green-800 border-0 mb-3 px-3 py-1 rounded-full">
                      {product.category || 'Umum'}
                    </Badge>
                    <h1 className="text-3xl font-bold text-gray-800 leading-tight mb-2">{product.name}</h1>
                    <p className="text-gray-500 text-lg">
                      oleh{' '}
                      <span 
                        className="font-semibold text-gray-800 hover:text-green-600 cursor-pointer underline-offset-4 hover:underline transition-all"
                        onClick={() => onViewCreator(product.userId, product.creator || 'Kreator')}
                      >
                        {product.creator || 'Kreator'}
                      </span>
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                        <MoreVertical className="w-6 h-6 text-gray-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-gray-100 p-1">
                      <DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer gap-2 py-2 rounded-lg">
                        <Flag className="w-4 h-4" />
                        Laporkan Produk
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1.5" />
                    <span className="font-bold text-yellow-700">{product.rating || '0'}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center">
                    <span className="text-gray-800 font-semibold mr-1">{product.sold_count || '0'}</span>
                    <span className="text-gray-500">Terjual</span>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-gray-800 font-semibold mb-2">Deskripsi Produk</h3>
                  <p className="text-gray-600 leading-relaxed line-clamp-6">
                    {product.description || 'Karya seni unik yang dibuat dengan tangan menggunakan teknik tradisional yang dikombinasikan dengan desain modern.'}
                  </p>
                </div>

                <div className="mt-auto pt-6 border-t">
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Harga</p>
                      <span className="text-4xl font-bold text-green-700">Rp {getPrice().toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => onChatSeller(product)}
                    className="w-full rounded-2xl h-14 text-lg text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all bg-gradient-to-r from-[var(--theme-light)] to-[var(--theme-secondary)]"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Chat Penjual
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* REVIEW SECTION */}
      {!isLoading && product && (
        <ReviewSection 
          productId={product.id} 
          userData={userData} 
          isGuest={isGuest} 
        />
      )}
      </div>

      {/* MODAL PELAPORAN */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> Laporkan Produk
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 ml-1">Kategori Pelanggaran</Label>
              <Select value={reportCategory} onValueChange={setReportCategory}>
                <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50/50"><SelectValue placeholder="Pilih alasan laporan" /></SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  <SelectItem value="fraud">Penipuan / Barang Palsu</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 ml-1">Detail Laporan</Label>
              <Textarea
                placeholder="Jelaskan alasan..."
                className="min-h-[120px] rounded-xl bg-gray-50/50 resize-none p-4"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)} className="flex-1 rounded-xl h-11">Batal</Button>
            <Button onClick={handleSendReport} disabled={isSubmitting} className="flex-1 rounded-xl h-11 bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
              {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}