import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import type { UserData } from '../../types';
import {
  Settings, Mail, User, Lock, Globe, Shield, LogOut, AlertTriangle,
  FileText, Upload, Phone, MapPin, Calendar, Palette, Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { getTranslation, languageNames, type Language } from '../../utils/translations';
import { authService } from '../../utils/apiServices';
import { THEME_COLORS } from '../../data/constants';

type SettingsPageProps = {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  onLogout: () => void;
};

export function SettingsPage({ userData, updateUserData, onLogout }: SettingsPageProps) {
  // Authentication States
  const [email, setEmail] = useState(userData.email);
  const [username, setUsername] = useState(userData.name || userData.username || '');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Profile Data States (Dipindah dari ProfilePage)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    fullName: userData.fullName || '',
    phoneNumber: userData.phoneNumber || '',
    address: userData.address || '',
    gender: userData.gender || '',
    age: userData.age || '',
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Report States
  const [reportTitle, setReportTitle] = useState('');
  const [contentType, setContentType] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [reportCategories, setReportCategories] = useState({
    copyright: false, inappropriate: false, hateSpeech: false, violence: false, misinformation: false, spam: false, other: false,
  });
  const [otherCategory, setOtherCategory] = useState('');
  const [reasonForReport, setReasonForReport] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [signature, setSignature] = useState('');

  const currentLang = (userData.language as Language) || 'id';
  const t = getTranslation(currentLang);

  // --- THEME LOGIC ---
  const themeColorsList = Object.entries(THEME_COLORS).map(([key, colors]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: key,
    gradient: `from-${key}-400 to-${key}-600`,
    colors
  }));

  const handleThemeChange = (color: string) => {
    updateUserData({ themeColor: color });
    toast.success(`${t.themeChanged} ${color}! 🎨`);
  };

  const currentThemeData = THEME_COLORS[userData.themeColor as keyof typeof THEME_COLORS] || THEME_COLORS.green;

  // --- HANDLERS ---
  const handleSaveProfile = async () => {
    try {
      await authService.updateProfile({ name: formData.fullName });
      updateUserData({ ...formData, name: formData.fullName });
      setIsEditingProfile(false);
      toast.success(t.profileUpdated || 'Profil berhasil diperbarui!');
    } catch (error) {
      toast.error('Gagal menyimpan profil');
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error(t.fileTooLarge || 'File maksimal 5MB'); return; }
      const fd = new FormData();
      fd.append('profile_picture', file);
      authService.updateProfile(fd).then(res => {
        const u = res.data.user || res.data;
        updateUserData({ profilePicture: u.profile_picture, profile_picture: u.profile_picture });
        toast.success(t.profilePhotoUpdated || 'Foto profil diperbarui!');
      }).catch(() => toast.error('Gagal mengupload foto'));
    }
  };

  const handleLanguageChange = (value: string) => {
    updateUserData({ language: value });
    const newLang = value as Language;
    const newTranslations = getTranslation(newLang);
    toast.success(`${newTranslations.languageChanged} ${languageNames[newLang]}! 🌍`);
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !passwordConfirm) { toast.error('Mohon lengkapi semua field!'); return; }
    if (newPassword !== confirmNewPassword) { toast.error('Password baru tidak cocok!'); return; }
    setIsChangingPassword(true);
    try {
      await authService.changePassword(passwordConfirm, newPassword);
      toast.success('Password berhasil diubah! 🔒');
      setShowPasswordDialog(false);
      setPasswordConfirm(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-xl">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl text-gray-800">{t.settings}</h1>
              <p className="text-gray-600">{t.settingsDesc}</p>
            </div>
          </div>

          {/* FOTO PROFIL & TEMA (BARU DIPINDAH) */}
          <Card className="rounded-2xl shadow-lg border-0 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-gray-200 to-gray-300"></div>
            <CardContent className="relative pt-12 pb-6">
              <div className="absolute -top-12 left-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    {userData.profilePicture ? (
                      <AvatarImage src={userData.profilePicture} alt={userData.username} />
                    ) : (
                      <AvatarFallback className="text-white text-2xl" style={{ backgroundImage: `linear-gradient(to bottom right, ${currentThemeData.secondary}, ${currentThemeData.primary})` }}>
                        {userData.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="absolute bottom-0 right-0 bg-white hover:bg-gray-50 text-gray-700 rounded-full p-1.5 shadow-md border border-gray-200" title="Ubah Foto">
                        <Camera className="w-4 h-4" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                      <DialogHeader><DialogTitle>Ubah Foto Profil</DialogTitle></DialogHeader>
                      <div className="space-y-4 mt-4">
                        <input ref={profileInputRef} type="file" accept="image/*" onChange={handleProfilePhotoChange} className="hidden" />
                        <Button onClick={() => profileInputRef.current?.click()} variant="outline" className="w-full rounded-xl">
                          <Upload className="w-4 h-4 mr-2" /> Pilih Gambar Lokal
                        </Button>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">atau URL</span></div>
                        <div className="flex gap-2">
                          <Input placeholder="https://example.com/avatar.jpg" value={profilePhotoUrl} onChange={(e) => setProfilePhotoUrl(e.target.value)} className="rounded-xl" />
                          <Button onClick={() => { updateUserData({ profilePicture: profilePhotoUrl }); toast.success('Foto diperbarui'); }} className="rounded-xl">Gunakan</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="ml-32 -mt-8 mb-6">
                <h2 className="text-xl font-bold text-gray-800">{userData.fullName || userData.username}</h2>
                <p className="text-gray-500">@{userData.name || userData.username || ''}</p>
              </div>

              {/* Kustomisasi Tema */}
              <div>
                <Label className="text-gray-700 flex items-center gap-2 mb-3 mt-4">
                  <Palette className="w-4 h-4" /> Warna Tema Aplikasi
                </Label>
                <div className="grid grid-cols-5 gap-3">
                  {themeColorsList.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleThemeChange(color.value)}
                      className={`h-12 rounded-xl bg-gradient-to-br ${color.gradient} transition-transform ${userData.themeColor === color.value ? 'ring-2 ring-offset-2 ring-gray-800 scale-105' : 'hover:scale-105'}`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DATA DIRI (BARU DIPINDAH DARI PROFILEPAGE) */}
          <Card className="rounded-2xl shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-green-800 flex items-center gap-2">
                <User className="w-5 h-5" /> Data Diri
              </CardTitle>
              <Button
                onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                size="sm"
                className="rounded-xl text-white"
                style={{ backgroundImage: `linear-gradient(to right, ${currentThemeData.light}, ${currentThemeData.secondary})` }}
              >
                {isEditingProfile ? t.save : 'Edit Data'}
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Nama Lengkap</Label>
                <Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} disabled={!isEditingProfile} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Nomor Telepon</Label>
                <Input value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} disabled={!isEditingProfile} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Jenis Kelamin</Label>
                <Select disabled={!isEditingProfile} value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Usia</Label>
                <Input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} disabled={!isEditingProfile} className="rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-gray-700">Alamat Lengkap</Label>
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} disabled={!isEditingProfile} className="rounded-xl" />
              </div>
            </CardContent>
          </Card>

          {/* AKUN & KEAMANAN */}
          <Card className="rounded-2xl shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2"><Shield className="w-5 h-5" /> Akun & Keamanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 flex items-center gap-2"><Mail className="w-4 h-4" /> {t.email}</Label>
                <div className="flex gap-2">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
                  <Button onClick={() => setShowEmailDialog(true)} disabled={email === userData.email} className="rounded-xl">Ubah</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 flex items-center gap-2"><User className="w-4 h-4" /> {t.username}</Label>
                <div className="flex gap-2">
                  <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="rounded-xl" />
                  <Button onClick={() => setShowUsernameDialog(true)} disabled={username === userData.username} className="rounded-xl">Ubah</Button>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <Button onClick={() => setShowPasswordDialog(true)} variant="outline" className="flex-1 rounded-xl">
                  <Lock className="w-4 h-4 mr-2" /> {t.changePassword}
                </Button>
                <Button onClick={() => setShowLogoutDialog(true)} variant="destructive" className="flex-1 rounded-xl">
                  <LogOut className="w-4 h-4 mr-2" /> {t.logout}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* BAHASA */}
          <Card className="rounded-2xl shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2"><Globe className="w-5 h-5" /> {t.language}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={currentLang} onValueChange={handleLanguageChange}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih bahasa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">🇮🇩 Bahasa Indonesia</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

        </div>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari Akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar? Sesi Anda akan diakhiri dan Anda perlu masuk kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onLogout} className="rounded-xl bg-red-600 hover:bg-red-700">
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Ubah Password</DialogTitle>
            <DialogDescription>Masukkan password lama dan password baru Anda.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Password Saat Ini</Label>
              <Input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Konfirmasi Password Baru</Label>
              <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} className="rounded-xl">Batal</Button>
            <Button 
              className="rounded-xl"
              disabled={isChangingPassword || !passwordConfirm || !newPassword || !confirmNewPassword}
              onClick={async () => {
                if (newPassword !== confirmNewPassword) {
                  toast.error('Password baru dan konfirmasi tidak cocok');
                  return;
                }
                setIsChangingPassword(true);
                try {
                  await authService.changePassword(passwordConfirm, newPassword);
                  toast.success('Password berhasil diubah');
                  setShowPasswordDialog(false);
                  setPasswordConfirm('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                } catch (error: any) {
                  toast.error(error.response?.data?.message || 'Gagal mengubah password');
                } finally {
                  setIsChangingPassword(false);
                }
              }}
            >
              {isChangingPassword ? 'Menyimpan...' : 'Simpan Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Ubah Email</DialogTitle>
            <DialogDescription>Email baru akan membutuhkan verifikasi jika fitur ini aktif di masa depan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Baru</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)} className="rounded-xl">Batal</Button>
            <Button 
              className="rounded-xl"
              onClick={async () => {
                await updateUserData({ email });
                setShowEmailDialog(false);
              }}
            >
              Simpan Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Ubah Username</DialogTitle>
            <DialogDescription>Nama ini akan tampil di profil Anda.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Username Baru</Label>
              <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUsernameDialog(false)} className="rounded-xl">Batal</Button>
            <Button 
              className="rounded-xl"
              onClick={async () => {
                await updateUserData({ name: username });
                setShowUsernameDialog(false);
              }}
            >
              Simpan Username
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}