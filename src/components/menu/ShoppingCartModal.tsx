
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PaymentModal from './PaymentModal';
import CartItemDeleteModal from './CartItemDeleteModal';

interface ShoppingCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  sessionId: string;
  onRefetchCart: () => void;
  totalPrice: number;
}

const ShoppingCartModal = ({ isOpen, onClose, cartItems, sessionId, onRefetchCart, totalPrice }: ShoppingCartModalProps) => {
  const [showPayment, setShowPayment] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      const item = cartItems.find(item => item.id === itemId);
      if (item) {
        setItemToDelete(item);
        setShowDeleteModal(true);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;
      onRefetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cantidad",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = (item: any) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;
      
      toast({
        title: "Producto eliminado",
        description: "Producto eliminado del carrito correctamente",
      });
      
      onRefetchCart();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto del carrito",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const clearCart = async () => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;
      
      toast({
        title: "Carrito limpiado",
        description: "Todos los productos han sido eliminados",
      });
      
      onRefetchCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error",
        description: "No se pudo limpiar el carrito",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carrito de Compras</DialogTitle>
            <DialogDescription>
              Revisa tus productos antes de proceder al pago
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tu carrito está vacío</p>
              </div>
            ) : (
              <>
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.products?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ${Number(item.products?.price || 0).toFixed(2)} c/u
                      </p>
                      {item.special_instructions && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Instrucciones: {item.special_instructions}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-8 text-center">{item.quantity}</span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">
                        ${(item.quantity * Number(item.products?.price || 0)).toFixed(2)}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={clearCart} className="flex-1">
                      Limpiar Carrito
                    </Button>
                    <Button 
                      onClick={() => setShowPayment(true)} 
                      className="flex-1"
                      disabled={cartItems.length === 0}
                    >
                      Proceder al Pago
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showPayment && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          cartItems={cartItems}
          totalAmount={totalPrice}
          sessionId={sessionId}
          onPaymentSuccess={() => {
            setShowPayment(false);
            onClose();
            clearCart();
          }}
        />
      )}

      <CartItemDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDeleteItem}
        itemName={itemToDelete?.products?.name || ''}
        itemQuantity={itemToDelete?.quantity || 0}
        isLoading={isDeleting}
      />
    </>
  );
};

export default ShoppingCartModal;
