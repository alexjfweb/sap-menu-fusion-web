
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChefHat, 
  Users, 
  Package, 
  Calendar, 
  BarChart3, 
  Settings,
  LogOut,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  Building,
  CreditCard,
  Database,
  Bell,
  Shield,
  UserCheck
} from 'lucide-react';
import { usePublicMenuCustomization, getDefaultCustomization } from '@/hooks/useMenuCustomization';
import OrderManagement from '../orders/OrderManagement';
import ProductManagement from '../products/ProductManagement';
import ReservationManagement from '../reservations/ReservationManagement';
import ReportsManagement from '../reports/ReportsManagement';
import UserManagement from '../users/UserManagement';
import GlobalSettings from '../settings/GlobalSettings';
import BusinessInfoManagement from '../business/BusinessInfoManagement';
import CompanyManagement from '../companies/CompanyManagement';
import GlobalAnalytics from '../analytics/GlobalAnalytics';
import DatabaseManagement from '../database/DatabaseManagement';
import MaintenanceTools from '../maintenance/MaintenanceTools';
import SubscriptionManagement from '../subscriptions/SubscriptionManagement';
import DatabaseTestPanel from '../DatabaseTestPanel';
import PaymentReminderManagement from '../payment-reminders/PaymentReminderManagement';
import UserPermissionValidator from '../UserPermissionValidator';
import AccountVerification from '../AccountVerification';
import SuperAdminPanel from '../SuperAdminPanel';
import PaymentConfiguration from '../PaymentConfiguration';
import SubscriptionPlansManagement from '../subscriptions/SubscriptionPlansManagement';
import WhatsappConfiguration from '../whatsapp/WhatsappConfiguration';

const SuperAdminDashboard = () => {
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

  // Si hay una sección activa, mostrar ese componente
  if (activeSection === 'superadmin-panel') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToDashboard}>
            ← Volver al Dashboard
          </Button>
        </div>
        <SuperAdminPanel />
      </div>
    );
  }

  if (activeSection === 'payments') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToDashboard}>
            ← Volver al Dashboard
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Configuración de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentConfiguration />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === 'subscriptions') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToDashboard}>
            ← Volver al Dashboard
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Planes de Suscripción</CardTitle>
          </CardHeader>
          <CardContent>
            <SubscriptionPlansManagement />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === 'whatsapp') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToDashboard}>
            ← Volver al Dashboard
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Configuración de WhatsApp Business API</CardTitle>
          </CardHeader>
          <CardContent>
            <WhatsappConfiguration />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === 'validator') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToDashboard}>
            ← Volver al Dashboard
          </Button>
        </div>
        <UserPermissionValidator />
      </div>
    );
  }

  if (activeSection === 'verification') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToDashboard}>
            ← Volver al Dashboard
          </Button>
        </div>
        <AccountVerification />
      </div>
    );
  }

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

  if (activeSection === 'users') {
    return <UserManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'settings') {
    return <GlobalSettings onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'business-info') {
    return <BusinessInfoManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'companies') {
    return <CompanyManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'analytics') {
    return <GlobalAnalytics onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'database') {
    return <DatabaseManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'maintenance') {
    return <MaintenanceTools onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'payment-reminders') {
    return <PaymentReminderManagement onBack={handleBackToDashboard} />;
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
              SAP Menu - Panel Super Administrador
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span 
              className="text-sm"
              style={{ color: colors.product_description_color }}
            >
              Super Admin: {profile?.full_name || profile?.email}
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
            Panel de Super Administrador
          </h2>
          <p 
            className="text-muted-foreground"
            style={{ color: colors.product_description_color }}
          >
            Control total sobre la plataforma SAP Menu
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
                    156
                  </div>
                  <p 
                    className="text-sm"
                    style={{ color: colors.product_description_color }}
                  >
                    Usuarios Totales
                  </p>
                </div>
                <Users 
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
                    €45,247
                  </div>
                  <p 
                    className="text-sm"
                    style={{ color: colors.product_description_color }}
                  >
                    Ingresos del Mes
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
                    className="text-2xl font-bold"
                    style={{ color: colors.social_links_color }}
                  >
                    23
                  </div>
                  <p 
                    className="text-sm"
                    style={{ color: colors.product_description_color }}
                  >
                    Restaurantes Activos
                  </p>
                </div>
                <Building 
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
                    className="text-2xl font-bold"
                    style={{ color: colors.contact_button_bg_color }}
                  >
                    98.2%
                  </div>
                  <p 
                    className="text-sm"
                    style={{ color: colors.product_description_color }}
                  >
                    Tiempo de Actividad
                  </p>
                </div>
                <TrendingUp 
                  className="h-8 w-8 opacity-50" 
                  style={{ color: colors.contact_button_bg_color }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Panel de Super Administrador */}
          <Card 
            className="hover:shadow-lg transition-shadow duration-300"
            style={{ 
              backgroundColor: colors.product_card_bg_color,
              borderColor: '#ef4444'
            }}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center space-x-2"
                style={{ color: colors.product_name_color }}
              >
                <Shield className="h-5 w-5 text-red-600" />
                <span>Panel de Super Admin</span>
              </CardTitle>
              <CardDescription style={{ color: colors.product_description_color }}>
                Gestión avanzada de usuarios super administradores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('superadmin-panel')}
                style={{ 
                  backgroundColor: colors.button_bg_color,
                  color: colors.button_text_color
                }}
              >
                Acceder al Panel
              </Button>
            </CardContent>
          </Card>

          {/* Configuración de Pagos - CORREGIDA */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <span>Configuración de Pagos</span>
              </CardTitle>
              <CardDescription>
                Administra métodos de pago y configuraciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('payments')}
              >
                Gestionar Pagos
              </Button>
            </CardContent>
          </Card>

          {/* Planes de Suscripción - CORREGIDA */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-yellow-600" />
                <span>Planes de Suscripción</span>
              </CardTitle>
              <CardDescription>
                Gestiona planes y suscripciones de usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('subscriptions')}
              >
                Gestionar Suscripciones
              </Button>
            </CardContent>
          </Card>

          {/* WhatsApp Business API - CORREGIDA */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-emerald-600" />
                <span>WhatsApp Business API</span>
              </CardTitle>
              <CardDescription>
                Configura integración con WhatsApp Business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('whatsapp')}
              >
                Configurar WhatsApp
              </Button>
            </CardContent>
          </Card>

          {/* Verificación de Cuentas */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <span>Verificación de Cuentas</span>
              </CardTitle>
              <CardDescription>
                Verifica si las cuentas existen en la base de datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('verification')}
              >
                Verificar Cuentas
              </Button>
            </CardContent>
          </Card>

          {/* Validador de Permisos */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Validador de Permisos</span>
              </CardTitle>
              <CardDescription>
                Verifica permisos de usuarios y estado de autenticación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('validator')}
              >
                Validar Permisos
              </Button>
            </CardContent>
          </Card>

          {/* Gestión de Empresas */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-primary" />
                <span>Gestión de Empresas</span>
              </CardTitle>
              <CardDescription>
                Administra empresas y restaurantes registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('companies')}
              >
                Gestionar Empresas
              </Button>
            </CardContent>
          </Card>

          {/* Analíticas Globales */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Analíticas Globales</span>
              </CardTitle>
              <CardDescription>
                Métricas y estadísticas de toda la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('analytics')}
              >
                Ver Analíticas
              </Button>
            </CardContent>
          </Card>

          {/* Gestión de Base de Datos */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-primary" />
                <span>Gestión de Base de Datos</span>
              </CardTitle>
              <CardDescription>
                Administra la base de datos y migraciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('database')}
              >
                Gestionar BD
              </Button>
            </CardContent>
          </Card>

          {/* Gestión de Usuarios Globales */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Gestión de Usuarios</span>
              </CardTitle>
              <CardDescription>
                Administra todos los usuarios de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('users')}
              >
                Gestionar Usuarios
              </Button>
            </CardContent>
          </Card>

          {/* Recordatorios de Pago */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <span>Recordatorios de Pago</span>
              </CardTitle>
              <CardDescription>
                Gestiona recordatorios automáticos de vencimientos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('payment-reminders')}
              >
                Gestionar Recordatorios
              </Button>
            </CardContent>
          </Card>

          {/* Herramientas de Mantenimiento */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <span>Herramientas de Mantenimiento</span>
              </CardTitle>
              <CardDescription>
                Mantenimiento y configuración del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('maintenance')}
              >
                Herramientas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Pruebas de Base de Datos */}
        <div className="mt-8">
          <DatabaseTestPanel />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
