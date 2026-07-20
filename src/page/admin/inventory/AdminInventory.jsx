//QUẢN LÝ KHO
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, Download, FileText, SlidersHorizontal } from 'lucide-react';
import { inventoryService } from '../../../services/inventoryService';
import { productService } from '../../../services/productService';
import { brandService } from '../../../services/brandService';
import { categoryService } from '../../../services/categoryService';
import { useFormat } from '../../../hooks/useFormat';
import { usePagination } from '../../../hooks/usePagination';

import TxDetailsModal from './components/TxDetailsModal';
import InventoryStats from './components/InventoryStats';
import HistoryTable from './components/HistoryTable';
import ImportCsvModal from './components/ImportCsvModal';
import TransactionModal from './components/TransactionModal';
import StockProductDetailModal from './components/StockProductDetailModal';

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
  const [stockHistory, setStockHistory] = useState([]);
  //const [viewMode, setViewMode] = useState('TRANSACTIONS'); //MẶC ĐỊNH HIỆN BẢNG: 'TRANSACTIONS' (Lịch sử giao dịch)
  const [viewMode, setViewMode] = useState('STOCK'); // MẶC ĐỊNH HIỆN BẢNG: 'STOCK' (Tồn kho chi tiết)
  const [stockBrandFilter, setStockBrandFilter] = useState('ALL');
  const [categories, setCategories] = useState([]);
  const [stockCategoryFilter, setStockCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL'); // 'ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlProductId = searchParams.get('productId');
  const urlAction = searchParams.get('action');

  // Form states for transaction
  const [activeTxTab, setActiveTxTab] = useState(null);
  const [isTxDropdownOpen, setIsTxDropdownOpen] = useState(false);

  // Excel import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedTxGroup, setSelectedTxGroup] = useState(null);
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);

  const { formatCurrency } = useFormat();

  // Load products & history
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, historyData, brandsData, stockData, categoriesData] = await Promise.all([
        productService.getAll(true),
        inventoryService.getAll(),
        brandService.getAll(),
        inventoryService.getStock(),
        categoryService.getAll()
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
      if (Array.isArray(stockData)) {
        setStockHistory(stockData);
      }
      if (categoriesData) {
        setCategories(categoriesData.items || (Array.isArray(categoriesData) ? categoriesData : []));
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

  // Group transactions into batches
  const groupedHistory = useMemo(() => {
    if (!txHistory || txHistory.length === 0) return [];

    // Sort descending by ID
    const sorted = [...txHistory].sort((a, b) => b.id - a.id);

    const groups = [];
    let currentGroup = null;

    for (const tx of sorted) {
      if (!currentGroup) {
        currentGroup = {
          batchId: `BATCH-${tx.id}`,
          primaryTx: tx,
          items: [tx],
          transactionType: tx.transactionType,
          createdAt: tx.createdAt,
          note: tx.note,
          createdByUsername: tx.createdByUsername,
          totalQuantity: Math.abs(tx.quantityChanged),
          totalPrice: (tx.price || 0) * Math.abs(tx.quantityChanged),
          isReverted: tx.isReverted,
          orderId: tx.orderId
        };
        groups.push(currentGroup);
      } else {
        const timeDiff = Math.abs(new Date(currentGroup.createdAt) - new Date(tx.createdAt));
        const sameType = currentGroup.transactionType === tx.transactionType;
        const sameUser = currentGroup.createdByUsername === tx.createdByUsername;
        const sameNote = currentGroup.note === tx.note;

        // Group transactions within 5 seconds with same metadata
        if (timeDiff < 5000 && sameType && sameUser && sameNote) {
          currentGroup.items.push(tx);
          currentGroup.totalQuantity += Math.abs(tx.quantityChanged);
          currentGroup.totalPrice += (tx.price || 0) * Math.abs(tx.quantityChanged);
          if (!currentGroup.isReverted && tx.isReverted) {
            currentGroup.isReverted = true;
          }
        } else {
          currentGroup = {
            batchId: `BATCH-${tx.id}`,
            primaryTx: tx,
            items: [tx],
            transactionType: tx.transactionType,
            createdAt: tx.createdAt,
            note: tx.note,
            createdByUsername: tx.createdByUsername,
            totalQuantity: Math.abs(tx.quantityChanged),
            totalPrice: (tx.price || 0) * Math.abs(tx.quantityChanged),
            isReverted: tx.isReverted,
            orderId: tx.orderId
          };
          groups.push(currentGroup);
        }
      }
    }
    return groups;
  }, [txHistory]);

  // Filter history list
  const filteredHistory = groupedHistory.filter(group => {
    let match = true;
    if (typeFilter !== 'ALL' && group.transactionType !== typeFilter) match = false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchNote = group.note?.toLowerCase().includes(query);
      const matchUser = group.createdByUsername?.toLowerCase().includes(query);
      const matchId = group.batchId.toLowerCase().includes(query);
      const matchOrder = group.orderId && String(group.orderId).includes(query);

      const matchProduct = group.items.some(tx =>
        tx.productName?.toLowerCase().includes(query) ||
        tx.variantName?.toLowerCase().includes(query)
      );

      if (!matchProduct && !matchNote && !matchUser && !matchId && !matchOrder) {
        match = false;
      }
    }
    return match;
  });

  // Group stock list by Product and aggregate stock by ProductVariant
  const groupedProductStock = useMemo(() => {
    if (!stockHistory || stockHistory.length === 0) return [];

    const productMap = {};

    stockHistory.forEach(item => {
      const pId = item.productId;
      const productInfo = products.find(p => p.id === pId);
      const brandInfo = brands.find(b => b.id === (productInfo?.brandId || item.brandId));
      const categoryInfo = categories.find(c => c.id === (productInfo?.categoryId || item.categoryId));

      if (!productMap[pId]) {
        const baseName = productInfo?.name || item.productName?.split(' - ')[0] || item.productName || `Sản phẩm #${pId}`;

        productMap[pId] = {
          productId: pId,
          productName: baseName,
          productImage: productInfo?.image || productInfo?.thumbnailImage || productInfo?.mainImage,
          brandName: brandInfo?.name || '---',
          categoryName: categoryInfo?.name || '---',
          brandId: productInfo?.brandId || item.brandId,
          categoryId: productInfo?.categoryId || item.categoryId,
          totalQuantityIn: 0,
          totalQuantityRemaining: 0,
          totalStockValue: 0,
          variantMap: {}
        };
      }

      const grp = productMap[pId];
      grp.totalQuantityIn += (item.quantityIn || 0);
      grp.totalQuantityRemaining += (item.quantityRemaining || 0);
      grp.totalStockValue += ((item.quantityRemaining || 0) * (item.price || 0));

      const vKey = item.variantId || item.productVariantId || item.inventoryDetailId;
      if (!grp.variantMap[vKey]) {
        grp.variantMap[vKey] = {
          variantId: item.variantId || item.productVariantId,
          variantName: item.variantName,
          unit: item.unit || 'Cái',
          price: item.price || 0,
          quantityIn: 0,
          quantityRemaining: 0
        };
      }
      grp.variantMap[vKey].quantityIn += (item.quantityIn || 0);
      grp.variantMap[vKey].quantityRemaining += (item.quantityRemaining || 0);
    });

    return Object.values(productMap).map(p => ({
      ...p,
      variants: Object.values(p.variantMap)
    }));
  }, [stockHistory, products, brands, categories]);

  // Filter grouped stock list
  const filteredGroupedStock = useMemo(() => {
    if (!groupedProductStock || groupedProductStock.length === 0) return [];
    return groupedProductStock.filter(prod => {
      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = prod.productName?.toLowerCase().includes(query);
        const matchId = String(prod.productId).includes(query);
        const matchBrand = prod.brandName?.toLowerCase().includes(query);
        const matchCategory = prod.categoryName?.toLowerCase().includes(query);
        const matchVariant = prod.variants.some(v => v.variantName?.toLowerCase().includes(query));
        if (!matchName && !matchId && !matchBrand && !matchCategory && !matchVariant) {
          return false;
        }
      }

      // 2. Brand Filter
      if (stockBrandFilter !== 'ALL') {
        if (String(prod.brandId) !== String(stockBrandFilter)) {
          return false;
        }
      }

      // 3. Category Filter
      if (stockCategoryFilter !== 'ALL') {
        if (String(prod.categoryId) !== String(stockCategoryFilter)) {
          return false;
        }
      }

      // 4. Status Filter
      if (stockStatusFilter === 'IN_STOCK') {
        if (prod.totalQuantityRemaining <= 0) return false;
      } else if (stockStatusFilter === 'LOW_STOCK') {
        if (prod.totalQuantityRemaining <= 0 || prod.totalQuantityRemaining > 5) return false;
      } else if (stockStatusFilter === 'OUT_OF_STOCK') {
        if (prod.totalQuantityRemaining > 0) return false;
      }

      return true;
    });
  }, [groupedProductStock, searchQuery, stockBrandFilter, stockCategoryFilter, stockStatusFilter]);

  const activeDataList = viewMode === 'TRANSACTIONS' ? filteredHistory : filteredGroupedStock;

  // Pagination for active view list
  const {
    currentData: paginatedData,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    startIndex,
    endIndex,
    totalItems
  } = usePagination(activeDataList, 10);

  // Revert Tx
  const handleRevertTransaction = async (txId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hoàn tác/hủy giao dịch này không? Số lượng tồn kho sản phẩm sẽ được điều chỉnh ngược lại.")) return;
    try {
      await inventoryService.revert(txId);
      alert("Hoàn tác giao dịch thành công!");
      fetchData();
      if (selectedTxGroup) {
        setSelectedTxGroup(null); // Close modal on revert
      }
    } catch (err) {
      console.error("Lỗi hoàn tác giao dịch:", err);
      alert("Lỗi hoàn tác: " + (err.response?.data?.message || err.response?.data || err.message));
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const { excelService } = await import('../../../utils/excelService');
      await excelService.exportInventoryReport(products, brands);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsExporting(false);
    }
  };

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
              placeholder="Tìm theo sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full py-2.5 bg-white border border-admin-border rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm font-semibold text-admin-text-main placeholder-gray-400"
            />
          </div>

          {/* Actions Dropdown (Commented out as requested) */}
          {/* 
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

                    <hr className="my-1 border-admin-border" />

                    <button
                      onClick={() => {
                        setIsImportModalOpen(true);
                        setIsTxDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-admin-text-main hover:bg-admin-bg font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <FileText size={16} className="text-gray-400" />
                      Nhập tồn kho từ file Excel
                    </button>

                    <button
                      onClick={() => {
                        handleExportExcel();
                        setIsTxDropdownOpen(false);
                      }}
                      disabled={isExporting}
                      className="w-full text-left px-4 py-2.5 text-sm text-admin-text-main hover:bg-admin-bg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Download size={16} className="text-gray-400" />
                      {isExporting ? "Đang xuất..." : "Xuất dữ liệu ra file Excel"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          */}
        </div>
      </div>

      {/* Stats Cards */}
      <InventoryStats products={products} txHistory={txHistory} />

      {/* Layout Grid: Sidebar Filters on the Left, Table on the Right */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Sidebar Filters (only in STOCK mode) */}
        {viewMode === 'STOCK' && (
          <div className="w-full lg:w-64 flex-shrink-0 bg-white rounded-md border border-admin-border/50 overflow-hidden h-fit">
            <div className="px-6 py-4 border-b border-admin-border font-bold text-admin-text-main flex items-center text-md">
              <SlidersHorizontal className="w-4 h-4 mr-3 text-primary" />
              Bộ lọc tồn kho
            </div>
            <div className="flex flex-col p-4 gap-4">
              {/* Lọc theo Brand */}
              <div>
                <label className="block text-xs font-bold text-admin-text-main mb-2">Thương hiệu</label>
                <select
                  value={stockBrandFilter}
                  onChange={(e) => { setStockBrandFilter(e.target.value); goToPage(1); }}
                  className="w-full border border-admin-border text-admin-text-main rounded-md px-3 py-2 text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white cursor-pointer"
                >
                  <option value="ALL">Tất cả thương hiệu</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Lọc theo Category */}
              <div>
                <label className="block text-xs font-bold text-admin-text-main mb-2">Danh mục</label>
                <select
                  value={stockCategoryFilter}
                  onChange={(e) => { setStockCategoryFilter(e.target.value); goToPage(1); }}
                  className="w-full border border-admin-border text-admin-text-main rounded-md px-3 py-2 text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white cursor-pointer"
                >
                  <option value="ALL">Tất cả danh mục</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-white rounded-md p-6 border border-admin-border/50 flex flex-col min-h-[400px] flex-1 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-admin-text-main">
                {viewMode === 'TRANSACTIONS' ? 'Lịch sử xuất/nhập kho' : 'Tồn kho chi tiết'}
              </h3>
              <button
                onClick={() => {
                  setViewMode(viewMode === 'TRANSACTIONS' ? 'STOCK' : 'TRANSACTIONS');
                  goToPage(1);
                }}
                className="px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md font-bold transition-all active:scale-95 border border-primary/20 flex items-center gap-1 cursor-pointer"
              >
                {viewMode === 'TRANSACTIONS' ? 'Xem tồn kho' : 'Xem lịch sử GD'}
              </button>
            </div>

            {/* Quick Filters */}
            {viewMode === 'TRANSACTIONS' ? (
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
            ) : (
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto no-scrollbar">
                {/* Status Filters */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => { setStockStatusFilter('ALL'); goToPage(1); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${stockStatusFilter === 'ALL' ? 'bg-primary text-white border-primary' : 'bg-admin-bg text-admin-text-muted border-admin-border hover:text-primary'}`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => { setStockStatusFilter('IN_STOCK'); goToPage(1); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${stockStatusFilter === 'IN_STOCK' ? 'bg-primary text-white border-primary' : 'bg-admin-bg text-admin-text-muted border-admin-border hover:text-primary'}`}
                  >
                    Còn hàng
                  </button>
                  <button
                    onClick={() => { setStockStatusFilter('LOW_STOCK'); goToPage(1); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${stockStatusFilter === 'LOW_STOCK' ? 'bg-primary text-white border-primary' : 'bg-admin-bg text-admin-text-muted border-admin-border hover:text-primary'}`}
                  >
                    Tồn thấp (≤ 5)
                  </button>
                  <button
                    onClick={() => { setStockStatusFilter('OUT_OF_STOCK'); goToPage(1); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${stockStatusFilter === 'OUT_OF_STOCK' ? 'bg-primary text-white border-primary' : 'bg-admin-bg text-admin-text-muted border-admin-border hover:text-primary'}`}
                  >
                    Hết hàng
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History Table */}
          <HistoryTable
            loading={loading}
            error={error}
            paginatedHistory={paginatedData}
            formatCurrency={formatCurrency}
            handleRevertTransaction={handleRevertTransaction}
            setSelectedTxGroup={setSelectedTxGroup}
            setSelectedStockProduct={setSelectedStockProduct}
            viewMode={viewMode}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-admin-border pt-4">
              <div className="text-sm font-bold text-admin-text-muted">
                Hiển thị {startIndex}-{endIndex} trên {totalItems} {viewMode === 'TRANSACTIONS' ? 'giao dịch' : 'sản phẩm'}
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
      </div>

      {/* Transaction Modal Popup Form */}
      {activeTxTab && (
        <TransactionModal
          activeTxTab={activeTxTab}
          setActiveTxTab={setActiveTxTab}
          products={products}
          brands={brands}
          onSuccess={fetchData}
          urlProductId={urlProductId}
          urlAction={urlAction}
          setSearchParams={setSearchParams}
        />
      )}

      {/* CSV Import Modal */}
      <ImportCsvModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchData}
        products={products}
      />

      {/* Tx Details Batch Modal */}
      <TxDetailsModal
        selectedTxGroup={selectedTxGroup}
        onClose={() => setSelectedTxGroup(null)}
        onRevert={handleRevertTransaction}
      />

      {/* Stock Product Detail Modal */}
      {selectedStockProduct && (
        <StockProductDetailModal
          selectedStockProduct={selectedStockProduct}
          onClose={() => setSelectedStockProduct(null)}
          formatCurrency={formatCurrency}
          onOpenImportTx={(prodId) => {
            setSearchParams(prev => {
              const p = new URLSearchParams(prev);
              p.set('tab', 'inventory');
              p.set('productId', String(prodId));
              p.set('action', 'IMPORT_SUPPLIER');
              return p;
            });
            setActiveTxTab('IMPORT_SUPPLIER');
          }}
        />
      )}
    </div>
  );
}
