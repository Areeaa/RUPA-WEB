import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Home, Search, Upload, Heart, ArrowRight, Sparkles } from 'lucide-react';

type OnboardingTutorialProps = {
  username: string;
  onComplete: () => void;
};

export function OnboardingTutorial({ username, onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: `Selamat datang kembali, ${username}!`,
      description: 'Apa yang mau kalian lihat hari ini?',
      message: 'Mari kita kenali fitur-fitur RUPA untuk memaksimalkan pengalaman Anda! 🇮🇩',
      icon: Sparkles,
      color: 'from-green-500 to-orange-500',
    },
    {
      title: 'Jelajahi Karya',
      description: 'Temukan inovasi sosial dan lingkungan dari seluruh Indonesia',
      message: 'Di halaman Home, Anda dapat melihat karya-karya unggulan dan kreasi terbaru dari anak bangsa.',
      icon: Home,
      color: 'from-blue-500 to-green-500',
    },
    {
      title: 'Cari & Filter',
      description: 'Gunakan fitur pencarian untuk menemukan karya spesifik',
      message: 'Filter berdasarkan harga, kategori, dan kreator favorit Anda.',
      icon: Search,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Upload Karya Anda',
      description: 'Bagikan inovasi Anda dengan dunia',
      message: 'Unggah foto, deskripsi, dan tentukan harga untuk karya Anda. Mari bangga dengan kreasi anak bangsa!',
      icon: Upload,
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Donasi & Dukung',
      description: 'Beri dukungan kepada kreator',
      message: 'Anda dapat memberikan donasi langsung untuk mendukung karya-karya inovatif dan menginspirasi.',
      icon: Heart,
      color: 'from-pink-500 to-red-500',
    },
  ];

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-green-50 to-orange-50">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${currentStepData.color} flex items-center justify-center shadow-xl`}>
                <StepIcon className="w-12 h-12 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl text-gray-800">{currentStepData.title}</h2>
              <p className="text-lg text-green-700">{currentStepData.description}</p>
            </div>

            <p className="text-gray-600 max-w-md mx-auto">
              {currentStepData.message}
            </p>

            <div className="flex gap-2 justify-center pt-4">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStep 
                      ? 'w-8 bg-gradient-to-r from-green-500 to-orange-500' 
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-4 justify-center pt-6">
              <Button
                onClick={handleSkip}
                variant="outline"
                className="rounded-xl border-gray-300"
              >
                Lewati Tutorial
              </Button>
              <Button
                onClick={handleNext}
                className="rounded-xl bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white shadow-lg"
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    Lanjut
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                ) : (
                  'Mulai Sekarang'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
