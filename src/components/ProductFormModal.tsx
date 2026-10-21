'use client';

/**
 * @file ProductFormModal.tsx
 * @description Modal de cadastro e edição de produtos integrado com validação reativa
 * via Zod e React Hook Form. Suporta definição de estoque operacional, categorização,
 * conformidade com WCAG AA, anéis de foco acessíveis e feedback via toast.
 */

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Loader2, CheckCircle2, AlertTriangle, Image as ImageIcon, Boxes } from 'lucide-react';
import { Product, ProductCategory } from '@/types/product';
import { useProductStore } from '@/store/useProductStore';

// Compatibilidade entre Zod v4 e @hookform/resolvers
if (typeof Error !== 'undefined' && !('errors' in Error.prototype)) {
  Object.defineProperty(Error.prototype, 'errors', {
    get() {
      return (this as unknown as { issues?: unknown[] }).issues;
    },
    configurable: true,
  });
}

// Schema de validação Zod para produtos
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
  stockQuantity: z
    .preprocess(
      (val) => (val === '' || val === undefined || val === null ? 0 : Number(val)),
      z.number({ message: 'Informe a quantidade em estoque' }).min(0, {
        message: 'A quantidade em estoque não pode ser negativa',
      })
    )
    .optional(),
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
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit = null,
}) => {
  const addProduct = useProductStore((state) => state.addProduct);
  const updateProduct = useProductStore((state) => state.updateProduct);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const isEditing = Boolean(productToEdit);

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
      stockQuantity: 15,
      description: '',
      imageUrl: '',
      sku: '',
      unit: 'tonelada',
    },
  });

  // Atualiza valores do formulário quando productToEdit ou modal abrir
  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        reset({
          name: productToEdit.name,
          category: productToEdit.category,
          price: productToEdit.price,
          stockQuantity:
            productToEdit.stockQuantity !== undefined
              ? productToEdit.stockQuantity
              : productToEdit.inStock !== false
              ? 20
              : 0,
          description: productToEdit.description,
          imageUrl: productToEdit.imageUrl,
          sku: productToEdit.sku || '',
          unit: productToEdit.unit || 'tonelada',
        });
      } else {
        reset({
          name: '',
          category: 'Celulose',
          price: undefined,
          stockQuantity: 15,
          description: '',
          imageUrl: '',
          sku: '',
          unit: 'tonelada',
        });
      }
    }
  }, [isOpen, productToEdit, reset]);

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
      const stock = data.stockQuantity !== undefined ? Number(data.stockQuantity) : 0;

      if (isEditing && productToEdit) {
        await updateProduct(productToEdit.id, {
          name: data.name.trim(),
          category: data.category,
          price: Number(data.price),
          stockQuantity: stock,
          inStock: stock > 0,
          description: data.description.trim(),
          imageUrl: data.imageUrl.trim(),
          sku: data.sku ? data.sku.trim().toUpperCase() : undefined,
          unit: data.unit ? data.unit.trim() : 'tonelada',
        });

        setToastMessage({
          type: 'success',
          text: `Produto "${data.name}" atualizado com sucesso!`,
        });
      } else {
        await addProduct({
          name: data.name.trim(),
          category: data.category,
          price: Number(data.price),
          stockQuantity: stock,
          inStock: stock > 0,
          description: data.description.trim(),
          imageUrl: data.imageUrl.trim(),
          sku: data.sku ? data.sku.trim().toUpperCase() : undefined,
          unit: data.unit ? data.unit.trim() : 'tonelada',
        });

        setToastMessage({
          type: 'success',
          text: `Produto "${data.name}" cadastrado com sucesso!`,
        });
      }

      reset();

      setTimeout(() => {
        setToastMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao processar produto',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Caixa de Diálogo Responsiva com Altura Controlada */}
      <div className="relative z-10 my-auto flex max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200">
        {/* Cabeçalho do Modal (Fixo no topo) */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5 sm:px-6 sm:py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Plus className={`h-5 w-5 ${isEditing ? 'rotate-45' : ''}`} />
            </div>
            <div>
              <h2 id="modal-title" className="text-base font-bold text-slate-900 dark:text-slate-50">
                {isEditing ? 'Atualizar Produto' : 'Cadastrar Novo Produto'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {isEditing
                  ? 'Edite as especificações técnicas, valores e estoque do produto'
                  : 'Adicione um novo item operacional com quantidade em estoque'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notificação Toast Flutuante Interna */}
        {toastMessage && (
          <div className="px-5 pt-3 sm:px-6 shrink-0">
            <div
              role="alert"
              className={`flex items-center gap-2.5 rounded-xl p-3 text-xs font-semibold ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-700 dark:text-rose-400" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* Formulário com Área de Conteúdo Rolável e Rodapé Pinned */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden" noValidate>
          <div className="flex-1 overflow-y-auto space-y-4 p-5 sm:p-6">
            {/* Campo Nome */}
            <div>
              <label htmlFor="product-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nome do Produto <span className="text-red-500">*</span>
              </label>
              <input
                id="product-name"
                type="text"
                placeholder="Ex: Válvula Reguladora de Pressão DN50"
                {...register('name')}
                className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 ${
                  errors.name
                    ? 'border-red-400 dark:border-red-700'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Grid Categoria + SKU */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Categoria */}
              <div>
                <label htmlFor="product-category" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <select
                  id="product-category"
                  {...register('category')}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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

              {/* SKU */}
              <div>
                <label htmlFor="product-sku" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  SKU (Código Interno)
                </label>
                <input
                  id="product-sku"
                  type="text"
                  placeholder="Ex: VLV-REG-DN50"
                  {...register('sku')}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm uppercase text-slate-900 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Grid Preço Unitário + Estoque Operacional */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Preço Unitário */}
              <div>
                <label htmlFor="product-price" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Preço Unitário (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 3450.00"
                  {...register('price', { valueAsNumber: true })}
                  className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 ${
                    errors.price
                      ? 'border-red-400 dark:border-red-700'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errors.price && (
                  <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                    {errors.price.message}
                  </p>
                )}
              </div>

              {/* Quantidade em Estoque */}
              <div>
                <label
                  htmlFor="product-stock"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <Boxes className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Estoque Operacional (unidades)</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="product-stock"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Ex: 25"
                    {...register('stockQuantity', { valueAsNumber: true })}
                    className={`w-full rounded-xl border bg-white py-2.5 pr-12 pl-3.5 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 ${
                      errors.stockQuantity
                        ? 'border-red-400 dark:border-red-700'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    un.
                  </div>
                </div>
                {errors.stockQuantity && (
                  <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                    {errors.stockQuantity.message}
                  </p>
                )}
              </div>
            </div>

            {/* Grid Unidade + Imagem */}
            <div>
              <label htmlFor="product-unit" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Unidade de Medida
              </label>
              <input
                id="product-unit"
                type="text"
                placeholder="Ex: Bobina 850 kg, Fardo 1.000 kg, Caixa c/ 2.500 folhas"
                {...register('unit')}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
              />
            </div>

            {/* URL da Imagem */}
            <div>
              <label htmlFor="product-image" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                URL da Imagem <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 dark:text-slate-400">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <input
                  id="product-image"
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  {...register('imageUrl')}
                  className={`w-full rounded-xl border bg-white py-2.5 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 ${
                    errors.imageUrl
                      ? 'border-red-400 dark:border-red-700'
                      : 'border-slate-300 dark:border-slate-700'
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
              <label htmlFor="product-description" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Descrição Detalhada <span className="text-red-500">*</span>
              </label>
              <textarea
                id="product-description"
                rows={3}
                placeholder="Descreva as especificações técnicas, aplicações e procedência florestal/industrial do produto..."
                {...register('description')}
                className={`mt-1.5 w-full rounded-xl border bg-white p-3 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 ${
                  errors.description
                    ? 'border-red-400 dark:border-red-700'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Ações do Rodapé (Fixado na base) */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5 sm:px-6 sm:py-4 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/90">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:focus-visible:ring-offset-slate-900"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEditing ? 'Atualizando...' : 'Cadastrando...'}</span>
                </>
              ) : (
                <>
                  <Plus className={`h-4 w-4 ${isEditing ? 'rotate-45' : ''}`} />
                  <span>{isEditing ? 'Salvar Alterações' : 'Salvar Produto'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
