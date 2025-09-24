import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CartItem {
  name: string;
  price: number;
  discountPrice?: number;
  img: string;
  quantity: number;
  stock: number;
}

interface CartManagerProps {
  cartItems: Record<string, CartItem>;
  onUpdateQuantity: (productName: string, quantity: number) => void;
  onRemoveItem: (productName: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  currentUser: any;
}

export function CartManager({ 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart, 
  onCheckout,
  currentUser 
}: CartManagerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getItemPrice = (item: CartItem) => {
    return item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price;
  };

  const getTotalItems = () => {
    return Object.values(cartItems).reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return Object.values(cartItems).reduce((total, item) => {
      return total + (getItemPrice(item) * item.quantity);
    }, 0);
  };

  const handleQuantityChange = (productName: string, newQuantity: number, stock: number) => {
    if (newQuantity < 1) {
      onRemoveItem(productName);
      return;
    }
    
    if (newQuantity > stock) {
      toast.error(`在庫は${stock}個までです。`);
      return;
    }
    
    onUpdateQuantity(productName, newQuantity);
  };

  const cartItemsArray = Object.entries(cartItems);
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsOpen(true)}
          className="rounded-full w-16 h-16 shadow-lg"
          size="icon"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 text-xs"
              >
                {totalItems}
              </Badge>
            )}
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ショッピングカート ({totalItems}点)</CardTitle>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              閉じる
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto max-h-[60vh]">
          {cartItemsArray.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              カートは空です
            </div>
          ) : (
            <>
              {cartItemsArray.map(([productName, item]) => (
                <div key={productName} className="flex items-center gap-4 p-4 border rounded-lg">
                  <img 
                    src={item.img} 
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-medium">{item.name}</h4>
                    <div className="flex items-center gap-2">
                      {item.discountPrice && item.discountPrice > 0 ? (
                        <>
                          <span className="text-sm text-muted-foreground line-through">
                            {item.price.toFixed(1)}石炭
                          </span>
                          <span className="text-destructive font-medium">
                            {item.discountPrice.toFixed(1)}石炭
                          </span>
                        </>
                      ) : (
                        <span className="font-medium">{item.price.toFixed(1)}石炭</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => handleQuantityChange(productName, item.quantity - 1, item.stock)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(productName, parseInt(e.target.value) || 1, item.stock)}
                        className="w-16 text-center"
                        min="1"
                        max={item.stock}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => handleQuantityChange(productName, item.quantity + 1, item.stock)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground ml-2">
                        在庫: {item.stock}個
                      </span>
                    </div>
                    <p className="font-medium">
                      小計: {(getItemPrice(item) * item.quantity).toFixed(1)}石炭
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onRemoveItem(productName)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </>
          )}
        </CardContent>
        
        {cartItemsArray.length > 0 && (
          <div className="p-6 border-t space-y-4">
            <div className="flex justify-between items-center text-lg font-medium">
              <span>合計:</span>
              <span>{Math.ceil(totalPrice)}石炭</span>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClearCart} className="flex-1">
                カートを空にする
              </Button>
              <Button 
                onClick={onCheckout} 
                className="flex-1"
                disabled={!currentUser?.approved}
              >
                レジに進む
              </Button>
            </div>
            
            {!currentUser?.approved && (
              <p className="text-xs text-muted-foreground text-center">
                ※ アカウント承認後に購入可能
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}