
import React from 'react';
import { useInitialData } from '@/hooks/useInitialData';

const DataInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useInitialData();
  return <>{children}</>;
};

export default DataInitializer;
