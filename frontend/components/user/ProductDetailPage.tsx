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
  onProductClick: (product: Product) => void;
};

export function ProductDetailPage({ product: initialProduct, onBack, userData, isGuest, onNavigateToAuth, onViewCreator, onChatSeller, onProductClick }: ProductDetailPageProps) {
  const t = getTranslation((userData.language as Language) || 'id');
  const [product, setProduct] = useState(initialProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [reportCategory, setReportCategory] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchFullDetails = async () => {
      setProduct(initialProduct);
      setCurrentImageIndex(0);
      setIsLoading(true);
      setIsRelatedLoading(true);
      try {
        const res = await productService.getById(initialProduct.id);
        const normalized = normalizeProduct(res.data);
        setProduct(normalized);

        try {
          const productsRes = await productService.getAll();
          const normalizedProducts: Product[] = (productsRes.data || []).map(normalizeProduct);
          const categoryName = (normalized.category || '').toLowerCase();
          const related = normalizedProducts
            .filter((item) => {
              if (String(item.id) === String(normalized.id)) return false;
              if (normalized.categoryId && item.categoryId === normalized.categoryId) return true;
              return categoryName !== '' && (item.category || '').toLowerCase() === categoryName;
            })
            .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.sold_count || 0) - (a.sold_count || 0))
            .slice(0, 4);

          setRelatedProducts(related);
        } catch (error) {
          console.error('Failed to fetch related products:', error);
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error('Failed to fetch product details:', error);
      } finally {
        setIsLoading(false);
        setIsRelatedLoading(false);
      }
    };

    if (initialProduct.id) {
      fetchFullDetails();
    }
  }, [initialProduct.id]);

  // KODE PERBAIKAN: Parsing images dengan aman
  let parsedImages: string[] = [];
  
  if (product.images) {
    if (Array.isArray(product.images)) {
      parsedImages = product.images;
    } else if (typeof product.images === 'string') {
      try {
        parsedImages = JSON.parse(product.images);
      } catch (error) {
        parsedImages = [product.images]; 
      }
    }
  }

  const productImages = parsedImages.length > 0
    ? parsedImages
    : [product.image || 'https://placehold.co/800x800?text=No+Image'];

  const nextImage = () => setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
  const prevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));

  const getPrice = () => {
    const p = product.price;
    return typeof p === 'number' ? p : parseInt(String(p)) || 0;
  };

  const handleSendReport = async () => {
    if (isGuest) {
      toast.error('Silakan login untuk melaporkan produk');
      onNavigateToAuth?.();
      return;
    }

    if (!reportCategory || !reportDescription) {
      toast.error('Harap lengkapi kategori dan deskripsi laporan');
      return;
    }

    setIsSubmitting(true);
    try {
      await productService.report(product.id, {
        reason: reportCategory,
        description: reportDescription,
      });
      setIsSubmitting(false);
      setIsReportModalOpen(false);
      setReportCategory('');
      setReportDescription('');
      toast.success('Laporan berhasil dikirim. Terima kasih atas masukan Anda.', {
        icon: <ShieldAlert className="w-5 h-5 text-red-500" />
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal mengirim laporan produk';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-orange-50 pb-10">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:py-7">
        <Button variant="ghost" onClick={onBack} className="mb-4 rounded-lg hover:bg-white/70">
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t.back || 'Kembali'}
        </Button>

        <Card className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-white/80 bg-white shadow-lg">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
              <p className="text-gray-500">Memuat detail produk...</p>
            </div>
          ) : (
            <CardContent className="w-full p-0">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
                <div className="border-b bg-gray-50 p-3 sm:p-4 lg:border-b-0 lg:border-r">
                  <div className="relative flex aspect-[4/3] max-h-[560px] items-center justify-center overflow-hidden rounded-xl bg-white group">
                    <ImageWithFallback src={productImages[currentImageIndex]} alt={product.name} preset="detail" className="h-full w-full object-contain transition-all duration-500" />
                    {productImages.length > 1 && (
                      <>
                        <button onClick={prevImage} className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all hover:bg-white">
                          <ChevronLeft className="w-5 h-5 text-gray-800" />
                        </button>
                        <button onClick={nextImage} className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all hover:bg-white">
                          <ChevronRight className="w-5 h-5 text-gray-800" />
                        </button>
                      </>
                    )}
                  </div>

                  {productImages.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {productImages.map((image: string, idx: number) => (
                        <button
                          key={`${image}-${idx}`}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition-all ${currentImageIndex === idx ? 'border-green-500 shadow-sm' : 'border-transparent hover:border-gray-300'}`}
                          aria-label={`Lihat gambar produk ${idx + 1}`}
                        >
                          <ImageWithFallback src={image} alt={`${product.name} ${idx + 1}`} preset="thumbnail" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col p-5 sm:p-6 lg:p-7">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Badge className="mb-3 rounded-full border border-green-200 bg-green-100 px-3 py-1 font-semibold text-green-700 shadow-sm">
                        {product.category || 'Umum'}
                      </Badge>
                      <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">{product.name}</h1>
                      <p className="mt-2 text-sm text-gray-600 sm:text-base">
                        oleh{' '}
                        <span
                          className="cursor-pointer font-bold text-gray-900 underline decoration-green-200 underline-offset-4 transition-all hover:text-green-600 hover:decoration-green-500"
                          onClick={() => onViewCreator(product.userId, product.creator || 'Kreator')}
                        >
                          {product.creator || 'Kreator'}
                        </span>
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-gray-100 p-1 shadow-lg">
                        <DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="cursor-pointer gap-2 rounded-lg py-2 text-red-600 focus:bg-red-50 focus:text-red-700">
                          <Flag className="w-4 h-4" />
                          Laporkan Produk
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mb-5 flex items-center gap-3 text-sm">
                    <div className="flex items-center rounded-lg bg-yellow-50 px-2 py-1">
                      <Star className="mr-1.5 h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-yellow-700">{product.rating || '0'}</span>
                    </div>
                    <span className="text-gray-300">/</span>
                    <div className="flex items-center">
                      <span className="mr-1 font-semibold text-gray-800">{product.sold_count || '0'}</span>
                      <span className="text-gray-500">Terjual</span>
                    </div>
                  </div>

                  <div className="mb-6 rounded-xl bg-gray-50 p-4">
                    <h3 className="mb-2 font-semibold text-gray-800">Deskripsi Produk</h3>
                    <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                      {product.description || 'Karya seni unik yang dibuat dengan tangan menggunakan teknik tradisional yang dikombinasikan dengan desain modern.'}
                    </p>
                  </div>

                  <div className="mt-auto border-t pt-5">
                    <div className="mb-5">
                      <p className="mb-1 text-sm text-gray-500">Harga</p>
                      <span className="text-3xl font-bold text-green-700 sm:text-4xl">Rp {getPrice().toLocaleString('id-ID')}</span>
                    </div>

                    <Button
                      onClick={() => onChatSeller(product)}
                      className="h-12 w-full rounded-xl bg-gradient-to-r from-[var(--theme-light)] to-[var(--theme-secondary)] text-base text-white shadow-md transition-all hover:shadow-lg"
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

        {!isLoading && product && (
          <ReviewSection
            productId={product.id}
            userData={userData}
            isGuest={isGuest}
          />
        )}

        {!isLoading && (isRelatedLoading || relatedProducts.length > 0) && (
          <section className="mt-6 rounded-2xl border border-white/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Rekomendasi Produk Serupa</h2>
                <p className="text-sm text-gray-500">Pilihan lain dari kategori {product.category || 'yang sama'}</p>
              </div>
            </div>

            {isRelatedLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-green-500" />
                Memuat rekomendasi...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {relatedProducts.map((item) => (
                  <Card
                    key={item.id}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg"
                    onClick={() => onProductClick(item)}
                  >
                    <div className="relative aspect-[6/5] overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={item.image || item.images?.[0] || ''}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <Badge className="absolute right-2 top-2 border-0 bg-white/90 text-[10px] text-gray-800 shadow-sm backdrop-blur md:text-xs">
                        {item.category}
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-gray-800 transition-colors group-hover:text-green-600">{item.name}</h3>
                      <p className="mb-2 line-clamp-1 text-xs text-gray-500">oleh {item.creator}</p>
                      <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                        <span className="text-sm font-bold text-[var(--theme-primary)]">
                          Rp {(typeof item.price === 'number' ? item.price : parseInt(String(item.price)) || 0).toLocaleString('id-ID')}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-700">
                          <Star className="h-3.5 w-3.5" fill={item.rating ? '#fac824' : 'transparent'} color={item.rating ? '#fac824' : '#d1d5db'} />
                          {item.rating ? item.rating.toFixed(1) : '0'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

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
                    <SelectItem value="counterfeit">Produk Tiruan</SelectItem>
                    <SelectItem value="inappropriate">Konten Tidak Pantas</SelectItem>
                    <SelectItem value="copyright">Pelanggaran Hak Cipta</SelectItem>
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