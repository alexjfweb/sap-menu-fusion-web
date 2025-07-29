
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Palette, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import { useMenuCustomization } from '@/hooks/useMenuCustomization';
import { Alert, AlertDescription } from '@/components/ui/alert';

type MenuCustomization = Tables<'menu_customization'>;
type BusinessInfo = Tables<'business_info'>;

interface MenuCustomizationProps {
  onBack: () => void;
}

const MenuCustomization = ({ onBack }: MenuCustomizationProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [colors, setColors] = useState<Partial<MenuCustomization>>({
    menu_bg_color: '#ffffff',
    header_bg_color: '#f8f9fa',
    text_color: '#333333',
    header_text_color: '#ffffff',
    button_bg_color: '#007bff',
    button_text_color: '#ffffff',
    contact_button_bg_color: '#25d366',
    contact_button_text_color: '#ffffff',
    product_card_bg_color: '#ffffff',
    product_card_border_color: '#e9ecef',
    product_name_color: '#333333',
    product_description_color: '#6c757d',
    product_price_color: '#28a745',
    shadow_color: 'rgba(0,0,0,0.1)',
    social_links_color: '#007bff',
  });

  // Obtener información del negocio usando el hook mejorado
  const { data: businessInfo, error: businessError, isLoading: businessLoading } = useBusinessInfo();

  // Obtener configuración de personalización existente usando el hook
  const { data: customization, isLoading: customizationLoading } = useMenuCustomization(businessInfo?.id);

  // Cargar colores existentes
  useEffect(() => {
    if (customization) {
      setColors(customization);
    }
  }, [customization]);

  // Mutación para guardar cambios con manejo mejorado de errores
  const saveCustomization = useMutation({
    mutationFn: async (colorData: Partial<MenuCustomization>) => {
      // Validación previa
      if (!businessInfo?.id) {
        throw new Error('No se encontró información del negocio. Por favor, configure primero la información básica de su negocio.');
      }

      console.log('💾 [SAVE CUSTOMIZATION] Guardando para business_id:', businessInfo.id);

      try {
        const { data, error } = await supabase
          .from('menu_customization')
          .upsert({
            business_id: businessInfo.id,
            ...colorData,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('❌ [SAVE CUSTOMIZATION] Error de Supabase:', error);
          
          // Manejar errores específicos
          if (error.code === 'PGRST116') {
            throw new Error('No se pudo crear la configuración de personalización. Verifique que su negocio esté configurado correctamente.');
          }
          
          throw error;
        }

        if (!data) {
          throw new Error('No se recibió confirmación del guardado. Intente nuevamente.');
        }

        console.log('✅ [SAVE CUSTOMIZATION] Guardado exitoso:', data.id);
        return data;
        
      } catch (error) {
        console.error('💥 [SAVE CUSTOMIZATION] Error inesperado:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Personalización guardada",
        description: "Los colores de tu menú han sido actualizados exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['menu-customization'] });
      queryClient.invalidateQueries({ queryKey: ['public-menu-customization'] });
    },
    onError: (error) => {
      console.error('💥 [SAVE CUSTOMIZATION] Error final:', error);
      
      let errorMessage = "No se pudo guardar la personalización.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error al guardar",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleColorChange = (field: keyof MenuCustomization, value: string) => {
    setColors(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveCustomization.mutate(colors);
  };

  const handleReset = () => {
    const defaultColors = {
      menu_bg_color: '#ffffff',
      header_bg_color: '#f8f9fa',
      text_color: '#333333',
      header_text_color: '#ffffff',
      button_bg_color: '#007bff',
      button_text_color: '#ffffff',
      contact_button_bg_color: '#25d366',
      contact_button_text_color: '#ffffff',
      product_card_bg_color: '#ffffff',
      product_card_border_color: '#e9ecef',
      product_name_color: '#333333',
      product_description_color: '#6c757d',
      product_price_color: '#28a745',
      shadow_color: 'rgba(0,0,0,0.1)',
      social_links_color: '#007bff',
    };
    setColors(defaultColors);
  };

  // Estados de carga y error
  const isLoading = businessLoading || customizationLoading;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando personalización...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si hay problemas con la información del negocio
  if (businessError || !businessInfo) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-2xl pt-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {businessError?.message || 'No se pudo cargar la información del negocio. Por favor, configure primero la información básica de su restaurante desde el panel de administración.'}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Button>
          </div>
        </div>
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
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel
              </Button>
              <div className="flex items-center space-x-2">
                <Palette className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Personalización del Menú</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restablecer
              </Button>
              <Button onClick={handleSave} disabled={saveCustomization.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {saveCustomization.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Configuración */}
          <div className="space-y-6">
            {/* Colores Principales */}
            <Card>
              <CardHeader>
                <CardTitle>Colores Principales</CardTitle>
                <CardDescription>
                  Configura los colores base de tu menú público
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="menu_bg_color">Fondo General del Menú</Label>
                    <Input
                      id="menu_bg_color"
                      type="color"
                      value={colors.menu_bg_color || '#ffffff'}
                      onChange={(e) => handleColorChange('menu_bg_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="header_bg_color">Fondo del Encabezado</Label>
                    <Input
                      id="header_bg_color"
                      type="color"
                      value={colors.header_bg_color || '#f8f9fa'}
                      onChange={(e) => handleColorChange('header_bg_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="text_color">Texto General</Label>
                    <Input
                      id="text_color"
                      type="color"
                      value={colors.text_color || '#333333'}
                      onChange={(e) => handleColorChange('text_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="header_text_color">Texto del Encabezado</Label>
                    <Input
                      id="header_text_color"
                      type="color"
                      value={colors.header_text_color || '#ffffff'}
                      onChange={(e) => handleColorChange('header_text_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Colores de Botones */}
            <Card>
              <CardHeader>
                <CardTitle>Botones y Elementos Interactivos</CardTitle>
                <CardDescription>
                  Personaliza los colores de botones y elementos interactivos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="button_bg_color">Fondo de Botones Principales</Label>
                    <Input
                      id="button_bg_color"
                      type="color"
                      value={colors.button_bg_color || '#007bff'}
                      onChange={(e) => handleColorChange('button_bg_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="button_text_color">Texto de Botones Principales</Label>
                    <Input
                      id="button_text_color"
                      type="color"
                      value={colors.button_text_color || '#ffffff'}
                      onChange={(e) => handleColorChange('button_text_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_button_bg_color">Fondo Botón de Contacto</Label>
                    <Input
                      id="contact_button_bg_color"
                      type="color"
                      value={colors.contact_button_bg_color || '#25d366'}
                      onChange={(e) => handleColorChange('contact_button_bg_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_button_text_color">Texto Botón de Contacto</Label>
                    <Input
                      id="contact_button_text_color"
                      type="color"
                      value={colors.contact_button_text_color || '#ffffff'}
                      onChange={(e) => handleColorChange('contact_button_text_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Colores de Productos */}
            <Card>
              <CardHeader>
                <CardTitle>Tarjetas de Productos</CardTitle>
                <CardDescription>
                  Personaliza la apariencia de las tarjetas de platos/productos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product_card_bg_color">Fondo de Tarjeta</Label>
                    <Input
                      id="product_card_bg_color"
                      type="color"
                      value={colors.product_card_bg_color || '#ffffff'}
                      onChange={(e) => handleColorChange('product_card_bg_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product_card_border_color">Borde de Tarjeta</Label>
                    <Input
                      id="product_card_border_color"
                      type="color"
                      value={colors.product_card_border_color || '#e9ecef'}
                      onChange={(e) => handleColorChange('product_card_border_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product_name_color">Nombre del Producto</Label>
                    <Input
                      id="product_name_color"
                      type="color"
                      value={colors.product_name_color || '#333333'}
                      onChange={(e) => handleColorChange('product_name_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product_description_color">Descripción del Producto</Label>
                    <Input
                      id="product_description_color"
                      type="color"
                      value={colors.product_description_color || '#6c757d'}
                      onChange={(e) => handleColorChange('product_description_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product_price_color">Precio del Producto</Label>
                    <Input
                      id="product_price_color"
                      type="color"
                      value={colors.product_price_color || '#28a745'}
                      onChange={(e) => handleColorChange('product_price_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="social_links_color">Enlaces Sociales</Label>
                    <Input
                      id="social_links_color"
                      type="color"
                      value={colors.social_links_color || '#007bff'}
                      onChange={(e) => handleColorChange('social_links_color', e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vista Previa */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa</CardTitle>
                <CardDescription>
                  Así se verá tu menú público con los colores seleccionados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg overflow-hidden"
                  style={{ backgroundColor: colors.menu_bg_color }}
                >
                  {/* Header Preview */}
                  <div 
                    className="p-4 text-center"
                    style={{ 
                      backgroundColor: colors.header_bg_color,
                      color: colors.header_text_color 
                    }}
                  >
                    <h3 className="text-lg font-bold mb-2">Menú del Restaurante</h3>
                    <div className="flex justify-center space-x-2">
                      <span 
                        className="px-2 py-1 rounded text-sm"
                        style={{ 
                          backgroundColor: colors.social_links_color,
                          color: colors.button_text_color 
                        }}
                      >
                        Facebook
                      </span>
                      <span 
                        className="px-2 py-1 rounded text-sm"
                        style={{ 
                          backgroundColor: colors.social_links_color,
                          color: colors.button_text_color 
                        }}
                      >
                        Instagram
                      </span>
                    </div>
                  </div>

                  {/* Category Preview */}
                  <div className="p-4">
                    <button 
                      className="px-4 py-2 rounded mb-4"
                      style={{ 
                        backgroundColor: colors.button_bg_color,
                        color: colors.button_text_color 
                      }}
                    >
                      Categoría de Ejemplo
                    </button>

                    {/* Product Card Preview */}
                    <div 
                      className="border rounded-lg p-4 mb-4"
                      style={{ 
                        backgroundColor: colors.product_card_bg_color,
                        borderColor: colors.product_card_border_color 
                      }}
                    >
                      <h4 
                        className="font-semibold mb-2"
                        style={{ color: colors.product_name_color }}
                      >
                        Producto de Ejemplo
                      </h4>
                      <p 
                        className="text-sm mb-2"
                        style={{ color: colors.product_description_color }}
                      >
                        Descripción del producto de ejemplo con ingredientes...
                      </p>
                      <div className="flex justify-between items-center">
                        <span 
                          className="text-lg font-bold"
                          style={{ color: colors.product_price_color }}
                        >
                          $15.000
                        </span>
                        <button 
                          className="px-3 py-1 rounded text-sm"
                          style={{ 
                            backgroundColor: colors.button_bg_color,
                            color: colors.button_text_color 
                          }}
                        >
                          Agregar
                        </button>
                      </div>
                    </div>

                    {/* Contact Button Preview */}
                    <button 
                      className="px-4 py-2 rounded"
                      style={{ 
                        backgroundColor: colors.contact_button_bg_color,
                        color: colors.contact_button_text_color 
                      }}
                    >
                      Contactar por WhatsApp
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MenuCustomization;
