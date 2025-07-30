import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Plus, Share2, Calendar, ArrowLeft, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import MenuExplorer from './MenuExplorer';
import ExpandableDescription from './ExpandableDescription';
import ShoppingCartModal from './ShoppingCartModal';
import ShareModal from './ShareModal';
import ReservationModal from './ReservationModal';
import BusinessInfoDisplay from './BusinessInfoDisplay';
import { usePublicMenuCustomization, getDefaultCustomization } from '@/hooks/useMenuCustomization';
import { useProductPagination } from '@/hooks/useProductPagination';
import { Tables } from '@/integrations/supabase/types';
import { sortProductsByStandardizedCategories, sortCategoriesByStandardOrder } from '@/lib/categoryUtils';
import { useRestaurantContext, createRestaurantSlug, slugToBusinessName } from '@/hooks/useRestaurantContext';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

interface PublicMenuProps {
  onBack?: () => void;
}

const PublicMenu = ({ onBack }: { onBack?: () => void }) => {
  const { restaurantSlug } = useParams<{ restaurantSlug?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCart, setShowCart] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('🚀 [PUBLIC MENU] Iniciando con restaurantSlug:', restaurantSlug);

  // FASE 1: Usar contexto unificado del restaurante
  const { 
    data: restaurantInfo, 
    isLoading: restaurantLoading,
    error: restaurantError 
  } = useRestaurantContext(restaurantSlug);

  const restaurantId = restaurantInfo?.id;
  const restaurantName = restaurantInfo?.business_name;

  // FASE 2: Usar productos unificados (mismo criterio que admin)
  const { 
    data: products, 
    isLoading: productsLoading, 
    error: productsError,
    refetch: refetchProducts 
  } = useUnifiedProducts({
    businessId: restaurantId,
    isPublic: true,
    enabled: isInitialized && !!restaurantId
  });

  // CORRECCIÓN CRÍTICA: Inicialización controlada
  useEffect(() => {
    const initializeMenu = async () => {
      console.log('🔧 [INIT] Inicializando menú público...');
      
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
        
        setSessionId(storedSessionId);
        
        // Limpiar cache específico si es necesario
        console.log('🧹 [INIT] Limpiando cache obsoleto...');
        queryClient.removeQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key?.includes('old') || key?.includes('duplicate');
          }
        });
        
        setIsInitialized(true);
        console.log('✅ [INIT] Menú inicializado correctamente');
        
      } catch (error) {
        console.error('❌ [INIT] Error en inicialización:', error);
        const fallbackId = 'fallback_' + Date.now();
        setSessionId(fallbackId);
        setIsInitialized(true);
      }
    };

    initializeMenu();
  }, [queryClient]);

  const { 
    data: customization, 
    isLoading: customizationLoading,
    error: customizationError,
  } = usePublicMenuCustomization();
  
  const colors = React.useMemo(() => {
    const defaults = getDefaultCustomization();
    
    if (customization) {
      const appliedColors = {
        menu_bg_color: customization.menu_bg_color || defaults.menu_bg_color,
        header_bg_color: customization.header_bg_color || defaults.header_bg_color,
        text_color: customization.text_color || defaults.text_color,
        header_text_color: customization.header_text_color || defaults.header_text_color,
        button_bg_color: customization.button_bg_color || defaults.button_bg_color,
        button_text_color: customization.button_text_color || defaults.button_text_color,
        contact_button_bg_color: customization.contact_button_bg_color || defaults.contact_button_bg_color,
        contact_button_text_color: customization.contact_button_text_color || defaults.contact_button_text_color,
        product_card_bg_color: customization.product_card_bg_color || defaults.product_card_bg_color,
        product_card_border_color: customization.product_card_border_color || defaults.product_card_border_color,
        product_name_color: customization.product_name_color || defaults.product_name_color,
        product_description_color: customization.product_description_color || defaults.product_description_color,
        product_price_color: customization.product_price_color || defaults.product_price_color,
        shadow_color: customization.shadow_color || defaults.shadow_color,
        social_links_color: customization.social_links_color || defaults.social_links_color,
      };
      return appliedColors;
    }
    
    return defaults;
  }, [customization, customizationLoading, customizationError]);

  // Fetch categories
  const { 
    data: categories, 
    isLoading: categoriesLoading, 
    error: categoriesError,
    refetch: refetchCategories 
  } = useQuery({
    queryKey: ['categories-public-unified'],
    queryFn: async () => {
      console.log('🏷️ [CATEGORIES] Obteniendo categorías...');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .limit(50);
      
      if (error) {
        console.error('❌ [CATEGORIES] Error:', error);
        throw error;
      }
      
      const sortedCategories = sortCategoriesByStandardOrder(data || []);
      console.log(`✅ [CATEGORIES] ${sortedCategories.length} categorías obtenidas`);
      return sortedCategories;
    },
    enabled: isInitialized,
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  // CORRECCIÓN CRÍTICA: Query optimizada para carrito
  const { data: cartData, refetch: refetchCart } = useQuery({
    queryKey: ['cart-items-unified', sessionId],
    queryFn: async () => {
      if (!sessionId) {
        console.log('⚠️ [CART] No session ID disponible');
        return [];
      }
      
      console.log('🛒 [CART] Obteniendo items del carrito...');
      
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
        .eq('session_id', sessionId)
        .limit(50);
      
      if (error) {
        console.error('❌ [CART] Error:', error);
        return [];
      }
      
      console.log(`✅ [CART] ${data?.length || 0} items obtenidos`);
      return data || [];
    },
    enabled: !!sessionId && isInitialized,
    retry: 1,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (cartData) {
      setCartItems(cartData);
    }
  }, [cartData]);

  // Productos filtrados con ordenamiento optimizado
  const filteredProducts = React.useMemo(() => {
    if (!products || !Array.isArray(products)) {
      console.log('🔄 [FILTER] No hay productos para filtrar');
      return [];
    }
    
    console.log('🔄 [FILTER] Procesando productos filtrados...');
    console.log('📊 Total productos disponibles:', products.length);
    console.log('🎯 Categoría seleccionada:', selectedCategory);
    
    const filtered = products.filter(product => {
      if (selectedCategory === 'all') return true;
      return product.category_id === selectedCategory;
    });
    
    console.log('✅ Productos después del filtro:', filtered.length);
    
    if (selectedCategory === 'all') {
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Usar category_id para encontrar la categoría correspondiente
    const productsWithCategories = filtered.map(product => {
      const category = categories?.find(cat => cat.id === product.category_id);
      return {
        ...product,
        categories: category ? { name: category.name } : null
      };
    });
    
    const sortedByCategory = sortProductsByStandardizedCategories(productsWithCategories, categories);
    return sortedByCategory;
  }, [products, selectedCategory, categories]);

  // Hook de paginación optimizado
  const pagination = useProductPagination({ 
    products: filteredProducts, 
    itemsPerPage: 9
  });

  // Reset pagination when category changes
  useEffect(() => {
    pagination.resetToFirstPage();
  }, [selectedCategory]);

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
      console.log('🛒 [CART] Agregando producto:', product.name);
      
      const { error } = await supabase
        .from('cart_items')
        .insert({
          session_id: sessionId,
          product_id: product.id,
          quantity,
          special_instructions: specialInstructions,
        });

      if (error) {
        console.error('❌ [CART] Error agregando:', error);
        throw error;
      }

      toast({
        title: "Producto agregado",
        description: `${product.name} agregado al carrito`,
      });

      refetchCart();
    } catch (error) {
      console.error('❌ [CART] Error crítico:', error);
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
    console.log('🔄 [RETRY] Reintentando carga de datos...');
    refetchProducts();
    refetchCategories();
    refetchCart();
  };

  // Estados de carga y error mejorados
  const isLoading = !isInitialized || productsLoading || categoriesLoading || restaurantLoading;
  const hasError = productsError || categoriesError || restaurantError;

  console.log('🎯 [RENDER] Estado actual:', {
    isInitialized,
    isLoading,
    hasError,
    restaurantId,
    restaurantName,
    productsCount: products?.length || 0,
    categoriesCount: categories?.length || 0,
    filteredCount: filteredProducts?.length || 0
  });

  // CORRECCIÓN CRÍTICA: Estado de carga mejorado
  if (isLoading) {
    console.log('⏳ [RENDER] Mostrando estado de carga optimizado...');
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.menu_bg_color }}
      >
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div 
            className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto"
            style={{ borderColor: colors.button_bg_color }}
          ></div>
          <div>
            <p style={{ color: colors.text_color }} className="text-xl font-bold">
              Cargando Menú del Restaurante
            </p>
            <p style={{ color: colors.product_description_color }} className="text-sm mt-2">
              {restaurantName ? `Cargando menú de ${restaurantName}...` : 'Obteniendo los productos más frescos para ti...'}
            </p>
          </div>
          <div className="space-y-2">
            <Button 
              onClick={handleRetry}
              variant="outline"
              size="sm"
              style={{ 
                borderColor: colors.product_card_border_color,
                color: colors.text_color
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
            {onBack && (
              <Button 
                onClick={onBack}
                variant="ghost"
                size="sm"
                style={{ color: colors.product_description_color }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // CORRECCIÓN CRÍTICA: Manejo de errores mejorado
  if (hasError) {
    console.error('❌ [RENDER] Error crítico detectado:', { productsError, categoriesError, restaurantError });
    
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
                  {restaurantName || 'Menú del Restaurante'}
                </h1>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-medium">Error al cargar el menú del restaurante</p>
                <div className="text-sm space-y-1">
                  {restaurantError && <div>• Información del negocio: {restaurantError.message}</div>}
                  {productsError && <div>• Productos: {productsError.message}</div>}
                  {categoriesError && <div>• Categorías: {categoriesError.message}</div>}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRetry} size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                  {onBack && (
                    <Button onClick={onBack} variant="outline" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver al panel
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  // CORRECCIÓN CRÍTICA: Validación de productos mejorada
  if (!products || !Array.isArray(products) || products.length === 0) {
    console.warn('⚠️ [RENDER] No hay productos disponibles para el restaurante');
    
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
                  {restaurantName || 'Menú del Restaurante'}
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
                <div className="space-y-3">
                  <p className="font-medium">Menú en preparación</p>
                  <p className="text-sm">
                    {restaurantName 
                      ? `${restaurantName} está preparando su delicioso menú para ti.`
                      : 'Estamos preparando nuestro delicioso menú para ti.'
                    }
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={handleRetry} size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualizar menú
                    </Button>
                    {onBack && (
                      <Button onClick={onBack} variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver al panel
                      </Button>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  console.log('✅ [RENDER] Renderizando menú completo del restaurante:', restaurantName, 'con', products.length, 'productos');

  // FASE 3: Generar URL amigable para compartir
  const friendlyUrl = restaurantName ? createRestaurantSlug(restaurantName) : '';
  const currentUrl = window.location.origin + (friendlyUrl ? `/menu/${friendlyUrl}` : '/menu');

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: colors.menu_bg_color }}
    >
      {/* FASE 3: Header optimizado con nombre prominente del restaurante */}
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
              <div>
                <h1 
                  className="text-3xl font-bold"
                  style={{ color: colors.header_text_color }}
                >
                  {restaurantName || 'Menú del Restaurante'}
                </h1>
                {friendlyUrl && (
                  <p className="text-sm opacity-75 mt-1" style={{ color: colors.header_text_color }}>
                    📍 {currentUrl}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    ✅ Menú Sincronizado
                  </span>
                  <span className="text-xs opacity-60" style={{ color: colors.header_text_color }}>
                    {products.length} productos disponibles
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowShare(true)}
                size="sm"
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
                size="sm"
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
                size="sm"
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

      {/* Main content optimizado */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {restaurantInfo && (
            <BusinessInfoDisplay businessInfo={restaurantInfo} />
          )}

          <MenuExplorer
            categories={categories || []}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            customization={colors}
          />

          {/* Información de paginación mejorada */}
          {filteredProducts && filteredProducts.length > 0 && (
            <div className="flex justify-between items-center text-sm mb-4">
              <span style={{ color: colors.product_description_color }}>
                Mostrando {pagination.startItem} - {pagination.endItem} de {pagination.totalItems} productos de {restaurantName}
              </span>
              <div className="flex items-center gap-2">
                <span style={{ color: colors.product_description_color }}>
                  Página {pagination.currentPage} de {pagination.totalPages}
                </span>
                <Button
                  onClick={handleRetry}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  style={{ color: colors.product_description_color }}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Grid de productos optimizado */}
          {pagination.paginatedProducts && pagination.paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pagination.paginatedProducts.map((product) => {
                  // Encontrar la categoría usando category_id
                  const productCategory = categories?.find(cat => cat.id === product.category_id);
                  
                  return (
                    <Card 
                      key={`${product.id}-${product.name}`}
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
                              {productCategory?.name || 'Sin categoría'}
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
                  );
                })}
              </div>

              {
                pagination.totalPages > 1 && (
                  <div className="flex flex-col items-center space-y-4 mt-8">
                    <div className="text-sm" style={{ color: colors.product_description_color }}>
                      Página {pagination.currentPage} de {pagination.totalPages} 
                      ({pagination.totalItems} productos en total)
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={pagination.goToFirstPage}
                        disabled={!pagination.hasPreviousPage}
                        style={{ 
                          borderColor: colors.product_card_border_color,
                          color: colors.text_color
                        }}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        onClick={pagination.goToPreviousPage}
                        disabled={!pagination.hasPreviousPage}
                        style={{ 
                          borderColor: colors.product_card_border_color,
                          color: colors.text_color
                        }}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Anterior
                      </Button>

                      <div className="flex items-center space-x-1">
                        {pagination.getVisiblePages().map((pageNumber) => {
                          const isCurrentPage = pageNumber === pagination.currentPage;
                          
                          return (
                            <Button
                              key={pageNumber}
                              variant={isCurrentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => pagination.goToPage(pageNumber)}
                              style={isCurrentPage ? {
                                backgroundColor: colors.button_bg_color,
                                color: colors.button_text_color
                              } : {
                                borderColor: colors.product_card_border_color,
                                color: colors.text_color
                              }}
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        onClick={pagination.goToNextPage}
                        disabled={!pagination.hasNextPage}
                        style={{ 
                          borderColor: colors.product_card_border_color,
                          color: colors.text_color
                        }}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={pagination.goToLastPage}
                        disabled={!pagination.hasNextPage}
                        style={{ 
                          borderColor: colors.product_card_border_color,
                          color: colors.text_color
                        }}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              }
            </>
          ) : (
            <div className="text-center py-12">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-medium">No se encontraron productos en esta categoría</p>
                    <div className="flex justify-center gap-2">
                      <Button onClick={() => setSelectedCategory('all')} size="sm">
                        Ver todos los productos
                      </Button>
                      <Button onClick={handleRetry} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualizar
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </main>

      {/* Modales */}
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
          restaurantInfo={restaurantInfo}
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
