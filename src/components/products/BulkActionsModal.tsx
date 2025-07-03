
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Eye, EyeOff, Trash2 } from 'lucide-react';

interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  isLoading?: boolean;
}

const BulkActionsModal = ({
  isOpen,
  onClose,
  selectedCount,
  onBulkDelete,
  onBulkActivate,
  onBulkDeactivate,
  isLoading = false
}: BulkActionsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Acciones en Lote
            <Badge variant="secondary">{selectedCount} productos</Badge>
          </DialogTitle>
          <DialogDescription>
            Selecciona la acción que quieres realizar en los productos seleccionados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={onBulkActivate}
            disabled={isLoading}
          >
            <Eye className="h-4 w-4 text-green-600" />
            Activar productos seleccionados
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={onBulkDeactivate}
            disabled={isLoading}
          >
            <EyeOff className="h-4 w-4 text-gray-600" />
            Desactivar productos seleccionados
          </Button>
          
          <div className="border-t pt-3">
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={onBulkDelete}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Eliminar productos seleccionados
              </div>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkActionsModal;
