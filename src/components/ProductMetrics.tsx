'use client';

/**
 * @file ProductMetrics.tsx
 * @description Painel de métricas rápidas operacionais e industriais.
 * Exibe dados analíticos calculados em tempo real a partir dos produtos atualmente filtrados:
 * Total de Itens Ativos, Preço Médio do Catálogo e Alertas de Reposição Crítica.
 */

import React from 'react';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { Product } from '@/types/product';
import { formatCurrencyBRL } from '@/utils/formatters';

interface ProductMetricsProps {
  products: Product[];
}

export const ProductMetrics: React.FC<ProductMetricsProps> = ({ products }) => {
  // 1. Total de Itens Ativos
  const totalItems = products.length;

  // 2. Preço Médio dos Itens em Exibição
  const avgPrice =
    totalItems > 0
      ? products.reduce((acc, p) => acc + (p.price || 0), 0) / totalItems
      : 0;

  // 3. Alertas de Reposição (Estoque inferior a 5 unidades ou sem estoque)
  const lowStockCount = products.filter(
    (p) =>
      p.inStock === false ||
      (p.stockQuantity !== undefined && p.stockQuantity < 5)
  ).length;

  return (
    <section
      aria-label="Painel de métricas rápidas do catálogo"
      className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
    >
      {/* Card 1: Total de Itens Ativos */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Total de Itens Ativos
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Package className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {totalItems}
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {totalItems === 1 ? 'produto visível' : 'produtos visíveis'}
          </span>
        </div>
      </div>

      {/* Card 2: Preço Médio do Catálogo */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Preço Médio do Catálogo
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {formatCurrencyBRL(avgPrice)}
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-400">
            por unidade/fardo
          </span>
        </div>
      </div>

      {/* Card 3: Alertas de Reposição */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 shadow-xs transition-all ${
          lowStockCount > 0
            ? 'border-amber-300/80 bg-amber-50/40 dark:border-amber-800/60 dark:bg-amber-950/20'
            : 'border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900/90'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Alertas de Reposição
          </span>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              lowStockCount > 0
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`font-mono text-2xl font-extrabold tracking-tight ${
              lowStockCount > 0
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-slate-900 dark:text-slate-50'
            }`}
          >
            {lowStockCount}
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {lowStockCount === 1 ? 'item crítico (< 5 un.)' : 'itens críticos (< 5 un.)'}
          </span>
        </div>
      </div>
    </section>
  );
};
