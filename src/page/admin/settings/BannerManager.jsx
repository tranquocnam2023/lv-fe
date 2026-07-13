import React, { useState, useEffect, useRef } from 'react';
import {
  Settings, Save, RotateCcw, GripVertical, Plus,
  Trash2, Upload, Eye, EyeOff, Check, AlertCircle,
  Sliders, Layout, LayoutGrid, MonitorPlay, Sparkles
} from 'lucide-react';
import BannerSection from '../../../components/BannerSection';
import DraggableSliderList from './components/DraggableSliderList';
import FixedBannerCard from './components/FixedBannerCard';
import BannerLivePreview from './components/BannerLivePreview';
import { productService } from '../../../services/productService';
import { bannerService } from '../../../services/bannerService';


// Banner dọc 2 bên mép
import bannerLeft from '../../../assets/banner-left.png';
import bannerRight from '../../../assets/banner-right.png';
// Banner ngang trên cùng 
import topBannerImg from '../../../assets/top-banner.png';
// Banner cho Slider trượt
import banner1 from '../../../assets/banner-1.jpg';
import banner2 from '../../../assets/banner-2.png';
import banner3 from '../../../assets/banner-3.png';
import banner4 from '../../../assets/banner-4.webp';
import banner5 from '../../../assets/banner-5.png';
import banner6 from '../../../assets/banner-6.png';

// Danh sách banner mặc định để khởi tạo dữ liệu
const DEFAULT_BANNERS = [
  { id: 's1', imageUrl: banner1, linkUrl: '/khuyen-mai-1', type: 'Slider', isActive: true, position: 0 },
  { id: 's2', imageUrl: banner2, linkUrl: '/khuyen-mai-2', type: 'Slider', isActive: true, position: 1 },
  { id: 's3', imageUrl: banner3, linkUrl: '/khuyen-mai-3', type: 'Slider', isActive: true, position: 2 },
  { id: 's4', imageUrl: banner4, linkUrl: '/khuyen-mai-4', type: 'Slider', isActive: true, position: 3 },
  { id: 's5', imageUrl: banner5, linkUrl: '/khuyen-mai-5', type: 'Slider', isActive: true, position: 4 },
  { id: 's6', imageUrl: banner6, linkUrl: '/khuyen-mai-6', type: 'Slider', isActive: true, position: 5 },
  { id: 'top', imageUrl: topBannerImg, linkUrl: '/khuyen-mai-hot', type: 'Top', isActive: true, position: 0 },
  { id: 'left', imageUrl: bannerLeft, linkUrl: '/khuyen-mai-trai', type: 'Left', isActive: true, position: 0 },
  { id: 'right', imageUrl: bannerRight, linkUrl: '/khuyen-mai-phai', type: 'Right', isActive: true, position: 0 },
];

export default function BannerManager() {
  const [activeTab, setActiveTab] = useState('slider');
  const [publishedBanners, setPublishedBanners] = useState([]);
  const [draftBanners, setDraftBanners] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null); // { type: 'success' | 'info', text: '' }
  const addSliderInputRef = useRef(null);

  // Khởi tạo dữ liệu từ backend API với fallback localStorage
  const loadBannersFromBackend = async () => {
    try {
      const drafts = await bannerService.getDraftBanners();
      const published = await bannerService.getPublishedBanners();
      setDraftBanners(drafts || []);
      setPublishedBanners(published || []);
    } catch (error) {
      console.error("Lỗi khi tải cấu hình banner từ API:", error);
      let published = localStorage.getItem('publishedBanners');
      let draft = localStorage.getItem('draftBanners');

      if (!published) {
        localStorage.setItem('publishedBanners', JSON.stringify(DEFAULT_BANNERS));
        published = JSON.stringify(DEFAULT_BANNERS);
      }
      if (!draft) {
        localStorage.setItem('draftBanners', published);
        draft = published;
      }

      setPublishedBanners(JSON.parse(published));
      setDraftBanners(JSON.parse(draft));
    }
  };

  useEffect(() => {
    loadBannersFromBackend();
  }, []);

  // So sánh dữ liệu nháp và chính thức
  const hasChanges = JSON.stringify(draftBanners) !== JSON.stringify(publishedBanners);

  // Lưu nháp (Cập nhật giao diện lập tức, lưu API bất đồng bộ)
  const saveDraft = async (newDraft) => {
    setDraftBanners(newDraft);
    localStorage.setItem('draftBanners', JSON.stringify(newDraft));
    try {
      const payload = newDraft.map((item, idx) => ({
        imageUrl: item.imageUrl,
        linkUrl: item.linkUrl || '',
        type: item.type,
        isActive: item.isActive,
        position: item.position !== undefined ? item.position : idx
      }));
      await bannerService.updateDraftBanners(payload);
    } catch (error) {
      console.error("Lỗi lưu bản nháp lên backend:", error);
    }
  };

  // Publish - Xuất bản các thay đổi nháp lên chính thức ở DB
  const handlePublish = async () => {
    try {
      showAlert('info', 'Đang xuất bản các thay đổi...');
      const res = await bannerService.publishBanners();
      if (res && res.banners) {
        setPublishedBanners(res.banners);
        setDraftBanners(res.banners);
        localStorage.setItem('publishedBanners', JSON.stringify(res.banners));
        localStorage.setItem('draftBanners', JSON.stringify(res.banners));
      } else {
        setPublishedBanners(draftBanners);
        localStorage.setItem('publishedBanners', JSON.stringify(draftBanners));
      }

      // Bắn sự kiện để BannerSection cập nhật trực tiếp cùng cửa sổ trình duyệt
      window.dispatchEvent(new Event('banners-updated'));
      showAlert('success', 'Đã xuất bản tất cả thay đổi ra ngoài trang chủ thành công!');
    } catch (error) {
      console.error("Lỗi xuất bản banner:", error);
      showAlert('info', 'Lỗi xuất bản: ' + error);
    }
  };

  // Discard - Reset các thay đổi nháp quay lại bản chính thức ở DB
  const handleDiscard = async () => {
    if (window.confirm("Bạn có chắc chắn muốn hủy bỏ toàn bộ các thay đổi nháp hiện tại và quay về dữ liệu đang hiển thị ngoài website?")) {
      try {
        showAlert('info', 'Đang hủy bỏ các thay đổi nháp...');
        const res = await bannerService.discardBanners();
        if (res && res.banners) {
          setDraftBanners(res.banners);
          localStorage.setItem('draftBanners', JSON.stringify(res.banners));
        } else {
          setDraftBanners(publishedBanners);
          localStorage.setItem('draftBanners', JSON.stringify(publishedBanners));
        }
        showAlert('info', 'Đã hủy bỏ thay đổi nháp và khôi phục về cấu hình đang chạy.');
      } catch (error) {
        console.error("Lỗi hủy bỏ bản nháp:", error);
        showAlert('info', 'Lỗi khôi phục: ' + error);
      }
    }
  };

  const showAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4000);
  };

  // ─── XỬ LÝ TAB SLIDER ─────────────────────────────────────────

  // Lấy danh sách banner slider
  const sliderItems = draftBanners
    .filter(b => b.type === 'Slider')
    .sort((a, b) => a.position - b.position);

  // Kéo thả sắp xếp
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const currentSliders = [...sliderItems];
    const draggedItem = currentSliders[draggedIndex];

    // Tráo đổi vị trí
    currentSliders.splice(draggedIndex, 1);
    currentSliders.splice(index, 0, draggedItem);

    // Cập nhật lại thuộc tính position
    const updatedSliders = currentSliders.map((item, idx) => ({
      ...item,
      position: idx
    }));

    setDraggedIndex(index);

    // Ghép lại với các banner cố định không thay đổi
    const nonSliders = draftBanners.filter(b => b.type !== 'Slider');
    saveDraft([...updatedSliders, ...nonSliders]);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Bật/tắt banner
  const handleToggleActive = (id) => {
    const updated = draftBanners.map(b =>
      b.id === id ? { ...b, isActive: !b.isActive } : b
    );
    saveDraft(updated);
  };

  // Sửa URL link liên kết
  const handleLinkChange = (id, newLink) => {
    const updated = draftBanners.map(b =>
      b.id === id ? { ...b, linkUrl: newLink } : b
    );
    saveDraft(updated);
  };

  // Thay thế ảnh mới qua file upload (Tải lên local backend)
  const handleReplaceImage = async (e, id) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExtensions = ['image/svg+xml', 'image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      alert("Hệ thống chỉ hỗ trợ các định dạng: SVG, WebP, PNG, JPG/JPEG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 2MB.");
      return;
    }

    try {
      showAlert('info', 'Đang tải ảnh lên hệ thống...');
      const res = await productService.uploadLocalImage(file, 'banners');
      if (res && res.url) {
        let finalUrl = res.url;
        if (finalUrl.startsWith('/')) {
          const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
          const hostBase = apiBase.replace('/api', '');
          finalUrl = `${hostBase}${finalUrl}`;
        }

        const updated = draftBanners.map(b =>
          b.id === id ? { ...b, imageUrl: finalUrl } : b
        );
        saveDraft(updated);
        showAlert('success', 'Đã tải lên và cập nhật ảnh cho banner.');
      }
    } catch (err) {
      console.error(err);
      showAlert('info', 'Lỗi tải ảnh lên: ' + err.message);
      alert('Lỗi tải ảnh: ' + err.message);
    }
  };

  // Kích hoạt dialog chọn tệp ẩn để thêm banner
  const handleAddSliderClick = () => {
    addSliderInputRef.current?.click();
  };

  // Tải ảnh mới lên backend và thêm slide mới trực tiếp từ tệp
  const handleUploadAndAddSlider = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExtensions = ['image/svg+xml', 'image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      alert("Hệ thống chỉ hỗ trợ các định dạng: SVG, WebP, PNG, JPG/JPEG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 2MB.");
      return;
    }

    try {
      showAlert('info', 'Đang tải ảnh banner mới lên...');
      const res = await productService.uploadLocalImage(file, 'banners');
      if (res && res.url) {
        let finalUrl = res.url;
        if (finalUrl.startsWith('/')) {
          const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
          const hostBase = apiBase.replace('/api', '');
          finalUrl = `${hostBase}${finalUrl}`;
        }

        const newSlide = {
          id: 's_new_' + Date.now(),
          imageUrl: finalUrl,
          linkUrl: '',
          type: 'Slider',
          isActive: true,
          position: sliderItems.length
        };
        const updated = [...draftBanners, newSlide];
        saveDraft(updated);
        showAlert('success', 'Đã thêm một ảnh Slider mới tải lên từ máy tính.');
      }
    } catch (err) {
      console.error(err);
      showAlert('info', 'Lỗi tải ảnh lên: ' + err.message);
      alert('Lỗi tải ảnh: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };


  // Xóa ảnh slider
  const handleDeleteSlider = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa banner slider này?")) {
      const filtered = draftBanners.filter(b => b.id !== id);

      // Sắp xếp lại position của slider
      const remainingSliders = filtered
        .filter(b => b.type === 'Slider')
        .sort((a, b) => a.position - b.position)
        .map((b, idx) => ({ ...b, position: idx }));

      const nonSliders = filtered.filter(b => b.type !== 'Slider');
      saveDraft([...remainingSliders, ...nonSliders]);
      showAlert('info', 'Đã xóa banner khỏi danh sách nháp.');
    }
  };

  // ─── XỬ LÝ TAB BANNER CỐ ĐỊNH ────────────────────────────────

  // Lấy dữ liệu tạm thời cho banner cố định để edit trong form cục bộ trước khi click Update
  const getBannerByType = (type) => draftBanners.find(b => b.type === type) || { imageUrl: '', linkUrl: '', isActive: true };

  // Update banner cố định cụ thể vào trạng thái nháp chung
  const handleUpdateFixedBanner = (type, localImage, localLink) => {
    const updated = draftBanners.map(b => {
      if (b.type === type) {
        return {
          ...b,
          imageUrl: localImage || b.imageUrl,
          linkUrl: localLink
        };
      }
      return b;
    });
    saveDraft(updated);
    showAlert('info', `Đã cập nhật bản nháp cho Banner cố định (${type})!`);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in duration-350">

      {/* HEADER QUẢN LÝ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            Cài đặt hệ thống - Quản lý Quảng Cáo (Banner)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Thiết kế & sắp xếp hình ảnh quảng cáo hiển thị ngoài trang chủ.
          </p>
        </div>

        {/* NÚT LƯU NHÁP / ĐỒNG BỘ */}
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200/60 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              Có thay đổi chưa lưu
            </span>
          )}

          <button
            onClick={handleDiscard}
            disabled={!hasChanges}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${hasChanges
                ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 cursor-pointer'
                : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Hủy thay đổi
          </button>

          <button
            onClick={handlePublish}
            disabled={!hasChanges}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors ${hasChanges
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            <Save className="w-3.5 h-3.5" />
            Lưu thay đổi (Publish)
          </button>
        </div>
      </div>

      {/* ALERT BÁO TRẠNG THÁI */}
      {alertMsg && (
        <div className={`p-3.5 rounded-lg border text-sm flex items-center gap-2.5 mb-6 transition-all animate-in slide-in-from-top-2 ${alertMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-blue-50 text-blue-800 border-blue-205'
          }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${alertMsg.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
            }`}>
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* TABS SELECTOR */}
      <div className="flex border-b border-gray-200 mb-6 bg-gray-50 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('slider')}
          className={`flex items-center justify-center gap-2 flex-1 md:flex-none px-5 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'slider'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
            }`}
        >
          <Sliders className="w-4 h-4" />
          A. Banner Slider ({sliderItems.length})
        </button>

        <button
          onClick={() => setActiveTab('fixed')}
          className={`flex items-center justify-center gap-2 flex-1 md:flex-none px-5 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'fixed'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
            }`}
        >
          <Layout className="w-4 h-4" />
          B. Banner Cố định (Top, Left, Right)
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center justify-center gap-2 flex-1 md:flex-none px-5 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'preview'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
            }`}
        >
          <MonitorPlay className="w-4 h-4" />
          C. Xem trước (Live Preview)
        </button>
      </div>

      {/* TAB CONTENTS */}
      <div className="tab-content transition-all duration-300">

        {/* ================= TAB A: BANNER SLIDER ================= */}
        {activeTab === 'slider' && (
          <DraggableSliderList
            sliderItems={sliderItems}
            draggedIndex={draggedIndex}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onAddSliderClick={handleAddSliderClick}
            addSliderInputRef={addSliderInputRef}
            onUploadAndAddSlider={handleUploadAndAddSlider}
            onReplaceImage={handleReplaceImage}
            onToggleActive={handleToggleActive}
            onDeleteSlider={handleDeleteSlider}
          />
        )}

        {/* ================= TAB B: BANNER CỐ ĐỊNH ================= */}
        {activeTab === 'fixed' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* 1. TOP BANNER */}
            <FixedBannerCard
              title="Banner ngang trên cùng (Top Banner)"
              dimensions="Kích thước đề xuất: 1200x120px (Tỷ lệ 10:1)"
              bannerData={getBannerByType('Top')}
              onUpdate={(newImg, newLink) => handleUpdateFixedBanner('Top', newImg, newLink)}
            />

            {/* 2. LEFT BANNER */}
            <FixedBannerCard
              title="Banner bám lề Trái (Left Banner)"
              dimensions="Kích thước đề xuất: 120x600px hoặc 120x450px"
              bannerData={getBannerByType('Left')}
              onUpdate={(newImg, newLink) => handleUpdateFixedBanner('Left', newImg, newLink)}
              isPortrait={true}
            />

            {/* 3. RIGHT BANNER */}
            <FixedBannerCard
              title="Banner bám lề Phải (Right Banner)"
              dimensions="Kích thước đề xuất: 120x600px hoặc 120x450px"
              bannerData={getBannerByType('Right')}
              onUpdate={(newImg, newLink) => handleUpdateFixedBanner('Right', newImg, newLink)}
              isPortrait={true}
            />

          </div>
        )}

        {/* ================= TAB C: XEM TRƯỚC (LIVE PREVIEW) ================= */}
        {activeTab === 'preview' && (
          <BannerLivePreview draftBanners={draftBanners} />
        )}

      </div>
    </div>
  );
}
