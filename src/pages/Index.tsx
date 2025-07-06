
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import PricingPlans from '@/components/PricingPlans';
import Footer from '@/components/Footer';
import DiagnosticPanel from '@/components/DiagnosticPanel';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    console.log('🏠 Index: Estado de autenticación:', { isAuthenticated, loading });
    
    // If user is already authenticated, redirect to dashboard
    if (!loading && isAuthenticated) {
      console.log('🔄 Index: Usuario autenticado, redirigiendo a dashboard');
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    console.log('⏳ Index: Verificando autenticación...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <div id="features">
        <FeaturesSection />
      </div>
      <PricingPlans />
      
      {/* Panel de diagnóstico para desarrollo (oculto por defecto) */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-4">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDiagnostics ? 'Ocultar' : 'Mostrar'} Panel de Diagnóstico
          </button>
        </div>
        {showDiagnostics && <DiagnosticPanel />}
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
