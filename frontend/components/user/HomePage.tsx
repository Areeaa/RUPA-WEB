import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { UserData, Product } from '../../types';
import { Star, Package, ShoppingBag, Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { getTranslation, type Language } from '../../utils/translations';
import { productService } from '../../utils/apiServices';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type HomePageProps = {
  userData: UserData;
  onProductClick: (product: Product) => void;
  navigateToOrders: () => void;
  isGuest?: boolean;
};

// Helper to normalize backend product to frontend Product type
function normalizeProduct(p: any): Product {
  const images = p.images || [];
  return {
    ...p,
    id: p.id,
    name: p.name,
    price: typeof p.price === 'string' ? parseInt(p.price) || 0 : p.price,
    images: images,
    image: images.length > 0 ? images[0] : 'https://placehold.co/400x400?text=No+Image',
    description: p.description,
    category: p.category?.name || p.category || 'Umum',
    categoryId: p.categoryId,
    creator: p.creator?.name || p.creatorObj?.name || 'Kreator',
    creatorObj: p.creator && typeof p.creator === 'object' ? p.creator : undefined,
    rating: typeof p.rating === 'string' ? parseFloat(p.rating) : (p.rating || 0),
    review_count: typeof p.review_count === 'string' ? parseInt(p.review_count) : (p.review_count || 0),
    sold_count: typeof p.sold_count === 'string' ? parseInt(p.sold_count) : (p.sold_count || 0),
  };
}

export { normalizeProduct };

export function HomePage({ userData, onProductClick, navigateToOrders, isGuest }: HomePageProps) {
  const t = getTranslation((userData.language as Language) || 'id');

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productService.getAll(),
          productService.getCategories()
        ]);
        // Normalize products from backend
        const normalized = (productsRes.data || []).map(normalizeProduct);
        setProducts(normalized);
        setCategories(categoriesRes.data.map((c: any) => typeof c === 'string' ? c : c.name));
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);



  let filteredWorks = products.filter(work =>
    work.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (work.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (work.creator || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (categoryFilter !== 'all') {
    filteredWorks = filteredWorks.filter(work => work.category === categoryFilter);
  }

  if (priceFilter !== 'all') {
    const getPrice = (w: Product) => typeof w.price === 'string' ? parseInt(w.price) || 0 : w.price;
    if (priceFilter === 'under-100') filteredWorks = filteredWorks.filter(w => getPrice(w) < 100000);
    else if (priceFilter === '100-500') filteredWorks = filteredWorks.filter(w => getPrice(w) >= 100000 && getPrice(w) <= 500000);
    else if (priceFilter === 'over-500') filteredWorks = filteredWorks.filter(w => getPrice(w) > 500000);
  }

  if (sortBy === 'price-low') {
    filteredWorks.sort((a, b) => (typeof a.price === 'number' ? a.price : 0) - (typeof b.price === 'number' ? b.price : 0));
  } else if (sortBy === 'price-high') {
    filteredWorks.sort((a, b) => (typeof b.price === 'number' ? b.price : 0) - (typeof a.price === 'number' ? a.price : 0));
  } else if (sortBy === 'rating') {
    filteredWorks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div
        className="pb-24 pt-8 px-4 rounded-b-[40px] shadow-sm bg-gradient-to-r from-[var(--theme-light)] to-[var(--theme-secondary)]"
      >
        <div className="container mx-auto space-y-6">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">{t.welcomeBack}, {userData.name || userData.username}! 👋</h2>
            </div>
          </div>

          <div className="relative max-w-3xl mx-auto shadow-xl rounded-2xl transform translate-y-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Cari karya anak bangsa, kategori, atau nama kreator..."
              className="pl-12 pr-4 py-4 h-14 w-full rounded-2xl border-0 ring-4 ring-white/20 text-gray-800 text-lg bg-white focus-visible:ring-offset-0 focus-visible:ring-green-400 shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-6 mt-4">
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {searchQuery ? `Hasil Pencarian: "${searchQuery}"` : 'Rekomendasi Hari Ini'}
            </h2>
            <p className="text-gray-500 text-sm">
              {searchQuery ? `Ditemukan ${filteredWorks.length} produk` : 'Temukan karya unik dari kreator lokal'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mr-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-500" /> Filter:
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] rounded-xl h-10 bg-gray-50/50 border-gray-200">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-[160px] rounded-xl h-10 bg-gray-50/50 border-gray-200">
                <SelectValue placeholder="Harga" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Semua Harga</SelectItem>
                <SelectItem value="under-100">Di bawah Rp 100rb</SelectItem>
                <SelectItem value="100-500">Rp 100rb - 500rb</SelectItem>
                <SelectItem value="over-500">Di atas Rp 500rb</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] rounded-xl h-10 bg-gray-50/50 border-gray-200">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="recommended">Rekomendasi</SelectItem>
                <SelectItem value="price-low">Termurah</SelectItem>
                <SelectItem value="price-high">Termahal</SelectItem>
                <SelectItem value="rating">Rating Tertinggi</SelectItem>
              </SelectContent>
            </Select>

            {(categoryFilter !== 'all' || priceFilter !== 'all' || sortBy !== 'recommended') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setCategoryFilter('all');
                  setPriceFilter('all');
                  setSortBy('recommended');
                }}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-10 px-4 ml-auto"
              >
                Reset Filter
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
              <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
              <p className="text-gray-500">Memuat karya kreatif...</p>
            </div>
          ) : filteredWorks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredWorks.map((work) => (
                <Card
                  key={work.id}
                  className="rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group cursor-pointer bg-white"
                  onClick={() => onProductClick(work)}
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={work.image || ''}
                      alt={work.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <Badge className="absolute top-2 right-2 bg-white/90 text-gray-800 border-0 backdrop-blur shadow-sm text-[10px] md:text-xs">
                      {work.category}
                    </Badge>
                  </div>
                  <CardContent className="p-3 md:p-4">
                    <h3 className="text-gray-800 mb-1 line-clamp-2 font-medium text-sm md:text-base group-hover:text-green-600 transition-colors">{work.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">oleh {work.creator}</p>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                      <span className="font-bold text-sm md:text-lg text-[var(--theme-primary)]">
                        Rp {(typeof work.price === 'number' ? work.price : parseInt(String(work.price)) || 0).toLocaleString('id-ID')}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 md:w-4 md:h-4" fill={work.rating ? "#fac824" : "transparent"} color={work.rating ? "#fac824" : "#d1d5db"} />
                        <span className="text-xs md:text-sm text-gray-700">{work.rating ? work.rating.toFixed(1) : '0'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Pencarian Tidak Ditemukan</h3>
              <p className="text-gray-500">Coba ubah kata kunci atau hapus filter yang ada.</p>
              <Button
                variant="outline"
                onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setPriceFilter('all'); setSortBy('recommended'); }}
                className="mt-4 rounded-xl"
              >
                Hapus Semua Filter
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
          <Card className="rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-green-700 text-lg">
                <ShoppingBag className="w-5 h-5 mr-2" /> Cara Pembelian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Pilih produk incaranmu → Chat Penjual → Nego Harga → Sepakat & Bayar! Transaksi lebih hangat dan personal.
              </p>
            </CardContent>
          </Card>

          {!isGuest && (
            <Card className="rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-blue-700 text-lg">
                  <Package className="w-5 h-5 mr-2" /> Status Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Kamu memiliki transaksi yang sedang dalam proses pengiriman.
                </p>
                <Button
                  onClick={navigateToOrders}
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Cek Pesanan Saya
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}