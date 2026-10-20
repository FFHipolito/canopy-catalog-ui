'use client';

/**
 * @file ProductFilters.tsx
 * @description Painel avançado de filtros e ordenação para o catálogo de produtos.
 * Apresenta campo de busca com debounce inteligente, seletor de categorias,
 * filtro numérico de faixa de preço e menu suspenso de ordenação dinâmico.
 */

import React, { useState, useEffect, useTransition, useRef } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  ArrowUpDown,
  DollarSign,
  ChevronDown,
  ArrowDownAZ,
  ArrowDownZA,
  ArrowDown01,
  ArrowDown10,
  Check,
} from 'lucide-react';
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

interface SortOptionItem {
  value: SortOption;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const SORT_OPTIONS: SortOptionItem[] = [
  {
    value: 'name-asc',
    label: 'Nome (A a Z)',
    icon: ArrowDownAZ,
    description: 'Ordem alfabética crescente',
  },
  {
    value: 'name-desc',
    label: 'Nome (Z a A)',
    icon: ArrowDownZA,
    description: 'Ordem alfabética decrescente',
  },
  {
    value: 'price-asc',
    label: 'Menor Preço',
    icon: ArrowDown01,
    description: 'Do mais econômico ao maior',
  },
  {
    value: 'price-desc',
    label: 'Maior Preço',
    icon: ArrowDown10,
    description: 'Do maior valor ao mais econômico',
  },
];

export interface ProductFiltersProps {
  defaultExpanded?: boolean;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({ defaultExpanded = false }) => {
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

  // Filtros recolhidos por padrão para layout limpo
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Estado e referência para o menu suspenso customizado de ordenação
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown de ordenação ao clicar fora ou ao pressionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSortOpen(false);
      }
    };

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortOpen]);

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

  const hasAdvancedFilters =
    (filterCriteria.category && filterCriteria.category !== 'ALL') ||
    filterCriteria.minPrice !== null ||
    filterCriteria.maxPrice !== null;

  const hasActiveFilters =
    filterCriteria.searchQuery !== '' ||
    hasAdvancedFilters ||
    filterCriteria.sort !== 'name-asc';

  const currentSortOption =
    SORT_OPTIONS.find((opt) => opt.value === filterCriteria.sort) || SORT_OPTIONS[0];
  const CurrentSortIcon = currentSortOption.icon;

  return (
    <section
      aria-label="Filtros e ordenação de produtos"
      className="mb-8 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/90"
    >
      {/* Linha Superior: Busca + Botão Recolher/Expandir + Ordenação + Limpar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pr-10 pl-10 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-emerald-600 focus:bg-white focus:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-400 dark:focus:bg-zinc-800 dark:focus:text-white"
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

        {/* Controles: Botão Expandir Filtros + Ordenação + Limpar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão de Abrir/Recolher Filtros */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all ${
              isExpanded || hasAdvancedFilters
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70'
                : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/60 dark:hover:border-zinc-600 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtros</span>
            {hasAdvancedFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                !
              </span>
            )}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Menu Suspenso de Ordenação Customizado e Elegante */}
          <div ref={sortRef} className="relative">
            <button
              id="sort-menu-button"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isSortOpen}
              aria-label={`Ordenar produtos: ${currentSortOption.label}`}
              onClick={() => setIsSortOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all ${
                isSortOpen || filterCriteria.sort !== 'name-asc'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/60 dark:hover:border-zinc-600 dark:hover:text-white'
              }`}
            >
              <CurrentSortIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{currentSortOption.label}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${
                  isSortOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                }`}
              />
            </button>

            {/* Painel Flutuante de Opções */}
            {isSortOpen && (
              <div
                role="listbox"
                aria-labelledby="sort-menu-button"
                className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-950/10 z-50 animate-in fade-in zoom-in-95 duration-150 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/60"
              >
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-1">
                  <ArrowUpDown className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Ordenar Catálogo</span>
                </div>
                <div className="space-y-1">
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = filterCriteria.sort === opt.value;
                    const OptionIcon = opt.icon;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSort(opt.value);
                          setIsSortOpen(false);
                        }}
                        className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-semibold dark:bg-emerald-950/50 dark:text-emerald-200'
                            : 'text-zinc-700 hover:bg-zinc-100/80 hover:text-zinc-900 font-medium dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500'
                                : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200/80 group-hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700 dark:group-hover:text-zinc-200'
                            }`}
                          >
                            <OptionIcon className="h-3.5 w-3.5" />
                          </span>
                          <div className="truncate">
                            <div className="truncate font-medium">{opt.label}</div>
                            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal truncate">
                              {opt.description}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-150" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Botão de Limpar Filtros */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              title="Restaurar filtros padrões"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700/60 dark:hover:border-zinc-600 dark:hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Painel Recolhível: Categorias e Faixa de Preço */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4 animate-in fade-in slide-in-from-top-2 duration-200 dark:border-zinc-800">
          {/* Pílulas de Categoria Responsivas */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Categorias de Produtos:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = (filterCriteria.category || 'ALL') === cat;
                const label = cat === 'ALL' ? 'Todas' : cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500'
                        : 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Faixa de Preço - Apenas Digitação sem Barra de Rolagem */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleApplyPrice} className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Faixa de Preço (R$):
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={`Mín (R$ ${minPriceBound})`}
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-28 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 [appearance:textfield] focus:border-emerald-600 focus:bg-white focus:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-emerald-400 dark:focus:bg-zinc-800 dark:focus:text-white"
                />
                <span className="text-xs font-medium text-zinc-400">até</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={`Máx (R$ ${maxPriceBound})`}
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-28 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 [appearance:textfield] focus:border-emerald-600 focus:bg-white focus:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-emerald-400 dark:focus:bg-zinc-800 dark:focus:text-white"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  Filtrar
                </button>
              </div>
            </form>

            {/* Resumo de Resultados */}
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Mostrando <strong className="text-zinc-900 dark:text-zinc-100">{filteredCount}</strong> de{' '}
              <strong className="text-zinc-900 dark:text-zinc-100">{totalRawCount}</strong> produtos
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
