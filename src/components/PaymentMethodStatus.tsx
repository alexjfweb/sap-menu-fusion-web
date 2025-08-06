import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { usePaymentMethodValidation } from '@/hooks/usePaymentMethodValidation';

const PaymentMethodStatus = () => {
  const { getValidatedMethods, isLoading } = usePaymentMethodValidation();

  if (isLoading) {
    return (
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">Verificando estado de métodos de pago...</p>
      </div>
    );
  }

  const validatedMethods = getValidatedMethods();
  const availableCount = validatedMethods.filter(m => m.validation.isValid).length;
  const totalActive = validatedMethods.length;

  if (totalActive === 0) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <XCircle className="h-4 w-4 text-destructive" />
          <h4 className="font-medium text-destructive">Sin métodos de pago configurados</h4>
        </div>
        <p className="text-sm text-muted-foreground">
          Configura al menos un método de pago para que los usuarios puedan suscribirse.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Estado de métodos de pago</h4>
        <Badge 
          variant={availableCount === totalActive ? "default" : availableCount > 0 ? "secondary" : "destructive"}
        >
          {availableCount} de {totalActive} disponibles
        </Badge>
      </div>
      
      <div className="grid gap-2">
        {validatedMethods.map((method) => (
          <div 
            key={method.id} 
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center space-x-3">
              {method.validation.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              )}
              <span className="font-medium">{method.name}</span>
            </div>
            <div className="text-right">
              {method.validation.isValid ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Configurado
                </Badge>
              ) : (
                <div className="text-right">
                  <Badge variant="destructive" className="mb-1">
                    Error
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {method.validation.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {availableCount < totalActive && (
        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>Atención:</strong> Algunos métodos de pago tienen configuración incompleta y no estarán disponibles para los usuarios.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodStatus;