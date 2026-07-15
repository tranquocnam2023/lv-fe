// THÊM MỚI SẢN PHẨM
import React from 'react';
import ProductForm from '../../../components/product/ProductForm';

export default function AdminCreateProduct({ onBack }) {
  return (
    <ProductForm 
      onBack={onBack} 
      onSaveSuccess={onBack} 
    />
  );
}
