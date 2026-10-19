/**
 * @file ProductSkeleton.tsx
 * @description Placeholders visuais com shimmer e animação de pulso para simular
 * fielmente a estrutura dos cards de produtos durante estados de carregamento,
 * prevenindo Cumulative Layout Shift (CLS) e melhorando as métricas Core Web Vitals.
 */

import React from 'react';

interface ProductSkeletonProps {
  count?: number;
}

export const ProductSkeletonItem: React.FC = () => {
  return (
    <div
      data-testid="product-skeleton-item"
      className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/90"
    >
      {/* Container de Imagem Simulado */}
      <div className="relative aspect-4/3 w-full animate-pulse bg-zinc-200 dark:bg-zinc-800">
        <div className="absolute top-3 left-3 h-6 w-24 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <div className="absolute top-3 right-3 h-5 w-16 rounded-full bg-zinc-300 dark:bg-zinc-700" />
      </div>

      {/* Conteúdo Informativo Simulado */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-3">
          {/* SKU simulado */}
          <div className="flex justify-between">
            <div className="h-3 w-20 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Título de produto simulado (duas linhas) */}
          <div className="h-5 w-4/5 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 w-3/5 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />

          {/* Descrição simulada */}
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3.5 w-5/6 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>

        {/* Rodapé de Preço Simulado */}
        <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="h-3 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-6 w-28 animate-pulse rounded-md bg-zinc-300 dark:bg-zinc-700" />
          </div>
          <div className="h-4 w-20 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
};

export const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ count = 6 }) => {
  return (
    <div
      data-testid="product-skeleton-grid"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <ProductSkeletonItem key={`skeleton-${idx}`} />
      ))}
    </div>
  );
};
