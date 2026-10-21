'use client';

/**
 * @file ProductFilters.tsx
 * @description Painel avançado de filtros e ordenação para o catálogo de produtos.
 * Apresenta campo de busca com debounce inteligente e atalho [ / ], seletor de categorias,
 * filtro numérico de faixa de preço, toggle de produtos com estoque e menu suspenso de ordenação.
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
  Boxes,
} from 'lucide-react';
import { ProductCategory, SortOption } from '@/types/product';
import {
  useProductStore,
  selectFilteredProducts,
  selectPriceRangeBounds,
} from '@/store/useProductStore';
import { Button } from '@/components/ui/Button';

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
  const setOnlyInStock = useProductStore((state) => state.setOnlyInStock);
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

  // Sincroniza estado local se o searchQuery na store mudar externamente (ex.: atalho Esc ou Reset)
  useEffect(() => {
    setLocalSearch(filterCriteria.searchQuery);
  }, [filterCriteria.searchQuery]);

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
    filterCriteria.maxPrice !== null ||
    Boolean(filterCriteria.onlyInStock);

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
      className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all sm:p-5 dark:border-slate-800 dark:bg-slate-900/90"
    >
      {/* Linha Superior: Busca + Botão Recolher/Expandir + Ordenação + Limpar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Barra de Busca com Debounce e Dica de Teclado [ / ] */}
        <div className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">
            Buscar produto por nome, SKU ou descrição
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 dark:text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            id="search-input"
            type="text"
            role="searchbox"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar por nome, SKU ou descrição... [ / ]"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-10 pl-10 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-offset-slate-900"
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Limpar campo de busca"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-sm dark:text-slate-400 dark:hover:text-slate-200"
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
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              isExpanded || hasAdvancedFilters
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
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

          {/* Menu Suspenso de Ordenação Customizado */}
          <div ref={sortRef} className="relative">
            <button
              id="sort-menu-button"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isSortOpen}
              aria-label={`Ordenar produtos: ${currentSortOption.label}`}
              onClick={() => setIsSortOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                isSortOpen || filterCriteria.sort !== 'name-asc'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60'
              }`}
            >
              <CurrentSortIcon className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>{currentSortOption.label}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${
                  isSortOpen ? 'rotate-180 text-emerald-700 dark:text-emerald-400' : ''
                }`}
              />
            </button>

            {/* Painel Flutuante de Opções */}
            {isSortOpen && (
              <div
                role="listbox"
                aria-labelledby="sort-menu-button"
                className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10 z-50 animate-in fade-in zoom-in-95 duration-150 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/60"
              >
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
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
                        className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-950 font-bold dark:bg-emerald-950/60 dark:text-emerald-200'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-200'
                            }`}
                          >
                            <OptionIcon className="h-3.5 w-3.5" />
                          </span>
                          <div className="truncate">
                            <div className="truncate font-semibold">{opt.label}</div>
                            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-normal truncate">
                              {opt.description}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleResetFilters}
              title="Restaurar filtros padrões"
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              className="py-2.5 rounded-xl text-slate-700 dark:text-slate-200"
            >
              <span className="hidden sm:inline">Limpar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Painel Recolhível: Categorias, Faixa de Preço e Toggle de Estoque */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 animate-in fade-in slide-in-from-top-2 duration-200 dark:border-slate-800">
          {/* Pílulas de Categoria Responsivas */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
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
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500'
                        : 'border border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Linha Inferior: Faixa de Preço + Toggle de Estoque + Resumo */}
          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100/60 dark:border-slate-800/60">
            {/* Faixa de Preço */}
            <form onSubmit={handleApplyPrice} className="flex flex-wrap items-center gap-2 max-w-full">
              <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                <DollarSign className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                Faixa de Preço (R$):
              </span>
              <div className="flex flex-wrap items-center gap-1.5 max-w-full">
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={`Mín (R$ ${minPriceBound})`}
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-20 sm:w-28 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-500 [appearance:textfield] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
                />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">até</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={`Máx (R$ ${maxPriceBound})`}
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-20 sm:w-28 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-500 [appearance:textfield] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="shrink-0 rounded-xl"
                >
                  Filtrar
                </Button>
              </div>
            </form>

            {/* Toggle: Apenas produtos com estoque disponível */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(filterCriteria.onlyInStock)}
                onClick={() => setOnlyInStock(!filterCriteria.onlyInStock)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                  filterCriteria.onlyInStock
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <Boxes className={`h-3.5 w-3.5 ${filterCriteria.onlyInStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`} />
                <span>Apenas produtos com estoque disponível</span>
              </button>

              {/* Resumo de Resultados */}
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Mostrando <strong className="text-slate-900 dark:text-slate-100">{filteredCount}</strong> de{' '}
                <strong className="text-slate-900 dark:text-slate-100">{totalRawCount}</strong> produtos
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
