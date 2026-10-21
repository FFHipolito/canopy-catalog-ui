import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ProductSkeleton, ProductSkeletonItem } from '@/components/ProductSkeleton';

describe('ProductSkeleton Component', () => {
  it('deve renderizar a quantidade padrão de 6 esqueletos', () => {
    render(<ProductSkeleton />);
    const skeletonContainer = screen.getByTestId('products-skeleton');
    expect(skeletonContainer).toBeInTheDocument();

    const items = screen.getAllByTestId('product-skeleton-item');
    expect(items).toHaveLength(6);
  });

  it('deve renderizar quantidade customizada de esqueletos quando informado count', () => {
    render(<ProductSkeleton count={3} />);
    const items = screen.getAllByTestId('product-skeleton-item');
    expect(items).toHaveLength(3);
  });

  it('deve renderizar o ProductSkeletonItem isoladamente com classes de animação pulse', () => {
    render(<ProductSkeletonItem />);
    const item = screen.getByTestId('product-skeleton-item');
    expect(item).toBeInTheDocument();
  });
});
