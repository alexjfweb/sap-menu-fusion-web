
import React from 'react';

// CORRECCIÓN DEFINITIVA: Sistema de inicialización completamente DESHABILITADO
// Para prevenir cualquier creación automática de productos duplicados
const DataInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🚫 [DATA INIT] Sistema de inicialización automática COMPLETAMENTE DESHABILITADO');
  console.log('✅ [DATA INIT] Renderizando children sin procesamiento adicional');
  console.log('🛡️ [DATA INIT] Protección anti-duplicados activada');
  
  return <>{children}</>;
};

export default DataInitializer;
