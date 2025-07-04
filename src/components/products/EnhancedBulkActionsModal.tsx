
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
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Trash2, Eye, EyeOff, X } from 'lucide-react';

interface EnhancedBulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  currentPage: number;
  onBulkDelete: (showProgress: (progress: number) => void) => Promise<void>;
  onBulkActivate: (showProgress: (progress: number) => void) => Promise<void>;
  onBulkDeactivate: (showProgress: (progress: number) => void) => Promise<void>;
  isLoading: boolean;
}

const EnhancedBulkActionsModal = ({
  isOpen,
  onClose,
  selectedCount,
  currentPage,
  onBulkDelete,
  onBulkActivate,
  onBulkDeactivate,
  isLoading
}: EnhancedBulkActionsModalProps) => {
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);

  const handleOperation = async (
    operation: 'delete' | 'activate' | 'deactivate',
    handler: (showProgress: (progress: number) => void) => Promise<void>
  ) => {
    setCurrentOperation(operation);
    setProgress(0);
    
    try {
      await handler((progressValue) => {
        setProgress(progressValue);
      });
    } finally {
      setCurrentOperation(null);
      setProgress(0);
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'activate': return <Eye className="h-4 w-4" />;
      case 'deactivate': return <EyeOff className="h-4 w-4" />;
      default: return null;
    }
  };

  const getOperationText = (operation: string) => {
    switch (operation) {
      case 'delete': return 'Eliminando';
      case 'activate': return 'Activando';
      case 'deactivate': return 'Desactivando';
      default: return 'Procesando';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Acciones en Lote</DialogTitle>
              <DialogDescription className="mt-1">
                Página {currentPage} • {selectedCount} productos seleccionados
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {currentOperation && (
          <div className="py-4">
            <div className="flex items-center gap-2 mb-3">
              {getOperationIcon(currentOperation)}
              <span className="text-sm font-medium">
                {getOperationText(currentOperation)} productos...
              </span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(progress)}% completado
            </p>
          </div>
        )}

        {!currentOperation && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              ¿Qué acción deseas realizar con los{' '}
              <span className="font-semibold text-foreground">{selectedCount}</span>{' '}
              productos seleccionados de la página {currentPage}?
            </p>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => handleOperation('activate', onBulkActivate)}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Eye className="h-4 w-4 mr-2" />
                Activar productos ({selectedCount})
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleOperation('deactivate', onBulkDeactivate)}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Desactivar productos ({selectedCount})
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => handleOperation('delete', onBulkDelete)}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar productos ({selectedCount})
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {!currentOperation && (
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedBulkActionsModal;
