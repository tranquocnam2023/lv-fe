import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, RotateCcw, ArrowDownLeft, ArrowUpRight, ShoppingCart, Activity, FileText, ChevronDown, CheckCircle, Package, Clock, X, AlertCircle, Download, Upload } from 'lucide-react';
import { inventoryService } from '../../../services/inventoryService';
import { productService } from '../../../services/productService';
import { brandService } from '../../../services/brandService';
import { orderService } from '../../../services/orderService';
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
  const [txQueue, setTxQueue] = useState([]);
  const [searchQueryOrder, setSearchQueryOrder] = useState('');
  const [allOrdersList, setAllOrdersList] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [matchingOrders, setMatchingOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
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

  // Load orders list when activeTxTab becomes IMPORT_RETURN
  useEffect(() => {
    if (activeTxTab === 'IMPORT_RETURN') {
      setOrdersLoading(true);
      orderService.getAll()
        .then(data => {
          if (Array.isArray(data)) {
            setAllOrdersList(data);
          } else {
            console.error("Dữ liệu đơn hàng không phải mảng:", data);
            setAllOrdersList([]);
          }
        })
        .catch(err => {
          console.error("Lỗi tải danh sách đơn hàng:", err);
          alert("Không thể tải danh sách đơn hàng để tra cứu. Vui lòng thử lại!");
        })
        .finally(() => {
          setOrdersLoading(false);
        });
    } else {
      // Clean up order search states when modal closes or changes tab
      setSearchQueryOrder('');
      setAllOrdersList([]);
      setMatchingOrders([]);
      setSelectedOrder(null);
    }
  }, [activeTxTab]);

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

  // Order return search helper functions
  const handleSearchOrder = () => {
    if (!searchQueryOrder.trim()) {
      alert("Vui lòng nhập số điện thoại hoặc mã hóa đơn!");
      return;
    }
    const query = searchQueryOrder.trim().toLowerCase();
    
    // Lọc tìm đơn hàng
    const matched = allOrdersList.filter(o => 
      String(o.id) === query || 
      (o.id && `#ORD${o.id}`.toLowerCase() === query) ||
      (o.receiverPhone && o.receiverPhone.trim().toLowerCase().includes(query))
    );

    if (matched.length === 0) {
      alert("Không tìm thấy đơn hàng nào khớp với thông tin đã nhập.");
      setMatchingOrders([]);
    } else if (matched.length === 1) {
      handleSelectOrder(matched[0]);
      setMatchingOrders([]);
    } else {
      // Có nhiều hơn 1 đơn hàng khớp (ví dụ tìm theo SĐT ra nhiều lần mua)
      setMatchingOrders(matched);
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setTxProductId(''); // xóa các lựa chọn sản phẩm thủ công trước đó
    setTxVariants([]);
    setMatchingOrders([]);
    
    // Map danh sách hàng trong hóa đơn sang txVariants
    if (order.items && Array.isArray(order.items)) {
      setTxVariants(order.items.map(item => {
        const matchedProd = products.find(p => p.name === item.productName);
        return {
          id: item.variantId,
          name: `${item.productName} - ${item.variantName}`,
          productName: item.productName,
          variantName: item.variantName,
          productId: matchedProd ? matchedProd.id : 0,
          price: item.priceAtPurchase || 0,
          purchasePrice: item.priceAtPurchase || 0,
          quantity: item.quantity || 1,
          purchaseQuantity: item.quantity || 1,
          selected: false,
          condition: 'NEW'
        };
      }));
    } else {
      setTxVariants([]);
    }
  };

  const handleClearSelectedOrder = () => {
    setSelectedOrder(null);
    setSearchQueryOrder('');
    setMatchingOrders([]);
    setTxVariants([]);
    setTxProductId('');
  };

  const handleConditionChange = (idx, value) => {
    setTxVariants(prev => prev.map((item, i) => i === idx ? { ...item, condition: value } : item));
  };

  const handleAddSingleVariantToQueue = (item) => {
    const price = parseFloat(item.price);
    if (isNaN(price) || price < 1000 || price > 500000000) {
      alert(`Giá trị hoàn trả phải từ 1.000 đến 500.000.000 VNĐ!`);
      return;
    }

    if (price > item.purchasePrice) {
      alert(`Giá hoàn lại không được vượt quá giá lúc mua (${item.purchasePrice.toLocaleString('vi-VN')} VNĐ)!`);
      return;
    }

    setTxQueue(prev => {
      let updated = [...prev];
      const cond = item.condition;

      // Find if this variant WITH THE SAME CONDITION is already in the queue
      const existingIdx = updated.findIndex(q => 
        q.productId === item.productId && 
        q.variantId === item.id && 
        q.condition === cond
      );

      if (existingIdx !== -1) {
        // Merge quantity
        const existingQty = parseInt(updated[existingIdx].quantity) || 0;
        const newQty = parseInt(item.quantity) || 0;
        
        // Validate merged quantity against purchase limit
        if ((existingQty + newQty) > item.purchaseQuantity) {
          alert(`Tổng số lượng hoàn trả trong hàng chờ của "${item.name}" không được vượt quá số lượng đã mua (${item.purchaseQuantity})!`);
          return prev;
        }

        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: existingQty + newQty,
          price: price
        };
      } else {
        // Add new item
        updated.push({
          productId: item.productId,
          productName: item.productName,
          variantId: item.id,
          variantName: item.variantName,
          quantity: parseInt(item.quantity),
          price: price,
          condition: cond,
          purchasePrice: item.purchasePrice,
          purchaseQuantity: item.purchaseQuantity
        });
      }
      return updated;
    });

    alert(`Đã thêm "${item.name}" vào danh sách chờ thực hiện.`);
  };

  // Queue helper functions
  const handleAddToQueue = () => {
    const isByOrder = activeTxTab === 'IMPORT_RETURN' && selectedOrder !== null;

    let product = null;
    if (!isByOrder) {
      if (!txProductId) {
        alert('Vui lòng chọn sản phẩm!');
        return;
      }
      product = products.find(p => p.id === parseInt(txProductId));
      if (!product) {
        alert('Sản phẩm không hợp lệ!');
        return;
      }
    }

    const itemsToAdd = txVariants.filter(v => {
      const qty = parseInt(v.quantity);
      return v.selected && !isNaN(qty) && qty > 0;
    });

    if (itemsToAdd.length === 0) {
      alert('Vui lòng tích chọn biến thể và nhập số lượng lớn hơn 0!');
      return;
    }

    // Validate prices and quantities of added items
    for (const item of itemsToAdd) {
      const price = parseFloat(item.price);
      if (isNaN(price) || price < 1000 || price > 500000000) {
        alert(`Giá trị của biến thể "${item.name}" phải từ 1.000 đến 500.000.000 VNĐ!`);
        return;
      }

      if (isByOrder) {
        // Validate against purchase limit
        const qty = parseInt(item.quantity);
        if (qty > item.purchaseQuantity) {
          alert(`Số lượng hoàn trả của "${item.name}" không được vượt quá số lượng đã mua (${item.purchaseQuantity})!`);
          return;
        }
        if (price > item.purchasePrice) {
          alert(`Giá hoàn lại của "${item.name}" không được vượt quá giá lúc mua (${item.purchasePrice.toLocaleString('vi-VN')} VNĐ)!`);
          return;
        }
      }
    }

    setTxQueue(prev => {
      let updated = [...prev];
      let hasError = false;

      itemsToAdd.forEach(item => {
        if (hasError) return;

        const prodId = isByOrder ? item.productId : product.id;
        const prodName = isByOrder ? item.productName : product.name;
        const varName = isByOrder ? item.variantName : (item.id ? item.name : 'Mặc định');
        const cond = activeTxTab === 'IMPORT_RETURN' ? item.condition : null;

        // Find if this variant WITH THE SAME CONDITION is already in the queue
        const existingIdx = updated.findIndex(q => 
          q.productId === prodId && 
          q.variantId === item.id && 
          (activeTxTab !== 'IMPORT_RETURN' || q.condition === cond)
        );

        if (existingIdx !== -1) {
          // Merge quantity
          const existingQty = parseInt(updated[existingIdx].quantity) || 0;
          const newQty = parseInt(item.quantity) || 0;
          
          // Validate merged quantity against purchase limit (if applicable)
          if (isByOrder && (existingQty + newQty) > item.purchaseQuantity) {
            alert(`Tổng số lượng hoàn trả trong hàng chờ của "${item.name}" không được vượt quá số lượng đã mua (${item.purchaseQuantity})!`);
            hasError = true;
            return;
          }

          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: existingQty + newQty,
            price: parseFloat(item.price) || 0 // update to latest price
          };
        } else {
          // Add new item
          updated.push({
            productId: prodId,
            productName: prodName,
            variantId: item.id,
            variantName: varName,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price) || 0,
            condition: cond,
            purchasePrice: isByOrder ? item.purchasePrice : null,
            purchaseQuantity: isByOrder ? item.purchaseQuantity : null
          });
        }
      });

      if (hasError) return prev;
      return updated;
    });

    // Reset selection inputs
    if (!isByOrder) {
      setTxProductId('');
      setTxVariants([]);
      setSelectedBrandId('');
    } else {
      // For order selection, just uncheck and clear inputs of added items
      setTxVariants(prev => prev.map(v => {
        if (v.selected) {
          return { ...v, selected: false, quantity: '' };
        }
        return v;
      }));
    }
  };

  const handleRemoveFromQueue = (index) => {
    setTxQueue(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearQueue = () => {
    setTxQueue([]);
  };

  const handleQueueQuantityChange = (index, value) => {
    setTxQueue(prev => prev.map((item, i) => {
      if (i === index) {
        const qty = parseInt(value);
        if (item.purchaseQuantity !== null && !isNaN(qty) && qty > item.purchaseQuantity) {
          alert(`Số lượng hoàn trả không được vượt quá số lượng đã mua (${item.purchaseQuantity})!`);
          return item;
        }
        return { ...item, quantity: value };
      }
      return item;
    }));
  };

  const handleQueuePriceChange = (index, value) => {
    setTxQueue(prev => prev.map((item, i) => {
      if (i === index) {
        const price = parseFloat(value);
        if (item.purchasePrice !== null && !isNaN(price) && price > item.purchasePrice) {
          alert(`Giá hoàn lại không được vượt quá giá lúc mua (${item.purchasePrice.toLocaleString('vi-VN')} VNĐ)!`);
          return item;
        }
        return { ...item, price: value };
      }
      return item;
    }));
  };

  const handleQueueConditionChange = (index, value) => {
    setTxQueue(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, condition: value };
      }
      return item;
    }));
  };

  // Execute Tx
  const handleExecuteTransaction = async () => {
    if (txQueue.length === 0) {
      alert('Danh sách chờ thực hiện đang trống! Vui lòng chọn sản phẩm và bấm "Thêm vào danh sách chờ" trước.');
      return;
    }

    // Validate quantities and prices in queue
    for (const item of txQueue) {
      const qty = parseInt(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        alert(`Số lượng của "${item.productName} (${item.variantName})" phải lớn hơn 0!`);
        return;
      }
      const price = parseFloat(item.price);
      if (isNaN(price) || price < 1000 || price > 500000000) {
        alert(`Giá trị của "${item.productName} (${item.variantName})" phải từ 1.000 đến 500.000.000 VNĐ!`);
        return;
      }
    }

    try {
      const txConf = TRANSACTIONS.find(t => t.id === activeTxTab);

      // Execute all transactions in parallel
      await Promise.all(txQueue.map(item => {
        let finalNote = txNote || '';
        if (activeTxTab === 'IMPORT_RETURN') {
          const condText = item.condition === 'NEW' ? 'Nguyên seal / Chưa sử dụng' :
                           item.condition === 'USED' ? 'Đã bóc seal / Máy cũ' : 'Lỗi phần cứng';
          const orderPrefix = selectedOrder ? `[Đơn hàng: #${selectedOrder.id}]` : '';
          const condPrefix = `[Tình trạng: ${condText}]`;
          finalNote = `${orderPrefix}${condPrefix} ${finalNote}`.trim();
        }

        return inventoryService.create({
          productId: item.productId,
          variantId: item.variantId,
          quantityChanged: parseInt(item.quantity),
          transactionType: activeTxTab,
          price: parseFloat(item.price) || 0,
          note: finalNote
        });
      }));

      alert(`${txConf.name} thành công!`);
      setActiveTxTab(null);
      // Reset form
      setTxProductId('');
      setTxQuantity(1);
      setTxPrice('');
      setTxNote('');
      setTxVariants([]);
      setTxQueue([]);

      // Reset order search states
      setSearchQueryOrder('');
      setMatchingOrders([]);
      setSelectedOrder(null);

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
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative border border-admin-border animate-in zoom-in duration-200">
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
                    setTxQueue([]);
                    
                    // Reset order search states
                    setSearchQueryOrder('');
                    setMatchingOrders([]);
                    setSelectedOrder(null);
                  }}
                  className="p-1 hover:bg-admin-bg text-admin-text-muted hover:text-admin-text-main rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Thanh tìm kiếm lịch sử mua hàng chỉ khi loại giao dịch là IMPORT_RETURN */}
                {activeTxTab === 'IMPORT_RETURN' && (
                  <div className="col-span-full bg-slate-50 p-4 border border-admin-border rounded-lg mb-2">
                    <label className="block text-sm font-bold text-admin-text-main mb-2">Tra cứu lịch sử mua hàng của khách</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập số điện thoại khách hàng hoặc Mã đơn hàng (VD: 1)..."
                        value={searchQueryOrder}
                        onChange={(e) => setSearchQueryOrder(e.target.value)}
                        className="flex-1 border border-admin-border text-admin-text-main rounded px-4 py-2.5 outline-none bg-white text-sm focus:border-primary"
                        disabled={ordersLoading}
                      />
                      <button
                        type="button"
                        onClick={handleSearchOrder}
                        disabled={ordersLoading}
                        className="px-5 py-2.5 bg-primary text-white rounded font-bold text-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer animate-in fade-in"
                      >
                        {ordersLoading ? "Đang tải..." : "Tìm kiếm"}
                      </button>
                    </div>

                    {/* Hiển thị danh sách đơn hàng nếu có nhiều kết quả */}
                    {matchingOrders.length > 0 && (
                      <div className="mt-3 border border-admin-border rounded bg-white overflow-hidden shadow-sm">
                        <div className="px-3 py-1.5 bg-slate-100 text-[10px] font-extrabold text-admin-text-muted uppercase tracking-wider">
                          Chọn đơn hàng phù hợp ({matchingOrders.length} kết quả):
                        </div>
                        <div className="max-h-32 overflow-y-auto divide-y divide-admin-border">
                          {matchingOrders.map(order => (
                            <button
                              key={order.id}
                              type="button"
                              onClick={() => handleSelectOrder(order)}
                              className="w-full text-left px-3 py-2 text-xs text-admin-text-main hover:bg-slate-50 transition-colors flex justify-between items-center"
                            >
                              <span>
                                <strong>#ORD{order.id}</strong> - {order.receiverName} ({order.receiverPhone})
                              </span>
                              <span className="text-gray-400 font-medium">
                                {new Date(order.createdAt).toLocaleDateString('vi-VN')} - {order.totalPrice.toLocaleString('vi-VN')} VNĐ
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hiển thị thông tin đơn hàng đang chọn */}
                    {selectedOrder && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded flex justify-between items-center text-xs animate-in fade-in duration-200">
                        <div className="text-blue-900 leading-relaxed font-semibold">
                          <div>
                            <strong>Đơn hàng đang chọn:</strong> <span className="font-mono text-blue-700">#ORD{selectedOrder.id}</span>
                          </div>
                          <div>
                            Khách hàng: {selectedOrder.receiverName || 'N/A'} - SĐT: {selectedOrder.receiverPhone || 'N/A'}
                          </div>
                          <div>
                            Ngày mua: {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearSelectedOrder}
                          className="px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded bg-white font-extrabold transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                          Hủy chọn
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Dropdowns chọn sản phẩm thủ công */}
                {activeTxTab !== 'IMPORT_RETURN' && (
                  <>
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
                  </>
                )}

                {/* Bảng danh sách các mặt hàng chọn để thêm vào hàng đợi */}
                {(txProductId || selectedOrder) && (
                  <div className="col-span-full animate-in fade-in duration-200">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-admin-text-main">
                        Danh sách sản phẩm {selectedOrder ? 'đã mua trong hóa đơn' : `biến thể (${txConf.type === 'IN' ? 'Nhập kho' : 'Xuất kho'})`}
                      </label>

                      {/* Dropdown Chọn theo thuộc tính - chỉ hiển thị khi chọn sản phẩm thủ công */}
                      {!selectedOrder && Object.keys(txAttributesConfig).length > 0 && (
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
                              {!selectedOrder && (
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
                              )}
                              <th className="py-2.5 px-3">Tên sản phẩm & Biến thể</th>
                              {activeTxTab === 'IMPORT_RETURN' && (
                                <th className="py-2.5 px-3 w-48">Tình trạng máy</th>
                              )}
                              <th className="py-2.5 px-3 w-32">Số lượng {txConf.type === 'IN' ? 'nhập' : 'xuất'}</th>
                              <th className="py-2.5 px-3 w-44">Giá {txConf.type === 'IN' ? 'hoàn lại' : 'xuất'} (VNĐ)</th>
                              {selectedOrder && (
                                <th className="py-2.5 px-3 w-32 text-center">Hành động</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-admin-border">
                            {txVariants.map((v, idx) => (
                              <tr key={idx} className={`hover:bg-slate-50/50 ${v.selected ? 'bg-blue-50/20' : ''}`}>
                                {!selectedOrder && (
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
                                )}
                                <td className={`py-3 px-3 font-bold ${selectedOrder || v.selected ? 'text-admin-text-main' : 'text-gray-400'}`}>{v.name}</td>
                                {activeTxTab === 'IMPORT_RETURN' && (
                                  <td className="py-2 px-3">
                                    <select
                                      value={v.condition}
                                      onChange={(e) => handleConditionChange(idx, e.target.value)}
                                      className="w-full border border-admin-border rounded px-2 py-1.5 outline-none font-semibold text-xs text-admin-text-main bg-white focus:border-primary"
                                    >
                                      <option value="NEW">Nguyên seal / Chưa sử dụng</option>
                                      <option value="USED">Đã bóc seal / Máy cũ</option>
                                      <option value="DEFECT">Lỗi phần cứng</option>
                                    </select>
                                  </td>
                                )}
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={v.quantity}
                                    onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                    disabled={!!selectedOrder}
                                    className={`w-full border border-admin-border rounded px-2.5 py-1.5 outline-none font-semibold text-xs text-admin-text-main focus:border-primary ${selectedOrder ? 'bg-slate-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                  />
                                  {selectedOrder && (
                                    <div className="text-[10px] text-gray-500 font-medium mt-1">
                                      Mua tối đa: {v.purchaseQuantity}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <PriceInput
                                    placeholder="VD: 25.000.000"
                                    value={v.price}
                                    onChange={(val) => handlePriceChange(idx, val)}
                                    className="w-full border border-admin-border rounded px-2.5 py-1.5 outline-none font-semibold text-xs text-admin-text-main bg-white focus:border-primary"
                                  />
                                  {selectedOrder && (
                                    <div className="text-[10px] text-gray-500 font-medium mt-1">
                                      Giá gốc: {v.purchasePrice.toLocaleString('vi-VN')}đ
                                    </div>
                                  )}
                                </td>
                                {selectedOrder && (
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleAddSingleVariantToQueue(v)}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-extrabold text-[11px] transition-all active:scale-95 cursor-pointer shadow-sm"
                                    >
                                      Chọn trả
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {!selectedOrder && (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddToQueue}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs transition-colors flex items-center gap-1.5 shadow active:scale-95 cursor-pointer font-bold"
                        >
                          <Plus size={14} />
                          Thêm vào danh sách chờ
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Bảng hàng chờ nhập/xuất */}
                <div className="col-span-full border-t border-admin-border pt-5 mt-2">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-admin-text-main">
                      Danh sách sản phẩm chờ thực hiện ({txQueue.length} mặt hàng)
                    </label>
                    {txQueue.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearQueue}
                        className="text-xs text-red-500 hover:text-red-700 font-extrabold transition-colors cursor-pointer"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>
                  {txQueue.length === 0 ? (
                    <div className="text-center py-8 text-xs font-semibold text-gray-400 bg-slate-50 border border-dashed border-admin-border rounded-lg">
                      Chưa có sản phẩm nào trong danh sách chờ. Hãy chọn thương hiệu & sản phẩm ở trên để thêm vào.
                    </div>
                  ) : (
                    <div className="border border-admin-border rounded-md overflow-hidden bg-white max-h-56 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-admin-border text-admin-text-muted font-bold sticky top-0 z-10">
                            <th className="py-2.5 px-3">Tên sản phẩm</th>
                            <th className="py-2.5 px-3">Biến thể</th>
                            {activeTxTab === 'IMPORT_RETURN' && (
                              <th className="py-2.5 px-3 w-48">Tình trạng máy</th>
                            )}
                            <th className="py-2.5 px-3 w-32">Số lượng</th>
                            <th className="py-2.5 px-3 w-44">Giá {txConf.type === 'IN' ? 'nhập' : 'xuất'} (VNĐ)</th>
                            <th className="py-2.5 px-3 w-24 text-center">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-admin-border">
                          {txQueue.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-bold text-admin-text-main">{item.productName}</td>
                              <td className="py-2.5 px-3 font-semibold text-gray-500">{item.variantName}</td>
                              {activeTxTab === 'IMPORT_RETURN' && (
                                <td className="py-2 px-3">
                                  <select
                                    value={item.condition}
                                    onChange={(e) => handleQueueConditionChange(index, e.target.value)}
                                    className="w-full border border-admin-border rounded px-2 py-1.5 outline-none font-semibold text-xs text-admin-text-main bg-white focus:border-primary"
                                  >
                                    <option value="NEW">Nguyên seal / Chưa sử dụng</option>
                                    <option value="USED">Đã bóc seal / Máy cũ</option>
                                    <option value="DEFECT">Lỗi phần cứng</option>
                                  </select>
                                </td>
                              )}
                              <td className="py-1 px-3">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleQueueQuantityChange(index, e.target.value)}
                                  className="w-full border border-admin-border rounded px-2 py-1.5 outline-none font-semibold text-xs text-admin-text-main bg-white focus:border-primary"
                                />
                                {item.purchaseQuantity !== null && (
                                  <div className="text-[9px] text-gray-400 font-medium mt-0.5">
                                    Mua tối đa: {item.purchaseQuantity}
                                  </div>
                                )}
                              </td>
                              <td className="py-1 px-3">
                                <PriceInput
                                  placeholder="VD: 25.000.000"
                                  value={item.price}
                                  onChange={(val) => handleQueuePriceChange(index, val)}
                                  className="w-full border border-admin-border rounded px-2 py-1.5 outline-none font-semibold text-xs text-admin-text-main bg-white focus:border-primary"
                                />
                                {item.purchasePrice !== null && (
                                  <div className="text-[9px] text-gray-400 font-medium mt-0.5">
                                    Giá gốc: {item.purchasePrice.toLocaleString('vi-VN')}đ
                                  </div>
                                )}
                              </td>
                              <td className="py-1 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromQueue(index)}
                                  className="text-red-500 hover:text-red-700 font-extrabold transition-colors p-1"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Ghi chú chung</label>
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
                    setTxQueue([]);
                    
                    // Reset order search states
                    setSearchQueryOrder('');
                    setMatchingOrders([]);
                    setSelectedOrder(null);
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
