import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Plus, Edit2, Trash2, Tag, Loader2, Save, X } from 'lucide-react';
import { adminService, productService } from '../../utils/apiServices';
import { toast } from 'sonner';

export function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await productService.getCategories();
      setCategories(res.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Gagal memuat kategori');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await adminService.createCategory(newCategoryName);
      toast.success('Kategori berhasil ditambahkan!');
      setNewCategoryName('');
      fetchCategories();
    } catch (error) {
      toast.error('Gagal menambahkan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }

    try {
      await adminService.updateCategory(id, editName);
      toast.success('Kategori berhasil diubah!');
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      toast.error('Gagal mengubah kategori');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini? Semua produk yang terkait mungkin akan terdampak.')) return;
    
    try {
      await adminService.deleteCategory(id);
      toast.success('Kategori berhasil dihapus!');
      fetchCategories();
    } catch (error) {
      toast.error('Gagal menghapus kategori');
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-orange-50 border-orange-200 rounded-xl">
        <Tag className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          Kelola kategori produk untuk memudahkan pengguna mencari karya. Hati-hati saat menghapus kategori yang sudah memiliki produk!
        </AlertDescription>
      </Alert>

      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-green-800">Manajemen Kategori</CardTitle>
          <CardDescription>Tambah, ubah, dan hapus kategori</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Input 
              placeholder="Nama Kategori Baru..." 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="max-w-md rounded-xl"
            />
            <Button 
              onClick={handleCreate} 
              disabled={isSubmitting || !newCategoryName.trim()}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Tambah Kategori
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map((cat: any) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.id}</TableCell>
                      <TableCell>
                        {editingId === cat.id ? (
                          <Input 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="max-w-sm rounded-lg"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-gray-800">{cat.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === cat.id ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleUpdate(cat.id)} className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 rounded-lg">
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-gray-500 rounded-lg">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => {
                                setEditingId(cat.id);
                                setEditName(cat.name);
                              }} 
                              className="text-blue-600 hover:text-blue-800 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDelete(cat.id)} 
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-gray-500">
                      Belum ada kategori
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
