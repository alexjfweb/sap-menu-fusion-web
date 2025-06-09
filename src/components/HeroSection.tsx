
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChefHat, Smartphone, Users, TrendingUp } from 'lucide-react';

const HeroSection = () => {
  return (
    <section id="inicio" className="pt-20 pb-16 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Revoluciona tu
                <span className="text-primary block">Restaurante</span>
                con SAP Menu
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                La plataforma completa para gestionar tu restaurante: menús digitales, 
                pedidos, reservas, inventario y mucho más. Todo en una sola aplicación moderna y fácil de usar.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold">
                Comenzar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg">
                Ver Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Restaurantes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">Pedidos/mes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">99%</div>
                <div className="text-sm text-muted-foreground">Satisfacción</div>
              </div>
            </div>
          </div>

          {/* Visual Elements */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-background rounded-xl p-4 shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <ChefHat className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold text-foreground">Menú Digital</h3>
                    <p className="text-sm text-muted-foreground">Crea y gestiona tu menú online</p>
                  </div>
                  
                  <div className="bg-background rounded-xl p-4 shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <Smartphone className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold text-foreground">App Móvil</h3>
                    <p className="text-sm text-muted-foreground">Optimizado para dispositivos móviles</p>
                  </div>
                </div>
                
                <div className="space-y-6 mt-8">
                  <div className="bg-background rounded-xl p-4 shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold text-foreground">Gestión de Usuarios</h3>
                    <p className="text-sm text-muted-foreground">Roles y permisos avanzados</p>
                  </div>
                  
                  <div className="bg-background rounded-xl p-4 shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <TrendingUp className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold text-foreground">Analytics</h3>
                    <p className="text-sm text-muted-foreground">Reportes y métricas en tiempo real</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/20 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-secondary/30 rounded-full animate-pulse delay-300"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
