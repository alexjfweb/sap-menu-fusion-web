
import { useEffect } from 'react';

// CORRECCIÓN CRÍTICA: Hook de inicialización automática COMPLETAMENTE DESHABILITADO
// Se elimina toda funcionalidad para evitar creación masiva de productos duplicados

export const useInitialData = () => {
  useEffect(() => {
    console.log('🚫 useInitialData: Sistema de inicialización automática DESHABILITADO');
    console.log('🚫 No se crearán productos automáticamente para evitar duplicados masivos');
    console.log('✅ Los administradores deben crear manualmente categorías y productos');
    
    // NO SE EJECUTA NINGUNA LÓGICA DE INICIALIZACIÓN
    // El administrador debe crear manualmente categorías y productos desde el panel
  }, []);

  // Devolver estado simulado para mantener compatibilidad
  return { 
    hasInitialData: true  // Siempre true para evitar bucles de inicialización
  };
};
