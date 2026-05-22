import { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, Store, MessageCircle, Loader2, Heart, Banknote, QrCode, Copy, Eye, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { UserData } from '../../types';
import type { Product } from '../../types';
import { toast } from 'sonner';
import { donationService, productService, authService } from '../../utils/apiServices';
import { normalizeProduct } from './HomePage';

type CreatorProfilePageProps = {
  userData: UserData;
  creatorId: number;
  creatorName: string;
  onBack: () => void;
  onProductClick: (product: Product) => void;
  onChatSeller: (product: Product) => void;
  isGuest?: boolean;
  onNavigateToAuth?: () => void;
};

export function CreatorProfilePage({ userData, creatorId, creatorName, onBack, onProductClick, onChatSeller, isGuest, onNavigateToAuth }: CreatorProfilePageProps) {
  const [creatorProducts, setCreatorProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [creatorPaymentInfo, setCreatorPaymentInfo] = useState<any>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [showQrisDonation, setShowQrisDonation] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const presetAmounts = [25000, 50000, 100000, 250000, 500000, 1000000];

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

  // Fetch creator payment info when donate dialog opens
  useEffect(() => {
    if (isDonateOpen && creatorId && !creatorPaymentInfo) {
      setIsLoadingPayment(true);
      authService.getPaymentInfo(creatorId)
        .then(res => setCreatorPaymentInfo(res.data))
        .catch(() => setCreatorPaymentInfo(null))
        .finally(() => setIsLoadingPayment(false));
    }
  }, [isDonateOpen, creatorId]);

  const donationAmount = selectedAmount || Number(customAmount || 0);

  const handleDonate = async () => {
    if (isGuest) {
      toast.error('Silakan login untuk berdonasi ke kreator');
      onNavigateToAuth?.();
      return;
    }

    if (!donationAmount || donationAmount < 1000) {
      toast.error('Nominal donasi minimal Rp 1.000');
      return;
    }

    if (!proofFile) {
      toast.error('Bukti transfer wajib diunggah sebelum donasi dikirim');
      return;
    }

    setIsSubmittingDonation(true);
    try {
      const formData = new FormData();
      formData.append('creatorId', String(creatorId));
      formData.append('amount', String(donationAmount));
      formData.append('message', donationMessage);
      formData.append('payment_proof', proofFile);

      await donationService.create(formData);
      toast.success('Donasi dan bukti transfer berhasil dikirim! Admin akan segera mereview donasi Anda.');
      resetDonationDialog();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengirim donasi');
    } finally {
      setIsSubmittingDonation(false);
    }
  };

  const resetDonationDialog = () => {
    setIsDonateOpen(false);
    setProofFile(null);
    setSelectedAmount(null);
    setCustomAmount('');
    setDonationMessage('');
  };

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
                <Button variant="outline" onClick={() => setIsDonateOpen(true)} className="rounded-xl border-pink-200 text-pink-700 hover:bg-pink-50">
                  <Heart className="w-4 h-4 mr-2" /> Donasi
                </Button>
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
                <div className="h-48 bg-gray-100"><ImageWithFallback src={work.image} alt={work.name} preset="card" className="w-full h-full object-cover" /></div>
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

      <Dialog open={isDonateOpen} onOpenChange={(open) => { if (!open) resetDonationDialog(); }}>
        <DialogContent className="rounded-2xl sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <Heart className="h-5 w-5 text-pink-500" />
              Donasi untuk {creatorName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <Label className="mb-3 block text-gray-700">Pilih Nominal</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                    className={`rounded-xl border-2 p-3 text-sm transition-all ${
                      selectedAmount === amount
                        ? 'border-pink-500 bg-pink-50 text-pink-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-pink-200'
                    }`}
                  >
                    Rp {amount.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nominal Lainnya</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                <Input
                  type="number"
                  min={1000}
                  value={customAmount}
                  onChange={(event) => { setCustomAmount(event.target.value); setSelectedAmount(null); }}
                  placeholder="Masukkan nominal donasi"
                  className="rounded-xl pl-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Pesan untuk Kreator
              </Label>
              <Textarea
                value={donationMessage}
                onChange={(event) => setDonationMessage(event.target.value)}
                placeholder="Tulis pesan dukungan singkat..."
                className="min-h-[80px] rounded-xl"
              />
            </div>

            {donationAmount > 0 && (
              <div className="rounded-xl border border-pink-100 bg-pink-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-pink-700">Total Donasi</span>
                  <span className="text-xl font-bold text-pink-800">Rp {donationAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            {donationAmount > 0 && creatorPaymentInfo?.bank_name && (
              <div className="rounded-xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-green-800">
                  <Banknote className="w-4 h-4" />
                  <span className="text-sm font-bold">Transfer ke:</span>
                </div>
                <div className="text-sm">
                  <p className="font-bold text-green-900">
                    {creatorPaymentInfo.bank_name} - {creatorPaymentInfo.bank_account_number}
                  </p>
                  <p className="text-green-700">a.n. {creatorPaymentInfo.bank_account_holder}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(creatorPaymentInfo.bank_account_number || ''); toast.success('Nomor rekening disalin!'); }}
                    className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Salin No. Rek
                  </button>
                  {creatorPaymentInfo.qris_image && (
                    <button
                      type="button"
                      onClick={() => setShowQrisDonation(true)}
                      className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <QrCode className="w-3 h-3" /> Lihat QRIS
                    </button>
                  )}
                </div>
              </div>
            )}

            {isLoadingPayment && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat info pembayaran...
              </div>
            )}

            <div className="space-y-3">
              <Label className="flex items-center gap-2 font-semibold text-gray-700">
                <Upload className="w-4 h-4" />
                Bukti Transfer / Screenshot <span className="text-red-500">*</span>
              </Label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
                  proofFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-pink-300'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {proofFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto">
                      <Eye className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="font-medium text-green-800 text-sm">{proofFile.name}</p>
                    <p className="text-xs text-green-600">Klik untuk ganti file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-9 h-9 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">Klik untuk pilih bukti transfer</p>
                    <p className="text-xs text-gray-400">JPG, PNG, WebP maks. 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetDonationDialog} className="rounded-xl">Batal</Button>
            <Button onClick={handleDonate} disabled={isSubmittingDonation || donationAmount < 1000 || !proofFile} className="rounded-xl bg-pink-600 text-white hover:bg-pink-700">
              {isSubmittingDonation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className="mr-2 h-4 w-4" />}
              Kirim Donasi
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* QRIS Preview Dialog for Donation */}
      {showQrisDonation && creatorPaymentInfo?.qris_image && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowQrisDonation(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><QrCode className="w-5 h-5" /> QRIS Pembayaran</h3>
              <button onClick={() => setShowQrisDonation(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="flex justify-center">
              <img src={creatorPaymentInfo.qris_image} alt="QRIS" className="max-w-full max-h-[350px] object-contain rounded-xl" />
            </div>
            <div className="text-center text-sm text-gray-600">
              <p className="font-bold">{creatorPaymentInfo.bank_name} - {creatorPaymentInfo.bank_account_number}</p>
              <p>a.n. {creatorPaymentInfo.bank_account_holder}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
