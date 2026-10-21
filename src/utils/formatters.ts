/**
 * @file formatters.ts
 * @description Funções utilitárias puras para formatação de valores monetários, números e textos.
 */

/**
 * Formata um valor numérico para o padrão de moeda brasileiro (BRL - R$).
 * Exemplo: 4350.5 -> "R$ 4.350,50"
 */
export const formatCurrencyBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata um número com separadores decimais e de milhares brasileiros.
 * Exemplo: 12500 -> "12.500"
 */
export const formatNumberBR = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};
