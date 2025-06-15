import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Plus, Share2, Calendar, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MenuExplorer from './MenuExplorer';
import ExpandableDescription from './ExpandableDescription';
import ShoppingCartModal from './ShoppingCartModal';
import ShareModal from './ShareModal';
import ReservationModal from './ReservationModal';
import BusinessInfoDisplay from './BusinessInfoDisplay';
import { usePublicMenuCustomization, getDefaultCustomization } from '@/hooks/useMenuCustomization';
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
    try {
      let storedSessionId = '';
      
      try {
        storedSessionId = localStorage.getItem('cart_session_id') || '';
      } catch (error) {
        console.log('LocalStorage not available (incognito mode), using session-only cart');
      }
      
      if (!storedSessionId) {
        storedSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        try {
          localStorage.setItem('cart_session_id', storedSessionId);
        } catch (error) {
          console.log('Could not save session ID to localStorage (incognito mode)');
        }
      }
      
      console.log('Using session ID:', storedSessionId);
      setSessionId(storedSessionId);
    } catch (error) {
      console.error('Error setting up session:', error);
      const fallbackId = 'fallback_' + Date.now();
      console.log('Using fallback session ID:', fallbackId);
      setSessionId(fallbackId);
    }
  }, []);

  // Get menu customization with improved error handling
  const { 
    data: customization, 
    isLoading: customizationLoading, 
    error: customizationError, 
    refetch: refetchCustomization,
    isSuccess: customizationSuccess 
  } = usePublicMenuCustomization();
  
  // Memoizar colores con mejor lógica de fallback
  const colors = React.useMemo(() => {
    const defaults = getDefaultCustomization();
    
    // Si tenemos customization, combinar con defaults
    if (customization) {
      console.log('Applying custom colors:', customization);
      return { ...defaults, ...customization };
    }
    
    // Si la query fue exitosa pero no hay customization, usar defaults
    if (customizationSuccess && !customization) {
      console.log('No customization found, using defaults');
      return defaults;
    }
    
    // Si aún está cargando o hay error, usar defaults temporalmente
    console.log('Using default colors (loading or error state)');
    return defaults;
  }, [customization, customizationSuccess]);

  console.log('Menu customization status:', {
    customizationLoading,
    customizationError: customizationError?.message,
    customizationSuccess,
    hasCustomization: !!customization,
    colorsApplied: colors
  });

  // Fetch business info
  const { 
    data: businessInfo, 
    isLoading: businessInfoLoading, 
    error: businessInfoError 
  } = useQuery({
    queryKey: ['public-business-info'],
    queryFn: async () => {
      console.log('Fetching business info from Supabase...');
      
      try {
        const { data, error } = await supabase
          .from('business_info')
          .select('*')
          .single();
        
        console.log('Business info query result:', { data, error });
        
        if (error) {
          console.error('Error fetching business info:', error);
          throw new Error(`Failed to fetch business info: ${error.message}`);
        }
        
        console.log('Successfully fetched business info');
        return data;
      } catch (error) {
        console.error('Business info fetch error:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch categories
  const { 
    data: categories, 
    isLoading: categoriesLoading, 
    error: categoriesError,
    refetch: refetchCategories 
  } = useQuery({
    queryKey: ['public-categories'],
    queryFn: async () => {
      console.log('Fetching categories from Supabase...');
      
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');
        
        console.log('Categories query result:', { data, error });
        
        if (error) {
          console.error('Error fetching categories:', error);
          throw new Error(`Failed to fetch categories: ${error.message}`);
        }
        
        console.log(`Successfully fetched ${data?.length || 0} categories`);
        return data || [];
      } catch (error) {
        console.error('Categories fetch error:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch products
  const { 
    data: products, 
    isLoading: productsLoading, 
    error: productsError,
    refetch: refetchProducts 
  } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      console.log('Fetching products from Supabase...');
      
      try {
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
        
        console.log('Products query result:', { data, error });
        
        if (error) {
          console.error('Error fetching products:', error);
          throw new Error(`Failed to fetch products: ${error.message}`);
        }
        
        console.log(`Successfully fetched ${data?.length || 0} products`);
        return data || [];
      } catch (error) {
        console.error('Products fetch error:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Load cart items
  const { data: cartData, refetch: refetchCart } = useQuery({
    queryKey: ['cart-items', sessionId],
    queryFn: async () => {
      if (!sessionId) {
        console.log('No session ID available for cart');
        return [];
      }
      
      console.log('Fetching cart items for session:', sessionId);
      
      try {
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
        
        console.log(`Successfully fetched ${data?.length || 0} cart items`);
        return data || [];
      } catch (error) {
        console.error('Cart items fetch error:', error);
        return [];
      }
    },
    enabled: !!sessionId,
    retry: 2,
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
    if (!sessionId) {
      toast({
        title: "Error",
        description: "No se pudo inicializar la sesión del carrito",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Adding to cart:', { product: product.name, quantity, sessionId });
      
      const { error } = await supabase
        .from('cart_items')
        .insert({
          session_id: sessionId,
          product_id: product.id,
          quantity,
          special_instructions: specialInstructions,
        });

      if (error) {
        console.error('Error adding to cart:', error);
        throw error;
      }

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleRetry = () => {
    console.log('Retrying to fetch data...');
    refetchProducts();
    refetchCategories();
  };

  const isLoading = productsLoading || categoriesLoading;
  const hasError = productsError || categoriesError;

  // Forzar refetch de personalización al montar el componente
  useEffect(() => {
    console.log('Component mounted, refetching customization...');
    refetchCustomization();
  }, [refetchCustomization]);

  console.log('PublicMenu render state:', {
    isLoading,
    hasError,
    productsCount: products?.length || 0,
    categoriesCount: categories?.length || 0,
    sessionId,
    customization: !!customization,
    actualColors: colors,
    customizationLoading,
    customizationSuccess
  });

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.menu_bg_color }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.button_bg_color }}
          ></div>
          <p style={{ color: colors.text_color }}>Cargando menú...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    console.error('Menu loading error:', { productsError, categoriesError });
    
    return (
      <div 
        className="min-h-screen"
        style={{ backgroundColor: colors.menu_bg_color }}
      >
        <header 
          className="border-b backdrop-blur sticky top-0 z-50"
          style={{ 
            backgroundColor: colors.header_bg_color,
            borderColor: colors.product_card_border_color
          }}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 
                className="text-2xl font-bold"
                style={{ color: colors.header_text_color }}
              >
                Menú del Restaurante
              </h1>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Error al cargar el menú. Por favor, intenta nuevamente.</p>
                {productsError && <div className="text-sm">Error de productos: {productsError.message}</div>}
                {categoriesError && <div className="text-sm">Error de categorías: {categoriesError.message}</div>}
                <Button onClick={handleRetry} size="sm" className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  if (!products || products.length === 0) {
    console.warn('No products found');
    
    return (
      <div 
        className="min-h-screen"
        style={{ backgroundColor: colors.menu_bg_color }}
      >
        <header 
          className="border-b backdrop-blur sticky top-0 z-50"
          style={{ 
            backgroundColor: colors.header_bg_color,
            borderColor: colors.product_card_border_color
          }}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                {onBack && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onBack}
                    style={{ color: colors.header_text_color }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Panel
                  </Button>
                )}
                <h1 
                  className="text-2xl font-bold"
                  style={{ color: colors.header_text_color }}
                >
                  Menú del Restaurante
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>No hay productos disponibles en este momento.</p>
                  <Button onClick={handleRetry} size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar menú
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  console.log('Rendering menu with products:', products.length, 'and colors:', colors);

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: colors.menu_bg_color }}
    >
      {/* Header */}
      <header 
        className="border-b backdrop-blur sticky top-0 z-50"
        style={{ 
          backgroundColor: colors.header_bg_color,
          borderColor: colors.product_card_border_color
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onBack}
                  style={{ color: colors.header_text_color }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Panel
                </Button>
              )}
              <div className="flex items-center space-x-2">
                <h1 
                  className="text-2xl font-bold"
                  style={{ color: colors.header_text_color }}
                >
                  Menú del Restaurante
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowShare(true)}
                style={{ 
                  borderColor: colors.button_bg_color,
                  color: colors.button_bg_color
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowReservation(true)}
                style={{ 
                  borderColor: colors.button_bg_color,
                  color: colors.button_bg_color
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Reservar
              </Button>
              
              <Button 
                onClick={() => setShowCart(true)}
                className="relative"
                style={{ 
                  backgroundColor: colors.button_bg_color,
                  color: colors.button_text_color
                }}
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
          {/* Business Info Display */}
          {businessInfo && !businessInfoLoading && (
            <BusinessInfoDisplay businessInfo={businessInfo} />
          )}

          {/* Menu Explorer */}
          <MenuExplorer
            categories={categories || []}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            customization={colors}
          />

          {/* Products Grid */}
          {filteredProducts && filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-lg transition-shadow"
                  style={{ 
                    backgroundColor: colors.product_card_bg_color,
                    borderColor: colors.product_card_border_color
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle 
                          className="text-lg"
                          style={{ color: colors.product_name_color }}
                        >
                          {product.name}
                        </CardTitle>
                        <CardDescription 
                          className="mt-1"
                          style={{ color: colors.product_description_color }}
                        >
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
                        onError={(e) => {
                          console.error('Error loading image:', product.image_url);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    
                    <ExpandableDescription 
                      description={product.description || ''} 
                      maxLength={80}
                      textColor={colors.product_description_color}
                    />
                    
                    <div className="flex items-center justify-between mb-3">
                      <span 
                        className="text-2xl font-bold"
                        style={{ color: colors.product_price_color }}
                      >
                        {formatPrice(Number(product.price))}
                      </span>
                      <Badge 
                        variant="default"
                        style={{ 
                          backgroundColor: colors.button_bg_color,
                          color: colors.button_text_color
                        }}
                      >
                        Disponible
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.is_vegetarian && (
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: colors.product_card_border_color,
                            color: colors.text_color
                          }}
                        >
                          Vegetariano
                        </Badge>
                      )}
                      {product.is_vegan && (
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: colors.product_card_border_color,
                            color: colors.text_color
                          }}
                        >
                          Vegano
                        </Badge>
                      )}
                      {product.is_gluten_free && (
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: colors.product_card_border_color,
                            color: colors.text_color
                          }}
                        >
                          Sin Gluten
                        </Badge>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => addToCart(product)}
                      className="w-full"
                      style={{ 
                        backgroundColor: colors.button_bg_color,
                        color: colors.button_text_color
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar al Carrito
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>No se encontraron productos en esta categoría.</p>
                    <Button onClick={() => setSelectedCategory('all')} size="sm">
                      Ver todos los productos
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
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
