
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock,
  Shield 
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type Product = Tables<'products'>;

interface ProductPermissionsProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleAvailability: (product: Product) => void;
}

const ProductPermissions: React.FC<ProductPermissionsProps> = ({
  product,
  onEdit,
  onDelete,
  onToggleAvailability
}) => {
  const { profile } = useAuth();

  // Verificar si el usuario puede editar/eliminar este producto
  const canModify = profile?.role === 'superadmin' || product.created_by === profile?.id;
  
  // Verificar si el producto pertenece a otro admin
  const isOtherAdminProduct = product.created_by !== profile?.id && profile?.role !== 'superadmin';

  return (
    <div className="space-y-3">
      {/* Badges de identificación */}
      <div className="flex flex-wrap gap-2">
        {product.is_available ? (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Disponible
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            No disponible
          </Badge>
        )}
        
        {isOtherAdminProduct && (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <Shield className="h-3 w-3 mr-1" />
            Otro admin
          </Badge>
        )}
        
        {profile?.role === 'superadmin' && product.created_by !== profile.id && (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Lock className="h-3 w-3 mr-1" />
            Superadmin
          </Badge>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(product)}
          disabled={!canModify}
          title={!canModify ? 'Solo puedes editar productos que has creado' : 'Editar producto'}
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleAvailability(product)}
          disabled={!canModify}
          title={!canModify ? 'Solo puedes cambiar disponibilidad de productos que has creado' : 'Cambiar disponibilidad'}
        >
          {product.is_available ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(product)}
          disabled={!canModify}
          title={!canModify ? 'Solo puedes eliminar productos que has creado' : 'Eliminar producto'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Mensaje informativo para productos restringidos */}
      {isOtherAdminProduct && (
        <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
          Este producto fue creado por otro administrador. Solo puedes verlo.
        </div>
      )}
    </div>
  );
};

export default ProductPermissions;
