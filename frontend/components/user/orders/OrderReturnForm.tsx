import React, { useState, useRef } from 'react';
import { Button } from '../../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Separator } from '../../ui/separator';
import { ArrowLeft, Upload, FileVideo, Clock, Check, X, AlertCircle, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getTranslation, type Language } from '../../../utils/translations';
import type { Order, OrderItem, ReturnRecord, UploadedFile } from '../../../types/orders';

const ImageWithFallback = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [error, setError] = useState(false);
  return (
    <img 
      src={error ? 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400' : src} 
      alt={alt} 
      className={className} 
      onError={() => setError(true)} 
    />
  );
};

type OrderReturnFormProps = {
  userData: any;
  order: Order;
  item: OrderItem;
  onCancel: () => void;
  onSuccess: (newReturn: ReturnRecord) => void;
};

export function OrderReturnForm({ userData, order: selectedOrderForReturn, item: selectedItemForReturn, onCancel, onSuccess }: OrderReturnFormProps) {
  const t = getTranslation((userData.language as Language) || 'id');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState('');
  const [returnType, setReturnType] = useState<'refund' | 'replacement'>('refund');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [customerDescription, setCustomerDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedReturnId, setGeneratedReturnId] = useState('');
  const [submittedReturn, setSubmittedReturn] = useState<ReturnRecord | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (uploadedFiles.length + files.length > 5) {
      toast.error(t.atLeast1File);
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          file: file as any,
          preview: reader.result as string,
          progress: 0
        };
        
        setUploadedFiles(prev => [...prev, newFile]);
        
        const interval = setInterval(() => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === newFile.id && f.progress < 100
                ? { ...f, progress: Math.min(f.progress + 20, 100) }
                : f
            )
          );
        }, 200);
        
        setTimeout(() => {
          clearInterval(interval);
          toast.success(t.fileUploaded);
        }, 1000);
      };
      reader.readAsDataURL(file as any);
    });
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmitReturn = () => {
    if (!selectedItemForReturn || !returnReason || !customerDescription.trim()) {
      toast.error(t.allFieldsRequired);
      return;
    }
    
    if (uploadedFiles.length === 0) {
      toast.error(t.atLeast1File);
      return;
    }

    const returnId = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setGeneratedReturnId(returnId);
    
    const newReturn: ReturnRecord = {
      returnId,
      orderId: selectedOrderForReturn!.orderId,
      productName: selectedItemForReturn.productName,
      productImage: selectedItemForReturn.productImage,
      returnReason,
      returnType,
      returnStatus: 'Pending',
      requestedDate: new Date().toISOString().split('T')[0],
      videoEvidence: uploadedFiles.find(f => f.file.type.startsWith('video')) ? 'unboxing-video.mp4' : '',
      photoEvidence: uploadedFiles.filter(f => f.file.type.startsWith('image')).map((_, i) => `photo${i + 1}.jpg`),
      adminNotes: 'Menunggu verifikasi dari tim RUPA.',
      customerName: userData.fullName || userData.username,
      customerEmail: userData.email,
      creatorName: 'Kreator Indonesia',
    };
    
    setSubmittedReturn(newReturn);
    setShowSuccessDialog(true);
    toast.success(t.returnSubmitted);
    
    setTimeout(() => {
      onSuccess(newReturn);
    }, 2000);
  };

  const isReturnFormValid = () => {
    return (
      selectedItemForReturn &&
      returnReason &&
      customerDescription.trim() &&
      uploadedFiles.length > 0 &&
      uploadedFiles.every(f => f.progress === 100)
    );
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header with Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => onCancel()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Button>
            <h1 className="text-4xl text-gray-800 mb-2">{t.returnSubmissionForm}</h1>
            <p className="text-gray-600">{t.motto}</p>
          </div>

          <Card className="rounded-2xl shadow-lg border-0">
            <CardHeader 
              className="text-white bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-light)]"
            >
              <CardTitle className="text-white">{t.submitNewReturn}</CardTitle>
              <CardDescription className="text-white/90">
                {t.orderId}: {selectedOrderForReturn.orderId}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Selected Product Display */}
              <div className="bg-blue-50 rounded-xl p-4">
                <Label className="mb-3 block">{t.selectProductToReturn}</Label>
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <ImageWithFallback
                      src={selectedItemForReturn.productImage}
                      alt={selectedItemForReturn.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-800 mb-1">{selectedItemForReturn.productName}</h3>
                    <p className="text-sm text-gray-600">
                      Rp {selectedItemForReturn.price.toLocaleString('id-ID')} × {selectedItemForReturn.quantity}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quantity Selection */}
              <div className="space-y-2">
                <Label>{t.quantityToReturn} *</Label>
                <Select value={returnQuantity.toString()} onValueChange={(v: string) => setReturnQuantity(parseInt(v))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: selectedItemForReturn.quantity }, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} item(s)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              {/* Return Type */}
              <div className="space-y-2">
                <Label>{t.solutionPreference} *</Label>
                <Select value={returnType} onValueChange={(v: 'refund' | 'replacement') => setReturnType(v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refund">{t.refund}</SelectItem>
                    <SelectItem value="replacement">{t.replacement}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Evidence Upload */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  {t.uploadEvidence} *
                </Label>
                <p className="text-sm text-gray-600">{t.uploadEvidenceDesc}</p>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors border-[var(--theme-light)]"
                >
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-1">{t.dragDropFiles}</p>
                  <p className="text-xs text-gray-500">
                    {uploadedFiles.length}/5 {t.uploadEvidence}
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                          {file.file.type.startsWith('image') ? (
                            <img
                              src={file.preview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileVideo className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Upload Progress */}
                          {file.progress < 100 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="text-white text-center">
                                <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
                                <p className="text-sm">{file.progress}%</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Success Check */}
                          {file.progress === 100 && (
                            <div className="absolute top-2 right-2">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                        
                        <p className="text-xs text-gray-500 mt-1 truncate">{file.file.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Order Information (Auto-filled) */}
              <div className="space-y-3">
                <Label>{t.orderInformation}</Label>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.orderId}:</span>
                    <span className="text-gray-800">{selectedOrderForReturn.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.orderDate}:</span>
                    <span className="text-gray-800">
                      {new Date(selectedOrderForReturn.orderDate).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.paymentMethod}:</span>
                    <span className="text-gray-800">{selectedOrderForReturn.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label>{t.additionalNotes}</Label>
                <Textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder={t.additionalNotesPlaceholder}
                  className="rounded-xl min-h-24"
                />
              </div>

              {/* Customer Description */}
              <div className="space-y-2">
                <Label>{t.customerDescription} *</Label>
                <Textarea
                  value={customerDescription}
                  onChange={(e) => setCustomerDescription(e.target.value)}
                  placeholder={t.customerDescriptionPlaceholder}
                  className="rounded-xl min-h-32"
                />
                <p className="text-xs text-gray-500">
                  {customerDescription.length}/500
                </p>
              </div>

              <Separator />

              {/* Help Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                <h4 className="text-gray-800 mb-3 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                  {t.needHelp}
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <details className="cursor-pointer">
                    <summary className="font-medium text-gray-800 hover:text-purple-600">
                      Berapa lama proses retur?
                    </summary>
                    <p className="mt-2 pl-4 text-gray-600">
                      Proses review 1-3 hari kerja, total proses retur sekitar 7-14 hari kerja tergantung jenis retur.
                    </p>
                  </details>
                  <details className="cursor-pointer">
                    <summary className="font-medium text-gray-800 hover:text-purple-600">
                      Format video apa yang diterima?
                    </summary>
                    <p className="mt-2 pl-4 text-gray-600">
                      Semua format video umum (MP4, MOV, AVI) dengan ukuran maksimal 100MB.
                    </p>
                  </details>
                  <details className="cursor-pointer">
                    <summary className="font-medium text-gray-800 hover:text-purple-600">
                      Bagaimana cara melacak status retur?
                    </summary>
                    <p className="mt-2 pl-4 text-gray-600">
                      Setelah submit, Anda bisa melihat status di tab "Return History" dan akan menerima notifikasi email.
                    </p>
                  </details>
                </div>
              </div>

              <Separator />

              {/* Submit Button */}
              <Button
                onClick={handleSubmitReturn}
                disabled={!isReturnFormValid()}
                className={`w-full rounded-xl text-white py-6 ${isReturnFormValid() ? "bg-[var(--theme-primary)] cursor-pointer" : "bg-gray-300 cursor-not-allowed"}`}
                size="lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                {t.submitReturn}
              </Button>

              {!isReturnFormValid() && (
                <p className="text-sm text-center text-gray-500">
                  {uploadedFiles.length === 0 ? t.atLeast1File : t.allFieldsRequired}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
}
