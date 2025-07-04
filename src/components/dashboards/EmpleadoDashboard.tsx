
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ChefHat, ClipboardList, Calendar, LogOut } from 'lucide-react';
import { usePublicMenuCustomization, getDefaultCustomization } from '@/hooks/useMenuCustomization';
import OrderManagement from '@/components/orders/OrderManagement';
import ReservationManagement from '@/components/reservations/ReservationManagement';
import PublicMenu from '@/components/menu/PublicMenu';

const EmpleadoDashboard = () => {
  const { profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'orders' | 'reservations' | 'menu'>('dashboard');

  // Fetch customization with the same hook as PublicMenu
  const { data: customization, isLoading: customizationLoading } = usePublicMenuCustomization();
  
  // Apply colors - use customization if available, otherwise defaults
  const colors = React.useMemo(() => {
    const defaults = getDefaultCustomization();
    
    if (customization) {
      return {
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
    }
    
    return defaults;
  }, [customization]);

  const handleViewOrders = () => {
    setCurrentView('orders');
  };

  const handleViewReservations = () => {
    setCurrentView('reservations');
  };

  const handleViewMenu = () => {
    setCurrentView('menu');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  if (currentView === 'orders') {
    return <OrderManagement onBack={handleBackToDashboard} />;
  }

  if (currentView === 'reservations') {
    return <ReservationManagement onBack={handleBackToDashboard} />;
  }

  if (currentView === 'menu') {
    return (
      <div 
        className="min-h-screen"
        style={{ backgroundColor: colors.menu_bg_color }}
      >
        <header 
          className="border-b backdrop-blur supports-[backdrop-filter]:bg-background/60"
          style={{ 
            backgroundColor: colors.header_bg_color,
            borderColor: colors.product_card_border_color
          }}
        >
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <ChefHat 
                className="h-8 w-8"
                style={{ color: colors.header_text_color }}
              />
              <h1 
                className="text-2xl font-bold"
                style={{ color: colors.header_text_color }}
              >
                SAP Menu - Menú del Día
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToDashboard}
                style={{ 
                  borderColor: colors.product_card_border_color,
                  color: colors.header_text_color
                }}
              >
                Volver al Panel
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                style={{ 
                  borderColor: colors.product_card_border_color,
                  color: colors.header_text_color
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </header>
        <PublicMenu />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: colors.menu_bg_color }}
    >
      {/* Header */}
      <header 
        className="border-b backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{ 
          backgroundColor: colors.header_bg_color,
          borderColor: colors.product_card_border_color
        }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ChefHat 
              className="h-8 w-8"
              style={{ color: colors.header_text_color }}
            />
            <h1 
              className="text-2xl font-bold"
              style={{ color: colors.header_text_color }}
            >
              SAP Menu - Panel Empleado
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span 
              className="text-sm"
              style={{ color: colors.product_description_color }}
            >
              Bienvenido, {profile?.full_name || profile?.email}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              style={{ 
                borderColor: colors.product_card_border_color,
                color: colors.header_text_color
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 
            className="text-3xl font-bold mb-2"
            style={{ color: colors.text_color }}
          >
            Panel de Empleado
          </h2>
          <p 
            className="text-muted-foreground"
            style={{ color: colors.product_description_color }}
          >
            Gestiona pedidos y reservas del restaurante
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pedidos */}
          <Card 
            className="hover:shadow-lg transition-shadow duration-300"
            style={{ 
              backgroundColor: colors.product_card_bg_color,
              borderColor: colors.product_card_border_color
            }}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center space-x-2"
                style={{ color: colors.product_name_color }}
              >
                <ClipboardList 
                  className="h-5 w-5"
                  style={{ color: colors.button_bg_color }}
                />
                <span>Pedidos</span>
              </CardTitle>
              <CardDescription style={{ color: colors.product_description_color }}>
                Gestiona los pedidos de los clientes en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={handleViewOrders}
                style={{ 
                  backgroundColor: colors.button_bg_color,
                  color: colors.button_text_color
                }}
              >
                Ver Pedidos
              </Button>
            </CardContent>
          </Card>

          {/* Reservas */}
          <Card 
            className="hover:shadow-lg transition-shadow duration-300"
            style={{ 
              backgroundColor: colors.product_card_bg_color,
              borderColor: colors.product_card_border_color
            }}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center space-x-2"
                style={{ color: colors.product_name_color }}
              >
                <Calendar 
                  className="h-5 w-5"
                  style={{ color: colors.button_bg_color }}
                />
                <span>Reservas</span>
              </CardTitle>
              <CardDescription style={{ color: colors.product_description_color }}>
                Consulta y gestiona reservas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={handleViewReservations}
                style={{ 
                  backgroundColor: colors.button_bg_color,
                  color: colors.button_text_color
                }}
              >
                Ver Reservas
              </Button>
            </CardContent>
          </Card>

          {/* Menú */}
          <Card 
            className="hover:shadow-lg transition-shadow duration-300"
            style={{ 
              backgroundColor: colors.product_card_bg_color,
              borderColor: colors.product_card_border_color
            }}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center space-x-2"
                style={{ color: colors.product_name_color }}
              >
                <ChefHat 
                  className="h-5 w-5"
                  style={{ color: colors.button_bg_color }}
                />
                <span>Menú</span>
              </CardTitle>
              <CardDescription style={{ color: colors.product_description_color }}>
                Consulta el menú del día
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={handleViewMenu}
                style={{ 
                  backgroundColor: colors.button_bg_color,
                  color: colors.button_text_color
                }}
              >
                Ver Menú
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <h3 
            className="text-xl font-semibold mb-4"
            style={{ color: colors.text_color }}
          >
            Resumen del Día
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card 
              style={{ 
                backgroundColor: colors.product_card_bg_color,
                borderColor: colors.product_card_border_color
              }}
            >
              <CardContent className="p-4">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: colors.button_bg_color }}
                >
                  12
                </div>
                <p 
                  className="text-sm"
                  style={{ color: colors.product_description_color }}
                >
                  Pedidos Pendientes
                </p>
              </CardContent>
            </Card>
            <Card 
              style={{ 
                backgroundColor: colors.product_card_bg_color,
                borderColor: colors.product_card_border_color
              }}
            >
              <CardContent className="p-4">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: colors.product_price_color }}
                >
                  8
                </div>
                <p 
                  className="text-sm"
                  style={{ color: colors.product_description_color }}
                >
                  Pedidos Completados
                </p>
              </CardContent>
            </Card>
            <Card 
              style={{ 
                backgroundColor: colors.product_card_bg_color,
                borderColor: colors.product_card_border_color
              }}
            >
              <CardContent className="p-4">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: colors.social_links_color }}
                >
                  5
                </div>
                <p 
                  className="text-sm"
                  style={{ color: colors.product_description_color }}
                >
                  Reservas Hoy
                </p>
              </CardContent>
            </Card>
            <Card 
              style={{ 
                backgroundColor: colors.product_card_bg_color,
                borderColor: colors.product_card_border_color
              }}
            >
              <CardContent className="p-4">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: colors.contact_button_bg_color }}
                >
                  3
                </div>
                <p 
                  className="text-sm"
                  style={{ color: colors.product_description_color }}
                >
                  Mesas Ocupadas
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmpleadoDashboard;
