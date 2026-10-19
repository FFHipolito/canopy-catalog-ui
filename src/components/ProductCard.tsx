'use client';

/**
 * @file ProductCard.tsx
 * @description Card de produto moderno com imagem responsiva, badges contextuais,
 * formatação monetária em BRL, fallback visual gracioso e microtransições em Tailwind CSS.
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { Tag, CheckCircle2, AlertCircle, Layers, Pencil } from 'lucide-react';
import { Product, ProductCategory } from '@/types/product';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  onEdit?: (product: Product) => void;
}

const CATEGORY_STYLES: Record<ProductCategory, { bg: string; text: string; border: string }> = {
  Celulose: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  'Papéis de Imprimir e Escrever': {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  'Embalagens e Papelcartão': {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  'Bens de Consumo / Tissue': {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  'Bioprodutos e Inovação': {
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
  },
};

export const formatCurrencyBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
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
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-200 dark:border-zinc-700',
  };

  const isUnsplash = product.imageUrl?.includes('images.unsplash.com');

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:border-emerald-600"
    >
      {/* Container de Imagem */}
      <div className="relative h-56 w-full aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {!imageError && product.imageUrl ? (
          <>
            {isImageLoading && (
              <div className="absolute inset-0 animate-pulse bg-zinc-200 dark:bg-zinc-700" />
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
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-zinc-400 dark:text-zinc-500">
            <Layers className="h-10 w-10 stroke-1" />
            <span className="text-xs font-medium">Imagem indisponível</span>
          </div>
        )}

        {/* Badge Flutuante de Categoria */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-md transition-colors ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
          >
            <Tag className="h-3 w-3" />
            {product.category}
          </span>
        </div>

        {/* Badge de Disponibilidade */}
        {product.inStock !== false ? (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm backdrop-blur-sm">
              <CheckCircle2 className="h-3 w-3" />
              Disponível
            </span>
          </div>
        ) : (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm backdrop-blur-sm">
              <AlertCircle className="h-3 w-3" />
              Sob Demanda
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo Informativo */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {/* Identificador SKU / Unidade */}
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
            <span>SKU: {product.sku || product.id.slice(0, 10).toUpperCase()}</span>
            {product.unit && <span>Unidade: {product.unit}</span>}
          </div>

          {/* Nome do Produto */}
          <h3
            title={product.name}
            className="line-clamp-2 text-lg font-bold tracking-tight text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-50 dark:group-hover:text-emerald-400"
          >
            {product.name}
          </h3>

          {/* Descrição expansível com 'mais' / 'menos' */}
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
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
                className="mt-1 inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                {isDescriptionExpanded ? 'menos' : 'mais'}
              </button>
            )}
          </div>
        </div>

        {/* Rodapé do Card com Preço Formatado e Botão de Atualizar Produto */}
        <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Preço Estimado
            </span>
            <span className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {formatCurrencyBRL(product.price)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onEdit?.(product)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-all hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
          >
            <Pencil className="h-3 w-3" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>
    </article>
  );
};
