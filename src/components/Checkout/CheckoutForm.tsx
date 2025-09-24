import React, { useState, useEffect } from 'react';
import { ref, get, set, push, update } from 'firebase/database';
import { database } from '../../firebase';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { toast } from 'sonner@2.0.3';

interface CartItem {
  name: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  stock: number;
}

interface CheckoutFormProps {
  cartItems: Record<string, CartItem>;
  currentUser: any;
  onOrderComplete: () => void;
  onBack: () => void;
}

export function CheckoutForm({ cartItems, currentUser, onOrderComplete, onBack }: CheckoutFormProps) {
  const [deliveryMethod, setDeliveryMethod] = useState('normal');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [usePoints, setUsePoints] = useState('none');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBranchesAndPromotions();
  }, []);

  useEffect(() => {
    if (usePoints === 'all') {
      setPointsToUse(Math.min(currentUser.points, Math.floor(getSubtotal())));
    } else if (usePoints === 'none') {
      setPointsToUse(0);
    }
  }, [usePoints, currentUser.points]);

  const loadBranchesAndPromotions = async () => {
    try {
      const [branchesSnapshot, promotionsSnapshot] = await Promise.all([
        get(ref(database, 'branches')),
        get(ref(database, 'promotions'))
      ]);

      if (branchesSnapshot.exists()) {
        setBranches(branchesSnapshot.val());
        setSelectedBranch(branchesSnapshot.val()[0] || '');
      }

      if (promotionsSnapshot.exists()) {
        setPromotions(promotionsSnapshot.val());
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
    }
  };

  const getItemPrice = (item: CartItem) => {
    return item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price;
  };

  const getSubtotal = () => {
    return Object.values(cartItems).reduce((total, item) => {
      return total + (getItemPrice(item) * item.quantity);
    }, 0);
  };

  const getDiscount = () => {
    const subtotal = getSubtotal();
    return promotions.discount_percentage ? subtotal * (promotions.discount_percentage / 100) : 0;
  };

  const getShippingFee = () => {
    if (promotions.free_shipping) return 0;
    const subtotal = getSubtotal();
    if (deliveryMethod === 'express') {
      return subtotal >= 15 ? 0 : 1; // 15石炭以上で無料、それ以外は1石炭
    } else {
      return subtotal >= 10 ? 0 : 0.5; // 10石炭以上で無料、それ以外は0.5石炭
    }
  };

  const getPointsEarned = () => {
    const subtotal = getSubtotal();
    const multiplier = 1 + (promotions.points_boost || 0);
    return Math.floor(subtotal * 0.01 * multiplier); // 1% base rate
  };

  const getFinalTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscount();
    const shipping = getShippingFee();
    return Math.ceil(subtotal - discount + shipping - pointsToUse);
  };

  const handleOrder = async () => {
    if (!selectedBranch) {
      toast.error('支店を選択してください。');
      return;
    }

    setLoading(true);

    try {
      // Check stock availability
      const productUpdates: any = {};
      const orderItems: any = {};

      for (const [productName, item] of Object.entries(cartItems)) {
        const productRef = ref(database, `products/${productName}`);
        const snapshot = await get(productRef);
        
        if (snapshot.exists()) {
          const currentStock = snapshot.val().stock;
          if (currentStock < item.quantity) {
            toast.error(`${item.name}の在庫が不足しています（在庫: ${currentStock}個）`);
            setLoading(false);
            return;
          }
          
          productUpdates[`products/${productName}/stock`] = currentStock - item.quantity;
          orderItems[productName] = {
            name: item.name,
            price: getItemPrice(item),
            quantity: item.quantity,
            total: getItemPrice(item) * item.quantity
          };
        }
      }

      // Create order
      const orderData = {
        userUid: currentUser.uid,
        userEmail: currentUser.email || '',
        items: orderItems,
        subtotal: getSubtotal(),
        discount: getDiscount(),
        shippingFee: getShippingFee(),
        pointsUsed: pointsToUse,
        pointsEarned: getPointsEarned(),
        total: getFinalTotal(),
        deliveryMethod,
        paymentMethod,
        branch: selectedBranch,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      const ordersRef = ref(database, 'orders');
      const newOrderRef = push(ordersRef);
      await set(newOrderRef, orderData);

      // Update product stocks
      await update(ref(database), productUpdates);

      // Update user points
      const newPoints = currentUser.points - pointsToUse + getPointsEarned();
      await update(ref(database, `users/${currentUser.uid}`), {
        points: newPoints
      });

      toast.success('ご注文ありがとうございました！');
      onOrderComplete();
    } catch (error) {
      console.error('Order error:', error);
      toast.error('注文の処理に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          戻る
        </Button>
        <h1 className="text-2xl font-bold">レジ</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Options */}
        <div className="space-y-6">
          {/* Delivery Method */}
          <Card>
            <CardHeader>
              <CardTitle>配達方法</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal">通常便 (0.5石炭、10石炭以上で無料)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="express" id="express" />
                  <Label htmlFor="express">お急ぎ便 (1石炭、15石炭以上で無料)</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>支払い方法</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod">代金引換</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="points" id="points" />
                  <Label htmlFor="points">ポイント払い</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Points Usage */}
          <Card>
            <CardHeader>
              <CardTitle>ポイント利用 (所持: {currentUser.points}pt)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={usePoints} onValueChange={setUsePoints}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none">利用しない</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="partial" id="partial" />
                  <Label htmlFor="partial">一部利用</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">すべて利用</Label>
                </div>
              </RadioGroup>
              
              {usePoints === 'partial' && (
                <Input
                  type="number"
                  placeholder="使用するポイント数"
                  value={pointsToUse}
                  onChange={(e) => setPointsToUse(Math.min(parseInt(e.target.value) || 0, currentUser.points, Math.floor(getSubtotal())))}
                  max={Math.min(currentUser.points, Math.floor(getSubtotal()))}
                  min="0"
                />
              )}
            </CardContent>
          </Card>

          {/* Branch Selection */}
          <Card>
            <CardHeader>
              <CardTitle>発送支店</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="支店を選択" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>注文内容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Items */}
            {Object.entries(cartItems).map(([productName, item]) => (
              <div key={productName} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {getItemPrice(item).toFixed(1)}石炭 × {item.quantity}
                  </p>
                </div>
                <p className="font-medium">
                  {(getItemPrice(item) * item.quantity).toFixed(1)}石炭
                </p>
              </div>
            ))}

            <Separator />

            {/* Pricing Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>小計</span>
                <span>{getSubtotal().toFixed(1)}石炭</span>
              </div>
              
              {getDiscount() > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>割引 ({promotions.discount_percentage}%)</span>
                  <span>-{getDiscount().toFixed(1)}石炭</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>
                  配送料 {(promotions.free_shipping || getShippingFee() === 0) && <span className="text-destructive">(無料)</span>}
                </span>
                <span>{getShippingFee().toFixed(1)}石炭</span>
              </div>
              
              {pointsToUse > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>ポイント利用</span>
                  <span>-{pointsToUse.toFixed(1)}石炭</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>合計</span>
                <span>{getFinalTotal()}石炭</span>
              </div>

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>獲得予定ポイント</span>
                <span>{getPointsEarned()}pt</span>
              </div>
            </div>

            <Button 
              onClick={handleOrder} 
              className="w-full" 
              disabled={loading || getFinalTotal() < 0}
            >
              {loading ? '注文処理中...' : '注文を確定する'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}