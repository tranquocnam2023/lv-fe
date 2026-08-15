import React from 'react';
import { useProductFormContext } from '../../../context/ProductFormContext';
import SharedLocalImageUpload from '../../SharedLocalImageUpload';

export default function ProductImageUpload() {
  // Khai báo giải nén các thuộc tính/hàm (formData, setFormData) từ Hook / Context / Props
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
