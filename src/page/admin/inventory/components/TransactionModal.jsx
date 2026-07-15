import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Plus, RotateCcw, ArrowDownLeft, ArrowUpRight, ShoppingCart, Activity, FileText, ChevronDown, CheckCircle, Package, Clock, X, AlertCircle } from "lucide-react";
import PriceInput from "../../../../components/PriceInput";
import api from "../../../../services/api";
import { inventoryService } from "../../../../services/inventoryService";
import { orderService } from "../../../../services/orderService";

const TRANSACTIONS = [
  { id: "IMPORT_SUPPLIER", name: "Nhập từ nhà cung cấp", type: "IN", bgColor: "#E0E7FF", textColor: "var(--color-primary)", borderColor: "var(--color-primary)" },
  { id: "IMPORT_RETURN", name: "Nhập hàng khách trả", type: "IN", bgColor: "#D1FAE5", textColor: "var(--color-success)", borderColor: "var(--color-success)" },
  { id: "EXPORT_SELL", name: "Xuất bán hàng", type: "OUT", bgColor: "#F3F4F6", textColor: "var(--color-admin-text-main)", borderColor: "var(--color-admin-border)" },
  { id: "EXPORT_DEFECT", name: "Xuất trả hàng lỗi cho NCC", type: "OUT", bgColor: "#FEE2E2", textColor: "var(--color-admin-danger)", borderColor: "var(--color-admin-danger)" }
];

export default function TransactionModal({ activeTxTab, setActiveTxTab, products, brands, onSuccess, urlProductId, urlAction, setSearchParams }) {
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

  // Excel import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
              selected: true
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

      // Execute all transactions sequentially to prevent concurrency issues and ensure correct parent stock sync
      for (const item of txQueue) {
        let finalNote = txNote || '';
        if (activeTxTab === 'IMPORT_RETURN') {
          const condText = item.condition === 'NEW' ? 'Nguyên seal / Chưa sử dụng' :
                           item.condition === 'USED' ? 'Đã bóc seal / Máy cũ' : 'Lỗi phần cứng';
          const orderPrefix = selectedOrder ? `[Đơn hàng: #${selectedOrder.id}]` : '';
          const condPrefix = `[Tình trạng: ${condText}]`;
          finalNote = `${orderPrefix}${condPrefix} ${finalNote}`.trim();
        }

        await inventoryService.create({
          productId: item.productId,
          variantId: item.variantId,
          quantityChanged: parseInt(item.quantity),
          transactionType: activeTxTab,
          price: parseFloat(item.price) || 0,
          note: finalNote
        });
      }

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

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Lỗi thực hiện giao dịch kho:", err);
      alert('Giao dịch thất bại: ' + (err.response?.data || err.message || JSON.stringify(err)));
    }
  };

  if (!activeTxTab) return null;
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
}
