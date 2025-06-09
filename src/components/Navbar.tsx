
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, User, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowUserMenu(false);
  };

  return (
    <nav className="fixed top-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary">SAP Menu</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#inicio" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Inicio
              </a>
              <a href="#planes" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Planes
              </a>
              <a href="#caracteristicas" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Características
              </a>
              <a href="#contacto" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Contacto
              </a>
            </div>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:block">
            {!isLoggedIn ? (
              <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90">
                Iniciar Sesión
              </Button>
            ) : (
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Mi Cuenta</span>
                </Button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg animate-fade-in">
                    <div className="py-1">
                      <a href="#perfil" className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent">
                        <User className="h-4 w-4 mr-2" />
                        Mi Perfil
                      </a>
                      <a href="#configuracion" className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent">
                        <Settings className="h-4 w-4 mr-2" />
                        Configuración
                      </a>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-foreground"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={cn(
        "md:hidden transition-all duration-300 ease-in-out",
        isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
      )}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t border-border">
          <a href="#inicio" className="text-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
            Inicio
          </a>
          <a href="#planes" className="text-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
            Planes
          </a>
          <a href="#caracteristicas" className="text-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
            Características
          </a>
          <a href="#contacto" className="text-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
            Contacto
          </a>
          
          <div className="pt-4 pb-3 border-t border-border">
            {!isLoggedIn ? (
              <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90">
                Iniciar Sesión
              </Button>
            ) : (
              <div className="space-y-2">
                <a href="#perfil" className="flex items-center px-3 py-2 text-base font-medium text-foreground hover:text-primary">
                  <User className="h-5 w-5 mr-2" />
                  Mi Perfil
                </a>
                <a href="#configuracion" className="flex items-center px-3 py-2 text-base font-medium text-foreground hover:text-primary">
                  <Settings className="h-5 w-5 mr-2" />
                  Configuración
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-base font-medium text-foreground hover:text-primary"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
