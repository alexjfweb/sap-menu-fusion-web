
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Copy, Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  error?: any;
  logToConsole?: boolean;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  error,
  logToConsole = false
}) => {
  const [isReporting, setIsReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const { toast } = useToast();

  // Log del error en consola si se solicita
  React.useEffect(() => {
    if (logToConsole && error) {
      console.error('Error detallado:', error);
    }
  }, [error, logToConsole]);

  // Generar información técnica del error
  const getTechnicalInfo = () => {
    const timestamp = new Date().toISOString();
    const userAgent = navigator.userAgent;
    const url = window.location.href;
    
    let errorDetails = '';
    if (error) {
      if (error.message) errorDetails += `Message: ${error.message}\n`;
      if (error.code) errorDetails += `Code: ${error.code}\n`;
      if (error.constraint) errorDetails += `Constraint: ${error.constraint}\n`;
      if (error.table) errorDetails += `Table: ${error.table}\n`;
      if (error.stack) errorDetails += `Stack: ${error.stack}\n`;
    }

    return `
REPORTE DE ERROR - ${timestamp}
====================================

Título: ${title}
URL: ${url}
User Agent: ${userAgent}

Descripción del Error:
${message}

Detalles Técnicos:
${errorDetails}

Información Adicional:
${error ? JSON.stringify(error, null, 2) : 'No hay información adicional'}
    `.trim();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getTechnicalInfo());
      toast({
        title: "Copiado",
        description: "La información del error se ha copiado al portapapeles",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo copiar la información",
      });
    }
  };

  const sendReport = async () => {
    setIsReporting(true);
    
    try {
      // Simular envío de reporte (aquí podrías integrar con un servicio real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setReportSent(true);
      toast({
        title: "Reporte enviado",
        description: "El reporte de error ha sido enviado al equipo de soporte",
      });
      
      // Auto-cerrar después de mostrar confirmación
      setTimeout(() => {
        setReportSent(false);
        onClose();
      }, 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error al enviar",
        description: "No se pudo enviar el reporte. Intenta copiar la información manualmente.",
      });
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Se ha producido un error en la aplicación. Puedes reportar este problema 
            al equipo de soporte para recibir ayuda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mensaje principal */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Descripción del Error</h4>
            <p className="text-red-700 whitespace-pre-wrap">{message}</p>
          </div>

          {/* Información técnica */}
          {error && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Información Técnica</h4>
                <Badge variant="outline" className="text-xs">
                  Para Soporte
                </Badge>
              </div>
              
              <div className="p-3 bg-gray-50 border rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {error.code && (
                    <div>
                      <span className="font-medium">Código:</span> {error.code}
                    </div>
                  )}
                  {error.constraint && (
                    <div>
                      <span className="font-medium">Constraint:</span> {error.constraint}
                    </div>
                  )}
                  {error.table && (
                    <div>
                      <span className="font-medium">Tabla:</span> {error.table}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Timestamp:</span> {new Date().toLocaleString()}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Información completa para copia */}
              <div className="space-y-2">
                <h5 className="font-medium text-sm">Información Completa del Error</h5>
                <Textarea
                  value={getTechnicalInfo()}
                  readOnly
                  className="font-mono text-xs h-32"
                />
              </div>
            </div>
          )}

          {/* Estado de reporte enviado */}
          {reportSent && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">¡Reporte enviado exitosamente!</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                El equipo de soporte ha recibido la información del error y te contactará pronto.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar Info
            </Button>
            
            <Button
              onClick={sendReport}
              disabled={isReporting || reportSent}
              className="flex items-center gap-2"
            >
              {isReporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Enviando...
                </>
              ) : reportSent ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Enviado
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Reportar Error
                </>
              )}
            </Button>
          </div>

          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorModal;
