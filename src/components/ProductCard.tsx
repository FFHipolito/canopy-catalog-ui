'use client';

/**
 * @file ProductCard.tsx
 * @description Card de produto corporativo com conformidade WCAG AA estrita,
 * tipografia monoespaçada tabular para valores, indicador visual de estoque com microbarra
 * e anéis de foco acessíveis.
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { Tag, CheckCircle2, AlertTriangle, XCircle, Layers, Pencil } from 'lucide-react';
import { Product, ProductCategory } from '@/types/product';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  onEdit?: (product: Product) => void;
}

export const CATEGORY_STYLES: Record<ProductCategory, { bg: string; text: string; border: string }> = {
  Celulose: {
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700/60',
  },
  'Papéis de Imprimir e Escrever': {
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-sky-800 dark:text-sky-300',
    border: 'border-sky-300 dark:border-sky-700/60',
  },
  'Embalagens e Papelcartão': {
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-amber-900 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700/60',
  },
  'Bens de Consumo / Tissue': {
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-purple-900 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700/60',
  },
  'Bioprodutos e Inovação': {
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-teal-900 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-700/60',
  },
};

export const formatCurrencyBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export interface StockStatusInfo {
  label: string;
  badgeClass: string;
  barColor: string;
  barPercent: number;
  icon: React.ComponentType<{ className?: string }>;
  isOutOfStock: boolean;
}

export const getStockStatus = (product: Product): StockStatusInfo => {
  const stock = product.stockQuantity;
  const isOutOfStock = product.inStock === false || (stock !== undefined && stock === 0);

  if (isOutOfStock) {
    return {
      label: 'Esgotado',
      badgeClass:
        'bg-white text-rose-800 border-rose-300 shadow-2xs dark:bg-slate-900 dark:text-rose-300 dark:border-rose-700/60',
      barColor: 'bg-rose-600 dark:bg-rose-500',
      barPercent: 0,
      icon: XCircle,
      isOutOfStock: true,
    };
  }

  if (stock !== undefined && stock > 0 && stock < 5) {
    return {
      label: `Estoque Baixo (${stock} un.)`,
      badgeClass:
        'bg-white text-amber-900 border-amber-300 shadow-2xs dark:bg-slate-900 dark:text-amber-300 dark:border-amber-700/60',
      barColor: 'bg-amber-500 dark:bg-amber-400',
      barPercent: Math.max(10, Math.min(100, (stock / 20) * 100)),
      icon: AlertTriangle,
      isOutOfStock: false,
    };
  }

  return {
    label: 'Disponível',
    badgeClass:
      'bg-white text-emerald-800 border-emerald-300 shadow-2xs dark:bg-slate-900 dark:text-emerald-300 dark:border-emerald-700/60',
    barColor: 'bg-emerald-600 dark:bg-emerald-500',
    barPercent: 100,
    icon: CheckCircle2,
    isOutOfStock: false,
  };
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  priority = false,
  onEdit,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const categoryStyle = CATEGORY_STYLES[product.category] || {
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
  };

  const stockStatus = getStockStatus(product);
  const StockIcon = stockStatus.icon;
  const isUnsplash = product.imageUrl?.includes('images.unsplash.com');

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-emerald-600"
    >
      {/* Container de Imagem */}
      <div className="relative h-52 w-full aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {!imageError && product.imageUrl ? (
          <>
            {isImageLoading && (
              <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700" />
            )}
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              unoptimized={!isUnsplash}
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setImageError(true);
                setIsImageLoading(false);
              }}
              className={`object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-slate-400 dark:text-slate-500">
            <Layers className="h-10 w-10 stroke-1" />
            <span className="text-xs font-medium">Imagem indisponível</span>
          </div>
        )}

        {/* Badges Flutuantes Responsivos (Categoria e Estoque) */}
        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 z-10 flex flex-wrap items-start justify-between gap-1.5 sm:inset-x-3 sm:top-3">
          {/* Badge de Categoria */}
          <span
            className={`pointer-events-auto inline-flex max-w-[calc(100%-8px)] items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold shadow-xs transition-colors sm:max-w-none sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
          >
            <Tag className="h-3 w-3 shrink-0" />
            <span className="truncate">{product.category}</span>
          </span>

          {/* Badge de Disponibilidade com Contraste Alto WCAG AA */}
          <span
            className={`pointer-events-auto inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold shadow-xs sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs ${stockStatus.badgeClass}`}
          >
            <StockIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span>{stockStatus.label}</span>
          </span>
        </div>

        {/* Microbarra de Progresso do Nível de Estoque (3px) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-200/80 dark:bg-slate-700/80"
          aria-hidden="true"
        >
          <div
            className={`h-full transition-all duration-300 ${stockStatus.barColor}`}
            style={{ width: `${stockStatus.barPercent}%` }}
          />
        </div>
      </div>

      {/* Conteúdo Informativo */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {/* Identificador SKU / Unidade com contraste mínimo 4.5:1 */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="font-mono truncate">SKU: {product.sku || product.id.slice(0, 10).toUpperCase()}</span>
            {product.unit && <span className="truncate">Unidade: {product.unit}</span>}
          </div>

          {/* Nome do Produto */}
          <h3
            title={product.name}
            className="line-clamp-2 text-base font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 sm:text-lg dark:text-slate-100 dark:group-hover:text-emerald-400"
          >
            {product.name}
          </h3>

          {/* Descrição expansível com 'mais' / 'menos' */}
          <div className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
            <p className={isDescriptionExpanded ? 'leading-relaxed' : 'line-clamp-2 leading-relaxed'}>
              {product.description}
            </p>
            {product.description && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDescriptionExpanded(!isDescriptionExpanded);
                }}
                className="mt-1 inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                {isDescriptionExpanded ? 'menos' : 'mais'}
              </button>
            )}
          </div>
        </div>

        {/* Rodapé do Card com Preço Monoespaçado e Ação com Anéis de Foco */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Preço Estimado
            </span>
            <span className="font-mono text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {formatCurrencyBRL(product.price)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onEdit?.(product)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 dark:focus-visible:ring-offset-slate-900"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>
    </article>
  );
};
