
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';

const Navbar = () => {
  const navigate = useNavigate();
  const { navigateToAuth, isNavigating } = useSmartNavigation();

  const handleAuthClick = () => {
    navigateToAuth();
  };

  const handleContactClick = () => {
    navigate('/contact');
  };

  const handleScrollToSection = (sectionId: string) => {
    const section = document.querySelector(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ChefHat className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">SAP Menu</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => handleScrollToSection('#features')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Características
          </button>
          <button 
            onClick={() => handleScrollToSection('#planes')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Precios
          </button>
          <button 
            onClick={handleContactClick}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Contacto
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={handleAuthClick}
            disabled={isNavigating}
          >
            {isNavigating ? 'Verificando...' : 'Iniciar Sesión'}
          </Button>
          <Button 
            onClick={handleAuthClick}
            disabled={isNavigating}
          >
            {isNavigating ? 'Verificando...' : 'Empezar Gratis'}
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
