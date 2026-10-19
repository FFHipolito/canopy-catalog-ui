'use client';

/**
 * @file page.tsx
 * @description Página principal da aplicação Canopy Catalog.
 * Centraliza a navegação do catálogo, feedback de carregamento assíncrono,
 * painel de filtros com debounce, grid responsivo de produtos e modal de cadastro.
 */

import React, { useEffect, useState } from 'react';
import {
  Plus,
  TreePine,
  RefreshCw,
  PackageSearch,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useProductStore } from '@/store/useProductStore';
import { productService } from '@/services/productService';
import { ProductCard } from '@/components/ProductCard';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import { ProductFilters } from '@/components/ProductFilters';
import { Pagination } from '@/components/Pagination';
import { ProductFormModal } from '@/components/ProductFormModal';

export default function CatalogPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const isLoading = useProductStore((state) => state.isLoading);
  const error = useProductStore((state) => state.error);
  const resetFilters = useProductStore((state) => state.resetFilters);

  const products = useProductStore((state) => state.products);
  const filterCriteria = useProductStore((state) => state.filterCriteria);
  const currentPage = useProductStore((state) => state.currentPage);
  const pageSize = useProductStore((state) => state.pageSize);

  // Derivação memoizada segura contra re-renders e hydration mismatch no SSR
  const filteredProducts = React.useMemo(() => {
    return productService.filterAndSort(products, filterCriteria);
  }, [products, filterCriteria]);

  const paginatedProducts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Carregamento inicial com simulação de latência assíncrona
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-900 transition-colors dark:bg-black dark:text-zinc-100">
      {/* Barra de Topo Corporativa */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo e Nome da Plataforma */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <TreePine className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  Canopy
                </span>
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Catálogo Industrial de Produtos & Celulose
              </p>
            </div>
          </div>

          {/* Ações da Barra de Topo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchProducts()}
              title="Recarregar catálogo"
              disabled={isLoading}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="ml-1.5 hidden sm:inline">Atualizar</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-lg dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Produto</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner de Boas-Vindas e Métricas Rápidas */}
        <section className="mb-8 rounded-3xl border border-zinc-200/80 bg-gradient-to-r from-emerald-900 via-teal-900 to-zinc-900 p-6 text-white shadow-xl sm:p-8 dark:border-zinc-800">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                Catálogo de Soluções Sustentáveis
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                Catálogo Corporativo de Produtos
              </h1>
              <p className="mt-2 text-sm text-zinc-300">
                Explore a linha completa de celulose solúvel, papéis termossensíveis, embalagens
                biodegradáveis e inovação em bioprodutos derivados do eucalipto.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                <div className="text-2xl font-black text-emerald-300">
                  {filteredProducts.length}
                </div>
                <div className="text-xs text-zinc-300">Itens Filtrados</div>
              </div>
            </div>
          </div>
        </section>

        {/* Barra de Filtros e Ordenação */}
        <ProductFilters />

        {/* Tratamento de Erro de Conexão / Serviço */}
        {error && !isLoading && (
          <div
            role="alert"
            className="mb-8 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
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
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Grid de Produtos / Skeletons */}
        {isLoading ? (
          <ProductSkeleton count={6} />
        ) : filteredProducts.length === 0 ? (
          /* Empty State Amigável */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
              <PackageSearch className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-100">
              Nenhum produto encontrado
            </h3>
            <p className="mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
              Não encontramos nenhum item correspondente aos critérios de busca ou filtros de faixa
              de preço aplicados.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                Limpar Todos os Filtros
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500"
              >
                Cadastrar Novo Produto
              </button>
            </div>
          </div>
        ) : (
          /* Lista de Produtos Renderizados */
          <>
            <div
              data-testid="products-grid"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {paginatedProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={idx < 3}
                />
              ))}
            </div>

            {/* Paginação */}
            <Pagination />
          </>
        )}
      </main>

      {/* Modal de Cadastro */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
