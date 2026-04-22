import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Store, Plus, Upload, Star, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { UserData, Product } from '../../types';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { productService, orderService } from '../../utils/apiServices';
import { normalizeProduct } from './HomePage';
import { CreatorApplication } from './CreatorApplication';

type ProfilePageProps = {
  userData: UserData;
  updateUserData: (newData: Partial<UserData>) => void;
};

export function ProfilePage({ userData, updateUserData }: ProfilePageProps) {
  const [activeTab, setActivePage] = useState<'my-products' | 'upload' | 'sales'>('my-products');
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [receivedOrders, setReceivedOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<{id: number; name: string}[]>([]);

  // States untuk Upload / Edit
  const [formData, setFormData] = useState({ title: '', description: '', price: '', category: '' });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === 'my-products') {
      fetchMyProducts();
    } else if (activeTab === 'sales') {
      fetchReceivedOrders();
    }
  }, [activeTab]);

  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await productService.getCategories();
        setCategories(res.data.map((c: any) => typeof c === 'string' ? { id: 0, name: c } : c));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const fetchMyProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productService.getMyProducts();
      const normalized = (response.data || []).map(normalizeProduct);
      setMyProducts(normalized);
    } catch (error) {
      console.error('Failed to fetch my products:', error);
      toast.error('Gagal mengambil data karya saya');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReceivedOrders = async () => {
    setIsLoading(true);
    try {
      const response = await orderService.getReceivedOrders();
      setReceivedOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch received orders:', error);
      toast.error('Gagal mengambil data pesanan masuk');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPayment = async (orderId: number, action: 'approve' | 'reject') => {
    try {
      await orderService.verifyPayment(orderId, action);
      toast.success(action === 'approve' ? 'Pembayaran disetujui!' : 'Pembayaran ditolak.');
      fetchReceivedOrders();
    } catch (error) {
      toast.error('Gagal verifikasi pembayaran');
    }
  };

  const [trackingNumbers, setTrackingNumbers] = useState<Record<number, string>>({});
  const [isShipping, setIsShipping] = useState(false);

  const handleShipOrder = async (orderId: number) => {
    const tracking_number = trackingNumbers[orderId];
    if (!tracking_number) return;
    setIsShipping(true);
    try {
      await orderService.inputResi(orderId, tracking_number);
      toast.success('Nomor resi berhasil diinput! Status: Dikirim');
      setTrackingNumbers(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      fetchReceivedOrders();
    } catch (error) {
      toast.error('Gagal menginput resi');
    } finally {
      setIsShipping(false);
    }
  };



  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imagePreviews.length > 10) {
      toast.error('Maksimal 10 foto diperbolehkan');
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditClick = (product: Product) => {
    setEditingProductId(product.id as number);
    setFormData({
      title: product.name,
      description: product.description || '',
      price: String(product.price),
      category: String(product.categoryId || ''),
    });
    setImagePreviews(product.images || [product.image].filter(Boolean) as string[]);
    setImageFiles([]); // Reset files, we use existing previews (URLs) or new files
    setActivePage('upload');
  };

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      toast.error('Mohon lengkapi judul dan harga!'); 
      return;
    }

    if (!editingProductId && imageFiles.length === 0) {
      toast.error('Mohon upload setidaknya satu foto karya!');
      return;
    }

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append('name', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('categoryId', formData.category);
      
      imageFiles.forEach(file => {
        data.append('images', file);
      });

      if (editingProductId) {
        await productService.update(editingProductId, data);
        toast.success('Karya berhasil diperbarui! ✨');
      } else {
        await productService.create(data);
        toast.success('Karya berhasil diupload! 🎉');
      }

      setFormData({ title: '', description: '', price: '', category: '' });
      setImagePreviews([]);
      setImageFiles([]);
      setEditingProductId(null);
      setActivePage('my-products');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal menyimpan karya';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  if (userData.creator_status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <CreatorApplication 
          userData={userData} 
          onApplicationSuccess={() => {
            updateUserData({ creator_status: 'pending' });
          }} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <div className="bg-white shadow-sm mb-6 border-b border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20 border-2 border-gray-100">
              {(userData.profilePicture || userData.profile_picture) ? (
                <AvatarImage src={userData.profilePicture || userData.profile_picture} alt={userData.name || userData.username} />
              ) : (
                <AvatarFallback className="text-xl" style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}>
                  {(userData.name || userData.username || '??').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                Toko {userData.fullName || userData.name || userData.username} <Store className="w-5 h-5 text-gray-400" />
              </h1>
              <p className="text-gray-500">Kelola dan tawarkan karyamu di sini</p>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <Button
              onClick={() => setActivePage('my-products')}
              variant={activeTab === 'my-products' ? 'default' : 'outline'}
              className={`rounded-xl ${activeTab === 'my-products' ? 'text-white shadow-md' : 'text-gray-600'}`}
              style={activeTab === 'my-products' ? { backgroundImage: 'linear-gradient(to right, var(--theme-light), var(--theme-secondary))' } : {}}
            >
              <Package className="w-4 h-4 mr-2" /> Karya Saya
            </Button>
            <Button
              onClick={() => setActivePage('upload')}
              variant={activeTab === 'upload' ? 'default' : 'outline'}
              className={`rounded-xl ${activeTab === 'upload' ? 'text-white shadow-md' : 'text-gray-600'}`}
              style={activeTab === 'upload' ? { backgroundImage: 'linear-gradient(to right, var(--theme-light), var(--theme-secondary))' } : {}}
            >
              <Plus className="w-4 h-4 mr-2" /> Tambah Karya Baru
            </Button>
            <Button
              onClick={() => setActivePage('sales')}
              variant={activeTab === 'sales' ? 'default' : 'outline'}
              className={`rounded-xl ${activeTab === 'sales' ? 'text-white shadow-md' : 'text-gray-600'}`}
              style={activeTab === 'sales' ? { backgroundImage: 'linear-gradient(to right, var(--theme-light), var(--theme-secondary))' } : {}}
            >
              <Package className="w-4 h-4 mr-2" /> Pesanan Masuk
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {activeTab === 'my-products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm">
                <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
                <p className="text-gray-500">Memuat karya Anda...</p>
              </div>
            ) : (
              <>
                {myProducts.map((work) => (
                  <Card key={work.id} className="rounded-2xl shadow-sm border-0 overflow-hidden bg-white">
                    <div className="relative h-40 bg-gray-100">
                      <ImageWithFallback src={work.image || ''} alt={work.name} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 truncate mb-1">{work.name}</h3>
                      <p className="text-gray-500 text-xs mb-3">{work.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">
                          Rp {(typeof work.price === 'number' ? work.price : parseInt(String(work.price)) || 0).toLocaleString('id-ID')}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 rounded-lg text-xs"
                          onClick={() => handleEditClick(work)}
                        >
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <button
                  onClick={() => setActivePage('upload')}
                  className="flex flex-col items-center justify-center h-[260px] rounded-2xl border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-500">Upload Karya Lain</p>
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="max-w-3xl mx-auto">
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-800">
                  {editingProductId ? 'Edit Karya' : 'Detail Karya Baru'}
                </CardTitle>
                <CardDescription>
                  {editingProductId ? 'Ubah informasi karya Anda' : 'Lengkapi informasi produk yang ingin kamu jual'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitUpload} className="space-y-5">
                  <div className="space-y-3">
                    <Label className="text-gray-700">Foto Karya (Maks. 10)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square">
                          <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-xl border border-gray-100" />
                          <button 
                            type="button" 
                            onClick={() => removeImage(index)} 
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {imagePreviews.length < 10 && (
                        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                          <Upload className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-[10px] text-gray-500 text-center px-1">Tambah Foto</span>
                          <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Nama Karya</Label>
                    <Input placeholder="Contoh: Vas Anyaman Bambu" className="rounded-xl" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700">Harga (Rp)</Label>
                      <Input type="number" placeholder="50000" className="rounded-xl" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700">Kategori</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id || cat.name} value={String(cat.id || cat.name)}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Deskripsi Lengkap</Label>
                    <Textarea placeholder="Ceritakan detail bahan, ukuran, dan kelebihan karyamu..." className="rounded-xl min-h-[100px]" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setActivePage('my-products');
                        setEditingProductId(null);
                      }} 
                      className="rounded-xl"
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={isUploading} className="rounded-xl text-white px-8 shadow-md bg-gradient-to-r from-[var(--theme-light)] to-[var(--theme-secondary)]">
                      {isUploading ? 'Menyimpan...' : (editingProductId ? 'Simpan Perubahan' : 'Terbitkan Karya')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm">
                <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
                <p className="text-gray-500">Memuat pesanan masuk...</p>
              </div>
            ) : receivedOrders.length === 0 ? (
              <Card className="rounded-2xl shadow-sm border-0 p-12 text-center bg-white">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800">Belum Ada Pesanan Masuk</h3>
                <p className="text-gray-500">Karya Anda belum ada yang memesan. Tetap semangat berkarya!</p>
              </Card>
            ) : (
              receivedOrders.map(order => (
                <Card key={order.id} className="rounded-2xl shadow-sm border-0 overflow-hidden bg-white">
                  <CardHeader className="bg-gray-50 border-b border-gray-100 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                        <CardDescription>Pembeli: {order.buyer?.name} ({order.buyer?.email})</CardDescription>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        order.status === 'waiting_verification' ? 'bg-orange-100 text-orange-700' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex gap-4 mb-4">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex gap-3 items-center">
                          <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                            <ImageWithFallback src={item.Product?.images?.[0]} alt={item.Product?.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{item.Product?.name}</p>
                            <p className="text-sm text-gray-500">Rp {item.price.toLocaleString('id-ID')} x {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Alamat Pengiriman</p>
                        <p className="text-sm text-gray-700">{order.shipping_address || 'N/A'}</p>
                        <p className="text-sm font-bold mt-2 text-green-700">Ongkir: Rp {order.shipping_cost?.toLocaleString('id-ID') || 0}</p>
                      </div>

                      <div className="flex flex-col justify-end gap-3">
                        {order.status === 'waiting_verification' && (
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-orange-600 animate-pulse">BUKTI PEMBAYARAN TELAH DIUNGGAH</p>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleVerifyPayment(order.id, 'approve')}
                                className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs h-10"
                              >
                                Terima Pembayaran
                              </Button>
                              <Button 
                                onClick={() => handleVerifyPayment(order.id, 'reject')}
                                variant="outline"
                                className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs h-10"
                              >
                                Tolak
                              </Button>
                            </div>
                          </div>
                        )}

                        {order.status === 'processing' && (
                          <div className="space-y-3">
                            <Label className="text-xs font-bold">Input Nomor Resi</Label>
                            <div className="flex gap-2">
                              <Input 
                                placeholder="Nomor Resi..." 
                                value={trackingNumbers[order.id] || ''}
                                onChange={(e) => {
                                  setTrackingNumbers(prev => ({ ...prev, [order.id]: e.target.value }));
                                }}
                                className="rounded-xl flex-1"
                              />
                              <Button 
                                onClick={() => handleShipOrder(order.id)}
                                disabled={isShipping || !trackingNumbers[order.id]}
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white h-10 px-4"
                              >
                                {isShipping ? <Loader2 className="animate-spin" /> : 'Kirim'}
                              </Button>
                            </div>
                          </div>
                        )}

                        {order.status === 'shipped' && (
                          <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                            <p className="text-xs text-purple-700 font-bold">NOMOR RESI: {order.tracking_number}</p>
                            <p className="text-[10px] text-purple-600">Menunggu konfirmasi barang diterima oleh pembeli.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}