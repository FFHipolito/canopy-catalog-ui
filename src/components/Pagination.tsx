'use client';

/**
 * @file Pagination.tsx
 * @description Componente de paginação numerada, acessível e configurável.
 * Fornece botões anterior/próximo, números de página com elipses inteligentes,
 * seletor de itens por página, conformidade WCAG AA e anéis de foco acessíveis.
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useProductStore } from '@/store/useProductStore';
import { productService } from '@/services/productService';

export const Pagination: React.FC = () => {
  const products = useProductStore((state) => state.products);
  const filterCriteria = useProductStore((state) => state.filterCriteria);
  const currentPage = useProductStore((state) => state.currentPage);
  const pageSize = useProductStore((state) => state.pageSize);
  const setCurrentPage = useProductStore((state) => state.setCurrentPage);
  const setPageSize = useProductStore((state) => state.setPageSize);

  const paginationInfo = React.useMemo(() => {
    const totalItems = productService.filterAndSort(products, filterCriteria).length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);

    return {
      currentPage: validCurrentPage,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: validCurrentPage < totalPages,
      hasPrevPage: validCurrentPage > 1,
    };
  }, [products, filterCriteria, currentPage, pageSize]);

  const { totalPages, totalItems, hasNextPage, hasPrevPage } = paginationInfo;

  // Não renderiza nada se não houver itens
  if (totalItems === 0) return null;

  /**
   * Gera a lista de números e elipses a serem exibidos.
   */
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItemIndex = Math.min(totalItems, (currentPage - 1) * pageSize + 1);
  const endItemIndex = Math.min(totalItems, currentPage * pageSize);

  return (
    <nav
      role="navigation"
      aria-label="Paginação de produtos"
      className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row dark:border-slate-800 max-w-full"
    >
      {/* Indicador de Itens e Seletor de PageSize */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-xs text-slate-600 dark:text-slate-300">
        <span className="text-center sm:text-left">
          Mostrando <strong className="font-semibold text-slate-900 dark:text-slate-100">{startItemIndex}</strong> a{' '}
          <strong className="font-semibold text-slate-900 dark:text-slate-100">{endItemIndex}</strong> de{' '}
          <strong className="font-semibold text-slate-900 dark:text-slate-100">{totalItems}</strong> produtos
        </span>

        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 dark:border-slate-700">
          <label htmlFor="page-size-select" className="text-slate-600 dark:text-slate-300">
            Exibir:
          </label>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
        </div>
      </div>

      {/* Controles de Navegação Numérica */}
      <div className="flex flex-wrap items-center justify-center gap-1 max-w-full">
        {/* Botão Anterior */}
        <button
          type="button"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={!hasPrevPage}
          aria-label="Ir para a página anterior"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Lista de Páginas */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) => {
            if (typeof page === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs font-semibold text-slate-500"
                >
                  ...
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => setCurrentPage(page)}
                aria-label={`Ir para a página ${page}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={`h-9 min-w-9 rounded-lg px-2.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                  isCurrent
                    ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Botão Próximo */}
        <button
          type="button"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={!hasNextPage}
          aria-label="Ir para a próxima página"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
        >
          <span className="hidden sm:inline">Próximo</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
};
