import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChefHat, 
  Package, 
  Calendar, 
  BarChart3, 
  Settings,
  LogOut,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  Palette,
  Building,
  Globe,
  Users,
  CreditCard
} from 'lucide-react';
import { usePublicMenuCustomization, getDefaultCustomization } from '@/hooks/useMenuCustomization';
import OrderManagement from '../orders/OrderManagement';
import ProductManagement from '../products/ProductManagement';
import ReservationManagement from '../reservations/ReservationManagement';
import ReportsManagement from '../reports/ReportsManagement';
import BusinessInfoManagement from '../business/BusinessInfoManagement';
import MenuCustomization from '../menu/MenuCustomization';
import PublicMenu from '../menu/PublicMenu';
import EmployeeManagement from '../employees/EmployeeManagement';
import NotificationCenter from '../notifications/NotificationCenter';
import UserSubscriptionDashboard from '../subscriptions/UserSubscriptionDashboard';

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);

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

  const handleBackToDashboard = () => {
    setActiveSection(null);
  };

  // CORRECCIÓN CRÍTICA: Mejorar navegación al menú público
  const handleViewPublicMenu = () => {
    console.log('🔗 [ADMIN] Navegando al menú público...');
    setActiveSection('public-menu');
  };

  // Si hay una sección activa, mostrar ese componente
  if (activeSection === 'orders') {
    return <OrderManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'products') {
    return <ProductManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'reservations') {
    return <ReservationManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'reports') {
    return <ReportsManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'business-info') {
    return <BusinessInfoManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'menu-customization') {
    return <MenuCustomization onBack={handleBackToDashboard} />;
  }

  // NUEVA SECCIÓN: Gestión de Empleados
  if (activeSection === 'employee-management') {
    return <EmployeeManagement onBack={handleBackToDashboard} />;
  }

  // NUEVA SECCIÓN: Dashboard de Suscripciones
  if (activeSection === 'subscription-dashboard') {
    return <UserSubscriptionDashboard onBack={handleBackToDashboard} />;
  }

  // CORRECCIÓN CRÍTICA: Renderizado optimizado del menú público
  if (activeSection === 'public-menu') {
    console.log('📱 [ADMIN] Renderizando menú público desde dashboard');
    return <PublicMenu onBack={handleBackToDashboard} />;
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
              SAP Menu - Panel Administrativo
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Centro de Notificaciones */}
            <NotificationCenter />
            
            {/* CORRECCIÓN: Botón directo para ver menú público */}
            <Button 
              onClick={handleViewPublicMenu}
              variant="outline"
              size="sm"
              style={{ 
                borderColor: colors.button_bg_color,
                color: colors.button_bg_color
              }}
            >
              <Globe className="h-4 w-4 mr-2" />
              Ver Menú Público
            </Button>
            <span 
              className="text-sm"
              style={{ color: colors.product_description_color }}
            >
              Admin: {profile?.full_name || profile?.email}
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
            Panel de Control
          </h2>
          <p 
            className="text-muted-foreground"
            style={{ color: colors.product_description_color }}
          >
            Gestiona tu restaurante desde aquí
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card 
            style={{ 
              backgroundColor: colors.product_card_bg_color,
              borderColor: colors.product_card_border_color
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: colors.button_bg_color }}
                  >
                    24
                  </div>
                  <p 
                    className="text-sm"
                    style={{ color: colors.product_description_color }}
                  >
                    Pedidos Hoy
                  </p>
                </div>
                <ShoppingCart 
                  className="h-8 w-8 opacity-50" 
                  style={{ color: colors.button_bg_color }}
                />
              </div>
            </CardContent>
          </Card>
          <Card 
            style={{ 
              backgroundColor: colors.product_card_bg_color,
              borderColor: colors.product_card_border_color
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: colors.product_price_color }}
                  >
                    €1,247
                  </div>
                  <p 
                    className="text-sm"
                    style={{ color: colors.product_description_color }}
                  >
                    Ventas Hoy
                  </p>
                </div>
                <DollarSign 
                  className="h-8 w-8 opacity-50" 
                  style={{ color: colors.product_price_color }}
                />
              </div>
            </CardContent>
          </Card>
          <Card 
            style={{ 
              backgroundColor: colors.product_card_bg_color,
              borderColor: colors.product_card_border_color
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div 
                    className="text-2xl font-bold text-blue-600"
                    style={{ color: colors.social_links_color }}
                  >
                    12
                  </div>
                  <p 
                    className="text-sm"
                    style={{ color: colors.product_description_color }}
                  >
                    Reservas Hoy
                  </p>
                </div>
                <Calendar 
                  className="h-8 w-8 opacity-50" 
                  style={{ color: colors.social_links_color }}
                />
              </div>
            </CardContent>
          </Card>
          <Card 
            style={{ 
              backgroundColor: colors.product_card_bg_color,
              borderColor: colors.product_card_border_color
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div 
                    className="text-2xl font-bold text-orange-600"
                    style={{ color: colors.contact_button_bg_color }}
                  >
                    15 min
                  </div>
                  <p 
                    className="text-sm"
                    style={{ color: colors.product_description_color }}
                  >
                    Tiempo Promedio
                  </p>
                </div>
                <Clock 
                  className="h-8 w-8 opacity-50" 
                  style={{ color: colors.contact_button_bg_color }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* NUEVA CARD: Dashboard de Suscripciones */}
          <Card 
            className="hover:shadow-lg transition-shadow duration-300 border-primary/40"
            style={{ 
              backgroundColor: colors.product_card_bg_color,
              borderColor: colors.button_bg_color,
              boxShadow: `0 4px 6px -1px ${colors.shadow_color}`
            }}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center space-x-2"
                style={{ color: colors.product_name_color }}
              >
                <CreditCard 
                  className="h-5 w-5"
                  style={{ color: colors.button_bg_color }}
                />
                <span>Mi Suscripción</span>
              </CardTitle>
              <CardDescription style={{ color: colors.product_description_color }}>
                Gestiona tu plan y uso de recursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('subscription-dashboard')}
                style={{ 
                  backgroundColor: colors.button_bg_color,
                  color: colors.button_text_color
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Ver Mi Suscripción
              </Button>
            </CardContent>
          </Card>
          {/* NUEVA CARD: Gestión de Empleados */}
          <Card 
            className="hover:shadow-lg transition-shadow duration-300 border-primary/40"
            style={{ 
              backgroundColor: colors.product_card_bg_color,
              borderColor: colors.button_bg_color,
              boxShadow: `0 4px 6px -1px ${colors.shadow_color}`
            }}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center space-x-2"
                style={{ color: colors.product_name_color }}
              >
                <Users 
                  className="h-5 w-5"
                  style={{ color: colors.button_bg_color }}
                />
                <span>Gestión de Empleados</span>
              </CardTitle>
              <CardDescription style={{ color: colors.product_description_color }}>
                Administra tu equipo de trabajo completo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('employee-management')}
                style={{ 
                  backgroundColor: colors.button_bg_color,
                  color: colors.button_text_color
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Gestionar Empleados
              </Button>
            </CardContent>
          </Card>

          {/* Gestión de Pedidos */}
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
                <ShoppingCart 
                  className="h-5 w-5"
                  style={{ color: colors.button_bg_color }}
                />
                <span>Gestión de Pedidos</span>
              </CardTitle>
              <CardDescription style={{ color: colors.product_description_color }}>
                Administra pedidos entrantes y su estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('orders')}
                style={{ 
                  backgroundColor: colors.button_bg_color,
                  color: colors.button_text_color
                }}
              >
                Gestionar Pedidos
              </Button>
            </CardContent>
          </Card>

          {/* Gestión de Productos */}
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
                <Package 
                  className="h-5 w-5"
                  style={{ color: colors.button_bg_color }}
                />
                <span>Gestión de Productos</span>
              </CardTitle>
              <CardDescription style={{ color: colors.product_description_color }}>
                Añade, edita y organiza tu menú
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('products')}
                style={{ 
                  backgroundColor: colors.button_bg_color,
                  color: colors.button_text_color
                }}
              >
                Gestionar Productos
              </Button>
            </CardContent>
          </Card>

          {/* Personalización del Menú */}
          <Card 
            className="hover:shadow-lg transition-shadow duration-300 border-primary/20"
            style={{ 
              backgroundColor: colors.product_card_bg_color,
              borderColor: colors.button_bg_color
            }}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center space-x-2"
                style={{ color: colors.product_name_color }}
              >
                <Palette 
                  className="h-5 w-5"
                  style={{ color: colors.button_bg_color }}
                />
                <span>Personalización del Menú</span>
              </CardTitle>
              <CardDescription style={{ color: colors.product_description_color }}>
                Personaliza colores y diseño de tu menú público
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('menu-customization')}
                style={{ 
                  backgroundColor: colors.button_bg_color,
                  color: colors.button_text_color
                }}
              >
                Personalizar Menú
              </Button>
            </CardContent>
          </Card>

          {/* Gestión de Reservas */}
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
                <span>Gestión de Reservas</span>
              </CardTitle>
              <CardDescription style={{ color: colors.product_description_color }}>
                Administra reservas de mesas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('reservations')}
                style={{ 
                  backgroundColor: colors.button_bg_color,
                  color: colors.button_text_color
                }}
              >
                Gestionar Reservas
              </Button>
            </CardContent>
          </Card>

          {/* Información del Negocio */}
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
                <Building 
                  className="h-5 w-5"
                  style={{ color: colors.button_bg_color }}
                />
                <span>Información del Negocio</span>
              </CardTitle>
              <CardDescription style={{ color: colors.product_description_color }}>
                Configura datos de tu restaurante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('business-info')}
                style={{ 
                  backgroundColor: colors.button_bg_color,
                  color: colors.button_text_color
                }}
              >
                Configurar Negocio
              </Button>
            </CardContent>
          </Card>

          {/* Reportes y Analíticas */}
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
                <BarChart3 
                  className="h-5 w-5"
                  style={{ color: colors.button_bg_color }}
                />
                <span>Reportes y Analíticas</span>
              </CardTitle>
              <CardDescription style={{ color: colors.product_description_color }}>
                Visualiza estadísticas de ventas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('reports')}
                style={{ 
                  backgroundColor: colors.button_bg_color,
                  color: colors.button_text_color
                }}
              >
                Ver Reportes
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
