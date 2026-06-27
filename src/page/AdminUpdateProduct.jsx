import React from 'react';
import ProductForm from '../components/product/ProductForm';

export default function AdminUpdateProduct({ productId, onBack, onCreateNew }) {
  return (
    <ProductForm 
      productId={productId}
      onBack={onBack} 
      onSaveSuccess={onBack} 
    />
  );
}
