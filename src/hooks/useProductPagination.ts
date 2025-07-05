
import { useState, useMemo } from 'react';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

interface UseProductPaginationProps {
  products: Product[];
  itemsPerPage?: number;
}

export const useProductPagination = ({ 
  products, 
  itemsPerPage = 20 
}: UseProductPaginationProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  // Reset page when products change (e.g., when filtering by category)
  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  // CORRECCIÓN CRÍTICA: Paginación inteligente sin limitación artificial
  const getVisiblePages = () => {
    const visiblePageCount = 7; // Mostrar hasta 7 páginas a la vez
    const halfVisible = Math.floor(visiblePageCount / 2);
    
    if (totalPages <= visiblePageCount) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    // Ajustar si estamos cerca del inicio
    if (currentPage <= halfVisible) {
      endPage = visiblePageCount;
    }
    
    // Ajustar si estamos cerca del final
    if (currentPage > totalPages - halfVisible) {
      startPage = totalPages - visiblePageCount + 1;
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  return {
    currentPage,
    totalPages,
    paginatedProducts,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    resetToFirstPage,
    getVisiblePages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    totalItems: products.length,
    startItem: (currentPage - 1) * itemsPerPage + 1,
    endItem: Math.min(currentPage * itemsPerPage, products.length)
  };
};
