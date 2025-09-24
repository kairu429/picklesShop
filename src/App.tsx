import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner@2.0.3';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { ProductList } from './components/Shop/ProductList';
import { CartManager } from './components/Cart/CartManager';
import { CheckoutForm } from './components/Checkout/CheckoutForm';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { UserDashboard } from './components/User/UserDashboard';
import { LargeOrderForm } from './components/LargeOrder/LargeOrderForm';
import { OrderTracking } from './components/Tracking/OrderTracking';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { 
  ShoppingCart, 
  User, 
  Settings, 
  LogOut, 
  Package, 
  MessageSquare,
  Home,
  Menu,
  X,
  MapPin
} from 'lucide-react';

interface CartItem {
  name: string;
  price: number;
  discountPrice?: number;
  img: string;
  quantity: number;
  stock: number;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'shop' | 'checkout' | 'admin' | 'user' | 'large-order' | 'tracking'>('login');
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('picklesShopUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setCurrentView('shop');
      } catch (error) {
        localStorage.removeItem('picklesShopUser');
      }
    }
  }, []);

  // Save user to localStorage whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('picklesShopUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('picklesShopUser');
    }
  }, [currentUser]);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setCurrentView('shop');
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCartItems({});
    setCurrentView('login');
    setMobileMenuOpen(false);
    toast.success('ログアウトしました。');
  };

  const handleAddToCart = (product: any, quantity: number) => {
    setCartItems(prev => {
      const existing = prev[product.name];
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        if (newQuantity > product.stock) {
          toast.error(`在庫は${product.stock}個までです。`);
          return prev;
        }
        return {
          ...prev,
          [product.name]: {
            ...existing,
            quantity: newQuantity
          }
        };
      } else {
        return {
          ...prev,
          [product.name]: {
            name: product.name,
            price: product.price,
            discountPrice: product.discountPrice,
            img: product.img,
            quantity: quantity,
            stock: product.stock
          }
        };
      }
    });
  };

  const handleUpdateQuantity = (productName: string, quantity: number) => {
    setCartItems(prev => ({
      ...prev,
      [productName]: {
        ...prev[productName],
        quantity: quantity
      }
    }));
  };

  const handleRemoveItem = (productName: string) => {
    setCartItems(prev => {
      const newCart = { ...prev };
      delete newCart[productName];
      return newCart;
    });
    toast.success('商品をカートから削除しました。');
  };

  const handleClearCart = () => {
    setCartItems({});
    toast.success('カートを空にしました。');
  };

  const handleOrderComplete = () => {
    setCartItems({});
    setCurrentView('shop');
    toast.success('注文が完了しました！');
  };

  const handleUserUpdate = (updatedUser: any) => {
    setCurrentUser(updatedUser);
  };

  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((total, item) => total + item.quantity, 0);
  };

  const renderNavigation = () => {
    if (!currentUser) return null;

    return (
      <nav className="bg-white/95 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <Package className="w-8 h-8 text-amber-600" />
              <h1 className="text-xl font-bold text-amber-600">PicklesShop</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Button
                variant={currentView === 'shop' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('shop')}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                ショップ
              </Button>

              <Button
                variant={currentView === 'large-order' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('large-order')}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                大型注文
              </Button>

              <Button
                variant={currentView === 'user' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('user')}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                マイページ
              </Button>

              <Button
                variant={currentView === 'tracking' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('tracking')}
                className="flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                配送状況
              </Button>

              {currentUser.rank === 'admin' && (
                <Button
                  variant={currentView === 'admin' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('admin')}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  管理
                </Button>
              )}
            </div>

            {/* User Info and Actions */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {currentUser.points}pt
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {currentUser.uid}
                </span>
              </div>
              
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                ログアウト
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-white py-4 space-y-2">
              <Button
                variant={currentView === 'shop' ? 'default' : 'ghost'}
                onClick={() => {
                  setCurrentView('shop');
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <Home className="w-4 h-4 mr-2" />
                ショップ
              </Button>

              <Button
                variant={currentView === 'large-order' ? 'default' : 'ghost'}
                onClick={() => {
                  setCurrentView('large-order');
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                大型注文
              </Button>

              <Button
                variant={currentView === 'user' ? 'default' : 'ghost'}
                onClick={() => {
                  setCurrentView('user');
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <User className="w-4 h-4 mr-2" />
                マイページ
              </Button>

              <Button
                variant={currentView === 'tracking' ? 'default' : 'ghost'}
                onClick={() => {
                  setCurrentView('tracking');
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <MapPin className="w-4 h-4 mr-2" />
                配送状況
              </Button>

              {currentUser.rank === 'admin' && (
                <Button
                  variant={currentView === 'admin' ? 'default' : 'ghost'}
                  onClick={() => {
                    setCurrentView('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  管理
                </Button>
              )}

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{currentUser.uid}</span>
                  <Badge variant="outline">
                    {currentUser.points}pt
                  </Badge>
                </div>
                <Button variant="outline" onClick={handleLogout} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  ログアウト
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  };

  const renderContent = () => {
    if (!currentUser) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {currentView === 'login' ? (
              <LoginForm 
                onLogin={handleLogin}
                onSwitchToRegister={() => setCurrentView('register')}
              />
            ) : (
              <RegisterForm 
                onSwitchToLogin={() => setCurrentView('login')}
              />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-amber-50">
        {renderNavigation()}
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentView === 'shop' && (
            <ProductList 
              onAddToCart={handleAddToCart}
              currentUser={currentUser}
            />
          )}
          
          {currentView === 'checkout' && (
            <CheckoutForm
              cartItems={cartItems}
              currentUser={currentUser}
              onOrderComplete={handleOrderComplete}
              onBack={() => setCurrentView('shop')}
            />
          )}
          
          {currentView === 'admin' && currentUser.rank === 'admin' && (
            <AdminDashboard currentUser={currentUser} />
          )}
          
          {currentView === 'user' && (
            <UserDashboard 
              currentUser={currentUser}
              onUserUpdate={handleUserUpdate}
            />
          )}
          
          {currentView === 'large-order' && (
            <LargeOrderForm 
              currentUser={currentUser}
              onOrderSubmitted={() => setCurrentView('user')}
            />
          )}
          
          {currentView === 'tracking' && (
            <OrderTracking currentUser={currentUser} />
          )}
        </main>

        {/* Cart Manager */}
        {currentView === 'shop' && (
          <CartManager
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCheckout={() => setCurrentView('checkout')}
            currentUser={currentUser}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <Toaster 
        position="top-center" 
        richColors 
        closeButton
        duration={3000}
      />
    </>
  );
}