
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
  itemsPerPage = 20 
}: UseProductPaginationProps): PaginationResult => {
  // Para esta implementación crítica, usaremos paginación del lado del cliente
  // manteniendo un número fijo de productos por página para optimizar rendimiento
  const [currentPage, setCurrentPage] = React.useState(1);
  
  const totalItems = products?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginatedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return products.slice(startIndex, endIndex);
  }, [products, currentPage, itemsPerPage]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  const getVisiblePages = (): number[] => {
    const delta = 2; // Número de páginas a mostrar a cada lado de la página actual
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...' as any);
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...' as any, totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((page, index, arr) => 
      arr.indexOf(page) === index && typeof page === 'number'
    ) as number[];
  };

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
