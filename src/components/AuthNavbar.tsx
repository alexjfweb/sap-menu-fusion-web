
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuthNavbar = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ChefHat className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">SAP Menu</span>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleBackToHome}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al inicio</span>
        </Button>
      </div>
    </nav>
  );
};

export default AuthNavbar;
