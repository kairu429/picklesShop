import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, Package, Truck, CheckCircle, XCircle, Clock, ShoppingBag, MessageSquare } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface OrderTrackingProps {
  currentUser: any;
}

export function OrderTracking({ currentUser }: OrderTrackingProps) {
  const [orders, setOrders] = useState<any>({});
  const [largeOrders, setLargeOrders] = useState<any>({});
  const [searchOrderId, setSearchOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadUserOrders();
    }
  }, [currentUser]);

  const loadUserOrders = async () => {
    setLoading(true);
    try {
      const [ordersSnapshot, largeOrdersSnapshot] = await Promise.all([
        get(ref(database, 'orders')),
        get(ref(database, 'largeOrders'))
      ]);
      
      // Filter orders for current user
      const allOrders = ordersSnapshot.exists() ? ordersSnapshot.val() : {};
      const userOrders = Object.fromEntries(
        Object.entries(allOrders).filter(([_, order]: [string, any]) => order.userUid === currentUser.uid)
      );

      const allLargeOrders = largeOrdersSnapshot.exists() ? largeOrdersSnapshot.val() : {};
      const userLargeOrders = Object.fromEntries(
        Object.entries(allLargeOrders).filter(([_, order]: [string, any]) => order.userUid === currentUser.uid)
      );

      setOrders(userOrders);
      setLargeOrders(userLargeOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('注文の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const searchOrderById = async () => {
    if (!searchOrderId.trim()) {
      toast.error('注文IDを入力してください。');
      return;
    }

    setLoading(true);
    try {
      // Try to find in regular orders first
      const orderSnapshot = await get(ref(database, `orders/${searchOrderId}`));
      
      if (orderSnapshot.exists()) {
        const orderData = orderSnapshot.val();
        // Check if the order belongs to the current user
        if (orderData.userUid === currentUser.uid) {
          setSelectedOrder({ id: searchOrderId, type: 'regular', ...orderData });
          return;
        } else {
          toast.error('この注文にアクセス権限がありません。');
          return;
        }
      }

      // Try to find in large orders
      const largeOrderSnapshot = await get(ref(database, `largeOrders/${searchOrderId}`));
      
      if (largeOrderSnapshot.exists()) {
        const orderData = largeOrderSnapshot.val();
        if (orderData.userUid === currentUser.uid) {
          setSelectedOrder({ id: searchOrderId, type: 'large', ...orderData });
        } else {
          toast.error('この注文にアクセス権限がありません。');
        }
      } else {
        toast.error('注文が見つかりませんでした。');
      }
    } catch (error) {
      console.error('Error searching order:', error);
      toast.error('注文の検索に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const getOrderProgress = (status: string, type: string = 'regular') => {
    if (type === 'large') {
      switch (status) {
        case 'pending': return { progress: 20, text: '見積もり確認中' };
        case 'processing': return { progress: 40, text: '準備中' };
        case 'shipping': return { progress: 80, text: '配送中' };
        case 'completed': return { progress: 100, text: '配達完了' };
        case 'rejected': return { progress: 0, text: '注文拒否' };
        default: return { progress: 0, text: '不明' };
      }
    } else {
      switch (status) {
        case 'pending': return { progress: 25, text: '注文確認中' };
        case 'shipped': return { progress: 75, text: '発送済み' };
        case 'delivered': return { progress: 100, text: '配達完了' };
        case 'rejected': return { progress: 0, text: '注文拒否' };
        default: return { progress: 0, text: '不明' };
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'shipped': return <Truck className="w-5 h-5 text-blue-500" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string, type: string = 'regular') => {
    if (type === 'large') {
      switch (status) {
        case 'pending': return '処理中';
        case 'processing': return '準備中';
        case 'shipping': return '配送中';
        case 'completed': return '配達完了';
        case 'rejected': return '拒否';
        default: return status;
      }
    } else {
      switch (status) {
        case 'pending': return '処理中';
        case 'shipped': return '発送済み';
        case 'delivered': return '配達完了';
        case 'rejected': return '拒否';
        default: return status;
      }
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'shipped': return 'secondary';
      case 'delivered': return 'default';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const getEstimatedDelivery = (shippedAt: string, deliveryMethod: string) => {
    if (!shippedAt) return null;
    
    const shippedDate = new Date(shippedAt);
    const deliveryDays = deliveryMethod === 'express' ? 1 : 3;
    const estimatedDate = new Date(shippedDate.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
    
    return estimatedDate.toLocaleDateString('ja-JP');
  };

  if (loading) {
    return <div className="text-center p-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">配送状況・注文履歴</h1>

      {/* Order Search */}
      <Card>
        <CardHeader>
          <CardTitle>注文ID検索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="注文IDを入力..."
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchOrderById()}
            />
            <Button onClick={searchOrderById}>
              <Search className="w-4 h-4 mr-2" />
              検索
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Order Details */}
      {selectedOrder && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>注文詳細: {selectedOrder.id}</CardTitle>
                <p className="text-muted-foreground">
                  注文日時: {formatDate(selectedOrder.timestamp)}
                </p>
              </div>
              <Badge variant={getStatusVariant(selectedOrder.status) as any}>
                {getStatusText(selectedOrder.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedOrder.status)}
                <span className="font-medium">
                  {getOrderProgress(selectedOrder.status, selectedOrder.type).text}
                </span>
                <Badge variant="outline">
                  {selectedOrder.type === 'large' ? '大型注文' : '通常注文'}
                </Badge>
              </div>
              <Progress 
                value={getOrderProgress(selectedOrder.status, selectedOrder.type).progress} 
                className="w-full"
              />
            </div>

            {/* Order Timeline */}
            <div className="space-y-4">
              <h3 className="font-medium">配送状況</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">注文受付</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedOrder.timestamp)}
                    </p>
                  </div>
                </div>

                {selectedOrder.status !== 'rejected' && selectedOrder.status !== 'pending' && (
                  <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <Truck className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">発送完了</p>
                      {selectedOrder.shippedAt && (
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedOrder.shippedAt)}
                        </p>
                      )}
                      {selectedOrder.shippingBranch && (
                        <p className="text-sm text-muted-foreground">
                          発送支店: {selectedOrder.shippingBranch}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedOrder.status === 'delivered' && (
                  <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">配達完了</p>
                      <p className="text-sm text-muted-foreground">
                        お届け完了しました
                      </p>
                    </div>
                  </div>
                )}

                {selectedOrder.status === 'rejected' && (
                  <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium">注文拒否</p>
                      {selectedOrder.rejectionReason && (
                        <p className="text-sm text-muted-foreground">
                          理由: {selectedOrder.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Estimated Delivery */}
            {selectedOrder.status === 'shipped' && selectedOrder.shippedAt && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">お届け予定日</h4>
                <p className="text-blue-700">
                  {getEstimatedDelivery(selectedOrder.shippedAt, selectedOrder.deliveryMethod)}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {selectedOrder.deliveryMethod === 'express' ? 'お急ぎ便' : '通常便'}でお届け予定です
                </p>
              </div>
            )}

            <Separator />

            {/* Order Items */}
            <div className="space-y-4">
              <h3 className="font-medium">注文内容</h3>
              {selectedOrder.type === 'large' ? (
                <div className="space-y-2">
                  <p className="text-sm"><strong>希望価格:</strong> {selectedOrder.requestedPrice}石炭</p>
                  {selectedOrder.finalPrice && (
                    <p className="text-sm"><strong>最終価格:</strong> {selectedOrder.finalPrice}石炭</p>
                  )}
                  <p className="text-sm"><strong>配達先:</strong> {selectedOrder.address}</p>
                  <p className="text-sm"><strong>注文内容:</strong> {selectedOrder.details}</p>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => {
                      toast.info('チャット機能は開発中です');
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    チャットを開く
                  </Button>
                </div>
              ) : (
                <>
                  {selectedOrder.items && Object.entries(selectedOrder.items).map(([itemId, item]: [string, any]) => (
                    <div key={itemId} className="flex justify-between items-center">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{item.total?.toFixed(1)}石炭</span>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center font-medium">
                    <span>合計金額</span>
                    <span>{Math.ceil(selectedOrder.total || selectedOrder.finalPrice || selectedOrder.requestedPrice)}石炭</span>
                  </div>
                  
                  {selectedOrder.pointsUsed > 0 && (
                    <p className="text-sm text-muted-foreground">
                      ポイント利用: {selectedOrder.pointsUsed}pt
                    </p>
                  )}
                  {selectedOrder.pointsEarned > 0 && (
                    <p className="text-sm text-green-600">
                      獲得ポイント: {selectedOrder.pointsEarned}pt
                    </p>
                  )}
                </>
              )}
            </div>

            <Button 
              variant="outline" 
              onClick={() => setSelectedOrder(null)}
              className="w-full"
            >
              閉じる
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Order History Tabs */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">最近の注文</TabsTrigger>
          <TabsTrigger value="orders">通常注文履歴</TabsTrigger>
          <TabsTrigger value="large-orders">大型注文履歴</TabsTrigger>
        </TabsList>

        {/* Recent Orders */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>最近の注文</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(orders).length === 0 && Object.keys(largeOrders).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  注文履歴がありません
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    ...Object.entries(orders).map(([orderId, order]: [string, any]) => ({
                      id: orderId,
                      type: 'regular',
                      ...order
                    })),
                    ...Object.entries(largeOrders).map(([orderId, order]: [string, any]) => ({
                      id: orderId,
                      type: 'large',
                      ...order
                    }))
                  ]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 8)
                    .map((order) => (
                      <div 
                        key={order.id} 
                        className="flex justify-between items-center p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(order.status)}
                          <div>
                            <p className="font-medium">
                              {order.type === 'large' ? '大型注文' : '注文'}ID: {order.id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(order.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusVariant(order.status) as any}>
                            {getStatusText(order.status, order.type)}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {Math.ceil(order.total || order.finalPrice || order.requestedPrice)}石炭
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regular Orders History */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                通常注文履歴
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(orders).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  まだ注文履歴がありません
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(orders)
                    .sort(([, a]: [string, any], [, b]: [string, any]) => 
                      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    )
                    .map(([orderId, order]: [string, any]) => (
                      <div 
                        key={orderId} 
                        className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedOrder({ id: orderId, type: 'regular', ...order })}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">注文ID: {orderId}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(order.timestamp)}
                            </p>
                          </div>
                          <Badge variant={getStatusVariant(order.status) as any}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">注文内容:</p>
                          {order.items && Object.entries(order.items).map(([itemId, item]: [string, any]) => (
                            <div key={itemId} className="flex justify-between text-sm">
                              <span>{item.name} x{item.quantity}</span>
                              <span>{item.total?.toFixed(1)}石炭</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">合計金額:</span>
                            <span className="font-bold">{Math.ceil(order.total)}石炭</span>
                          </div>
                          {order.pointsUsed > 0 && (
                            <p className="text-sm text-muted-foreground">
                              ポイント利用: {order.pointsUsed}pt
                            </p>
                          )}
                          {order.pointsEarned > 0 && (
                            <p className="text-sm text-green-600">
                              獲得ポイント: {order.pointsEarned}pt
                            </p>
                          )}
                        </div>

                        {order.rejectionReason && (
                          <div className="bg-destructive/10 p-3 rounded">
                            <p className="text-sm font-medium text-destructive">拒否理由:</p>
                            <p className="text-sm text-destructive">{order.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Large Orders History */}
        <TabsContent value="large-orders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                大型注文履歴
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(largeOrders).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  まだ大型注文履歴がありません
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(largeOrders)
                    .sort(([, a]: [string, any], [, b]: [string, any]) => 
                      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    )
                    .map(([orderId, order]: [string, any]) => (
                      <div 
                        key={orderId} 
                        className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedOrder({ id: orderId, type: 'large', ...order })}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">大型注文ID: {orderId}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(order.timestamp)}
                            </p>
                          </div>
                          <Badge variant={getStatusVariant(order.status) as any}>
                            {getStatusText(order.status, 'large')}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm"><strong>希望価格:</strong> {order.requestedPrice}石炭</p>
                          {order.finalPrice && (
                            <p className="text-sm"><strong>最終価格:</strong> {order.finalPrice}石炭</p>
                          )}
                          <p className="text-sm"><strong>配達先:</strong> {order.address}</p>
                          <p className="text-sm"><strong>注文内容:</strong> {order.details}</p>
                        </div>

                        {order.rejectionReason && (
                          <div className="bg-destructive/10 p-3 rounded">
                            <p className="text-sm font-medium text-destructive">拒否理由:</p>
                            <p className="text-sm text-destructive">{order.rejectionReason}</p>
                          </div>
                        )}

                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info('チャット機能は開発中です');
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          チャットを開く
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}