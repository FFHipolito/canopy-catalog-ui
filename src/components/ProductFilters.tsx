'use client';

/**
 * @file ProductFilters.tsx
 * @description Painel avançado de filtros e ordenação para o catálogo de produtos.
 * Apresenta campo de busca com debounce inteligente, seletor de categorias,
 * filtro numérico de faixa de preço e menu suspenso de ordenação dinâmico.
 */

import React, { useState, useEffect, useTransition } from 'react';
import { Search, X, SlidersHorizontal, RotateCcw, ArrowUpDown, DollarSign } from 'lucide-react';
import { ProductCategory, SortOption } from '@/types/product';
import {
  useProductStore,
  selectFilteredProducts,
  selectPriceRangeBounds,
} from '@/store/useProductStore';

const ALL_CATEGORIES: (ProductCategory | 'ALL')[] = [
  'ALL',
  'Celulose',
  'Papéis de Imprimir e Escrever',
  'Embalagens e Papelcartão',
  'Bens de Consumo / Tissue',
  'Bioprodutos e Inovação',
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Nome (A a Z)' },
  { value: 'name-desc', label: 'Nome (Z a A)' },
  { value: 'price-asc', label: 'Menor Preço' },
  { value: 'price-desc', label: 'Maior Preço' },
];

export const ProductFilters: React.FC = () => {
  const filterCriteria = useProductStore((state) => state.filterCriteria);
  const totalRawCount = useProductStore((state) => state.products.length);
  const setSearchQuery = useProductStore((state) => state.setSearchQuery);
  const setCategory = useProductStore((state) => state.setCategory);
  const setPriceRange = useProductStore((state) => state.setPriceRange);
  const setSort = useProductStore((state) => state.setSort);
  const resetFilters = useProductStore((state) => state.resetFilters);

  const filteredCount = useProductStore((state) => selectFilteredProducts(state).length);
  const minPriceBound = useProductStore((state) => selectPriceRangeBounds(state).min);
  const maxPriceBound = useProductStore((state) => selectPriceRangeBounds(state).max);

  // Estado local para digitação imediata no input de busca com debounce
  const [localSearch, setLocalSearch] = useState(filterCriteria.searchQuery);
  const [minPriceInput, setMinPriceInput] = useState<string>(
    filterCriteria.minPrice !== null && filterCriteria.minPrice !== undefined
      ? String(filterCriteria.minPrice)
      : ''
  );
  const [maxPriceInput, setMaxPriceInput] = useState<string>(
    filterCriteria.maxPrice !== null && filterCriteria.maxPrice !== undefined
      ? String(filterCriteria.maxPrice)
      : ''
  );

  const [, startTransition] = useTransition();

  // Debounce do campo de busca textual (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== filterCriteria.searchQuery) {
        startTransition(() => {
          setSearchQuery(localSearch);
        });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch, filterCriteria.searchQuery, setSearchQuery]);

  // Handler para resetar os filtros da store e os campos visuais locais
  const handleResetFilters = () => {
    resetFilters();
    setLocalSearch('');
    setMinPriceInput('');
    setMaxPriceInput('');
  };

  const handleApplyPrice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const min = minPriceInput.trim() !== '' ? Number(minPriceInput) : null;
    const max = maxPriceInput.trim() !== '' ? Number(maxPriceInput) : null;
    setPriceRange(min, max);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    setSearchQuery('');
  };

  const hasActiveFilters =
    filterCriteria.searchQuery !== '' ||
    (filterCriteria.category && filterCriteria.category !== 'ALL') ||
    filterCriteria.minPrice !== null ||
    filterCriteria.maxPrice !== null ||
    filterCriteria.sort !== 'name-asc';

  return (
    <section
      aria-label="Filtros e ordenação de produtos"
      className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      {/* Linha Superior: Busca Textual + Ordenação + Reset */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Barra de Busca com Debounce */}
        <div className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">
            Buscar produto por nome, SKU ou descrição
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            id="search-input"
            type="text"
            role="searchbox"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar por nome, SKU ou descrição..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 py-2.5 pr-10 pl-10 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-400 dark:focus:bg-zinc-800"
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Limpar campo de busca"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Menu Suspenso de Ordenação Dinâmica */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <label htmlFor="sort-select" className="sr-only">
              Ordenar produtos
            </label>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <ArrowUpDown className="h-4 w-4" />
            </div>
            <select
              id="sort-select"
              value={filterCriteria.sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none rounded-xl border border-zinc-200 bg-zinc-50/80 py-2.5 pr-8 pl-9 text-sm font-medium text-zinc-800 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200 dark:focus:border-emerald-400"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botão de Limpar Filtros */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              title="Restaurar filtros padrões"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Linha Intermediária: Pílulas de Categoria Responsivas */}
      <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="mr-2 flex shrink-0 items-center gap-1 font-semibold text-zinc-600 dark:text-zinc-300">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Categorias:
        </span>
        {ALL_CATEGORIES.map((cat) => {
          const isSelected = (filterCriteria.category || 'ALL') === cat;
          const label = cat === 'ALL' ? 'Todas' : cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Linha Inferior: Faixa de Preço e Estatísticas de Busca */}
      <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        {/* Formulário de Faixa de Preço */}
        <form onSubmit={handleApplyPrice} className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <DollarSign className="h-3.5 w-3.5" />
            Faixa de Preço (R$):
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              placeholder={`Mín (${minPriceBound})`}
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-24 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <span className="text-xs text-zinc-400">até</span>
            <input
              type="number"
              min="0"
              placeholder={`Máx (${maxPriceBound})`}
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-24 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              Filtrar
            </button>
          </div>
        </form>

        {/* Resumo de Resultados */}
        <div className="text-xs text-zinc-600 dark:text-zinc-300">
          Mostrando <strong className="text-zinc-900 dark:text-zinc-100">{filteredCount}</strong> de{' '}
          <strong className="text-zinc-900 dark:text-zinc-100">{totalRawCount}</strong> produtos
        </div>
      </div>
    </section>
  );
};
