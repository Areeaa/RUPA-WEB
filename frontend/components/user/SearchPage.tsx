import { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { CartItem } from '../../types';
import type { UserData } from '../../types';
import { Search, Filter, Star, Plus, SlidersHorizontal, Heart } from 'lucide-react';
import { toast } from 'sonner';
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

type SearchPageProps = {
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  userData: UserData;
};

export function SearchPage({ addToCart, favorites, toggleFavorite, userData }: SearchPageProps) {
  const t = getTranslation((userData.language as Language) || 'id');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productService.getAll();
        setAllProducts((res.data || []).map(normalizeProduct));
      } catch (error) {
        toast.error('Gagal memuat produk');
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesPrice && matchesCategory;
  });

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      creator: product.creator,
      image: product.image,
    });
    toast.success(`${product.name} ${t.addedToCart}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-800 mb-2">{t.searchTitle}</h1>
          <p className="text-gray-600">{t.searchDesc}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl shadow-lg border-0 sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <SlidersHorizontal className="w-5 h-5 text-green-600" />
                    <h3 className="text-gray-800">{t.filter}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700 mb-2 block">{t.category}</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder={t.selectCategory} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t.allCategories}</SelectItem>
                          <SelectItem value="Daur Ulang">{t.recycling}</SelectItem>
                          <SelectItem value="Energi">{t.energy}</SelectItem>
                          <SelectItem value="Kerajinan">{t.crafts}</SelectItem>
                          <SelectItem value="Organik">{t.organic}</SelectItem>
                          <SelectItem value="Pertanian">{t.agriculture}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-700 mb-2 block">
                        {t.priceRange}: Rp {priceRange[0].toLocaleString('id-ID')} - Rp {priceRange[1].toLocaleString('id-ID')}
                      </Label>
                      <Slider
                        min={0}
                        max={500000}
                        step={10000}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="mt-2"
                      />
                    </div>

                    <Button 
                      onClick={() => {
                        setSelectedCategory('all');
                        setPriceRange([0, 500000]);
                        setSearchQuery('');
                      }}
                      variant="outline" 
                      className="w-full rounded-xl"
                    >
                      {t.resetFilter}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                className="pl-12 rounded-2xl border-gray-200 focus:border-green-400 focus:ring-green-400 h-14 shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Results */}
            <div>
              <p className="text-gray-600 mb-4">
                {t.showingResults} {filteredProducts.length} {t.results}
              </p>

              {filteredProducts.length === 0 ? (
                <Card className="rounded-2xl shadow-lg border-0">
                  <CardContent className="p-12 text-center">
                    <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl text-gray-800 mb-2">{t.noResults}</h3>
                    <p className="text-gray-600">{t.tryDifferentKeywords}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-2xl transition-all group">
                      <div className="relative h-48 overflow-hidden">
                        <ImageWithFallback
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <Badge className="absolute top-3 right-3 bg-green-500 text-white border-0">
                          {product.category}
                        </Badge>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite(product.id);
                            const favMessage = favorites.includes(product.id) 
                              ? `${product.name} ${t.removedFromFavorites}`
                              : `${product.name} ${t.addedToFavorites}`;
                            toast.success(favMessage);
                          }}
                          className="absolute top-3 left-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <Heart 
                            className={`w-4 h-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-red-500'}`} 
                          />
                        </button>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-1">
                          {t.by} {product.creator}
                        </p>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                        <div className="flex items-center gap-1 mb-3">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-700">{product.rating}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-green-700">
                            Rp {product.price.toLocaleString('id-ID')}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                            className="rounded-lg bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            {t.add}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
