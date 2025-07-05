
import React from 'react';

// CORRECCIÓN CRÍTICA: Sistema de inicialización automática DESHABILITADO
// Se elimina completamente para evitar creación masiva de productos duplicados
const DataInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ya no ejecutamos useInitialData() - sistema completamente deshabilitado
  console.log('🚫 Sistema de inicialización automática deshabilitado para evitar duplicados');
  return <>{children}</>;
};

export default DataInitializer;
