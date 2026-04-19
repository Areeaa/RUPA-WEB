import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import type { UserData } from '../../types';
import { Upload, Image as ImageIcon, DollarSign, Tag, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { getTranslation, type Language } from '../../utils/translations';

type UploadPageProps = {
  userData: UserData;
};

export function UploadPage({ userData }: UploadPageProps) {
  const t = getTranslation((userData.language as Language) || 'id');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      toast.error('Mohon lengkapi semua field!');
      return;
    }

    if (!imagePreview) {
      toast.error('Mohon upload foto karya Anda!');
      return;
    }

    toast.success('Karya berhasil diupload! Tim RUPA akan me-review dalam 1-2 hari kerja. 🎉', {
      duration: 5000,
    });

    setTimeout(() => {
      setFormData({
        title: '',
        description: '',
        price: '',
        category: '',
      });
      setImagePreview(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                <Upload className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl text-gray-800 mb-2">Upload Karya Anda</h1>
            <p className="text-gray-600">
              Bagikan inovasi sosial dan lingkungan Anda dengan dunia 🇮🇩
            </p>
          </div>

          {/* Upload Form */}
          <Card className="rounded-2xl shadow-2xl border-0">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-green-800">Informasi Karya</CardTitle>
              <CardDescription>
                Lengkapi detail karya Anda dengan jelas dan menarik
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-3">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Foto Karya <span className="text-red-500">*</span>
                  </Label>
                  
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-2xl"
                      />
                      <Button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        variant="destructive"
                        size="sm"
                        className="absolute top-4 right-4 rounded-lg"
                      >
                        Hapus
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Klik untuk upload</span> atau drag and drop
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG atau JPEG (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-gray-700">
                    Judul Karya <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Contoh: Tas Ramah Lingkungan dari Plastik Daur Ulang"
                    className="rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-gray-700">
                    Deskripsi Karya <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="Jelaskan tentang karya Anda, proses pembuatan, material yang digunakan, dan dampak positifnya terhadap lingkungan atau masyarakat..."
                    className="rounded-xl resize-none"
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Tip: Ceritakan dengan detail untuk menarik minat pembeli
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Harga Jual (Rp) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                        Rp
                      </span>
                      <Input
                        type="number"
                        placeholder="150000"
                        className="pl-12 rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Kategori <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daur-ulang">Daur Ulang</SelectItem>
                        <SelectItem value="energi">Energi Terbarukan</SelectItem>
                        <SelectItem value="kerajinan">Kerajinan Tangan</SelectItem>
                        <SelectItem value="organik">Produk Organik</SelectItem>
                        <SelectItem value="pertanian">Teknologi Pertanian</SelectItem>
                        <SelectItem value="fashion">Fashion Berkelanjutan</SelectItem>
                        <SelectItem value="teknologi">Teknologi Ramah Lingkungan</SelectItem>
                        <SelectItem value="lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-orange-50 rounded-xl border border-green-200">
                  <p className="text-sm text-gray-700">
                    <strong>Kreator:</strong> {userData.fullName || userData.username}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong> {userData.email}
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg h-14"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Karya Sekarang
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card className="rounded-2xl shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Panduan Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-gray-800 mb-3">✅ Yang Harus Dilakukan:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Gunakan foto berkualitas tinggi dan pencahayaan baik</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Tulis deskripsi yang jelas dan detail</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Tentukan harga yang wajar dan kompetitif</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Pastikan karya adalah hasil karya sendiri</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-gray-800 mb-3">❌ Yang Harus Dihindari:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <span className="text-red-600 flex-shrink-0">✗</span>
                      <span>Mengupload karya orang lain (plagiarisme)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-600 flex-shrink-0">✗</span>
                      <span>Menggunakan foto berkualitas rendah atau blur</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-600 flex-shrink-0">✗</span>
                      <span>Menulis deskripsi yang menyesatkan</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-600 flex-shrink-0">✗</span>
                      <span>Menetapkan harga yang tidak realistis</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <CardContent className="p-6 text-center">
              <p className="text-white/90">
                💡 <strong>Tips:</strong> Karya dengan foto menarik dan deskripsi detail memiliki peluang terjual 3x lebih tinggi!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
