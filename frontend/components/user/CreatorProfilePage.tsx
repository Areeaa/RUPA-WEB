import { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, Store, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { UserData } from '../../types';
import type { Product } from '../../types';
import { toast } from 'sonner';
import { productService } from '../../utils/apiServices';
import { normalizeProduct } from './HomePage';

type CreatorProfilePageProps = {
  userData: UserData;
  creatorId: number;
  creatorName: string;
  onBack: () => void;
  onProductClick: (product: Product) => void;
  onChatSeller: (product: Product) => void;
};

export function CreatorProfilePage({ userData, creatorId, creatorName, onBack, onProductClick, onChatSeller }: CreatorProfilePageProps) {
  const [creatorProducts, setCreatorProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorProducts = async () => {
      setIsLoading(true);
      try {
        const res = await productService.getProductsByUser(creatorId);
        const normalized = (res.data || []).map(normalizeProduct);
        setCreatorProducts(normalized);
      } catch (error) {
        console.error('Failed to fetch creator products:', error);
        toast.error('Gagal mengambil karya kreator');
      } finally {
        setIsLoading(false);
      }
    };

    if (creatorId) {
      fetchCreatorProducts();
    }
  }, [creatorId]);



  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <div className="container mx-auto px-4 pt-6 pb-2">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors bg-white/50 px-3 py-1.5 rounded-full">
          <ArrowLeft className="w-5 h-5 mr-1" /> Kembali
        </button>
      </div>

      <div className="container mx-auto px-4">
        <Card className="rounded-3xl shadow-lg border-0 overflow-hidden bg-white mb-8">
          <div className="h-32 md:h-48 w-full bg-gradient-to-r from-[var(--theme-light)] to-[var(--theme-secondary)]"></div>
          <CardContent className="px-6 md:px-12 pb-8 relative text-center md:text-left">
            <div className="flex flex-col md:flex-row gap-6 md:items-end -mt-12 md:-mt-16 mb-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden bg-gray-200 mx-auto md:mx-0 shadow-md">
                <ImageWithFallback src={`https://ui-avatars.com/api/?name=${creatorName}&background=random&size=200`} alt={creatorName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center justify-center md:justify-start gap-2">
                  {creatorName} <Badge className="bg-blue-100 text-blue-700 border-0">Terverifikasi</Badge>
                </h1>
                <p className="text-gray-500 flex items-center justify-center md:justify-start gap-1 mt-1">
                  <MapPin className="w-4 h-4" /> Indonesia
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => toast.success(`Mengikuti ${creatorName}`)} className="rounded-xl">Ikuti</Button>
                {creatorProducts.length > 0 && (
                    <Button onClick={() => onChatSeller(creatorProducts[0])} className="rounded-xl text-white bg-gradient-to-r from-[var(--theme-light)] to-[var(--theme-secondary)]">
                    <MessageCircle className="w-4 h-4 mr-2" /> Chat
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 flex items-center gap-2">
          <Store className="w-6 h-6 text-gray-700" />
          <h2 className="text-2xl font-bold text-gray-800">Karya dari {creatorName}</h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
            <p className="text-gray-500">Memuat karya kreator...</p>
          </div>
        ) : creatorProducts.length === 0 ? (
          <Card className="rounded-2xl p-12 text-center bg-white shadow-sm border-0">
            <p className="text-gray-500 italic">Kreator ini belum memiliki karya yang dipublikasikan.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatorProducts.map((work) => (
              <Card key={work.id} className="rounded-2xl shadow-sm border-0 overflow-hidden hover:shadow-xl transition-all cursor-pointer bg-white" onClick={() => onProductClick(work)}>
                <div className="h-48 bg-gray-100"><ImageWithFallback src={work.image} alt={work.name} className="w-full h-full object-cover" /></div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-800 truncate">{work.name}</h3>
                  <div className="flex justify-between mt-2">
                    <span className="font-bold text-green-700">Rp {work.price.toLocaleString('id-ID')}</span>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4" fill={work.rating ? "#fac824" : "transparent"} color={work.rating ? "#fac824" : "#d1d5db"} /> 
                      <span className="text-gray-700">{work.rating ? work.rating.toFixed(1) : '0'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}