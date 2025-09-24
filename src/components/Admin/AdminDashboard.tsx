import React, { useState, useEffect } from 'react';
import { ref, get, update, remove, set } from 'firebase/database';
import { database } from '../../firebase';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { Users, Package, ShoppingCart, Settings, MessageSquare, Plus, Trash2, Edit } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: any;
}

export function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [orders, setOrders] = useState<any>({});
  const [largeOrders, setLargeOrders] = useState<any>({});
  const [users, setUsers] = useState<any>({});
  const [products, setProducts] = useState<any>({});
  const [branches, setBranches] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<any>({});
  const [newBranch, setNewBranch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [ordersSnapshot, largeOrdersSnapshot, usersSnapshot, productsSnapshot, branchesSnapshot, promotionsSnapshot] = await Promise.all([
        get(ref(database, 'orders')),
        get(ref(database, 'largeOrders')),
        get(ref(database, 'users')),
        get(ref(database, 'products')),
        get(ref(database, 'branches')),
        get(ref(database, 'promotions'))
      ]);

      setOrders(ordersSnapshot.exists() ? ordersSnapshot.val() : {});
      setLargeOrders(largeOrdersSnapshot.exists() ? largeOrdersSnapshot.val() : {});
      setUsers(usersSnapshot.exists() ? usersSnapshot.val() : {});
      setProducts(productsSnapshot.exists() ? productsSnapshot.val() : {});
      setBranches(branchesSnapshot.exists() ? branchesSnapshot.val() : []);
      setPromotions(promotionsSnapshot.exists() ? promotionsSnapshot.val() : {});
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('データの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, reason?: string, shippingBranch?: string) => {
    try {
      const updateData: any = { status };
      if (reason) {
        updateData.rejectionReason = reason;
      }
      if (shippingBranch) {
        updateData.shippingBranch = shippingBranch;
        updateData.shippedAt = new Date().toISOString();
      }
      
      await update(ref(database, `orders/${orderId}`), updateData);
      toast.success('注文ステータスを更新しました。');
      loadAdminData();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('ステータス更新に失敗しました。');
    }
  };

  const updateLargeOrderStatus = async (orderId: string, status: string, reason?: string, finalPrice?: number) => {
    try {
      const updateData: any = { status };
      if (reason) {
        updateData.rejectionReason = reason;
      }
      if (finalPrice !== undefined) {
        updateData.finalPrice = finalPrice;
      }
      
      await update(ref(database, `largeOrders/${orderId}`), updateData);
      toast.success('大型注文を更新しました。');
      loadAdminData();
    } catch (error) {
      console.error('Error updating large order status:', error);
      toast.error('更新に失敗しました。');
    }
  };

  const approveUser = async (userId: string) => {
    try {
      await update(ref(database, `users/${userId}`), { approved: true });
      toast.success('ユーザーを承認しました。');
      loadAdminData();
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('ユーザー承認に失敗しました。');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await remove(ref(database, `users/${userId}`));
      toast.success('ユーザーを削除しました。');
      loadAdminData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('ユーザー削除に失敗しました。');
    }
  };

  const updateProductStock = async (productId: string, newStock: number) => {
    try {
      await update(ref(database, `products/${productId}`), { stock: newStock });
      toast.success('在庫を更新しました。');
      loadAdminData();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('在庫更新に失敗しました。');
    }
  };

  const updatePromotions = async (newPromotions: any) => {
    try {
      await set(ref(database, 'promotions'), newPromotions);
      setPromotions(newPromotions);
      toast.success('キャンペーン設定を更新しました。');
    } catch (error) {
      console.error('Error updating promotions:', error);
      toast.error('キャンペーン設定の更新に失敗しました。');
    }
  };

  const addBranch = async () => {
    if (!newBranch.trim()) return;
    
    try {
      const newBranches = [...branches, newBranch.trim()];
      await set(ref(database, 'branches'), newBranches);
      setBranches(newBranches);
      setNewBranch('');
      toast.success('支店を追加しました。');
    } catch (error) {
      console.error('Error adding branch:', error);
      toast.error('支店追加に失敗しました。');
    }
  };

  const deleteBranch = async (branchToDelete: string) => {
    try {
      const newBranches = branches.filter(branch => branch !== branchToDelete);
      await set(ref(database, 'branches'), newBranches);
      setBranches(newBranches);
      toast.success('支店を削除しました。');
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error('支店削除に失敗しました。');
    }
  };

  if (loading) {
    return <div className="text-center p-8">データを読み込み中...</div>;
  }

  const pendingUsers = Object.entries(users).filter(([_, user]: [string, any]) => !user.approved);
  const pendingOrders = Object.entries(orders).filter(([_, order]: [string, any]) => order.status === 'pending');
  const pendingLargeOrders = Object.entries(largeOrders).filter(([_, order]: [string, any]) => order.status === 'pending');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">管理者ダッシュボード</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">承認待ちユーザー</p>
                <p className="text-2xl font-bold">{pendingUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <ShoppingCart className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">未処理注文</p>
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <MessageSquare className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">大型注文</p>
                <p className="text-2xl font-bold">{pendingLargeOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Package className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">商品数</p>
                <p className="text-2xl font-bold">{Object.keys(products).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">注文管理</TabsTrigger>
          <TabsTrigger value="large-orders">大型注文</TabsTrigger>
          <TabsTrigger value="users">ユーザー管理</TabsTrigger>
          <TabsTrigger value="inventory">在庫管理</TabsTrigger>
          <TabsTrigger value="promotions">キャンペーン</TabsTrigger>
          <TabsTrigger value="branches">支店管理</TabsTrigger>
        </TabsList>

        {/* Orders Management */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>通常注文管理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(orders).map(([orderId, order]: [string, any]) => (
                  <div key={orderId} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">注文ID: {orderId}</p>
                        <p className="text-sm text-muted-foreground">
                          ユーザー: {order.userUid} | 合計: {order.total?.toFixed(1)}石炭
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={order.status === 'pending' ? 'default' : order.status === 'shipped' ? 'secondary' : 'destructive'}>
                        {order.status === 'pending' ? '未処理' : 
                         order.status === 'shipped' ? '発送済み' : 
                         order.status === 'delivered' ? '配達完了' : '拒否'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">注文内容:</p>
                      {order.items && Object.entries(order.items).map(([itemId, item]: [string, any]) => (
                        <p key={itemId} className="text-sm text-muted-foreground">
                          {item.name} x{item.quantity} - {item.total?.toFixed(1)}石炭
                        </p>
                      ))}
                    </div>

                    {order.status === 'pending' && (
                      <div className="flex gap-2 flex-wrap">
                        <Select onValueChange={(branchName) => {
                          if (branchName) updateOrderStatus(orderId, 'shipped', undefined, branchName);
                        }}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="発送支店を選択して発送" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch} value={branch}>
                                {branch}から発送
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            const reason = prompt('拒否理由を入力してください:');
                            if (reason) updateOrderStatus(orderId, 'rejected', reason);
                          }}
                        >
                          拒否
                        </Button>
                      </div>
                    )}
                    
                    {order.shippingBranch && (
                      <p className="text-xs text-muted-foreground">
                        発送支店: {order.shippingBranch}
                      </p>
                    )}

                    {order.status === 'shipped' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateOrderStatus(orderId, 'delivered')}
                      >
                        配達完了にする
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Large Orders Management */}
        <TabsContent value="large-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>大型注文管理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(largeOrders).map(([orderId, order]: [string, any]) => (
                  <div key={orderId} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">大型注文ID: {orderId}</p>
                        <p className="text-sm text-muted-foreground">
                          ユーザー: {order.minecraftName} | 希望価格: {order.requestedPrice}石炭
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={order.status === 'pending' ? 'default' : 'secondary'}>
                        {order.status === 'pending' ? '処理中' : order.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm"><strong>住所:</strong> {order.address}</p>
                      <p className="text-sm"><strong>連絡先:</strong> {order.contactInfo}</p>
                      <p className="text-sm"><strong>詳細:</strong> {order.details}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">ステータス:</label>
                        <Select 
                          value={order.status} 
                          onValueChange={(newStatus) => {
                            if (newStatus === 'rejected') {
                              const reason = prompt('拒否理由を入力してください:');
                              if (reason) updateLargeOrderStatus(orderId, newStatus, reason);
                            } else {
                              updateLargeOrderStatus(orderId, newStatus);
                            }
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">処理中</SelectItem>
                            <SelectItem value="processing">準備中</SelectItem>
                            <SelectItem value="shipping">配送中</SelectItem>
                            <SelectItem value="completed">配達完了</SelectItem>
                            <SelectItem value="rejected">拒否</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">最終価格:</label>
                        <Input
                          type="number"
                          placeholder="最終価格"
                          className="w-32"
                          step="0.1"
                          min="0"
                          onChange={(e) => {
                            const finalPrice = parseFloat(e.target.value);
                            if (!isNaN(finalPrice) && finalPrice > 0) {
                              updateLargeOrderStatus(orderId, order.status, undefined, finalPrice);
                            }
                          }}
                          defaultValue={order.finalPrice || ''}
                        />
                        <span className="text-sm text-muted-foreground">石炭</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ユーザー管理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(users).map(([userId, user]: [string, any]) => (
                  <div key={userId} className="flex justify-between items-center border rounded-lg p-4">
                    <div>
                      <p className="font-medium">{userId}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email} | ポイント: {user.points} | ランク: {user.rank}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.approved ? 'default' : 'destructive'}>
                        {user.approved ? '承認済み' : '承認待ち'}
                      </Badge>
                      {!user.approved && (
                        <Button size="sm" onClick={() => approveUser(userId)}>
                          承認
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => deleteUser(userId)}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Management */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>在庫管理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(products).map(([productId, product]: [string, any]) => (
                  <div key={productId} className="border rounded-lg p-4">
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={product.img} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.price}石炭</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label>在庫:</Label>
                      <Input
                        type="number"
                        value={product.stock}
                        onChange={(e) => {
                          const newStock = parseInt(e.target.value) || 0;
                          updateProductStock(productId, newStock);
                        }}
                        className="w-20"
                        min="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotions Management */}
        <TabsContent value="promotions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>キャンペーン設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>送料無料キャンペーン</Label>
                  <Switch
                    checked={promotions.free_shipping || false}
                    onCheckedChange={(checked) => 
                      updatePromotions({ ...promotions, free_shipping: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>全品割引率 (%)</Label>
                  <Input
                    type="number"
                    value={promotions.discount_percentage || 0}
                    onChange={(e) => 
                      updatePromotions({ 
                        ...promotions, 
                        discount_percentage: parseInt(e.target.value) || 0 
                      })
                    }
                    min="0"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ポイント倍率ボーナス (%)</Label>
                  <Input
                    type="number"
                    value={promotions.points_boost || 0}
                    onChange={(e) => 
                      updatePromotions({ 
                        ...promotions, 
                        points_boost: parseInt(e.target.value) || 0 
                      })
                    }
                    min="0"
                    max="1000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches Management */}
        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>支店管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="新しい支店名"
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                />
                <Button onClick={addBranch}>
                  <Plus className="w-4 h-4 mr-2" />
                  追加
                </Button>
              </div>
              
              <div className="space-y-2">
                {branches.map((branch, index) => (
                  <div key={index} className="flex justify-between items-center border rounded-lg p-3">
                    <span>{branch}</span>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => deleteBranch(branch)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}