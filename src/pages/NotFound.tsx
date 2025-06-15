
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Home, Menu as MenuIcon } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <ChefHat className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold text-primary">404</CardTitle>
          <CardDescription className="text-lg">
            ¡Oops! Página no encontrada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            La página que buscas no existe o ha sido movida.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Volver al Inicio
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/menu">
                <MenuIcon className="h-4 w-4 mr-2" />
                Ver Menú del Restaurante
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/auth">
                Iniciar Sesión
              </Link>
            </Button>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-md text-sm">
            <p className="font-semibold">Ruta solicitada:</p>
            <code className="text-xs break-all">{location.pathname}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
