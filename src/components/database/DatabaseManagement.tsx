
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  ArrowLeft, 
  Activity, 
  HardDrive, 
  Users, 
  ShoppingCart,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DatabaseManagementProps {
  onBack: () => void;
}

interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  databaseSize: string;
  activeConnections: number;
  lastBackup: string;
}

interface TableInfo {
  name: string;
  records: number;
  size: string;
  lastUpdated: string;
}

const DatabaseManagement: React.FC<DatabaseManagementProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      
      // Simular estadísticas de la base de datos
      // En una implementación real, esto vendría de consultas específicas a la BD
      const mockStats: DatabaseStats = {
        totalTables: 8,
        totalRecords: 1247,
        databaseSize: "45.2 MB",
        activeConnections: 12,
        lastBackup: "2025-06-12 08:00:00"
      };

      const mockTables: TableInfo[] = [
        { name: "profiles", records: 142, size: "2.1 MB", lastUpdated: "2025-06-12 10:30:00" },
        { name: "companies", records: 15, size: "512 KB", lastUpdated: "2025-06-12 09:45:00" },
        { name: "products", records: 324, size: "8.7 MB", lastUpdated: "2025-06-12 11:15:00" },
        { name: "orders", records: 456, size: "12.3 MB", lastUpdated: "2025-06-12 11:45:00" },
        { name: "order_items", records: 1247, size: "15.8 MB", lastUpdated: "2025-06-12 11:45:00" },
        { name: "categories", records: 12, size: "128 KB", lastUpdated: "2025-06-11 16:30:00" },
        { name: "tables", records: 25, size: "256 KB", lastUpdated: "2025-06-10 14:20:00" },
        { name: "reservations", records: 89, size: "1.9 MB", lastUpdated: "2025-06-12 10:20:00" }
      ];

      setStats(mockStats);
      setTables(mockTables);
    } catch (error) {
      console.error('Error loading database info:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la base de datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDatabaseInfo();
    setIsRefreshing(false);
    toast({
      title: "Actualizado",
      description: "Información de la base de datos actualizada"
    });
  };

  const handleBackup = async () => {
    toast({
      title: "Respaldo Iniciado",
      description: "Se ha iniciado el proceso de respaldo de la base de datos"
    });
  };

  const handleOptimize = async () => {
    toast({
      title: "Optimización Iniciada",
      description: "Se ha iniciado el proceso de optimización de la base de datos"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Gestión de Base de Datos</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando información de la base de datos...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Gestión de Base de Datos</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Database Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Resumen de la Base de Datos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats?.totalTables}</div>
                    <p className="text-sm text-muted-foreground">Tablas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats?.totalRecords.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Registros Totales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{stats?.databaseSize}</div>
                    <p className="text-sm text-muted-foreground">Tamaño BD</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{stats?.activeConnections}</div>
                    <p className="text-sm text-muted-foreground">Conexiones Activas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Database Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Acciones de Mantenimiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5 text-blue-600" />
                  <span>Crear Respaldo</span>
                </CardTitle>
                <CardDescription>
                  Genera un respaldo completo de la base de datos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={handleBackup}>
                  Iniciar Respaldo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Último respaldo: {stats?.lastBackup}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 text-green-600" />
                  <span>Optimizar BD</span>
                </CardTitle>
                <CardDescription>
                  Optimiza el rendimiento de la base de datos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={handleOptimize}>
                  Optimizar Ahora
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Mejora el rendimiento y libera espacio
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-orange-600" />
                  <span>Restaurar BD</span>
                </CardTitle>
                <CardDescription>
                  Restaura la base de datos desde un respaldo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Seleccionar Archivo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Restaura desde archivo de respaldo
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tables Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Información de Tablas</h3>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Tabla</th>
                      <th className="text-left p-4 font-medium">Registros</th>
                      <th className="text-left p-4 font-medium">Tamaño</th>
                      <th className="text-left p-4 font-medium">Última Actualización</th>
                      <th className="text-left p-4 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((table) => (
                      <tr key={table.name} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{table.name}</span>
                          </div>
                        </td>
                        <td className="p-4">{table.records.toLocaleString()}</td>
                        <td className="p-4">{table.size}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{table.lastUpdated}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activa
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Alerts */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Alertas del Sistema</h3>
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                La base de datos está funcionando correctamente. Todas las conexiones son estables.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Se recomienda realizar un respaldo programado. El último respaldo fue hace más de 24 horas.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DatabaseManagement;
