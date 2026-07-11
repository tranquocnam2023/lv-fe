import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, RotateCcw, ArrowDownLeft, ArrowUpRight, ShoppingCart, Activity, FileText, ChevronDown, CheckCircle, Package, Clock, X, AlertCircle, Download, Upload } from 'lucide-react';
import { inventoryService } from '../../../services/inventoryService';
import { productService } from '../../../services/productService';
import { brandService } from '../../../services/brandService';
import { useFormat } from '../../../hooks/useFormat';
import { usePagination } from '../../../hooks/usePagination';
import PriceInput from '../../../components/PriceInput';
import api from '../../../services/api';

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

  const [searchParams, setSearchParams] = useSearchParams();
  const urlProductId = searchParams.get('productId');
  const urlAction = searchParams.get('action');

  // Form states for transaction
  const [activeTxTab, setActiveTxTab] = useState(null);
  const [isTxDropdownOpen, setIsTxDropdownOpen] = useState(false);
  const [txProductId, setTxProductId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [txQuantity, setTxQuantity] = useState(1);
  const [txPrice, setTxPrice] = useState('');
  const [txNote, setTxNote] = useState('');
  const [txVariants, setTxVariants] = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const txDropdownRef = useRef(null);
  const [isTxAttrOpen, setIsTxAttrOpen] = useState(false);

  // States cho tính năng Nhập/Xuất Excel
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importingProgress, setImportingProgress] = useState(null);
  const [importError, setImportError] = useState(null);

  // Close attribute dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (txDropdownRef.current && !txDropdownRef.current.contains(event.target)) {
        setIsTxAttrOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Parse attributes for currently selected product variants
  const txAttributesConfig = useMemo(() => {
    const config = {
      "Dung lượng RAM - ROM": new Set(),
      "Màu sắc": new Set()
    };

    txVariants.forEach(v => {
      if (v.name && v.name.includes(' - ')) {
        const parts = v.name.split(' - ');
        if (parts.length > 1) {
          config["Dung lượng RAM - ROM"].add(parts[1].trim());
        }
        if (parts.length > 2) {
          config["Màu sắc"].add(parts[2].trim());
        }
      }
    });

    const result = {};
    Object.entries(config).forEach(([key, set]) => {
      if (set.size > 0) {
        result[key] = Array.from(set);
      }
    });
    return result;
  }, [txVariants]);

  // Handle redirection action from Product Edit Page
  useEffect(() => {
    if (urlProductId && urlAction) {
      setActiveTxTab(urlAction);
      setTxProductId(urlProductId);
      setTxNote(urlAction === 'IMPORT_SUPPLIER' ? 'Nhập hàng từ nhà cung cấp' :
        urlAction === 'IMPORT_RETURN' ? 'Khách trả hàng' :
          urlAction === 'EXPORT_SELL' ? 'Xuất bán lẻ trực tiếp tại quầy' :
            urlAction === 'EXPORT_DEFECT' ? 'Trả hàng lỗi cho nhà cung cấp' : '');

      setSearchParams(prev => {
        prev.delete('productId');
        prev.delete('action');
        return prev;
      }, { replace: true });
    }
  }, [urlProductId, urlAction, setSearchParams]);

  // Load product variants when product is selected in modal
  useEffect(() => {
    if (txProductId) {
      const selectedProd = products.find(p => p.id === parseInt(txProductId));
      if (!selectedProd) return;

      setVariantsLoading(true);
      api.get(`/ProductVariant?productId=${txProductId}`)
        .then(res => {
          if (Array.isArray(res) && res.length > 0) {
            setTxVariants(res.map(v => ({
              id: v.id,
              name: v.name,
              price: v.price || selectedProd.basePrice || selectedProd.price || '',
              quantity: '',
              selected: false
            })));
          } else {
            // Product has no variants, treat product itself as a single item
            setTxVariants([{
              id: null,
              name: selectedProd.name,
              price: selectedProd.basePrice || selectedProd.price || '',
              quantity: '',
              selected: true
            }]);
          }
        })
        .catch(err => {
          console.error("Lỗi tải biến thể:", err);
          setTxVariants([{
            id: null,
            name: selectedProd.name,
            price: selectedProd.basePrice || selectedProd.price || '',
            quantity: '',
            selected: true
          }]);
        })
        .finally(() => {
          setVariantsLoading(false);
        });
    } else {
      setTxVariants([]);
    }
  }, [txProductId, products]);

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

  const handleQuantityChange = (idx, value) => {
    setTxVariants(prev => {
      const target = prev[idx];
      const isSelected = target.selected;
      return prev.map((item, i) => {
        if (i === idx) {
          return { ...item, quantity: value };
        }
        if (isSelected && item.selected) {
          return { ...item, quantity: value };
        }
        return item;
      });
    });
  };

  const handlePriceChange = (idx, value) => {
    setTxVariants(prev => {
      const target = prev[idx];
      const isSelected = target.selected;
      return prev.map((item, i) => {
        if (i === idx) {
          return { ...item, price: value };
        }
        if (isSelected && item.selected) {
          return { ...item, price: value };
        }
        return item;
      });
    });
  };

  const handleSelectByTxAttribute = (attrKey, value) => {
    const keyLower = attrKey.toLowerCase();
    const valLower = value.toLowerCase().trim();

    const matchedIndices = [];
    txVariants.forEach((v, idx) => {
      if (v.name && v.name.includes(' - ')) {
        const parts = v.name.split(' - ');
        if (keyLower.includes('dung lượng') || keyLower.includes('ram')) {
          if (parts[1] && parts[1].toLowerCase().trim() === valLower) {
            matchedIndices.push(idx);
          }
        } else if (keyLower.includes('màu') || keyLower.includes('color')) {
          if (parts[2] && parts[2].toLowerCase().trim() === valLower) {
            matchedIndices.push(idx);
          }
        }
      }
    });

    if (matchedIndices.length === 0) return;

    const allSelected = matchedIndices.every(idx => txVariants[idx].selected);

    setTxVariants(prev => prev.map((v, idx) => {
      if (matchedIndices.includes(idx)) {
        return { ...v, selected: !allSelected };
      }
      return v;
    }));
  };

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

    const itemsToSubmit = txVariants.filter(v => {
      const qty = parseInt(v.quantity);
      return v.selected && !isNaN(qty) && qty > 0;
    });

    if (itemsToSubmit.length === 0) {
      alert('Vui lòng chọn và nhập số lượng lớn hơn 0 cho ít nhất một biến thể!');
      return;
    }

    // Validate prices
    for (const item of itemsToSubmit) {
      const price = parseFloat(item.price);
      if (isNaN(price) || price < 1000 || price > 500000000) {
        alert(`Giá trị của biến thể "${item.name}" phải từ 1.000 đến 500.000.000 VNĐ!`);
        return;
      }
    }

    try {
      const txConf = TRANSACTIONS.find(t => t.id === activeTxTab);

      // Execute all transactions in parallel
      await Promise.all(itemsToSubmit.map(item =>
        inventoryService.create({
          productId: product.id,
          variantId: item.id,
          quantityChanged: parseInt(item.quantity),
          transactionType: activeTxTab,
          price: parseFloat(item.price) || 0,
          note: txNote || ''
        })
      ));

      alert(`${txConf.name} thành công!`);
      setActiveTxTab(null);
      // Reset form
      setTxProductId('');
      setTxQuantity(1);
      setTxPrice('');
      setTxNote('');
      setTxVariants([]);
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

  // State hỗ trợ kéo thả tệp CSV
  const [isDragOver, setIsDragOver] = useState(false);

  // Xuất Báo cáo Tồn kho ra file Excel (CSV UTF-8 với BOM)
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const variants = await api.get('/ProductVariant');
      const headers = ["Mã sản phẩm (Product ID)", "Mã biến thể (Variant ID)", "Tên sản phẩm", "Tên biến thể", "Thương hiệu", "Tồn kho", "Đơn giá gốc (VNĐ)", "Tổng giá trị (VNĐ)"];
      const rows = [];
      
      variants.forEach(v => {
        const prod = products.find(p => p.id === v.productId);
        const prodName = prod ? prod.name : 'Sản phẩm không xác định';
        const brandObj = brands.find(b => b.id === prod?.brandId);
        const brandName = brandObj ? brandObj.name : '';
        const basePrice = v.price || prod?.basePrice || prod?.price || 0;
        const totalStock = v.totalStock ?? 0;
        const totalVal = basePrice * totalStock;
        
        rows.push([
          v.productId,
          v.id,
          `"${prodName.replace(/"/g, '""')}"`,
          `"${v.name.replace(/"/g, '""')}"`,
          `"${brandName.replace(/"/g, '""')}"`,
          totalStock,
          basePrice,
          totalVal
        ]);
      });
      
      // Thêm sản phẩm không có biến thể
      products.forEach(p => {
        const hasVariants = variants.some(v => v.productId === p.id);
        if (!hasVariants) {
          const brandObj = brands.find(b => b.id === p.brandId);
          const brandName = brandObj ? brandObj.name : '';
          const basePrice = p.basePrice || p.price || 0;
          const totalStock = p.totalStock ?? p.stock ?? p.stockQuantity ?? 0;
          const totalVal = basePrice * totalStock;
          
          rows.push([
            p.id,
            "",
            `"${p.name.replace(/"/g, '""')}"`,
            "Mặc định",
            `"${brandName.replace(/"/g, '""')}"`,
            totalStock,
            basePrice,
            totalVal
          ]);
        }
      });
      
      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `bao_cao_ton_kho_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Lỗi xuất dữ liệu: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Tạo và tải file Excel/CSV mẫu chứa dữ liệu thực tế trong DB
  const handleDownloadTemplateCSV = async () => {
    try {
      const variants = await api.get('/ProductVariant');
      const headers = [
        "Mã sản phẩm (Product ID)", 
        "Mã biến thể (Variant ID)", 
        "Tên sản phẩm", 
        "Tên biến thể", 
        "Số lượng thay đổi (Quantity - Nhập dương, Xuất âm)", 
        "Giá giao dịch (Price)", 
        "Loại giao dịch (IMPORT_SUPPLIER/IMPORT_RETURN/EXPORT_SELL/EXPORT_DEFECT)", 
        "Ghi chú (Note)"
      ];
      
      const rows = [];
      variants.forEach(v => {
        const prod = products.find(p => p.id === v.productId);
        const prodName = prod ? prod.name : '';
        rows.push([
          v.productId,
          v.id,
          `"${prodName.replace(/"/g, '""')}"`,
          `"${v.name.replace(/"/g, '""')}"`,
          "", 
          "", 
          "IMPORT_SUPPLIER", 
          "Nhập hàng từ Excel" 
        ]);
      });
      
      products.forEach(p => {
        const hasVariants = variants.some(v => v.productId === p.id);
        if (!hasVariants) {
          rows.push([
            p.id,
            "", 
            `"${p.name.replace(/"/g, '""')}"`,
            "Mặc định",
            "",
            "",
            "IMPORT_SUPPLIER",
            "Nhập hàng từ Excel"
          ]);
        }
      });
      
      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "mau_nhap_ton_kho.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Lỗi tạo tệp mẫu: ' + err.message);
    }
  };

  // Đọc và phân tích file CSV tải lên
  const handleCSVFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError(null);
    setImportPreview([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/);
        if (lines.length <= 1) {
          setImportError("Tệp tin trống hoặc không hợp lệ!");
          return;
        }

        const parseLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseLine(lines[0]);
        if (headers.length < 7) {
          setImportError("Cấu trúc cột của tệp không khớp với file mẫu!");
          return;
        }

        const previewData = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = parseLine(line);
          if (values.length < 6) continue; 

          const productId = parseInt(values[0]);
          const variantId = values[1] ? parseInt(values[1]) : null;
          const productName = values[2];
          const variantName = values[3];
          const quantity = parseInt(values[4]);
          const price = parseFloat(values[5]);
          const transactionType = values[6]?.toUpperCase();
          const note = values[7] || '';

          if (isNaN(productId) || isNaN(quantity) || quantity === 0 || isNaN(price)) {
            continue;
          }

          const validTypes = ['IMPORT_SUPPLIER', 'IMPORT_RETURN', 'EXPORT_SELL', 'EXPORT_DEFECT'];
          if (!validTypes.includes(transactionType)) {
            continue;
          }

          previewData.push({
            productId,
            variantId: isNaN(variantId) ? null : variantId,
            productName,
            variantName,
            quantityChanged: quantity,
            price,
            transactionType,
            note
          });
        }

        if (previewData.length === 0) {
          setImportError("Không tìm thấy dòng hợp lệ nào để nhập hàng (số lượng và đơn giá phải lớn hơn 0).");
        } else {
          setImportPreview(previewData);
        }
      } catch (err) {
        console.error(err);
        setImportError("Lỗi đọc file: " + err.message);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  // Xác nhận thực hiện luồng nhập hàng loạt từ dữ liệu CSV đã đọc
  const handleImportExcelConfirm = async () => {
    if (importPreview.length === 0) return;
    setImportingProgress({ current: 0, total: importPreview.length });
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < importPreview.length; i++) {
      const item = importPreview[i];
      setImportingProgress({ current: i + 1, total: importPreview.length });
      
      try {
        await inventoryService.create({
          productId: item.productId,
          variantId: item.variantId,
          quantityChanged: item.quantityChanged,
          transactionType: item.transactionType,
          price: item.price,
          note: item.note || 'Nhập từ file Excel'
        });
        successCount++;
      } catch (err) {
        console.error(`Lỗi nhập dòng ${i + 1}:`, err);
        failCount++;
      }
    }
    
    alert(`Hoàn thành nhập kho từ file Excel!\n- Thành công: ${successCount} dòng\n- Thất bại: ${failCount} dòng.`);
    setIsImportModalOpen(false);
    setImportPreview([]);
    setImportingProgress(null);
    fetchData(); 
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

          {/* Excel Controls (Commented out) */}
          {/* 
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-admin-border text-admin-text-main rounded-md hover:bg-admin-bg transition-all active:scale-95 text-sm font-bold disabled:opacity-50 cursor-pointer"
          >
            <Download size={16} />
            {isExporting ? "Đang xuất..." : "Xuất Excel"}
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all active:scale-95 text-sm font-bold cursor-pointer"
          >
            <Upload size={16} />
            Nhập Excel
          </button>
          */}

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
                <th className="pb-3 px-4 text-right">Tổng giá trị</th>
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
                    setTxVariants([]);
                    setQuickQty('');
                    setQuickPrice('');
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
                      setTxVariants([]);
                    }}
                    className="w-full border border-admin-border text-admin-text-main rounded-md px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white text-sm"
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
                        setTxNote(activeTxTab === 'IMPORT_SUPPLIER' ? 'Nhập hàng từ nhà cung cấp' :
                          activeTxTab === 'IMPORT_RETURN' ? 'Khách trả hàng' :
                            activeTxTab === 'EXPORT_SELL' ? 'Xuất bán lẻ trực tiếp tại quầy' :
                              activeTxTab === 'EXPORT_DEFECT' ? 'Trả hàng lỗi cho nhà cung cấp' : '');
                      } else {
                        setTxPrice('');
                        setTxNote('');
                        setTxVariants([]);
                      }
                    }}
                    className="w-full border border-admin-border text-admin-text-main rounded-md px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white text-sm"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products
                      .filter(p => !selectedBrandId || p.brandId === parseInt(selectedBrandId))
                      .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {txProductId && (
                  <div className="col-span-full">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-admin-text-main">
                        Danh sách biến thể ({txConf.type === 'IN' ? 'Nhập kho' : 'Xuất kho'})
                      </label>

                      {/* Dropdown Chọn theo thuộc tính */}
                      {Object.keys(txAttributesConfig).length > 0 && (
                        <div className="relative inline-block text-left" ref={txDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setIsTxAttrOpen(!isTxAttrOpen)}
                            className="flex items-center gap-1.5 px-3 py-1 border border-admin-border rounded bg-white text-admin-text-main hover:bg-admin-bg text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                          >
                            <span>Chọn theo thuộc tính</span>
                            <ChevronDown size={12} className="text-admin-text-muted" />
                          </button>

                          {isTxAttrOpen && (
                            <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50 border border-admin-border animate-in fade-in duration-150">
                              <div className="py-1 max-h-60 overflow-y-auto">
                                {Object.entries(txAttributesConfig).map(([attrKey, values]) => (
                                  <div key={attrKey} className="py-1 border-b border-gray-50 last:border-b-0">
                                    <div className="px-3 py-1 text-[10px] font-extrabold text-admin-text-muted uppercase tracking-wider bg-slate-50/50">
                                      {attrKey}
                                    </div>
                                    <div className="px-1 py-1 space-y-0.5">
                                      {values.map(val => {
                                        const keyLower = attrKey.toLowerCase();
                                        const valLower = val.toLowerCase().trim();
                                        const matches = txVariants.filter(v => {
                                          if (!v.name || !v.name.includes(' - ')) return false;
                                          const parts = v.name.split(' - ');
                                          if (keyLower.includes('dung lượng') || keyLower.includes('ram')) {
                                            return parts[1] && parts[1].toLowerCase().trim() === valLower;
                                          } else if (keyLower.includes('màu') || keyLower.includes('color')) {
                                            return parts[2] && parts[2].toLowerCase().trim() === valLower;
                                          }
                                          return false;
                                        });
                                        const isAllSelected = matches.length > 0 && matches.every(v => v.selected);

                                        return (
                                          <button
                                            key={val}
                                            type="button"
                                            onClick={() => handleSelectByTxAttribute(attrKey, val)}
                                            className={`flex w-full items-center justify-between px-3 py-1.5 text-xs rounded transition-colors text-left cursor-pointer ${isAllSelected
                                                ? 'text-primary bg-primary/10 hover:bg-primary/20 font-bold'
                                                : 'text-admin-text-main hover:bg-primary/10 hover:text-primary font-semibold'
                                              }`}
                                          >
                                            <span>{val}</span>
                                            {isAllSelected && <CheckCircle size={12} className="text-primary font-extrabold" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {variantsLoading ? (
                      <div className="text-center py-6 text-xs font-semibold text-gray-500 bg-gray-50 rounded-md border border-dashed border-admin-border">
                        Đang tải danh sách biến thể...
                      </div>
                    ) : (
                      <div className="border border-admin-border rounded-md overflow-hidden bg-white max-h-64 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-admin-border text-admin-text-muted font-bold sticky top-0 z-10">
                              <th className="py-2.5 px-3 w-10 text-center">
                                <input
                                  type="checkbox"
                                  checked={txVariants.length > 0 && txVariants.every(v => v.selected)}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setTxVariants(prev => prev.map(v => ({ ...v, selected: isChecked })));
                                  }}
                                  className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                />
                              </th>
                              <th className="py-2.5 px-3">Tên biến thể</th>
                              <th className="py-2.5 px-3 w-32">Số lượng {txConf.type === 'IN' ? 'nhập' : 'xuất'}</th>
                              <th className="py-2.5 px-3 w-40">{txConf.type === 'IN' ? 'Giá nhập (VNĐ)' : 'Giá xuất (VNĐ)'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-admin-border">
                            {txVariants.map((v, idx) => (
                              <tr key={idx} className={`hover:bg-slate-50/50 ${v.selected ? 'bg-blue-50/20' : ''}`}>
                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={!!v.selected}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      setTxVariants(prev => prev.map((item, i) => i === idx ? { ...item, selected: isChecked } : item));
                                    }}
                                    className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                  />
                                </td>
                                <td className={`py-3 px-3 font-bold ${v.selected ? 'text-admin-text-main' : 'text-gray-400'}`}>{v.name}</td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={v.quantity}
                                    onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                    className="w-full border border-admin-border rounded px-2.5 py-1.5 outline-none font-semibold text-xs text-admin-text-main bg-white focus:border-primary"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <PriceInput
                                    placeholder="VD: 25.000.000"
                                    value={v.price}
                                    onChange={(val) => handlePriceChange(idx, val)}
                                    className="w-full border border-admin-border rounded px-2.5 py-1.5 outline-none font-semibold text-xs text-admin-text-main bg-white focus:border-primary"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="col-span-full">
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Ghi chú</label>
                  <input
                    type="text"
                    placeholder="Lý do, mã phiếu..."
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    className="w-full border border-admin-border text-admin-text-main rounded-md px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white text-sm"
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
                    setTxVariants([]);
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

      {/* Modal Nhập Excel/CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative border border-admin-border animate-in zoom-in duration-200 flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-admin-border pb-4">
              <h3 className="text-xl font-bold text-admin-text-main flex items-center gap-2">
                <Upload size={20} className="text-primary" />
                Nhập tồn kho từ file Excel / CSV
              </h3>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPreview([]);
                  setImportError(null);
                }}
                disabled={importingProgress !== null}
                className="p-1 hover:bg-admin-bg text-admin-text-muted hover:text-admin-text-main rounded-full transition-all disabled:opacity-50 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              {/* Tải File Mẫu */}
              <div className="p-4 bg-slate-50 border border-admin-border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-admin-text-main">Chưa có file mẫu nhập kho?</h4>
                  <p className="text-xs text-admin-text-muted">Tải file mẫu được sinh tự động dựa trên danh sách sản phẩm hiện tại của bạn.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplateCSV}
                  className="flex items-center gap-1.5 px-4 py-2 border border-admin-border text-admin-text-main rounded-md hover:bg-admin-bg transition-all text-xs font-bold whitespace-nowrap bg-white cursor-pointer shadow-sm"
                >
                  <Download size={14} />
                  Tải file mẫu (.csv)
                </button>
              </div>

              {/* Vùng Dropzone tải tệp */}
              <div
                onDragOver={(e) => { e.preventDefault(); if (importingProgress === null) setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (importingProgress !== null) return;
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    handleCSVFileChange({ target: { files: [file] } });
                  }
                }}
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center relative transition-all duration-200 min-h-[140px] cursor-pointer ${
                  isDragOver ? 'border-primary bg-primary/5' : 'border-admin-border bg-slate-50/50 hover:border-primary/50'
                } ${importingProgress !== null ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={importingProgress !== null}
                />
                <Upload size={32} className={`mb-2 ${isDragOver ? 'text-primary animate-bounce' : 'text-admin-text-muted'}`} />
                <span className="text-sm font-bold text-admin-text-main">
                  {isDragOver ? 'Thả tệp vào đây!' : 'Tải file lên hoặc kéo thả tệp tại đây'}
                </span>
                <span className="text-xs mt-1 text-admin-text-muted">Chỉ hỗ trợ tệp CSV mã hóa UTF-8. Tối đa 2MB.</span>
              </div>

              {/* Lỗi Đọc Tệp */}
              {importError && (
                <div className="p-3.5 bg-red-50 border border-red-100 rounded-lg text-xs font-semibold text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview Bảng Xem Trước */}
              {importPreview.length > 0 && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-admin-text-main">Xem trước dữ liệu nhập kho ({importPreview.length} dòng hợp lệ)</h4>
                    <span className="text-[11px] text-gray-500 font-medium italic">* Vui lòng kiểm tra kỹ trước khi xác nhận</span>
                  </div>
                  <div className="border border-admin-border rounded-lg overflow-hidden bg-white max-h-48 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-admin-border text-admin-text-muted font-bold sticky top-0 z-10">
                          <th className="py-2 px-3">Sản phẩm</th>
                          <th className="py-2 px-3">Biến thể</th>
                          <th className="py-2 px-3 text-center">Số lượng</th>
                          <th className="py-2 px-3 text-right">Đơn giá</th>
                          <th className="py-2 px-3 text-center">Loại GD</th>
                          <th className="py-2 px-3">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-admin-border">
                        {importPreview.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-admin-text-main">{item.productName}</td>
                            <td className="py-2 px-3 text-gray-500">{item.variantName || 'Mặc định'}</td>
                            <td className="py-2 px-3 text-center font-bold text-admin-text-main">{item.quantityChanged}</td>
                            <td className="py-2 px-3 text-right font-semibold text-admin-text-main">{formatCurrency(item.price)}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                item.transactionType === 'IMPORT_SUPPLIER' ? 'bg-blue-50 text-blue-600' :
                                item.transactionType === 'IMPORT_RETURN' ? 'bg-green-50 text-green-600' :
                                item.transactionType === 'EXPORT_SELL' ? 'bg-purple-50 text-purple-600' :
                                'bg-red-50 text-red-600'
                              }`}>
                                {item.transactionType === 'IMPORT_SUPPLIER' ? 'Nhập NCC' :
                                 item.transactionType === 'IMPORT_RETURN' ? 'Khách trả' :
                                 item.transactionType === 'EXPORT_SELL' ? 'Xuất bán' : 'Xuất lỗi'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-gray-500 truncate max-w-[120px]">{item.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tiến trình xử lý (Loading Bar) */}
              {importingProgress && (
                <div className="space-y-2 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex justify-between items-center text-xs font-bold text-blue-800">
                    <span>Đang thực hiện nhập kho hàng loạt...</span>
                    <span>{importingProgress.current} / {importingProgress.total} dòng</span>
                  </div>
                  <div className="w-full bg-blue-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${(importingProgress.current / importingProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-admin-border pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPreview([]);
                  setImportError(null);
                }}
                disabled={importingProgress !== null}
                className="px-5 py-2.5 rounded-md font-bold text-admin-text-muted hover:text-admin-text-main hover:bg-admin-bg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleImportExcelConfirm}
                disabled={importPreview.length === 0 || importingProgress !== null}
                className="px-6 py-2.5 rounded-md font-bold transition-all hover:opacity-90 bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Xác nhận nhập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
