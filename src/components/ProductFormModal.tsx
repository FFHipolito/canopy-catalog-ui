'use client';

/**
 * @file ProductFormModal.tsx
 * @description Modal de cadastro de novos produtos integrado com validação reativa
 * via Zod e React Hook Form. Adiciona o produto à store com reflexo instantâneo
 * na UI, suporte a acessibilidade (WAI-ARIA, tecla ESC), e feedback via toast.
 */

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Loader2, CheckCircle2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { ProductCategory } from '@/types/product';
import { useProductStore } from '@/store/useProductStore';

// Compatibilidade de compatibilidade entre Zod v4 e @hookform/resolvers
if (typeof Error !== 'undefined' && !('errors' in Error.prototype)) {
  Object.defineProperty(Error.prototype, 'errors', {
    get() {
      return (this as unknown as { issues?: unknown[] }).issues;
    },
    configurable: true,
  });
}

// Schema de validação Zod para novos produtos
export const productSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'O nome do produto deve ter no mínimo 3 caracteres' })
    .max(100, { message: 'O nome não pode exceder 100 caracteres' }),
  category: z.enum(
    [
      'Celulose',
      'Papéis de Imprimir e Escrever',
      'Embalagens e Papelcartão',
      'Bens de Consumo / Tissue',
      'Bioprodutos e Inovação',
    ] as [ProductCategory, ...ProductCategory[]],
    { message: 'Selecione uma categoria válida' }
  ),
  price: z
    .number({ message: 'Informe um preço válido' })
    .positive({ message: 'O preço deve ser maior que zero (R$ 0,00)' })
    .max(1000000, { message: 'O preço não pode exceder R$ 1.000.000,00' }),
  description: z
    .string()
    .min(10, { message: 'A descrição deve ter no mínimo 10 caracteres' })
    .max(500, { message: 'A descrição não pode exceder 500 caracteres' }),
  imageUrl: z
    .string()
    .url({ message: 'Informe uma URL de imagem válida (ex: https://...)' })
    .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
      message: 'A URL deve iniciar com http:// ou https://',
    }),
  sku: z.string().optional(),
  unit: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose }) => {
  const addProduct = useProductStore((state) => state.addProduct);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: 'Celulose',
      price: undefined,
      description: '',
      imageUrl: '',
      sku: '',
      unit: 'tonelada',
    },
  });

  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bloquear rolagem do body quando o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      await addProduct({
        name: data.name.trim(),
        category: data.category,
        price: Number(data.price),
        description: data.description.trim(),
        imageUrl: data.imageUrl.trim(),
        sku: data.sku ? data.sku.trim().toUpperCase() : undefined,
        unit: data.unit ? data.unit.trim() : 'tonelada',
        inStock: true,
      });

      setToastMessage({
        type: 'success',
        text: `Produto "${data.name}" cadastrado com sucesso!`,
      });

      reset();

      // Aguarda feedback breve do toast antes de fechar o modal
      setTimeout(() => {
        setToastMessage(null);
        onClose();
      }, 1200);
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao salvar produto',
      });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop com Blur suave */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Caixa de Diálogo */}
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-200">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Cadastrar Novo Produto
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Adicione um item ao catálogo industrial com validação reativa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notificação Toast Flutuante Interna */}
        {toastMessage && (
          <div
            role="alert"
            className={`mx-6 mt-4 flex items-center gap-2.5 rounded-xl p-3 text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Formulário com React Hook Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6" noValidate>
          {/* Campo Nome */}
          <div>
            <label htmlFor="product-name" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nome do Produto <span className="text-red-500">*</span>
            </label>
            <input
              id="product-name"
              type="text"
              placeholder="Ex: Celulose Kraft Eucalipto Bleached"
              {...register('name')}
              className={`mt-1.5 w-full rounded-xl border bg-zinc-50/70 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:bg-white focus:outline-hidden dark:bg-zinc-800/70 dark:text-zinc-100 ${
                errors.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:border-red-800'
                  : 'border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Grid Categoria + Preço */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Categoria */}
            <div>
              <label htmlFor="product-category" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                id="product-category"
                {...register('category')}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-100"
              >
                <option value="Celulose">Celulose</option>
                <option value="Papéis de Imprimir e Escrever">Papéis de Imprimir e Escrever</option>
                <option value="Embalagens e Papelcartão">Embalagens e Papelcartão</option>
                <option value="Bens de Consumo / Tissue">Bens de Consumo / Tissue</option>
                <option value="Bioprodutos e Inovação">Bioprodutos e Inovação</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Preço */}
            <div>
              <label htmlFor="product-price" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Preço Unitário (R$) <span className="text-red-500">*</span>
              </label>
              <input
                id="product-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 3450.00"
                {...register('price', { valueAsNumber: true })}
                className={`mt-1.5 w-full rounded-xl border bg-zinc-50/70 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:bg-white focus:outline-hidden dark:bg-zinc-800/70 dark:text-zinc-100 ${
                  errors.price
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:border-red-800'
                    : 'border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700'
                }`}
              />
              {errors.price && (
                <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.price.message}
                </p>
              )}
            </div>
          </div>

          {/* URL da Imagem */}
          <div>
            <label htmlFor="product-image" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              URL da Imagem <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                <ImageIcon className="h-4 w-4" />
              </div>
              <input
                id="product-image"
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                {...register('imageUrl')}
                className={`w-full rounded-xl border bg-zinc-50/70 py-2.5 pr-3.5 pl-10 text-sm text-zinc-900 transition-colors focus:bg-white focus:outline-hidden dark:bg-zinc-800/70 dark:text-zinc-100 ${
                  errors.imageUrl
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:border-red-800'
                    : 'border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700'
                }`}
              />
            </div>
            {errors.imageUrl && (
              <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                {errors.imageUrl.message}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="product-description" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Descrição Detalhada <span className="text-red-500">*</span>
            </label>
            <textarea
              id="product-description"
              rows={3}
              placeholder="Descreva as características técnicas, aplicações e sustentabilidade do produto..."
              {...register('description')}
              className={`mt-1.5 w-full rounded-xl border bg-zinc-50/70 p-3 text-sm text-zinc-900 transition-colors focus:bg-white focus:outline-hidden dark:bg-zinc-800/70 dark:text-zinc-100 ${
                errors.description
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:border-red-800'
                  : 'border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Ações do Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Salvar Produto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
