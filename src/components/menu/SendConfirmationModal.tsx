
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';

interface SendConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  success: boolean;
  message: string;
}

const SendConfirmationModal = ({ isOpen, onClose, success, message }: SendConfirmationModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span>{success ? 'Pedido Enviado' : 'Error al Enviar'}</span>
          </DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {success && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Tu pedido ha sido enviado por WhatsApp
                </span>
              </div>
            </div>
          )}

          <Button onClick={onClose} className="w-full">
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendConfirmationModal;
