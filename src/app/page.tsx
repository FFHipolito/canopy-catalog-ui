'use client';

/**
 * @file page.tsx
 * @description Página principal corporativa da aplicação Canopy Catalog.
 * Apresenta Painel de Métricas Rápidas, Modo Duplo de Visualização (Catálogo vs Inventário),
 * atalhos operacionais de teclado (/ para busca, Esc para fechar/limpar),
 * conformidade rigorosa com WCAG AA e estética industrial com ardósia profunda e esmeralda.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  TreePine,
  Sun,
  Moon,
  PackageSearch,
  AlertCircle,
  Sparkles,
  LayoutGrid,
  TableProperties,
} from 'lucide-react';
import { Product } from '@/types/product';
import { useProductStore } from '@/store/useProductStore';
import { productService } from '@/services/productService';
import { ProductMetrics } from '@/components/ProductMetrics';
import { ProductCard } from '@/components/ProductCard';
import { ProductTableView } from '@/components/ProductTableView';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import { ProductFilters } from '@/components/ProductFilters';
import { Pagination } from '@/components/Pagination';
import { ProductFormModal } from '@/components/ProductFormModal';

export default function CatalogPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'catalog' | 'inventory'>('catalog');

  // Inicializa tema de forma segura contra hydration mismatch no SSR
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('canopy_theme');
    if (saved === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const isLoading = useProductStore((state) => state.isLoading);
  const error = useProductStore((state) => state.error);
  const resetFilters = useProductStore((state) => state.resetFilters);

  const products = useProductStore((state) => state.products);
  const filterCriteria = useProductStore((state) => state.filterCriteria);
  const currentPage = useProductStore((state) => state.currentPage);
  const pageSize = useProductStore((state) => state.pageSize);

  // Sincroniza a classe dark no elemento raiz HTML
  useEffect(() => {
    if (!mounted) return;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('canopy_theme', nextTheme);
    }
  };

  // Derivação memoizada dos produtos filtrados
  const filteredProducts = useMemo(() => {
    return productService.filterAndSort(products, filterCriteria);
  }, [products, filterCriteria]);

  // Paginação dos produtos filtrados
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Carregamento inicial assíncrono
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Atalhos de Teclado Operacionais Globais
  // '/' foca o campo de busca
  // 'Escape' fecha modal ou limpa a busca ativa
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        const active = document.activeElement;
        const isTyping =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          (active as HTMLElement)?.isContentEditable;

        if (!isTyping) {
          e.preventDefault();
          const searchInput = document.getElementById('search-input');
          if (searchInput) {
            searchInput.focus();
          }
        }
      }

      if (e.key === 'Escape') {
        if (isModalOpen) {
          setIsModalOpen(false);
        } else if (filterCriteria.searchQuery) {
          useProductStore.getState().setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isModalOpen, filterCriteria.searchQuery]);

  const handleOpenNewProduct = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditProduct = (prod?: Product) => {
    setProductToEdit(prod || products[0] || null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      {/* Barra de Topo Corporativa */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo e Nome da Plataforma */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <TreePine className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Canopy
                </span>
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Catálogo Industrial de Produtos & Celulose
              </p>
            </div>
          </div>

          {/* Ações da Barra de Topo */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Seletor de Modo de Visualização: Catálogo vs Inventário */}
            <div
              role="group"
              aria-label="Modo de visualização"
              className="inline-flex items-center rounded-xl border border-slate-300 bg-slate-100/90 p-1 dark:border-slate-700 dark:bg-slate-800"
            >
              <button
                type="button"
                onClick={() => setViewMode('catalog')}
                aria-pressed={viewMode === 'catalog'}
                title="Modo Catálogo (Grelha de Cards)"
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                  viewMode === 'catalog'
                    ? 'bg-white text-emerald-900 shadow-xs dark:bg-slate-900 dark:text-emerald-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Catálogo</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('inventory')}
                aria-pressed={viewMode === 'inventory'}
                title="Modo Inventário (Tabela Compacta)"
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                  viewMode === 'inventory'
                    ? 'bg-white text-emerald-900 shadow-xs dark:bg-slate-900 dark:text-emerald-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <TableProperties className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Inventário</span>
              </button>
            </div>

            {/* Alternância de Tema Claro / Escuro */}
            <button
              type="button"
              onClick={toggleTheme}
              title={
                !mounted
                  ? 'Alternar tema'
                  : theme === 'dark'
                  ? 'Mudar para Modo Claro'
                  : 'Mudar para Modo Escuro'
              }
              aria-label="Alternar tema claro ou escuro"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60 dark:focus-visible:ring-offset-slate-900"
            >
              {mounted && theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span className="hidden md:inline">Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  <span className="hidden md:inline">Escuro</span>
                </>
              )}
            </button>

            {/* Botão Cadastrar Novo Produto */}
            <button
              type="button"
              onClick={handleOpenNewProduct}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-600 px-3.5 sm:px-4 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:focus-visible:ring-offset-slate-900"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">Novo Produto</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner de Boas-Vindas Original */}
        <section className="mb-6 rounded-3xl border border-zinc-200/80 bg-gradient-to-r from-emerald-900 via-teal-900 to-zinc-900 p-6 text-white shadow-xl sm:p-8 dark:border-zinc-800">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Catálogo de Soluções Sustentáveis
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              Catálogo Corporativo de Produtos
            </h1>
            <p className="mt-2 text-sm text-zinc-200">
              Explore a linha completa de celulose solúvel, papéis termossensíveis, embalagens
              biodegradáveis e inovação em bioprodutos industriais de alta performance.
            </p>
          </div>
        </section>

        {/* 3. Painel de Métricas Rápidas Dinâmicas */}
        <ProductMetrics products={filteredProducts} />

        {/* Barra de Filtros e Ordenação */}
        <ProductFilters />

        {/* Tratamento de Erro de Conexão / Serviço */}
        {error && !isLoading && (
          <div
            role="alert"
            className="mb-8 flex items-center justify-between rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold">Erro ao consultar produtos</h4>
                <p className="text-xs">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchProducts()}
              className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Visualização de Produtos: Skeletons vs Empty State vs Grelha/Tabela */}
        {isLoading ? (
          <ProductSkeleton count={6} />
        ) : filteredProducts.length === 0 ? (
          /* 7. Empty State Detalhado */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <PackageSearch className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
              Nenhum produto corresponde aos filtros aplicados
            </h3>
            <p className="mt-1 max-w-md text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Não encontramos nenhum item correspondente aos critérios de busca textual, categoria,
              faixa de preço ou filtro de estoque ativo.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
              >
                Limpar filtros e restaurar lista
              </button>
              <button
                type="button"
                onClick={handleOpenNewProduct}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:bg-emerald-500 dark:focus-visible:ring-offset-slate-900"
              >
                Cadastrar Novo Produto
              </button>
            </div>
          </div>
        ) : (
          /* Renderização de Produtos de Acordo com o Modo Selecionado */
          <>
            {viewMode === 'catalog' ? (
              <div
                data-testid="products-grid"
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {paginatedProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={idx < 3}
                    onEdit={handleOpenEditProduct}
                  />
                ))}
              </div>
            ) : (
              <ProductTableView
                products={paginatedProducts}
                onEdit={handleOpenEditProduct}
              />
            )}

            {/* Paginação */}
            <Pagination />
          </>
        )}
      </main>

      {/* Modal de Cadastro e Atualização */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
      />
    </div>
  );
}
