import React, { useState } from 'react';
import { ref, push, set } from 'firebase/database';
import { database } from '../../firebase';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';

interface LargeOrderFormProps {
  currentUser: any;
  onOrderSubmitted: () => void;
}

export function LargeOrderForm({ currentUser, onOrderSubmitted }: LargeOrderFormProps) {
  const [formData, setFormData] = useState({
    minecraftName: '',
    contactInfo: '',
    address: '',
    details: '',
    requestedPrice: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.minecraftName || !formData.contactInfo || !formData.address || !formData.details || !formData.requestedPrice) {
      toast.error('すべての項目を入力してください。');
      return;
    }

    const requestedPrice = parseFloat(formData.requestedPrice);
    if (isNaN(requestedPrice) || requestedPrice <= 0) {
      toast.error('有効な希望価格を入力してください。');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        userUid: currentUser.uid,
        userEmail: currentUser.email || '',
        minecraftName: formData.minecraftName,
        contactInfo: formData.contactInfo,
        address: formData.address,
        details: formData.details,
        requestedPrice: requestedPrice,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      const largeOrdersRef = ref(database, 'largeOrders');
      const newOrderRef = push(largeOrdersRef);
      await set(newOrderRef, orderData);

      // Initialize chat for this order
      const chatRef = ref(database, `bulkOrderChats/${newOrderRef.key}`);
      await set(chatRef, {
        unreadAdmin: false,
        unreadUser: false
      });

      toast.success('大型注文を送信しました！管理者からの連絡をお待ちください。');
      setFormData({
        minecraftName: '',
        contactInfo: '',
        address: '',
        details: '',
        requestedPrice: ''
      });
      onOrderSubmitted();
    } catch (error) {
      console.error('Error submitting large order:', error);
      toast.error('注文の送信に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>大型注文フォーム</CardTitle>
        <p className="text-muted-foreground">
          大量購入や特殊な商品のご注文はこちらからお申し込みください。
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="minecraftName">Minecraftユーザー名 *</label>
            <Input
              id="minecraftName"
              value={formData.minecraftName}
              onChange={(e) => handleChange('minecraftName', e.target.value)}
              placeholder="例: Steve123"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="contactInfo">連絡先 (Discord ID等) *</label>
            <Input
              id="contactInfo"
              value={formData.contactInfo}
              onChange={(e) => handleChange('contactInfo', e.target.value)}
              placeholder="例: Discord#1234"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="address">配達先住所 *</label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="例: 座標: 100, 64, -200"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="details">希望商品内容 *</label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => handleChange('details', e.target.value)}
              placeholder="例: ダイヤモンド 10スタック、鉄インゴット 20スタック"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="requestedPrice">希望価格 (石炭) *</label>
            <Input
              id="requestedPrice"
              type="number"
              value={formData.requestedPrice}
              onChange={(e) => handleChange('requestedPrice', e.target.value)}
              placeholder="例: 100.5"
              min="0"
              step="0.1"
              required
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">ご注意事項</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 大型注文は管理者による確認と見積もりが必要です</li>
              <li>• 希望価格は参考価格であり、最終価格は別途調整いたします</li>
              <li>• 注文後にチャット機能で詳細を相談できます</li>
              <li>• 在庫状況により対応できない場合があります</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '送信中...' : '大型注文を送信'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}