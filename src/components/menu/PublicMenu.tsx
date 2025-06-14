
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Plus, Share2, Calendar, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MenuExplorer from './MenuExplorer';
import ExpandableDescription from './ExpandableDescription';
import ShoppingCartModal from './ShoppingCartModal';
import ShareModal from './ShareModal';
import ReservationModal from './ReservationModal';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

interface PublicMenuProps {
  onBack?: () => void;
}

const PublicMenu = ({ onBack }: PublicMenuProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCart, setShowCart] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const { toast } = useToast();

  // Generate or get session ID for cart
  useEffect(() => {
    let storedSessionId = localStorage.getItem('cart_session_id');
    if (!storedSessionId) {
      storedSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('cart_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  const { data: products, isLoading } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .eq('is_available', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      
      return data;
    },
  });

  // Load cart items
  const { data: cartData, refetch: refetchCart } = useQuery({
    queryKey: ['cart-items', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            price,
            image_url
          )
        `)
        .eq('session_id', sessionId);
      
      if (error) {
        console.error('Error fetching cart items:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (cartData) {
      setCartItems(cartData);
    }
  }, [cartData]);

  const filteredProducts = products?.filter(product => {
    if (selectedCategory === 'all') return true;
    return product.category_id === selectedCategory;
  });

  const addToCart = async (product: Product, quantity: number = 1, specialInstructions?: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          session_id: sessionId,
          product_id: product.id,
          quantity,
          special_instructions: specialInstructions,
        });

      if (error) throw error;

      toast({
        title: "Producto agregado",
        description: `${product.name} agregado al carrito`,
      });

      refetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito",
        variant: "destructive",
      });
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.quantity * Number(item.products?.price || 0)), 0);
  };

  // Format price with Colombian peso format
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Panel
                </Button>
              )}
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold">Menú del Restaurante</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setShowShare(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>
              
              <Button variant="outline" onClick={() => setShowReservation(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Reservar
              </Button>
              
              <Button 
                variant="default" 
                onClick={() => setShowCart(true)}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Carrito ({getTotalItems()})
                {getTotalItems() > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 px-1 min-w-[1.2rem] h-5">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Menu Explorer */}
          <MenuExplorer
            categories={categories || []}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts?.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {(product as any).categories?.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  )}
                  
                  <ExpandableDescription 
                    description={product.description || ''} 
                    maxLength={80}
                  />
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(Number(product.price))}
                    </span>
                    <Badge variant="default">Disponible</Badge>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.is_vegetarian && (
                      <Badge variant="outline" className="text-xs">Vegetariano</Badge>
                    )}
                    {product.is_vegan && (
                      <Badge variant="outline" className="text-xs">Vegano</Badge>
                    )}
                    {product.is_gluten_free && (
                      <Badge variant="outline" className="text-xs">Sin Gluten</Badge>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => addToCart(product)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar al Carrito
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron productos disponibles</p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showCart && (
        <ShoppingCartModal
          isOpen={showCart}
          onClose={() => setShowCart(false)}
          cartItems={cartItems}
          sessionId={sessionId}
          onRefetchCart={refetchCart}
          totalPrice={getTotalPrice()}
        />
      )}

      {showShare && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
        />
      )}

      {showReservation && (
        <ReservationModal
          isOpen={showReservation}
          onClose={() => setShowReservation(false)}
        />
      )}
    </div>
  );
};

export default PublicMenu;
