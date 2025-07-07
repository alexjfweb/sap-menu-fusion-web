
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  Database, 
  Network,
  CheckCircle,
  XCircle,
  Settings,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemStatus {
  database: 'connected' | 'error' | 'checking';
  auth: 'active' | 'error' | 'checking';
  storage: 'available' | 'error' | 'checking';
  functions: 'operational' | 'error' | 'checking';
}

interface RecoveryAction {
  id: string;
  title: string;
  description: string;
  action: () => Promise<void>;
  severity: 'low' | 'medium' | 'high';
  category: 'auth' | 'database' | 'storage' | 'general';
}

const TechnicalRecoveryMode = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'checking',
    auth: 'checking',
    storage: 'checking',
    functions: 'checking'
  });
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);
  const { toast } = useToast();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDiagnosticLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkSystemHealth = async () => {
    setIsRunningDiagnostics(true);
    addLog('🔍 Iniciando diagnóstico completo del sistema...');

    // Verificar conexión a base de datos
    try {
      addLog('📊 Verificando conexión a base de datos...');
      const { error: dbError } = await supabase.from('profiles').select('count').limit(1);
      if (dbError) {
        addLog(`❌ Error en base de datos: ${dbError.message}`);
        setSystemStatus(prev => ({ ...prev, database: 'error' }));
      } else {
        addLog('✅ Base de datos conectada correctamente');
        setSystemStatus(prev => ({ ...prev, database: 'connected' }));
      }
    } catch (error) {
      addLog(`❌ Error crítico en base de datos: ${error}`);
      setSystemStatus(prev => ({ ...prev, database: 'error' }));
    }

    // Verificar sistema de autenticación
    try {
      addLog('🔐 Verificando sistema de autenticación...');
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        addLog(`⚠️ Advertencia en auth: ${authError.message}`);
        setSystemStatus(prev => ({ ...prev, auth: 'error' }));
      } else {
        addLog(`✅ Sistema de auth operativo ${session ? '(sesión activa)' : '(sin sesión)'}`);
        setSystemStatus(prev => ({ ...prev, auth: 'active' }));
      }
    } catch (error) {
      addLog(`❌ Error en sistema de auth: ${error}`);
      setSystemStatus(prev => ({ ...prev, auth: 'error' }));
    }

    // Verificar storage
    try {
      addLog('📁 Verificando sistema de storage...');
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      if (storageError) {
        addLog(`❌ Error en storage: ${storageError.message}`);
        setSystemStatus(prev => ({ ...prev, storage: 'error' }));
      } else {
        addLog(`✅ Storage disponible (${buckets?.length || 0} buckets)`);
        setSystemStatus(prev => ({ ...prev, storage: 'available' }));
      }
    } catch (error) {
      addLog(`❌ Error crítico en storage: ${error}`);
      setSystemStatus(prev => ({ ...prev, storage: 'error' }));
    }

    // Verificar funciones/triggers
    try {
      addLog('⚙️ Verificando funciones y triggers...');
      const { data, error } = await supabase.rpc('get_current_user_role');
      if (error && !error.message.includes('not found')) {
        addLog(`⚠️ Error en funciones: ${error.message}`);
        setSystemStatus(prev => ({ ...prev, functions: 'error' }));
      } else {
        addLog('✅ Funciones operativas');
        setSystemStatus(prev => ({ ...prev, functions: 'operational' }));
      }
    } catch (error) {
      addLog(`❌ Error en funciones: ${error}`);
      setSystemStatus(prev => ({ ...prev, functions: 'error' }));
    }

    addLog('🏁 Diagnóstico completado');
    setIsRunningDiagnostics(false);
    generateRecoveryActions();
  };

  const generateRecoveryActions = () => {
    const actions: RecoveryAction[] = [];

    // Acciones basadas en el estado del sistema
    if (systemStatus.database === 'error') {
      actions.push({
        id: 'reset-db-connection',
        title: 'Reiniciar Conexión a Base de Datos',
        description: 'Intentar restablecer la conexión con Supabase',
        action: async () => {
          addLog('🔄 Reiniciando conexión a base de datos...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          await checkSystemHealth();
        },
        severity: 'high',
        category: 'database'
      });
    }

    if (systemStatus.auth === 'error') {
      actions.push({
        id: 'clear-auth-state',
        title: 'Limpiar Estado de Autenticación',
        description: 'Limpiar tokens y estado de auth corrupto',
        action: async () => {
          addLog('🧹 Limpiando estado de autenticación...');
          localStorage.clear();
          sessionStorage.clear();
          await supabase.auth.signOut({ scope: 'global' });
          addLog('✅ Estado de auth limpiado');
          toast({
            title: 'Auth limpiado',
            description: 'El estado de autenticación ha sido limpiado',
          });
        },
        severity: 'medium',
        category: 'auth'
      });
    }

    // Acciones generales siempre disponibles
    actions.push({
      id: 'force-refresh',
      title: 'Recarga Forzada de Aplicación',
      description: 'Recargar completamente la aplicación',
      action: async () => {
        addLog('🔄 Ejecutando recarga forzada...');
        window.location.reload();
      },
      severity: 'low',
      category: 'general'
    });

    actions.push({
      id: 'clear-cache',
      title: 'Limpiar Cache del Navegador',
      description: 'Limpiar todos los datos almacenados localmente',
      action: async () => {
        addLog('🗑️ Limpiando cache...');
        localStorage.clear();
        sessionStorage.clear();
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        addLog('✅ Cache limpiado');
        toast({
          title: 'Cache limpiado',
          description: 'Todos los datos locales han sido eliminados',
        });
      },
      severity: 'medium',
      category: 'general'
    });

    setRecoveryActions(actions);
  };

  const executeRecoveryAction = async (action: RecoveryAction) => {
    try {
      addLog(`🎯 Ejecutando: ${action.title}`);
      await action.action();
      addLog(`✅ Completado: ${action.title}`);
    } catch (error) {
      addLog(`❌ Falló: ${action.title} - ${error}`);
      toast({
        variant: 'destructive',
        title: 'Error en acción de recuperación',
        description: `No se pudo ejecutar: ${action.title}`,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'available':
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
      default:
        return <Activity className="h-4 w-4 text-yellow-600 animate-pulse" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'available':
      case 'operational':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'checking':
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Bug className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Modo de Recuperación Técnica</h2>
          <p className="text-gray-600">Diagnóstico y herramientas de recuperación del sistema</p>
        </div>
      </div>

      {/* Alerta de modo técnico */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Modo de Recuperación Activo:</strong> Estas herramientas están diseñadas para resolver errores críticos del sistema. 
          Úsalas solo si experimentas problemas persistentes.
        </AlertDescription>
      </Alert>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Estado del Sistema
            </CardTitle>
            <Button
              onClick={checkSystemHealth}
              disabled={isRunningDiagnostics}
              variant="outline"
              size="sm"
            >
              {isRunningDiagnostics ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Diagnosticando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Ejecutar Diagnóstico
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="font-medium">Base de Datos</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.database)}
                <Badge variant="outline" className={getStatusColor(systemStatus.database)}>
                  {systemStatus.database}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Autenticación</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.auth)}
                <Badge variant="outline" className={getStatusColor(systemStatus.auth)}>
                  {systemStatus.auth}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                <span className="font-medium">Storage</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.storage)}
                <Badge variant="outline" className={getStatusColor(systemStatus.storage)}>
                  {systemStatus.storage}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="font-medium">Funciones</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.functions)}
                <Badge variant="outline" className={getStatusColor(systemStatus.functions)}>
                  {systemStatus.functions}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones de Recuperación */}
      {recoveryActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones de Recuperación Recomendadas</CardTitle>
            <CardDescription>
              Herramientas para resolver problemas detectados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recoveryActions.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{action.title}</h4>
                    <Badge variant="outline" className={getSeverityColor(action.severity)}>
                      {action.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
                <Button
                  onClick={() => executeRecoveryAction(action)}
                  variant={action.severity === 'high' ? 'destructive' : 'outline'}
                  size="sm"
                >
                  Ejecutar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Registro de Diagnóstico */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Diagnóstico</CardTitle>
          <CardDescription>
            Log detallado de las verificaciones y acciones ejecutadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
            <pre className="text-sm font-mono">
              {diagnosticLogs.length > 0 
                ? diagnosticLogs.join('\n')
                : 'Ejecuta un diagnóstico para ver los logs aquí...'
              }
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicalRecoveryMode;
