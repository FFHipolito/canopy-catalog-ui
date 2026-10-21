/**
 * @file productHelpers.ts
 * @description Funções utilitárias e estilos derivados de produtos e categorias.
 */

import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Product, ProductCategory } from '@/types/product';

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
