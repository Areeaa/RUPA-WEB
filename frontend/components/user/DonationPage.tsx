import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Heart, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { UserData } from '../../types';
import { getTranslation, type Language } from '../../utils/translations';

type DonationPageProps = {
  userData: UserData;
};

export function DonationPage({ userData }: DonationPageProps) {
  const t = getTranslation((userData.language as Language) || 'id');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<string>('');

  const presetAmounts = [50000, 100000, 250000, 500000, 1000000, 2000000];
  
  const creators = [
    { id: 'all', name: 'Semua Kreator (Donasi Umum)' },
    { id: '1', name: 'Budi Santoso' },
    { id: '2', name: 'Siti Rahayu' },
    { id: '3', name: 'Ahmad Fauzi' },
    { id: '4', name: 'Dewi Lestari' },
    { id: '5', name: 'Rahmat Hidayat' },
    { id: '6', name: 'Linda Sari' },
  ];

  const handleDonate = () => {
    const amount = selectedAmount || parseInt(customAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Mohon masukkan jumlah donasi yang valid!');
      return;
    }

    if (!selectedCreator) {
      toast.error('Mohon pilih kreator yang ingin Anda dukung!');
      return;
    }

    const creatorName = creators.find(c => c.id === selectedCreator)?.name;
    const donationTarget = selectedCreator === 'all' ? 'semua kreator' : creatorName;

    toast.success(
      `Terima kasih! Donasi Rp ${amount.toLocaleString('id-ID')} untuk ${donationTarget} sangat berarti untuk mendukung karya anak bangsa! 🇮🇩❤️`,
      { duration: 5000 }
    );

    setTimeout(() => {
      setCustomAmount('');
      setSelectedAmount(null);
      setMessage('');
      setSelectedCreator('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center shadow-xl">
                <Heart className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl text-gray-800 mb-2">Dukung Karya Anak Bangsa</h1>
            <p className="text-gray-600">
              Donasi Anda akan membantu para inovator muda Indonesia untuk terus berkarya
            </p>
          </div>

          {/* Donation Card */}
          <Card className="rounded-2xl shadow-2xl border-0">
            <CardHeader className="text-center bg-gradient-to-r from-pink-50 to-red-50">
              <CardTitle className="text-green-800">Pilih Jumlah Donasi</CardTitle>
              <CardDescription>
                Setiap rupiah yang Anda berikan sangat berarti
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {/* Creator Selection */}
              <div className="space-y-2">
                <Label className="text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Pilih Kreator yang Ingin Didukung
                </Label>
                <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                  <SelectTrigger className="rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400">
                    <SelectValue placeholder="Pilih kreator..." />
                  </SelectTrigger>
                  <SelectContent>
                    {creators.map((creator) => (
                      <SelectItem key={creator.id} value={creator.id}>
                        {creator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Pilih kreator spesifik atau donasi umum untuk semua kreator
                </p>
              </div>

              {/* Preset Amounts */}
              <div>
                <Label className="text-gray-700 mb-3 block">Pilih Nominal Donasi</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount('');
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedAmount === amount
                          ? 'border-green-500 bg-gradient-to-r from-green-50 to-orange-50 shadow-lg'
                          : 'border-gray-200 hover:border-green-300 bg-white'
                      }`}
                    >
                      <div className="text-gray-800">
                        Rp {amount.toLocaleString('id-ID')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-2">
                <Label className="text-gray-700">Atau Masukkan Nominal Lainnya</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    Rp
                  </span>
                  <Input
                    type="number"
                    placeholder="Masukkan jumlah donasi"
                    className="pl-12 rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-gray-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Pesan Motivasi untuk Kreator (Opsional)
                </Label>
                <Textarea
                  placeholder="Tulis pesan semangat untuk para kreator muda Indonesia..."
                  className="rounded-xl resize-none"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Total Display */}
              {(selectedAmount || customAmount) && (
                <div className="p-6 bg-gradient-to-r from-green-50 to-orange-50 rounded-xl border-2 border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total Donasi:</span>
                    <span className="text-2xl text-green-800">
                      Rp {(selectedAmount || parseInt(customAmount || '0')).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {/* Donate Button */}
              <Button
                onClick={handleDonate}
                className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-lg h-14"
              >
                <Heart className="w-5 h-5 mr-2" />
                Donasi Sekarang
              </Button>

              <div className="text-center text-sm text-gray-500">
                Donasi Anda akan langsung disalurkan kepada kreator
              </div>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-xl shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4 text-center">
                <div className="text-3xl text-blue-900 mb-1">1,247</div>
                <p className="text-sm text-blue-700">Donatur Aktif</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4 text-center">
                <div className="text-2xl text-green-900 mb-1">Rp 125 Jt+</div>
                <p className="text-sm text-green-700">Total Donasi</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-4 text-center">
                <div className="text-3xl text-orange-900 mb-1">382</div>
                <p className="text-sm text-orange-700">Kreator Terbantu</p>
              </CardContent>
            </Card>
          </div>

          {/* Impact Statement */}
          <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl mb-3">Dampak Donasi Anda</h3>
              <p className="text-white/90 max-w-2xl mx-auto">
                Dengan donasi Anda, para inovator muda Indonesia dapat terus mengembangkan
                ide-ide cemerlang yang berdampak positif bagi lingkungan dan masyarakat.
                Bersama kita wujudkan Indonesia yang lebih berkelanjutan! 🇮🇩
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
