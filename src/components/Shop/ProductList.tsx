import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ShoppingCart, Package, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Product {
  name: string;
  category: string;
  desc: string;
  img: string;
  price: number;
  discountPrice?: number;
  stock: number;
  kit?: string[];
}

interface ProductListProps {
  onAddToCart: (product: Product, quantity: number) => void;
  currentUser: any;
}

export function ProductList({ onAddToCart, currentUser }: ProductListProps) {
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [filteredProducts, setFilteredProducts] = useState<Record<string, Product>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const loadProducts = async () => {
    try {
      const productsRef = ref(database, 'products');
      const snapshot = await get(productsRef);
      
      if (snapshot.exists()) {
        const productsData = snapshot.val();
        setProducts(productsData);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(Object.values(productsData).map((p: any) => p.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('商品の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = { ...products };

    // Filter by search term
    if (searchTerm) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, product]) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, product]) => product.category === selectedCategory)
      );
    }

    setFilteredProducts(filtered);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: '在庫切れ', color: 'destructive', icon: XCircle };
    if (stock <= 5) return { status: '残りわずか', color: 'secondary', icon: AlertTriangle };
    return { status: '在庫あり', color: 'default', icon: Package };
  };

  const getDisplayPrice = (product: Product) => {
    const hasDiscount = product.discountPrice && product.discountPrice > 0;
    return hasDiscount ? product.discountPrice : product.price;
  };

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleQuantityChange = (productKey: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productKey]: Math.max(1, Math.min(quantity, products[productKey]?.stock || 1))
    }));
  };

  const getQuantity = (productKey: string) => {
    return quantities[productKey] || 1;
  };

  const handleAddToCart = (productKey: string, product: Product) => {
    if (product.stock === 0) {
      toast.error('この商品は在庫切れです。');
      return;
    }
    
    const quantity = getQuantity(productKey);
    if (quantity > product.stock) {
      toast.error(`在庫は${product.stock}個までです。`);
      return;
    }
    
    onAddToCart(product, quantity);
    toast.success(`${product.name}を${quantity}個カートに追加しました！`);
    
    // Reset quantity to 1 after adding to cart
    setQuantities(prev => ({
      ...prev,
      [productKey]: 1
    }));
  };

  if (loading) {
    return <div className="text-center p-8">商品を読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="商品を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="カテゴリーを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのカテゴリー</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.entries(filteredProducts).map(([key, product]) => {
          const stockInfo = getStockStatus(product.stock);
          const StockIcon = stockInfo.icon;
          const displayPrice = getDisplayPrice(product);
          const hasDiscount = product.discountPrice && product.discountPrice > 0;

          return (
            <Card key={key} className="overflow-hidden">
              <CardHeader className="p-0">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.img}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {product.category}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground line-clamp-2">{product.desc}</p>
                  
                  {/* Kit Contents */}
                  {product.kit && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">セット内容:</p>
                      <div className="flex flex-wrap gap-1">
                        {product.kit.map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Price */}
                  <div className="space-y-1">
                    {hasDiscount ? (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground line-through">
                          {product.price.toFixed(1)}石炭
                        </p>
                        <p className="text-destructive font-medium">
                          {displayPrice.toFixed(1)}石炭 (セール価格)
                        </p>
                      </div>
                    ) : (
                      <p className="font-medium">{displayPrice.toFixed(1)}石炭</p>
                    )}
                  </div>
                  
                  {/* Stock Status */}
                  <div className="flex items-center gap-2">
                    <StockIcon className="w-4 h-4" />
                    <Badge variant={stockInfo.color as any}>
                      {stockInfo.status} ({product.stock}個)
                    </Badge>
                  </div>
                  
                  {/* Quantity Selection */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => handleQuantityChange(key, getQuantity(key) - 1)}
                      disabled={getQuantity(key) <= 1}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={getQuantity(key)}
                      onChange={(e) => handleQuantityChange(key, parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                      min="1"
                      max={product.stock}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => handleQuantityChange(key, getQuantity(key) + 1)}
                      disabled={getQuantity(key) >= product.stock}
                    >
                      +
                    </Button>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <Button 
                    onClick={() => handleAddToCart(key, product)}
                    disabled={product.stock === 0 || !currentUser?.approved}
                    className="w-full"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {getQuantity(key)}個をカートに追加
                  </Button>
                  
                  {!currentUser?.approved && (
                    <p className="text-xs text-muted-foreground text-center">
                      ※ 承認後に購入可能
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {Object.keys(filteredProducts).length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          条件に一致する商品が見つかりませんでした。
        </div>
      )}
    </div>
  );
}