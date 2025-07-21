
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, Star, Clock, Shield } from 'lucide-react';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';

const HeroSection = () => {
  const { navigateToAuth, isNavigating } = useSmartNavigation();

  const handleGetStarted = () => {
    navigateToAuth();
  };

  const handleViewDemo = () => {
    // Scroll suave hacia la sección de características
    const featuresSection = document.querySelector('#features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-20 lg:py-32">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-background/60 backdrop-blur-sm shadow-lg rounded-xl p-8 md:p-12">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <ChefHat className="h-16 w-16 text-primary animate-pulse" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Transforma tu <span className="text-primary">Restaurante</span>
              <br />
              con SAP Menu
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              La solución integral para gestionar pedidos, reservas, inventario y más. 
              Optimiza tu negocio gastronómico con tecnología de vanguardia.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={handleGetStarted}
                disabled={isNavigating}
              >
                {isNavigating ? 'Verificando...' : 'Prueba Gratis'}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6"
                onClick={handleViewDemo}
              >
                Ver Demo
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="flex flex-col items-center text-center">
                <Star className="h-12 w-12 text-yellow-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Calidad Premium</h3>
                <p className="text-muted-foreground">
                  Sistema robusto y confiable para operaciones críticas
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <Clock className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Tiempo Real</h3>
                <p className="text-muted-foreground">
                  Gestión instantánea de pedidos y actualizaciones automáticas
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <Shield className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Seguro</h3>
                <p className="text-muted-foreground">
                  Datos protegidos con los más altos estándares de seguridad
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
