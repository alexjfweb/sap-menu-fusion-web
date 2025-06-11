
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/auth');
  };

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ChefHat className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">SAP Menu</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Características
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Precios
          </a>
          <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
            Contacto
          </a>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleLoginClick}>
            Iniciar Sesión
          </Button>
          <Button onClick={handleLoginClick}>
            Empezar Gratis
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
