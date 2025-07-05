
import React, { useMemo } from 'react';

interface UseProductPaginationProps {
  products: any[];
  itemsPerPage?: number;
}

interface PaginationResult {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  paginatedProducts: any[];
  startItem: number;
  endItem: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  resetToFirstPage: () => void;
  getVisiblePages: () => number[];
}

export const useProductPagination = ({ 
  products, 
  itemsPerPage = 12 
}: UseProductPaginationProps): PaginationResult => {
  // CORRECCIÓN CRÍTICA: Hook optimizado para paginación estable
  const [currentPage, setCurrentPage] = React.useState(1);
  
  // CORRECCIÓN: Cálculos más seguros
  const totalItems = Array.isArray(products) ? products.length : 0;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 1;
  
  // CORRECCIÓN: Productos paginados con validación
  const paginatedProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      console.log('📄 [PAGINATION] No hay productos para paginar');
      return [];
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    const paginated = products.slice(startIndex, endIndex);
    
    console.log(`📄 [PAGINATION] Página ${currentPage}/${totalPages}: ${paginated.length} productos (${startIndex}-${Math.min(endIndex, totalItems)})`);
    
    return paginated;
  }, [products, currentPage, itemsPerPage, totalItems, totalPages]);

  // CORRECCIÓN: Cálculos de rango más seguros
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  // CORRECCIÓN: Funciones de navegación más robustas
  const goToPage = React.useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      console.log(`📄 [PAGINATION] Navegando a página ${page}`);
      setCurrentPage(page);
    }
  }, [totalPages, currentPage]);

  const goToNextPage = React.useCallback(() => {
    if (hasNextPage) {
      console.log(`📄 [PAGINATION] Siguiente página: ${currentPage + 1}`);
      setCurrentPage(currentPage + 1);
    }
  }, [hasNextPage, currentPage]);

  const goToPreviousPage = React.useCallback(() => {
    if (hasPreviousPage) {
      console.log(`📄 [PAGINATION] Página anterior: ${currentPage - 1}`);
      setCurrentPage(currentPage - 1);
    }
  }, [hasPreviousPage, currentPage]);

  const goToFirstPage = React.useCallback(() => {
    if (currentPage !== 1) {
      console.log('📄 [PAGINATION] Yendo a primera página');
      setCurrentPage(1);
    }
  }, [currentPage]);

  const goToLastPage = React.useCallback(() => {
    if (currentPage !== totalPages) {
      console.log(`📄 [PAGINATION] Yendo a última página: ${totalPages}`);
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const resetToFirstPage = React.useCallback(() => {
    console.log('📄 [PAGINATION] Reset a primera página');
    setCurrentPage(1);
  }, []);

  // CORRECCIÓN: Páginas visibles optimizadas
  const getVisiblePages = React.useCallback((): number[] => {
    if (totalPages <= 1) return [1];
    
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    // Calcular rango de páginas visibles
    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    // Agregar primera página si no está en el rango
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...' as any);
    } else {
      rangeWithDots.push(1);
    }

    // Agregar páginas del rango
    rangeWithDots.push(...range);

    // Agregar última página si no está en el rango
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...' as any, totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    // Filtrar duplicados y mantener solo números
    const visiblePages = rangeWithDots.filter((page, index, arr) => 
      arr.indexOf(page) === index && typeof page === 'number'
    ) as number[];

    console.log(`📄 [PAGINATION] Páginas visibles: [${visiblePages.join(', ')}]`);
    return visiblePages;
  }, [currentPage, totalPages]);

  // CORRECCIÓN: Reset automático si la página actual es inválida
  React.useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      console.log(`📄 [PAGINATION] Página ${currentPage} inválida, reseteando a página 1`);
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  console.log(`📄 [PAGINATION] Estado actual: página ${currentPage}/${totalPages}, ${totalItems} items, ${paginatedProducts.length} mostrados`);

  return {
    currentPage,
    totalPages,
    totalItems,
    paginatedProducts,
    startItem,
    endItem,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    resetToFirstPage,
    getVisiblePages,
  };
};
