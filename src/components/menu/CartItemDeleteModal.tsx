
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
import { AlertTriangle, ShoppingCart } from 'lucide-react';

interface CartItemDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemQuantity: number;
  isLoading?: boolean;
}

const CartItemDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemQuantity,
  isLoading = false
}: CartItemDeleteModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle>Eliminar del Carrito</DialogTitle>
              <DialogDescription className="mt-1">
                ¿Estás seguro de que quieres eliminar este producto?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-foreground">{itemName}</p>
                <p className="text-sm text-muted-foreground">
                  Cantidad: {itemQuantity} {itemQuantity === 1 ? 'unidad' : 'unidades'}
                </p>
              </div>
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-3">
            Esta acción eliminará completamente el producto de tu carrito.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Mantener en carrito
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Eliminando...' : 'Eliminar del carrito'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CartItemDeleteModal;
