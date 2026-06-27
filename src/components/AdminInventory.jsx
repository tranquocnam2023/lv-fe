import React, { useState, useEffect } from 'react';
import { Search, Plus, RotateCcw, ArrowDownLeft, ArrowUpRight, ShoppingCart, Activity, FileText, ChevronDown, CheckCircle, Package, Clock, X, AlertCircle } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { productService } from '../services/productService';
import { brandService } from '../services/brandService';
import { useFormat } from '../hooks/useFormat';
import { usePagination } from '../hooks/usePagination';
import PriceInput from './PriceInput';

const TRANSACTIONS = [
  { id: 'IMPORT_SUPPLIER', name: 'Nhập từ nhà cung cấp', type: 'IN', bgColor: '#E0E7FF', textColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' },
  { id: 'IMPORT_RETURN', name: 'Nhập hàng khách trả', type: 'IN', bgColor: '#D1FAE5', textColor: 'var(--color-success)', borderColor: 'var(--color-success)' },
  { id: 'EXPORT_SELL', name: 'Xuất bán hàng', type: 'OUT', bgColor: '#F3F4F6', textColor: 'var(--color-admin-text-main)', borderColor: 'var(--color-admin-border)' },
  { id: 'EXPORT_DEFECT', name: 'Xuất trả hàng lỗi cho NCC', type: 'OUT', bgColor: '#FEE2E2', textColor: 'var(--color-admin-danger)', borderColor: 'var(--color-admin-danger)' }
];

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [txHistory, setTxHistory] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states for transaction
  const [activeTxTab, setActiveTxTab] = useState(null);
  const [isTxDropdownOpen, setIsTxDropdownOpen] = useState(false);
  const [txProductId, setTxProductId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [txQuantity, setTxQuantity] = useState(1);
  const [txPrice, setTxPrice] = useState('');
  const [txNote, setTxNote] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const { formatCurrency } = useFormat();

  // Load products & history
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, historyData, brandsData] = await Promise.all([
        productService.getAll(true),
        inventoryService.getAll(),
        brandService.getAll()
      ]);
      if (Array.isArray(productsData)) {
        setProducts(productsData);
      }
      if (Array.isArray(historyData)) {
        setTxHistory(historyData);
      }
      if (brandsData) {
        setBrands(brandsData.items || (Array.isArray(brandsData) ? brandsData : []));
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu kho:", err);
      setError("Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter history list
  const filteredHistory = txHistory.filter(t => {
    let match = true;
    if (typeFilter !== 'ALL' && t.transactionType !== typeFilter) match = false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchProduct = t.productName?.toLowerCase().includes(query);
      const matchNote = t.note?.toLowerCase().includes(query);
      const matchUser = t.createdByUsername?.toLowerCase().includes(query);
      const matchId = String(t.id).includes(query);
      const matchOrder = t.orderId && String(t.orderId).includes(query);
      if (!matchProduct && !matchNote && !matchUser && !matchId && !matchOrder) {
        match = false;
      }
    }
    return match;
  });

  // Pagination for history list
  const {
    currentData: paginatedHistory,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    startIndex,
    endIndex,
    totalItems
  } = usePagination(filteredHistory, 10);

  // Execute Tx
  const handleExecuteTransaction = async () => {
    if (!txProductId) {
      alert('Vui lòng chọn sản phẩm!');
      return;
    }
    const product = products.find(p => p.id === parseInt(txProductId));
    if (!product) {
      alert('Sản phẩm không hợp lệ!');
      return;
    }

    const txConf = TRANSACTIONS.find(t => t.id === activeTxTab);
    const quantity = parseInt(txQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Số lượng phải lớn hơn 0!');
      return;
    }

    if (txPrice && (txPrice < 1000 || txPrice > 500000000)) {
      alert('Giá trị giao dịch phải từ 1.000 đến 500.000.000 VNĐ!');
      return;
    }

    try {
      await inventoryService.create({
        productId: product.id,
        quantityChanged: quantity,
        transactionType: activeTxTab,
        price: parseFloat(txPrice) || 0,
        note: txNote || ''
      });

      alert(`${txConf.name} thành công!`);
      setActiveTxTab(null);
      // Reset form
      setTxProductId('');
      setTxQuantity(1);
      setTxPrice('');
      setTxNote('');
      fetchData();
    } catch (err) {
      console.error("Lỗi thực hiện giao dịch kho:", err);
      alert('Giao dịch thất bại: ' + (err.response?.data || err.message || JSON.stringify(err)));
    }
  };

  // Revert Tx
  const handleRevertTransaction = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hoàn tác/hủy giao dịch này không? Số lượng tồn kho sản phẩm sẽ được điều chỉnh ngược lại.")) return;
    try {
      await inventoryService.revert(id);
      alert("Hoàn tác giao dịch thành công!");
      fetchData();
    } catch (err) {
      console.error("Lỗi hoàn tác giao dịch:", err);
      alert("Lỗi hoàn tác: " + (err.response?.data?.message || err.response?.data || err.message));
    }
  };

  // Stats
  const totalStockQty = products.reduce((acc, p) => acc + ((p.totalStock ?? p.stock ?? p.stockQuantity ?? 0)), 0);
  const totalStockValue = products.reduce((acc, p) => acc + ((p.basePrice || p.price || 0) * (p.totalStock ?? p.stock ?? p.stockQuantity ?? 0)), 0);
  const totalTxCount = txHistory.filter(t => !t.isReverted).length;
  const lowStockCount = products.filter(p => (p.totalStock ?? p.stock ?? p.stockQuantity ?? 0) < 5).length;

  const STATS_CONFIG = [
    { label: 'Tổng sản lượng tồn kho', value: totalStockQty, icon: Package, iconColor: 'var(--color-primary)' },
    { label: 'Tổng giá trị tồn kho', value: totalStockValue, icon: Activity, isCurrency: true, iconColor: 'var(--color-success)' },
    { label: 'Giao dịch thành công', value: totalTxCount, icon: FileText, iconColor: 'var(--color-warning)' },
    { label: 'Sản phẩm sắp hết hàng', value: lowStockCount, icon: AlertCircle, iconColor: 'var(--color-admin-danger)' }
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-admin-text-main">Quản lý kho hàng</h2>
          <p className="text-sm text-admin-text-muted font-medium mt-1">Điều chỉnh số lượng, nhập hàng nhà cung cấp và theo dõi lịch sử luân chuyển kho</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-admin-text-muted">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Tìm theo sản phẩm, ghi chú..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); goToPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white font-semibold text-admin-text-main placeholder-admin-text-muted text-sm"
            />
          </div>
          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsTxDropdownOpen(!isTxDropdownOpen)}
              className="flex items-center gap-2 px-5 py-2.5 bg-admin-primary-hover text-white rounded-md font-bold hover:bg-admin-primary-hover/80 transition-all active:scale-95 text-sm whitespace-nowrap"
            >
              <span>Thao tác kho</span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${isTxDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isTxDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsTxDropdownOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-64 rounded-md shadow-xl bg-white border border-admin-border focus:outline-none z-20 animate-in fade-in duration-200">
                  <div className="py-1">
                    {TRANSACTIONS.map((tx) => (
                      <button
                        key={tx.id}
                        onClick={() => {
                          setActiveTxTab(tx.id);
                          setIsTxDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-admin-text-main hover:bg-admin-bg font-semibold transition-colors flex items-center gap-2"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tx.textColor }}></span>
                        {tx.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_CONFIG.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="p-5 rounded-md flex items-center justify-between h-28 bg-white border border-admin-border/50">
              <div className="flex flex-col">
                <p className="text-[12px] font-bold text-admin-text-muted mb-1 uppercase tracking-wider">{item.label}</p>
                <h3 className="text-2xl font-bold text-admin-text-main leading-none">
                  {item.isCurrency ? formatCurrency(item.value) : item.value.toLocaleString('vi-VN')}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-full bg-admin-bg flex items-center justify-center flex-shrink-0">
                <Icon size={24} style={{ color: item.iconColor }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-md p-6 border border-admin-border/50 flex flex-col min-h-[400px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-admin-text-main">Lịch sử xuất/nhập kho</h3>

          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
            <button
              onClick={() => { setTypeFilter('ALL'); goToPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${typeFilter === 'ALL' ? 'bg-primary text-white border-primary' : 'bg-admin-bg text-admin-text-muted border-admin-border hover:text-primary'}`}
            >
              Tất cả
            </button>
            {TRANSACTIONS.map(tx => (
              <button
                key={tx.id}
                onClick={() => { setTypeFilter(tx.id); goToPage(1); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${typeFilter === tx.id ? 'bg-primary text-white border-primary' : 'bg-admin-bg text-admin-text-muted border-admin-border hover:text-primary'}`}
              >
                {tx.name.replace('Nhập ', 'Nhập ').replace('Xuất ', 'Xuất ')}
              </button>
            ))}
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border text-admin-text-muted text-[11px] font-bold uppercase tracking-wider">
                <th className="pb-3 px-4">Mã Giao dịch</th>
                <th className="pb-3 px-4">Thời gian</th>
                <th className="pb-3 px-4">Sản phẩm & Biến thể</th>
                <th className="pb-3 px-4">Loại GD</th>
                <th className="pb-3 px-4 text-center">Số lượng</th>
                <th className="pb-3 px-4 text-right">Đơn giá trị</th>
                <th className="pb-3 px-4">Người thực hiện</th>
                <th className="pb-3 px-4">Ghi chú</th>
                <th className="pb-3 px-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-gray-500 font-bold">
                    Đang tải lịch sử giao dịch kho...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-red-500 font-bold">
                    {error}
                  </td>
                </tr>
              ) : paginatedHistory.length > 0 ? (
                paginatedHistory.map((t) => {
                  // Tạo mã giao dịch PS,ORD,REO,ER
                  let prefix = '#TX';
                  if (t.transactionType === 'EXPORT_SELL') {
                    prefix = '#PS';
                  } else if (t.transactionType === 'IMPORT_SUPPLIER') {
                    prefix = '#ORD';
                  } else if (t.transactionType === 'IMPORT_RETURN') {
                    prefix = '#REO';
                  } else if (t.transactionType === 'EXPORT_DEFECT' || t.transactionType === 'EXPORT_DAMAGE') {
                    prefix = '#ER';
                  }
                  const code = t.orderId ? `${prefix}${t.orderId}` : `${prefix}${t.id}`;
                  const formattedDate = new Date(t.createdAt).toLocaleString('vi-VN');
                  const qty = Math.abs(t.quantityChanged);
                  const totalVal = t.price * qty;

                  return (
                    <tr key={t.id} className={`border-b border-admin-border hover:bg-admin-bg transition-colors ${t.isReverted ? 'opacity-50 line-through' : ''}`}>
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">{code}</td>
                      <td className="py-3.5 px-4 text-xs text-admin-text-muted">{formattedDate}</td>
                      <td className="py-3.5 px-4 font-bold text-admin-text-main">
                        {t.productName} <span className="text-xs font-normal text-gray-500">({t.variantName})</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.transactionType === 'IMPORT_SUPPLIER' ? 'bg-blue-50 text-blue-600' :
                          t.transactionType === 'IMPORT_RETURN' ? 'bg-green-50 text-green-600' :
                            t.transactionType === 'EXPORT_SELL' ? 'bg-purple-50 text-purple-600' :
                              'bg-red-50 text-red-600'
                          }`}>
                          {t.transactionType === 'IMPORT_SUPPLIER' ? 'Nhập NCC' :
                            t.transactionType === 'IMPORT_RETURN' ? 'Khách trả' :
                              t.transactionType === 'EXPORT_SELL' ? 'Xuất bán' : 'Xuất lỗi'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-admin-text-main">{qty}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-admin-text-main">{formatCurrency(totalVal)}</td>
                      <td className="py-3.5 px-4 text-xs text-admin-text-main font-bold">{t.createdByUsername || 'Hệ thống'}</td>
                      <td className="py-3.5 px-4 text-xs text-admin-text-muted font-semibold">{t.note}</td>
                      <td className="py-3.5 px-4 text-center">
                        {t.orderId ? (
                          <span className="text-xs text-gray-400 italic font-semibold">Theo đơn hàng</span>
                        ) : !t.isReverted ? (
                          <button
                            onClick={() => handleRevertTransaction(t.id)}
                            className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-md font-extrabold transition-all border border-red-100 active:scale-95"
                          >
                            Hoàn tác
                          </button>
                        ) : (
                          <span className="text-xs text-red-400 italic font-semibold">Đã hủy</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-gray-400 italic font-semibold">
                    Không tìm thấy lịch sử giao dịch kho nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-admin-border pt-4">
            <div className="text-sm font-bold text-admin-text-muted">
              Hiển thị {startIndex}-{endIndex} trên {totalItems} giao dịch
            </div>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-sm font-bold hover:bg-admin-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                TRƯỚC
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i + 1)}
                  className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-white shadow-md' : 'bg-transparent text-admin-text-muted hover:bg-admin-bg'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-sm font-bold hover:bg-admin-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SAU
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal Popup Form */}
      {activeTxTab && (() => {
        const txConf = TRANSACTIONS.find(t => t.id === activeTxTab);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-admin-border animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6 border-b border-admin-border pb-4">
                <h3 className="text-xl font-bold text-admin-text-main flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full mr-3 animate-pulse" style={{ backgroundColor: txConf.textColor }}></span>
                  {txConf.name}
                </h3>
                <button
                  onClick={() => {
                    setActiveTxTab(null);
                    setTxProductId('');
                    setTxQuantity(1);
                    setTxPrice('');
                    setTxNote('');
                    setSelectedBrandId('');
                  }}
                  className="p-1 hover:bg-admin-bg text-admin-text-muted hover:text-admin-text-main rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Chọn thương hiệu</label>
                  <select
                    value={selectedBrandId}
                    onChange={(e) => {
                      setSelectedBrandId(e.target.value);
                      setTxProductId('');
                      setTxPrice('');
                    }}
                    className="w-full border border-admin-border text-admin-text-main rounded-md px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                  >
                    <option value="">-- Tất cả thương hiệu --</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Chọn sản phẩm</label>
                  <select
                    value={txProductId}
                    onChange={(e) => {
                      const prodId = e.target.value;
                      setTxProductId(prodId);
                      const selectedProd = products.find(p => p.id === parseInt(prodId));
                      if (selectedProd) {
                        setTxPrice((selectedProd.basePrice || selectedProd.price || 0).toString());
                        setTxNote(activeTxTab === 'IMPORT_SUPPLIER' ? 'Nhập hàng từ nhà cung cấp' :
                          activeTxTab === 'IMPORT_RETURN' ? 'Khách trả hàng' :
                            activeTxTab === 'EXPORT_SELL' ? 'Xuất bán lẻ trực tiếp tại quầy' :
                              activeTxTab === 'EXPORT_DEFECT' ? 'Trả hàng lỗi cho nhà cung cấp' : '');
                      } else {
                        setTxPrice('');
                        setTxNote('');
                      }
                    }}
                    className="w-full border border-admin-border text-admin-text-main rounded-md px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products
                      .filter(p => !selectedBrandId || p.brandId === parseInt(selectedBrandId))
                      .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={txQuantity}
                    onChange={(e) => setTxQuantity(e.target.value)}
                    className="w-full border border-admin-border text-admin-text-main rounded-md px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">
                    {txConf.type === 'IN' ? 'Giá nhập (VNĐ)' : 'Giá xuất/Bán (VNĐ)'}
                  </label>
                  <PriceInput
                    placeholder="VD: 25.000.000"
                    value={txPrice}
                    onChange={(val) => setTxPrice(val)}
                    className="w-full border border-admin-border text-admin-text-main rounded-md px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Ghi chú</label>
                  <input
                    type="text"
                    placeholder="Lý do, mã phiếu..."
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    className="w-full border border-admin-border text-admin-text-main rounded-md px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-admin-border pt-4">
                <button
                  onClick={() => {
                    setActiveTxTab(null);
                    setTxProductId('');
                    setTxQuantity(1);
                    setTxPrice('');
                    setTxNote('');
                    setSelectedBrandId('');
                  }}
                  className="px-5 py-2.5 rounded-md font-bold text-admin-text-muted hover:text-admin-text-main hover:bg-admin-bg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleExecuteTransaction}
                  className="px-6 py-2.5 rounded-md font-bold transition-all hover:opacity-90 bg-primary text-white"
                >
                  Xác nhận {txConf.type === 'IN' ? 'Nhập Kho' : 'Xuất Kho'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
