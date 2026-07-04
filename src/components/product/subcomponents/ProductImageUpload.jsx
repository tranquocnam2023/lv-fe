import React from 'react';
import { useProductFormContext } from '../../../context/ProductFormContext';
import SharedLocalImageUpload from '../../SharedLocalImageUpload';

export default function ProductImageUpload() {
  const { formData, setFormData } = useProductFormContext();

  return (
    <SharedLocalImageUpload
      multiple={true}
      value={formData.images}
      onChange={(updatedImages) => setFormData(prev => ({ ...prev, images: updatedImages }))}
      folder="products"
      label="Hình ảnh sản phẩm (Gallery)"
    />
  );
}
