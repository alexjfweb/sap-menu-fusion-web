import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import PricingPlans from '@/components/PricingPlans';
import Footer from '@/components/Footer';
import DiagnosticPanel from '@/components/DiagnosticPanel';
import SupabaseConnectionTest from '@/components/SupabaseConnectionTest';
import BusinessInfoDisplay from '@/components/menu/BusinessInfoDisplay';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';

const Index = () => {
  const { isAuthenticated, loading, profile, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [profileCheckAttempts, setProfileCheckAttempts] = useState(0);
  const { data: businessInfo } = useBusinessInfo();

  useEffect(() => {
    console.log('🏠 Index: Estado de autenticación:', { 
      isAuthenticated, 
      loading, 
      hasProfile: !!profile,
      profileRole: profile?.role,
      userEmail: user?.email
    });
    
    // If user is already authenticated, redirect based on role
    if (!loading && isAuthenticated) {
      if (profile) {
        console.log('Perfil cargado:', profile);
        
        if (profile.role === 'admin') {
          console.log('🔄 Index: Usuario admin, redirigiendo a /admin');
          navigate('/admin');
        } else if (profile.role === 'superadmin') {
          console.log('🔄 Index: Usuario superadmin, redirigiendo a /superadmin');
          navigate('/superadmin');
        } else if (profile.role === 'empleado') {
          console.log('🔄 Index: Usuario empleado, redirigiendo a /empleado');
          navigate('/empleado');
        } else {
          console.log('⚠️ Index: Rol desconocido:', profile.role, 'redirigiendo a dashboard');
          navigate('/dashboard');
        }
      } else if (user) {
        // Usuario autenticado pero sin perfil - podría ser un registro reciente
        console.log('🔄 Index: Usuario autenticado sin perfil, esperando...');
        
        // Intentar obtener el perfil manualmente si no se ha cargado
        if (profileCheckAttempts < 3) {
          setTimeout(() => {
            console.log(`🔄 Index: Reintentando obtener perfil (intento ${profileCheckAttempts + 1})`);
            setProfileCheckAttempts(prev => prev + 1);
            // Forzar recarga del perfil
            window.location.reload();
          }, 2000);
        } else {
          console.log('⚠️ Index: No se pudo obtener perfil después de 3 intentos, redirigiendo a dashboard');
          navigate('/dashboard');
        }
      }
    }
  }, [isAuthenticated, loading, profile, user, navigate, profileCheckAttempts]);

  // Handle scroll to section when navigating from other pages
  useEffect(() => {
    if (location.state?.scrollTo) {
      const sectionId = location.state.scrollTo;
      setTimeout(() => {
        const section = document.querySelector(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.state]);

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
      
      {/* Información del Negocio */}
      {businessInfo && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BusinessInfoDisplay businessInfo={businessInfo} />
        </div>
      )}
      
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="planes">
        <PricingPlans />
      </div>
      
      {/* Test de conexión temporal */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <SupabaseConnectionTest />
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
