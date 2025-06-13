
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Cog, 
  Database, 
  HardDrive, 
  RefreshCw,
  Trash2,
  Shield,
  Activity,
  Clock,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Zap,
  Server
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceToolsProps {
  onBack: () => void;
}

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  cache: 'healthy' | 'warning' | 'error';
}

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  lastRun: string;
}

const MaintenanceTools: React.FC<MaintenanceToolsProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [systemStatus] = useState<SystemStatus>({
    database: 'healthy',
    storage: 'healthy',
    api: 'healthy',
    cache: 'warning'
  });

  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([
    {
      id: 'db-cleanup',
      name: 'Limpieza de Base de Datos',
      description: 'Elimina registros obsoletos y optimiza índices',
      status: 'idle',
      progress: 0,
      lastRun: '2025-06-12 03:00:00'
    },
    {
      id: 'cache-clear',
      name: 'Limpiar Caché',
      description: 'Limpia el caché del sistema para mejorar rendimiento',
      status: 'idle',
      progress: 0,
      lastRun: '2025-06-12 02:30:00'
    },
    {
      id: 'log-rotation',
      name: 'Rotación de Logs',
      description: 'Archiva logs antiguos y libera espacio',
      status: 'idle',
      progress: 0,
      lastRun: '2025-06-11 23:59:00'
    },
    {
      id: 'backup-verify',
      name: 'Verificar Respaldos',
      description: 'Verifica la integridad de los respaldos automáticos',
      status: 'idle',
      progress: 0,
      lastRun: '2025-06-12 01:00:00'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const runMaintenanceTask = async (taskId: string) => {
    setMaintenanceTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'running', progress: 0 }
          : task
      )
    );

    // Simular progreso de la tarea
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setMaintenanceTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, progress: i }
            : task
        )
      );
    }

    // Marcar como completada
    setMaintenanceTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'completed', 
              progress: 100,
              lastRun: new Date().toLocaleString('es-ES')
            }
          : task
      )
    );

    toast({
      title: "Tarea Completada",
      description: "La tarea de mantenimiento se ejecutó correctamente"
    });
  };

  const handleSystemRestart = () => {
    toast({
      title: "Reinicio Programado",
      description: "El sistema se reiniciará en modo de mantenimiento"
    });
  };

  const handleClearCache = () => {
    runMaintenanceTask('cache-clear');
  };

  const handleDatabaseOptimize = () => {
    runMaintenanceTask('db-cleanup');
  };

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
              <Cog className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Herramientas de Mantenimiento</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* System Status Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Estado del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Base de Datos</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${getStatusColor(systemStatus.database)}`}>
                    {getStatusIcon(systemStatus.database)}
                    <span className="text-sm capitalize">{systemStatus.database}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Almacenamiento</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${getStatusColor(systemStatus.storage)}`}>
                    {getStatusIcon(systemStatus.storage)}
                    <span className="text-sm capitalize">{systemStatus.storage}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">API</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${getStatusColor(systemStatus.api)}`}>
                    {getStatusIcon(systemStatus.api)}
                    <span className="text-sm capitalize">{systemStatus.api}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Caché</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${getStatusColor(systemStatus.cache)}`}>
                    {getStatusIcon(systemStatus.cache)}
                    <span className="text-sm capitalize">{systemStatus.cache}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  <span>Limpiar Caché</span>
                </CardTitle>
                <CardDescription>
                  Limpia el caché del sistema para mejorar el rendimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={handleClearCache}>
                  Ejecutar Limpieza
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-green-600" />
                  <span>Optimizar BD</span>
                </CardTitle>
                <CardDescription>
                  Optimiza la base de datos y reorganiza índices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={handleDatabaseOptimize}>
                  Optimizar Ahora
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RotateCcw className="h-5 w-5 text-orange-600" />
                  <span>Reiniciar Sistema</span>
                </CardTitle>
                <CardDescription>
                  Reinicia el sistema en modo de mantenimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={handleSystemRestart}>
                  Programar Reinicio
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Maintenance Tasks */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Tareas de Mantenimiento</h3>
          <div className="space-y-4">
            {maintenanceTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{task.name}</h4>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getTaskStatusColor(task.status)}>
                        {task.status === 'idle' ? 'Inactiva' :
                         task.status === 'running' ? 'Ejecutando' :
                         task.status === 'completed' ? 'Completada' : 'Fallida'}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => runMaintenanceTask(task.id)}
                        disabled={task.status === 'running'}
                      >
                        {task.status === 'running' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {task.status === 'running' && (
                    <div className="mb-2">
                      <Progress value={task.progress} className="w-full" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Progreso: {task.progress}%
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Última ejecución: {task.lastRun}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* System Logs */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Logs del Sistema</h3>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Logs Recientes</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                <div>[2025-06-13 11:45:32] INFO: Sistema iniciado correctamente</div>
                <div>[2025-06-13 11:45:33] INFO: Base de datos conectada</div>
                <div>[2025-06-13 11:45:34] INFO: Caché inicializado</div>
                <div>[2025-06-13 11:46:12] WARN: Caché al 85% de capacidad</div>
                <div>[2025-06-13 11:47:01] INFO: Limpieza automática de logs ejecutada</div>
                <div>[2025-06-13 11:48:22] INFO: Respaldo programado completado</div>
                <div>[2025-06-13 11:49:45] INFO: 142 usuarios activos</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Alerts */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Alertas y Notificaciones</h3>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                El caché está al 85% de capacidad. Se recomienda ejecutar una limpieza.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Todos los respaldos automáticos se han completado correctamente en las últimas 24 horas.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MaintenanceTools;
