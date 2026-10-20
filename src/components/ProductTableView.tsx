'use client';

/**
 * @file ProductTableView.tsx
 * @description Tabela compacta de alta densidade para Modo Inventário / Operacional.
 * Ajustada para caber fluidamente na tela sem barra de rolagem horizontal desnecessária,
 * com tipografia monoespaçada tabular, badges de alto contraste e ações rápidas.
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { Pencil, Layers } from 'lucide-react';
import { Product } from '@/types/product';
import { CATEGORY_STYLES, formatCurrencyBRL, getStockStatus } from '@/components/ProductCard';

interface ProductTableViewProps {
  products: Product[];
  onEdit?: (product: Product) => void;
}

export const ProductTableView: React.FC<ProductTableViewProps> = ({
  products,
  onEdit,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full border-collapse text-left text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
            <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
              SKU
            </th>
            <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
              Produto
            </th>
            <th scope="col" className="hidden sm:table-cell px-3 py-3 font-semibold sm:px-4">
              Categoria
            </th>
            <th scope="col" className="px-3 py-3 text-right font-semibold sm:px-4">
              Preço
            </th>
            <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
              Estoque
            </th>
            <th scope="col" className="px-3 py-3 text-center font-semibold sm:px-4">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {products.map((product) => {
            const categoryStyle = CATEGORY_STYLES[product.category] || {
              bg: 'bg-white dark:bg-slate-900',
              text: 'text-slate-700 dark:text-slate-300',
              border: 'border-slate-300 dark:border-slate-700',
            };
            const stockStatus = getStockStatus(product);
            const StockIcon = stockStatus.icon;

            return (
              <tr
                key={product.id}
                className="transition-colors even:bg-slate-50/50 hover:bg-emerald-50/40 dark:even:bg-slate-800/30 dark:hover:bg-emerald-950/20"
              >
                {/* Coluna 1: SKU */}
                <td className="px-3 py-2.5 font-mono text-xs font-semibold text-slate-600 sm:px-4 dark:text-slate-300">
                  {product.sku || product.id.slice(0, 10).toUpperCase()}
                </td>

                {/* Coluna 2: Produto com Thumbnail */}
                <td className="px-3 py-2.5 sm:px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:h-10 sm:w-10 dark:border-slate-700 dark:bg-slate-800">
                      {product.imageUrl ? (
                        <TableImageThumbnail
                          imageUrl={product.imageUrl}
                          altName={product.name}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <Layers className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md">
                      <div
                        title={product.name}
                        className="truncate font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm"
                      >
                        {product.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        {product.unit && <span className="truncate">{product.unit}</span>}
                        <span className="sm:hidden font-medium text-slate-500">• {product.category}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Coluna 3: Categoria (ocultada apenas em mobile ultra compacto para não criar scroll) */}
                <td className="hidden sm:table-cell px-3 py-2.5 sm:px-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold shadow-2xs ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
                  >
                    {product.category}
                  </span>
                </td>

                {/* Coluna 4: Preço Tabular Monoespaçado */}
                <td className="px-3 py-2.5 text-right font-mono text-xs font-bold tracking-tight text-slate-900 whitespace-nowrap sm:px-4 sm:text-sm dark:text-slate-100">
                  {formatCurrencyBRL(product.price)}
                </td>

                {/* Coluna 5: Estoque Operacional com Microbarra */}
                <td className="px-3 py-2.5 sm:px-4">
                  <div className="flex flex-col gap-1 max-w-[130px] sm:max-w-[150px]">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] sm:text-[11px] font-bold shadow-2xs ${stockStatus.badgeClass}`}
                    >
                      <StockIcon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{stockStatus.label}</span>
                    </span>
                    <div
                      className="h-[3px] w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"
                      aria-hidden="true"
                    >
                      <div
                        className={`h-full transition-all duration-300 ${stockStatus.barColor}`}
                        style={{ width: `${stockStatus.barPercent}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Coluna 6: Ações Rápidas */}
                <td className="px-3 py-2.5 text-center sm:px-4">
                  <button
                    type="button"
                    onClick={() => onEdit?.(product)}
                    title={`Atualizar ${product.name}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 dark:focus-visible:ring-offset-slate-900"
                  >
                    <Pencil className="h-3 w-3" />
                    <span className="hidden md:inline">Atualizar</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

interface TableImageThumbnailProps {
  imageUrl: string;
  altName: string;
}

const TableImageThumbnail: React.FC<TableImageThumbnailProps> = ({
  imageUrl,
  altName,
}) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center text-slate-400">
        <Layers className="h-4 w-4" />
      </div>
    );
  }

  const isUnsplash = imageUrl.includes('images.unsplash.com');

  return (
    <Image
      src={imageUrl}
      alt={altName}
      fill
      sizes="40px"
      unoptimized={!isUnsplash}
      onError={() => setError(true)}
      className="object-cover"
    />
  );
};
