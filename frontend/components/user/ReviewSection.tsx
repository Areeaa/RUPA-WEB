import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { reviewService } from '../../utils/apiServices';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { toast } from 'sonner';

type ReviewSectionProps = {
  productId: number;
  userData: any;
  isGuest?: boolean;
};

export function ReviewSection({ productId, userData, isGuest }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await reviewService.getProductReviews(productId);
      setReviews(res.data || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-green-600" /> Ulasan Pembeli
        </h2>
        <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100">
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          <span className="text-xl font-bold text-yellow-700">{averageRating}</span>
          <span className="text-gray-400 text-sm">({reviews.length} ulasan)</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white rounded-3xl shadow-sm border border-gray-100">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
          <p className="text-gray-500">Memuat ulasan...</p>
        </div>
      ) : reviews.length === 0 ? (
        <Card className="rounded-3xl border-0 shadow-sm bg-white p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 italic">Belum ada ulasan untuk produk ini.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <Card key={review.id} className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={review.reviewer?.profile_picture} />
                      <AvatarFallback className="bg-green-100 text-green-700 font-bold">
                        {(review.reviewer?.name || '??').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-800">{review.reviewer?.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('id-ID', { 
                          day: 'numeric', month: 'long', year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {review.comment || 'Tidak ada komentar.'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
