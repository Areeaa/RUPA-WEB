import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { 
  PackageX, 
  Upload, 
  Video, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Info,
  FileVideo,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import type { UserData } from '../../types';
import { getTranslation, type Language } from '../../utils/translations';

type ReturnPageProps = {
  userData: UserData;
  selectedOrderId?: string;
};

// Mock orders data - in real app this would come from API
const mockOrders = [
  {
    orderId: 'ORD-2025-001234',
    orderDate: '2025-10-25',
    items: [
      {
        id: '1',
        productName: 'Eco-Friendly Water Filter',
        quantity: 2,
        price: 150000,
        status: 'Delivered',
      },
    ],
  },
  {
    orderId: 'ORD-2025-001235',
    orderDate: '2025-10-27',
    items: [
      {
        id: '2',
        productName: 'Solar Panel Kit',
        quantity: 1,
        price: 500000,
        status: 'Delivered',
      },
      {
        id: '3',
        productName: 'Organic Fertilizer Pack',
        quantity: 3,
        price: 75000,
        status: 'Delivered',
      },
    ],
  },
];

export function ReturnPage({ userData, selectedOrderId }: ReturnPageProps) {
  const t = getTranslation((userData.language as Language) || 'id');
  const [selectedOrder, setSelectedOrder] = useState(selectedOrderId || '');
  const [selectedItem, setSelectedItem] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnDetails, setReturnDetails] = useState('');
  const [solutionPreference, setSolutionPreference] = useState<'refund' | 'replacement'>('refund');
  const [unboxingVideo, setUnboxingVideo] = useState<File | null>(null);
  const [additionalPhotos, setAdditionalPhotos] = useState<File[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedReturnId, setGeneratedReturnId] = useState('');
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  const currentTheme = (userData.themeColor 
    ? {
        green: { primary: '#16a34a', light: '#22c55e', secondary: '#4ade80' },
        orange: { primary: '#ea580c', light: '#f97316', secondary: '#fb923c' },
        blue: { primary: '#2563eb', light: '#3b82f6', secondary: '#60a5fa' },
        purple: { primary: '#9333ea', light: '#a855f7', secondary: '#c084fc' },
        pink: { primary: '#ec4899', light: '#f472b6', secondary: '#f9a8d4' },
      }[userData.themeColor]
    : null) || { primary: '#16a34a', light: '#22c55e', secondary: '#4ade80' };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(t.maxFileSize);
        return;
      }
      // Check file type
      const acceptedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
      if (!acceptedTypes.includes(file.type)) {
        toast.error(t.acceptedFormats);
        return;
      }
      setUnboxingVideo(file);
      toast.success(t.videoUploaded);
    }
  };

  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (additionalPhotos.length + files.length > 5) {
      toast.error('Maksimal 5 foto');
      return;
    }
    setAdditionalPhotos([...additionalPhotos, ...files]);
  };

  const removePhoto = (index: number) => {
    setAdditionalPhotos(additionalPhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validation
    if (!selectedOrder) {
      toast.error(t.selectOrderFirst);
      return;
    }
    if (!selectedItem) {
      toast.error(t.fillAllFields);
      return;
    }
    if (!returnReason) {
      toast.error(t.fillAllFields);
      return;
    }
    if (!returnDetails.trim()) {
      toast.error(t.fillAllFields);
      return;
    }
    if (!unboxingVideo) {
      toast.error(t.videoRequired);
      return;
    }

    // Generate return ID
    const returnId = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setGeneratedReturnId(returnId);
    setShowSuccessDialog(true);
    toast.success(t.returnSubmitted);
  };

  const selectedOrderData = mockOrders.find(o => o.orderId === selectedOrder);
  const selectedItemData = selectedOrderData?.items.find(i => i.id === selectedItem);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                backgroundImage: `linear-gradient(to bottom right, ${currentTheme.light}, ${currentTheme.primary})`
              }}
            >
              <PackageX className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl text-gray-800">{t.returnTitle}</h1>
              <p className="text-gray-600">{t.returnDesc}</p>
            </div>
          </div>
        </div>

        {/* Return Policy Alert */}
        <Alert className="mb-6 border-2 rounded-2xl border-[var(--theme-light)]">
          <Info className="h-5 w-5 text-[var(--theme-primary)]" />
          <AlertDescription className="ml-2">
            <div className="space-y-2">
              <div>
                <strong>{t.returnPolicyTitle}:</strong>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                <li>{t.policyPoint1}</li>
                <li><strong className="text-red-600">{t.policyPoint2}</strong></li>
                <li>{t.policyPoint3}</li>
                <li>{t.policyPoint4}</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Return Form */}
        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader 
            className="text-white bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-light)]"
          >
            <CardTitle className="text-white">{t.returnItem}</CardTitle>
            <CardDescription className="text-white/90">
              {t.motto}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Order Selection */}
            <div className="space-y-2">
              <Label>{t.selectOrder} *</Label>
              <Select value={selectedOrder} onValueChange={(value) => {
                setSelectedOrder(value);
                setSelectedItem(''); // Reset item selection when order changes
              }}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t.selectOrderPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {mockOrders.map((order) => (
                    <SelectItem key={order.orderId} value={order.orderId}>
                      {order.orderId} - {new Date(order.orderDate).toLocaleDateString('id-ID')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Item Selection */}
            {selectedOrder && (
              <div className="space-y-2">
                <Label>{t.selectItem} *</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={t.selectItemPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedOrderData?.items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.productName} (Qty: {item.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* Return Reason */}
            <div className="space-y-2">
              <Label>{t.returnReason} *</Label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t.selectReason} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damaged">{t.damagedProduct}</SelectItem>
                  <SelectItem value="wrong">{t.wrongItem}</SelectItem>
                  <SelectItem value="not-described">{t.notAsDescribed}</SelectItem>
                  <SelectItem value="quality">{t.qualityIssue}</SelectItem>
                  <SelectItem value="incomplete">{t.incompleteOrder}</SelectItem>
                  <SelectItem value="other">{t.otherReason}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Return Details */}
            <div className="space-y-2">
              <Label>{t.returnDetails} *</Label>
              <Textarea
                value={returnDetails}
                onChange={(e) => setReturnDetails(e.target.value)}
                placeholder={t.returnDetailsPlaceholder}
                className="rounded-xl min-h-32"
              />
              <p className="text-xs text-gray-500">
                {returnDetails.length}/500
              </p>
            </div>

            <Separator />

            {/* Unboxing Video Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                {t.unboxingVideoRequired}
              </Label>
              <p className="text-sm text-gray-600">{t.unboxingVideoDesc}</p>
              
              {!unboxingVideo ? (
                <div 
                  onClick={() => videoInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors border-[var(--theme-light)]"
                >
                  <FileVideo className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-1">{t.uploadVideo}</p>
                  <p className="text-xs text-gray-500">{t.acceptedFormats}</p>
                  <p className="text-xs text-gray-500">{t.maxFileSize}</p>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Video className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-green-900">{unboxingVideo.name}</p>
                        <p className="text-sm text-green-700">
                          {(unboxingVideo.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => videoInputRef.current?.click()}
                      className="rounded-xl"
                    >
                      {t.changeVideo}
                    </Button>
                  </div>
                </div>
              )}
              
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </div>

            {/* Additional Photos */}
            <div className="space-y-2">
              <Label>{t.additionalPhotos}</Label>
              <p className="text-sm text-gray-600">{t.additionalPhotosDesc}</p>
              
              <div 
                onClick={() => photosInputRef.current?.click()}
                className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors border-[var(--theme-light)]"
              >
                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">{t.uploadPhotos}</p>
              </div>

              <input
                ref={photosInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotosUpload}
                className="hidden"
              />

              {additionalPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {additionalPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Solution Preference */}
            <div className="space-y-3">
              <Label>{t.solutionPreference} *</Label>
              <RadioGroup value={solutionPreference} onValueChange={(value: 'refund' | 'replacement') => setSolutionPreference(value)}>
                <div className="flex items-center space-x-2 p-4 border-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <RadioGroupItem value="refund" id="refund" />
                  <Label htmlFor="refund" className="flex-1 cursor-pointer">
                    <div>
                      <p>{t.refund}</p>
                      <p className="text-sm text-gray-600">{t.policyPoint5}</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <RadioGroupItem value="replacement" id="replacement" />
                  <Label htmlFor="replacement" className="flex-1 cursor-pointer">
                    <div>
                      <p>{t.replacement}</p>
                      <p className="text-sm text-gray-600">{t.policyPoint6}</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full rounded-xl text-white bg-[var(--theme-primary)]"
              size="lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              {t.submitReturn}
            </Button>
          </CardContent>
        </Card>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <DialogTitle className="text-center text-2xl">{t.returnSuccess}</DialogTitle>
              <DialogDescription className="text-center">
                {t.returnSuccessDesc}
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.returnId}:</span>
                <span className="text-gray-900">{generatedReturnId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.orderId}:</span>
                <span className="text-gray-900">{selectedOrder}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Produk:</span>
                <span className="text-gray-900">{selectedItemData?.productName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.solutionPreference}:</span>
                <Badge className="rounded-lg">
                  {solutionPreference === 'refund' ? t.refund : t.replacement}
                </Badge>
              </div>
            </div>

            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                // Reset form
                setSelectedOrder('');
                setSelectedItem('');
                setReturnReason('');
                setReturnDetails('');
                setUnboxingVideo(null);
                setAdditionalPhotos([]);
                setSolutionPreference('refund');
              }}
              className="w-full rounded-xl text-white bg-[var(--theme-primary)]"
            >
              {t.close}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
