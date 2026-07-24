import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Package, Layers, Sparkles } from 'lucide-react';
import api from '../../../services/api';
import { productService } from '../../../services/productService';
import { categoryService } from '../../../services/categoryService';
import { brandService } from '../../../services/brandService';
import CampaignRuleGroup from './components/CampaignRuleGroup';

export default function AdminComboForm({ comboId = null, onBack }) {
  const isEdit = Boolean(comboId);

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Form Basic Info
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    discountType: 'Percentage',
    discountValue: 10,
    maxQuantityAllowed: 5,
    maxDiscountAmount: '',
    isActive: true
  });

  // Rules Arrays
  const [mainRules, setMainRules] = useState([]);
  const [addonRules, setAddonRules] = useState([]);

  // Options for Selects
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Load Dropdown Options & Initial Edit Data
  useEffect(() => {
    const loadOptionsAndCampaign = async () => {
      setFetchingData(true);
      try {
        const [prodRes, catRes, brandRes] = await Promise.all([
          productService.getAll(true),
          categoryService.getAll(),
          brandService.getAll()
        ]);

        const rawProds = prodRes.data || prodRes || [];
        const rawCats = catRes.data || catRes || [];
        const rawBrands = brandRes.data || brandRes || [];

        setProducts(Array.isArray(rawProds) ? rawProds : []);
        setCategories(Array.isArray(rawCats) ? rawCats : []);
        setBrands(Array.isArray(rawBrands) ? rawBrands : []);

        // If Edit Mode, fetch campaign details
        if (comboId) {
          const campRes = await api.get(`/PromotionCampaign/${comboId}`);
          const camp = campRes.data || campRes;

          const startIso = camp.startDate ? new Date(camp.startDate).toISOString().slice(0, 16) : '';
          const endIso = camp.endDate ? new Date(camp.endDate).toISOString().slice(0, 16) : '';

          setFormData({
            name: camp.name || '',
            description: camp.description || '',
            startDate: startIso,
            endDate: endIso,
            discountType: camp.discountType || 'Percentage',
            discountValue: camp.discountValue || 0,
            maxQuantityAllowed: camp.maxQuantityAllowed || 5,
            maxDiscountAmount: camp.maxDiscountAmount ?? '',
            isActive: camp.isActive !== undefined ? camp.isActive : true
          });

          setMainRules(
            camp.mainProductRules?.map(r => ({
              productId: r.productId ? String(r.productId) : '',
              categoryId: r.categoryId ? String(r.categoryId) : '',
              brandId: r.brandId ? String(r.brandId) : ''
            })) || []
          );

          setAddonRules(
            camp.addonProductRules?.map(r => ({
              productId: r.productId ? String(r.productId) : '',
              categoryId: r.categoryId ? String(r.categoryId) : '',
              brandId: r.brandId ? String(r.brandId) : ''
            })) || []
          );
        } else {
          // Default dates: Now & +30 Days
          const now = new Date();
          const nextMonth = new Date();
          nextMonth.setDate(now.getDate() + 30);

          setFormData({
            name: '',
            description: '',
            startDate: now.toISOString().slice(0, 16),
            endDate: nextMonth.toISOString().slice(0, 16),
            discountType: 'Percentage',
            discountValue: 10,
            maxQuantityAllowed: 5,
            maxDiscountAmount: '',
            isActive: true
          });

          // Default 1 empty rule for Addon
          setAddonRules([{ productId: '', categoryId: '', brandId: '' }]);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu Form Chiến dịch:', err);
        alert('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setFetchingData(false);
      }
    };

    loadOptionsAndCampaign();
  }, [comboId]);

  // Dynamic Cascading Filtering Helpers
  const getFilteredCategories = (brandId) => {
    if (!brandId) return categories;
    const catIdsWithBrand = new Set(
      products
        .filter(p => String(p.brandId) === String(brandId))
        .map(p => p.categoryId)
    );
    return categories.filter(c => catIdsWithBrand.has(c.id));
  };

  const getFilteredBrands = (categoryId) => {
    if (!categoryId) return brands;
    const brandIdsWithCat = new Set(
      products
        .filter(p => String(p.categoryId) === String(categoryId))
        .map(p => p.brandId)
    );
    return brands.filter(b => brandIdsWithCat.has(b.id));
  };

  // Main Rules Handlers
  const addMainRule = () => {
    setMainRules([...mainRules, { productId: '', categoryId: '', brandId: '' }]);
  };

  const removeMainRule = (index) => {
    setMainRules(mainRules.filter((_, idx) => idx !== index));
  };

  const updateMainRule = (index, field, value) => {
    const updated = [...mainRules];
    updated[index][field] = value;

    if (field === 'productId') {
      if (value) {
        const selectedProd = products.find(p => String(p.id) === String(value));
        if (selectedProd) {
          updated[index].categoryId = selectedProd.categoryId ? String(selectedProd.categoryId) : '';
          updated[index].brandId = selectedProd.brandId ? String(selectedProd.brandId) : '';
        }
      } else {
        updated[index].categoryId = '';
        updated[index].brandId = '';
      }
    }

    if (field === 'categoryId' && value && updated[index].brandId) {
      const validBrandIds = getFilteredBrands(value).map(b => String(b.id));
      if (!validBrandIds.includes(String(updated[index].brandId))) {
        updated[index].brandId = '';
      }
    }

    if (field === 'brandId' && value && updated[index].categoryId) {
      const validCatIds = getFilteredCategories(value).map(c => String(c.id));
      if (!validCatIds.includes(String(updated[index].categoryId))) {
        updated[index].categoryId = '';
      }
    }

    setMainRules(updated);
  };

  // Addon Rules Handlers
  const addAddonRule = () => {
    setAddonRules([...addonRules, { productId: '', categoryId: '', brandId: '' }]);
  };

  const removeAddonRule = (index) => {
    setAddonRules(addonRules.filter((_, idx) => idx !== index));
  };

  const updateAddonRule = (index, field, value) => {
    const updated = [...addonRules];
    updated[index][field] = value;

    if (field === 'productId') {
      if (value) {
        const selectedProd = products.find(p => String(p.id) === String(value));
        if (selectedProd) {
          updated[index].categoryId = selectedProd.categoryId ? String(selectedProd.categoryId) : '';
          updated[index].brandId = selectedProd.brandId ? String(selectedProd.brandId) : '';
        }
      } else {
        updated[index].categoryId = '';
        updated[index].brandId = '';
      }
    }

    if (field === 'categoryId' && value && updated[index].brandId) {
      const validBrandIds = getFilteredBrands(value).map(b => String(b.id));
      if (!validBrandIds.includes(String(updated[index].brandId))) {
        updated[index].brandId = '';
      }
    }

    if (field === 'brandId' && value && updated[index].categoryId) {
      const validCatIds = getFilteredCategories(value).map(c => String(c.id));
      if (!validCatIds.includes(String(updated[index].categoryId))) {
        updated[index].categoryId = '';
      }
    }

    setAddonRules(updated);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên chương trình.');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      alert('Vui lòng nhập thời gian bắt đầu và kết thúc.');
      return;
    }

    // Filter valid rules (at least 1 non-null field)
    const cleanMainRules = mainRules
      .filter(r => r.productId || r.categoryId || r.brandId)
      .map(r => ({
        productId: r.productId ? Number(r.productId) : null,
        categoryId: r.categoryId ? Number(r.categoryId) : null,
        brandId: r.brandId ? Number(r.brandId) : null
      }));

    const cleanAddonRules = addonRules
      .filter(r => r.productId || r.categoryId || r.brandId)
      .map(r => ({
        productId: r.productId ? Number(r.productId) : null,
        categoryId: r.categoryId ? Number(r.categoryId) : null,
        brandId: r.brandId ? Number(r.brandId) : null
      }));

    if (cleanAddonRules.length === 0) {
      alert('Vui lòng thêm ít nhất 1 sản phẩm hoặc nhóm phụ kiện được ưu đãi.');
      return;
    }

    // Kiểm tra chống trùng lặp dòng quy tắc Sản phẩm chính
    const seenMainKeys = new Set();
    for (let i = 0; i < cleanMainRules.length; i++) {
      const key = `${cleanMainRules[i].productId || ''}_${cleanMainRules[i].categoryId || ''}_${cleanMainRules[i].brandId || ''}`;
      if (seenMainKeys.has(key)) {
        alert(`Cảnh báo trùng lặp: Nhóm điều kiện sản phẩm chính #${i + 1} bị trùng lặp hoàn toàn với một nhóm điều kiện khác. Vui lòng kiểm tra lại.`);
        return;
      }
      seenMainKeys.add(key);
    }

    // Kiểm tra chống trùng lặp dòng quy tắc Phụ kiện mua kèm
    const seenAddonKeys = new Set();
    for (let i = 0; i < cleanAddonRules.length; i++) {
      const key = `${cleanAddonRules[i].productId || ''}_${cleanAddonRules[i].categoryId || ''}_${cleanAddonRules[i].brandId || ''}`;
      if (seenAddonKeys.has(key)) {
        alert(`Cảnh báo trùng lặp: Nhóm phụ kiện ưu đãi #${i + 1} bị trùng lặp hoàn toàn với một nhóm phụ kiện khác. Vui lòng kiểm tra lại.`);
        return;
      }
      seenAddonKeys.add(key);
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      maxQuantityAllowed: Number(formData.maxQuantityAllowed),
      maxDiscountAmount: formData.maxDiscountAmount !== '' ? Number(formData.maxDiscountAmount) : null,
      isActive: formData.isActive,
      mainProductRules: cleanMainRules,
      addonProductRules: cleanAddonRules
    };

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/PromotionCampaign/${comboId}`, payload);
        alert('Cập nhật chương trình mua kèm thành công!');
      } else {
        await api.post('/PromotionCampaign', payload);
        alert('Tạo chương trình mua kèm thành công!');
      }
      onBack();
    } catch (err) {
      console.error('Lỗi lưu chiến dịch:', err);
      alert('Lưu thất bại: ' + (err.response?.data || err.message || 'Lỗi hệ thống'));
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="bg-white rounded-3xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-gray-500 text-sm">Đang tải dữ liệu cài đặt...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition-colors shrink-0 cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <span>{isEdit ? 'Chỉnh sửa Chương trình Mua kèm' : 'Tạo Chương trình Mua kèm Mới'}</span>
            </h1>
            <p className="text-xs text-gray-500 font-semibold mt-1">
              {isEdit ? `Mã chương trình #${comboId}` : 'Cấu hình ưu đãi giảm giá khi khách mua kèm sản phẩm phụ kiện với sản phẩm chính'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save size={18} strokeWidth={2.5} />
            <span>{loading ? 'Đang lưu...' : (isEdit ? 'Lưu Thay Đổi' : 'Lưu Chương Trình')}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Thông tin cơ bản */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
            <Sparkles size={20} className="text-red-500" />
            <span>1. Thông tin chung về Chương trình</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Tên Chương trình Mua kèm *
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all font-bold text-gray-900"
                placeholder="VD: Mua Điện thoại Samsung - Mua kèm Phụ kiện giảm đến 30%"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Mô tả chi tiết ưu đãi
              </label>
              <textarea
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all font-semibold text-gray-800 text-sm"
                placeholder="Nhập ghi chú hoặc mô tả ngắn hiển thị cho khách hàng xem..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Thời gian Bắt đầu *
              </label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all font-bold text-gray-800 text-sm"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Thời gian Kết thúc *
              </label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all font-bold text-gray-800 text-sm"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Hình thức Giảm giá Phụ kiện *
              </label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all font-bold text-gray-900 text-sm"
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
              >
                <option value="Percentage">Giảm theo phần trăm (%)</option>
                <option value="FixedAmount">Giảm số tiền cố định (₫)</option>
                <option value="FixedPrice">Bán giá ưu đãi cố định (₫)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Giá trị giảm ưu đãi *
              </label>
              <input
                type="number"
                required
                min={0}
                max={formData.discountType === 'Percentage' ? 100 : 999999999}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all font-black text-red-600 text-base"
                placeholder={formData.discountType === 'Percentage' ? 'Nhập % (1 - 100)' : 'Nhập số tiền (₫)'}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Giới hạn mua kèm (Số phụ kiện tối đa / 1 SP chính)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all font-bold text-gray-800 text-sm"
                placeholder="Mặc định: 5 (Khách mua 1 SP chính được mua tối đa 5 phụ kiện)"
                value={formData.maxQuantityAllowed}
                onChange={(e) => setFormData({ ...formData, maxQuantityAllowed: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Mức giảm tối đa cho 1 phụ kiện (Trần giảm giá khi dùng %)
              </label>
              <input
                type="number"
                min={0}
                disabled={formData.discountType !== 'Percentage'}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all font-bold text-gray-800 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                placeholder={formData.discountType === 'Percentage' ? 'Để trống = Không giới hạn trần giảm' : 'Chỉ áp dụng khi giảm theo %'}
                value={formData.maxDiscountAmount}
                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <label className="inline-flex items-center gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer select-none hover:bg-gray-100/70 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span className="font-bold text-sm text-gray-800">Cho phép chương trình hoạt động ngay trên website</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Điều kiện Sản phẩm chính */}
        <CampaignRuleGroup
          sectionTitle="2. Điều kiện Sản phẩm chính (Áp dụng khi khách mua sản phẩm nào?)"
          sectionSubtitle="Chỉ những khách hàng chọn xem hoặc mua sản phẩm chính thỏa mãn điều kiện bên dưới mới nhìn thấy ưu đãi mua kèm."
          icon={Package}
          colorTheme="blue"
          rules={mainRules}
          onAddRule={addMainRule}
          onRemoveRule={removeMainRule}
          onUpdateRule={updateMainRule}
          products={products}
          getFilteredCategories={getFilteredCategories}
          getFilteredBrands={getFilteredBrands}
          emptyMessage="Chưa giới hạn sản phẩm chính nào."
          emptySubMessage="Ưu đãi mua kèm hiện đang được áp dụng khi khách mua BẤT KỲ SẢN PHẨM NÀO."
          addButtonLabel="Thêm nhóm điều kiện"
          emptyAddButtonLabel="Giới hạn sản phẩm chính (Chỉ chọn một số SP/Danh mục nhất định)"
          productLabel="Sản phẩm cụ thể"
          productPlaceholder="-- Bất kỳ sản phẩm nào --"
          categoryLabel="Thuộc Danh mục"
          categoryPlaceholder="-- Bất kỳ danh mục nào --"
          brandLabel="Thuộc Thương hiệu"
          brandPlaceholder="-- Bất kỳ thương hiệu nào --"
          infoTitle="💡 Hướng dẫn chọn sản phẩm chính:"
          infoContent={
            <>
              <p>• <strong>Để chọn chính xác 1 nhóm sản phẩm:</strong> Chọn các ô trong cùng 1 dòng <em>(Ví dụ: Chọn "Điện thoại" + "Samsung" - Chỉ áp dụng khi khách mua Điện thoại Samsung)</em>.</p>
              <p>• <strong>Nếu muốn áp dụng cho nhiều nhóm sản phẩm khác nhau:</strong> Bấm nút <strong>"+ Thêm nhóm điều kiện"</strong> <em>(Ví dụ: Nhóm 1 là Điện thoại Samsung, Nhóm 2 là Laptop Dell - Khách mua 1 trong 2 loại đều được nhận ưu đãi mua kèm)</em>.</p>
              <p>• <strong>Lưu ý quan trọng:</strong> Nếu không chọn gì ở tất cả các ô bên dưới, ưu đãi sẽ tự động áp dụng cho <strong>TẤT CẢ sản phẩm</strong> trong cửa hàng.</p>
            </>
          }
        />

        {/* Section 3: Danh sách Phụ kiện ưu đãi */}
        <CampaignRuleGroup
          sectionTitle="3. Danh sách Phụ kiện ưu đãi (Khách được mua kèm món gì?) *"
          sectionSubtitle="Cấu hình các món sản phẩm/phụ kiện được phép mua với giá ưu đãi đặc biệt khi đã chọn sản phẩm chính."
          icon={Layers}
          colorTheme="amber"
          rules={addonRules}
          onAddRule={addAddonRule}
          onRemoveRule={removeAddonRule}
          onUpdateRule={updateAddonRule}
          products={products}
          getFilteredCategories={getFilteredCategories}
          getFilteredBrands={getFilteredBrands}
          emptyMessage="Chưa chọn món phụ kiện mua kèm nào!"
          emptySubMessage="Vui lòng bấm nút thêm ít nhất 1 món phụ kiện bên dưới."
          addButtonLabel="Thêm nhóm phụ kiện"
          emptyAddButtonLabel="Thêm món phụ kiện ưu đãi"
          productLabel="Sản phẩm chỉ định cụ thể"
          productPlaceholder="-- Không chọn riêng --"
          categoryLabel="Áp dụng cho cả Danh mục phụ kiện"
          categoryPlaceholder="-- Bất kỳ danh mục nào --"
          brandLabel="Áp dụng cho cả Thương hiệu phụ kiện"
          brandPlaceholder="-- Bất kỳ thương hiệu nào --"
          infoTitle="💡 Hướng dẫn chọn sản phẩm phụ kiện mua kèm:"
          infoContent={
            <>
              <p>• <strong>Chọn 1 Sản phẩm cụ thể:</strong> Nếu muốn chỉ định chính xác món phụ kiện đó <em>(Ví dụ: Tai nghe Samsung Galaxy Buds)</em>.</p>
              <p>• <strong>Chọn theo Danh mục hoặc Thương hiệu:</strong> Áp dụng giá ưu đãi mua kèm cho toàn bộ sản phẩm thuộc danh mục/hãng đó <em>(Ví dụ: Chọn danh mục "Smartwatch" - Tất cả đồng hồ thông minh đều được giảm giá mua kèm)</em>.</p>
            </>
          }
        />

        {/* Bottom Actions */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save size={18} strokeWidth={2.5} />
            <span>{loading ? 'Đang lưu...' : (isEdit ? 'Lưu Thay Đổi' : 'Lưu Chương Trình')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
