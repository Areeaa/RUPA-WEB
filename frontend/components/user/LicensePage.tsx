import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { FileText, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { UserData } from '../../types';
import { getTranslation, type Language } from '../../utils/translations';
import { licenseService } from '../../utils/apiServices';

type LicensePageProps = {
  userData: UserData;
};

export function LicensePage({ userData }: LicensePageProps) {
  const t = getTranslation((userData.language as Language) || 'id');
  const [formData, setFormData] = useState({
    creationName: '',
    creatorName: '',
    licenseType: '',
    purpose: '',
    duration: '',
    description: '',
  });
  const [licenses, setLicenses] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchLicenses = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await licenseService.getMyLicenses();
      setLicenses(res.data || []);
    } catch (error) {
      setLicenses([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.creationName || !formData.creatorName || !formData.licenseType || !formData.duration || !formData.purpose || !formData.description) {
      toast.error(t.fillRequiredFields);
      return;
    }

    setIsSubmitting(true);
    try {
      await licenseService.submit({
        nama_karya: formData.creationName,
        nama_pengaju: formData.creatorName,
        jenis_lisensi: formData.licenseType,
        durasi: formData.duration,
        tujuan: formData.purpose,
        deskripsi_karya: formData.description,
      });

      toast.success(t.licenseRequested, {
        duration: 5000,
      });

      setFormData({
        creationName: '',
        creatorName: '',
        licenseType: '',
        purpose: '',
        duration: '',
        description: '',
      });
      fetchLicenses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengirim pengajuan lisensi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const licenseTypes = [
    { value: 'komersil', label: t.commercial, fee: 'Rp 2,500,000 - 10,000,000' },
    { value: 'non komersil', label: t.nonCommercial, fee: 'Rp 500,000 - 2,000,000' },
    { value: 'pendidikan', label: t.educational, fee: 'Rp 250,000 - 1,000,000' },
    { value: 'pemerintah', label: t.government, fee: t.negotiation },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-xl">
                <FileText className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl text-gray-800 mb-2">{t.licenseService}</h1>
            <p className="text-gray-600">
              {t.licenseServiceDesc}
            </p>
          </div>

          {/* Info Alert */}
          <Alert className="rounded-2xl bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>{t.importantNote}:</strong> {t.licenseInfo}
            </AlertDescription>
          </Alert>

          {/* License Types */}
          <Card className="rounded-2xl shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="text-green-800">{t.licenseTypes}</CardTitle>
              <CardDescription>{t.selectLicenseTypeDesc}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {licenseTypes.map((type) => (
                  <div
                    key={type.value}
                    className="p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-colors bg-white"
                  >
                    <h3 className="text-gray-800 mb-1">{type.label}</h3>
                    <p className="text-sm text-green-700">{type.fee}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Application Form */}
          <Card className="rounded-2xl shadow-2xl border-0">
            <CardHeader>
              <CardTitle className="text-green-800">{t.licenseForm}</CardTitle>
              <CardDescription>
                {t.licenseFormDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-700">
                      {t.creationName} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder={t.creationNamePlaceholder}
                      className="rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400"
                      value={formData.creationName}
                      onChange={(e) => setFormData({ ...formData, creationName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">
                      {t.creatorName} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder={t.creatorNamePlaceholder}
                      className="rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400"
                      value={formData.creatorName}
                      onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">
                      {t.licenseType} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.licenseType} onValueChange={(value) => setFormData({ ...formData, licenseType: value })}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={t.selectLicenseType} />
                      </SelectTrigger>
                      <SelectContent>
                        {licenseTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label} ({type.fee})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">{t.licenseDuration}</Label>
                    <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={t.selectDuration} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1thn">{t.oneYear}</SelectItem>
                        <SelectItem value="3thn">{t.threeYears}</SelectItem>
                        <SelectItem value="5thn">{t.fiveYears}</SelectItem>
                        <SelectItem value="selamanya">{t.perpetual}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">{t.purpose} <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder={t.purposePlaceholder}
                    className="rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">{t.description} <span className="text-red-500">*</span></Label>
                  <Textarea
                    placeholder={t.descriptionPlaceholderLong}
                    className="rounded-xl resize-none"
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg h-14"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'Mengirim...' : t.submitLicense}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-green-800">{t.returnHistory || 'Riwayat Pengajuan'}</CardTitle>
              <CardDescription>Status pengajuan lisensi Anda</CardDescription>
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? (
                <p className="text-sm text-gray-500">Memuat riwayat lisensi...</p>
              ) : licenses.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada pengajuan lisensi.</p>
              ) : (
                <div className="space-y-3">
                  {licenses.map((license) => (
                    <div key={license.id} className="flex flex-col gap-2 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{license.nama_karya}</p>
                        <p className="text-sm text-gray-500">{license.jenis_lisensi} - {license.durasi}</p>
                      </div>
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        license.status === 'approved' ? 'bg-green-100 text-green-700' :
                        license.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {license.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terms & Process */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {t.applicationProcess}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm">1</span>
                    <span>{t.processStep1}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm">2</span>
                    <span>{t.processStep2}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm">3</span>
                    <span>{t.processStep3}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm">4</span>
                    <span>{t.processStep4}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm">5</span>
                    <span>{t.processStep5}</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t.termsConditions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t.term1}</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t.term2}</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t.term3}</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t.term4}</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t.term5}</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t.term6}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Contact Support */}
          <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-r from-green-500 to-orange-500 text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl mb-3">{t.needHelp}</h3>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                {t.needHelpDesc}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-xl">
                  Email: license@rupa.id
                </Button>
                <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-xl">
                  WhatsApp: +62 812-3456-7890
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
