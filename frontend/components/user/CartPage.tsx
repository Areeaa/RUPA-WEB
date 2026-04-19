import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { CartItem, UserData } from '../../types';
import { ShoppingCart, Minus, Plus, Trash2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { getTranslation, type Language } from '../../utils/translations';

type CartPageProps = {
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  onNavigateToSearch?: () => void;
  userData: UserData;
};

export function CartPage({ cartItems, updateQuantity, clearCart, onNavigateToSearch, userData }: CartPageProps) {
  const t = getTranslation((userData.language as Language) || 'id');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [messageToCreator, setMessageToCreator] = useState('');

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (!paymentMethod) {
      toast.error(t.selectPaymentFirst);
      return;
    }

    toast.success(t.orderSuccess, {
      duration: 5000,
    });

    setTimeout(() => {
      clearCart();
      setPaymentMethod('');
      setMessageToCreator('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl text-gray-800 mb-2">{t.shoppingCart}</h1>
            <p className="text-gray-600">{t.cartDesc}</p>
          </div>

          {cartItems.length === 0 ? (
            <Card className="rounded-2xl shadow-lg border-0">
              <CardContent className="p-12 text-center">
                <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl text-gray-800 mb-2">{t.emptyCart}</h3>
                <p className="text-gray-600 mb-6">{t.emptyCartDesc}</p>
                <Button 
                  onClick={onNavigateToSearch}
                  className="rounded-xl bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600"
                >
                  {t.exploreWorks}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id} className="rounded-2xl shadow-lg border-0">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-gray-800 mb-1">{item.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {t.by} {item.creator}
                          </p>
                          <p className="text-green-700">
                            Rp {item.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => updateQuantity(item.id, 0)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg w-8 h-8 p-0"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg w-8 h-8 p-0"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Checkout Summary */}
              <div className="lg:col-span-1">
                <Card className="rounded-2xl shadow-lg border-0 sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-green-800">{t.orderSummary}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>{t.subtotal} ({cartItems.length} {t.items})</span>
                        <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>{t.adminFee}</span>
                        <span>Rp 5,000</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between text-gray-800">
                        <span>{t.total}</span>
                        <span>Rp {(totalAmount + 5000).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700">{t.paymentMethod}</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder={t.selectPaymentMethod} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gopay">GoPay</SelectItem>
                          <SelectItem value="shopeepay">ShopeePay</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="bank">{t.bankTransfer}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700">{t.donationMessage}</Label>
                      <Textarea
                        placeholder={t.messagePlaceholder}
                        className="rounded-xl resize-none"
                        rows={3}
                        value={messageToCreator}
                        onChange={(e) => setMessageToCreator(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleCheckout}
                      className="w-full rounded-xl bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white shadow-lg"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {t.checkoutNow}
                    </Button>

                    <div className="text-center text-xs text-gray-500 pt-2">
                      {t.termsConditions}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
