// src/utils/comboPrice.js

/**
 * Tính giá mua kèm (combo) của 1 sản phẩm phụ theo chiến dịch khuyến mãi.
 * Logic phải khớp 100% với back-end (OrderService.CheckoutAsync), đặc biệt là
 * trần giảm giá MaxDiscountAmount của loại "Percentage" - nếu FE bỏ qua trần này
 * thì giỏ hàng sẽ hiển thị rẻ hơn số tiền thực tế đẩy sang VNPay.
 * @param {number} basePrice Giá gốc của sản phẩm phụ
 * @param {object} campaign Chiến dịch mua kèm (discountType, discountValue, maxDiscountAmount)
 * @returns {number} Giá sau khi áp dụng khuyến mãi mua kèm
 */
export const calcComboPrice = (basePrice, campaign) => {
  if (!campaign) return basePrice;

  if (campaign.discountType === 'Percentage') {
    // Khai báo biến/hằng số: discount - Số tiền được giảm theo %
    let discount = basePrice * (campaign.discountValue / 100);
    // Áp trần giảm giá (nếu chiến dịch có cấu hình) giống hệt back-end
    if (campaign.maxDiscountAmount != null && discount > campaign.maxDiscountAmount) {
      discount = campaign.maxDiscountAmount;
    }
    return Math.max(0, basePrice - discount);
  }

  if (campaign.discountType === 'FixedAmount') {
    return Math.max(0, basePrice - campaign.discountValue);
  }

  if (campaign.discountType === 'FixedPrice') {
    return campaign.discountValue;
  }

  return basePrice;
};
