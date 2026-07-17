import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Play } from 'lucide-react';

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function ProductGallery({ product, selectedColor, galleryImages, activeImage, setActiveImage }) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxActiveIndex, setLightboxActiveIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Auto-play slideshow effect (5 seconds)
  useEffect(() => {
    const isActiveVideo = activeImage?.type === 'video';
    if (galleryImages.length <= 1 || isLightboxOpen || isHoveringImage || isActiveVideo) return;

    const timer = setInterval(() => {
      handleMainImageNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [galleryImages, activeImage, isLightboxOpen, isHoveringImage]);

  // Control YouTube video playback based on active slide
  useEffect(() => {
    if (!activeImage) return;

    if (activeImage.type === 'video') {
      if (isVideoLoaded) {
        const timer = setTimeout(() => {
          const iframe = document.getElementById('product-youtube-iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    } else {
      if (isVideoLoaded) {
        const iframe = document.getElementById('product-youtube-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
      }
    }
  }, [activeImage, isVideoLoaded]);

  const handleMainImagePrev = () => {
    const currentIndex = galleryImages.findIndex(img => img.url === activeImage?.url && img.type === activeImage?.type);
    if (currentIndex === -1) return;
    const hasVideo = galleryImages.some(img => img.type === 'video');
    const targetFirstIndex = hasVideo ? 1 : 0;
    
    let prevIndex = currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1;
    if (currentIndex === targetFirstIndex) {
      prevIndex = galleryImages.length - 1;
    }
    
    setIsFading(true);
    setTimeout(() => {
      setActiveImage(galleryImages[prevIndex]);
      setIsFading(false);
    }, 120);
  };

  const handleMainImageNext = () => {
    const currentIndex = galleryImages.findIndex(img => img.url === activeImage?.url && img.type === activeImage?.type);
    if (currentIndex === -1) return;
    const hasVideo = galleryImages.some(img => img.type === 'video');
    const targetFirstIndex = hasVideo ? 1 : 0;
    
    let nextIndex = currentIndex === 0 ? targetFirstIndex : currentIndex + 1;
    if (currentIndex === galleryImages.length - 1) {
      nextIndex = targetFirstIndex;
    }

    setIsFading(true);
    setTimeout(() => {
      setActiveImage(galleryImages[nextIndex]);
      setIsFading(false);
    }, 120);
  };

  const handleThumbnailClick = (img) => {
    setIsFading(true);
    setTimeout(() => {
      setActiveImage(img);
      if (img.type === 'video') {
        setIsVideoLoaded(true);
      }
      setIsFading(false);
    }, 120);
  };

  const handleLightboxPrev = () => {
    setLightboxActiveIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleLightboxNext = () => {
    setLightboxActiveIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const activeIndex = galleryImages.findIndex(img => img.url === activeImage?.url && img.type === activeImage?.type);

  return (
    <div className="lg:col-span-7 w-full space-y-6">
      <div className="bg-white rounded-md p-8 flex flex-col items-center relative group" id="product-slideshow-container">
        {/* Khung ảnh chính */}
        <div 
          className="relative w-full aspect-[16/10] max-w-[620px] mb-6 overflow-hidden rounded-md border border-gray-100"
          onMouseEnter={() => setIsHoveringImage(true)}
          onMouseLeave={() => setIsHoveringImage(false)}
        >
          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handleMainImagePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 focus:outline-none"
                title="Ảnh trước"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={handleMainImageNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 focus:outline-none"
                title="Ảnh tiếp theo"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* Sliding Flex Container */}
          <div 
            className="w-full flex flex-nowrap h-full transition-transform duration-500 ease-in-out"
            style={{ 
              transform: `translateX(-${(activeIndex !== -1 ? activeIndex : 0) * 100}%)`
            }}
          >
            {galleryImages.map((item, idx) => (
              <div key={idx} className="w-full h-full flex-shrink-0 flex items-center justify-center bg-white p-2">
                {item.type === 'video' ? (
                  <div className="w-full h-full relative">
                    {isVideoLoaded ? (
                      <iframe
                        id="product-youtube-iframe"
                        src={`https://www.youtube.com/embed/${getYouTubeId(item.url)}?autoplay=1&rel=0&enablejsapi=1`}
                        className="w-full h-full object-contain absolute inset-0 border-0"
                        title="Product Video"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : (
                      <div className="w-full h-full relative flex items-center justify-center bg-gray-50 cursor-pointer" onClick={() => setIsVideoLoaded(true)}>
                        <img 
                          src={`https://img.youtube.com/vi/${getYouTubeId(item.url)}/hqdefault.jpg`} 
                          className="w-full h-full object-cover rounded-md opacity-90" 
                          alt="Video preview" 
                        />
                        <div className="absolute inset-0 bg-black/15 flex items-center justify-center rounded-md">
                          <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                            <Play size={24} className="text-white ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            ))}
          </div>

          {product.discount && (
            <div className="absolute top-2 right-2 bg-red-600 text-white font-black text-xs px-2 py-1 rounded transform rotate-3 z-10">
              -{product.discount}%
            </div>
          )}
        </div>

        {/* Dải ảnh nhỏ bên dưới */}
        <div className="w-full space-y-4">
          <div className="flex gap-3 overflow-x-auto w-full py-2 justify-center scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {galleryImages.map((img, idx) => (
              <div
                key={idx}
                onClick={() => handleThumbnailClick(img)}
                className={`flex-shrink-0 w-16 h-16 rounded-md p-0.5 cursor-pointer transition-all hover:scale-105 active:scale-95 border flex items-center justify-center bg-white overflow-hidden ${
                  activeImage?.url === img.url && activeImage?.type === img.type
                    ? 'border-2 border-blue-600 bg-blue-50/50 opacity-100 scale-105 shadow-sm'
                    : 'border-gray-200 opacity-60 hover:opacity-100'
                }`}
              >
                {img.type === 'video' ? (
                  <div className="w-full h-full relative flex items-center justify-center bg-black/5 rounded">
                    <img 
                      src={`https://img.youtube.com/vi/${getYouTubeId(img.url)}/mqdefault.jpg`} 
                      className="w-full h-full object-cover opacity-80" 
                      alt="Video Thumbnail" 
                    />
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white">
                      <Play size={16} className="text-white mb-0.5" fill="currentColor" />
                      <span className="text-[9px] font-black uppercase tracking-tight scale-90">Video</span>
                    </div>
                  </div>
                ) : (
                  <img src={img.url} className="w-full h-full object-contain" alt="" />
                )}
              </div>
            ))}
          </div>

          {/* Nút Xem hình thực tế & Xem Video giới thiệu */}
          <div className="flex justify-center gap-3">
            {product.videoUrl && (
              <button
                type="button"
                onClick={() => {
                  const videoIdx = galleryImages.findIndex(img => img.type === 'video');
                  if (videoIdx !== -1) {
                    handleThumbnailClick(galleryImages[videoIdx]);
                    const el = document.getElementById('product-slideshow-container');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-xs font-black transition-colors focus:outline-none border border-red-200 cursor-pointer"
              >
                <Play size={13} fill="currentColor" className="text-red-600" />
                <span>Xem Video giới thiệu</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const activeIdx = galleryImages.findIndex(img => img.url === activeImage?.url && img.type === activeImage?.type);
                setLightboxActiveIndex(activeIdx !== -1 ? activeIdx : 0);
                setIsLightboxOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 rounded-full text-xs font-black transition-colors focus:outline-none border border-gray-200 cursor-pointer"
            >
              <Maximize2 size={13} />
              <span>Xem hình thực tế {selectedColor && `màu ${selectedColor}`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIGHTBOX POPUP */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col justify-between p-4 md:p-6 animate-in fade-in duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header Lightbox */}
          <div className="flex justify-between items-center w-full max-w-7xl mx-auto shrink-0 pb-4 border-b border-white/10">
            <div className="text-white text-xs font-semibold tracking-wide">
              Hình ảnh thực tế {selectedColor && `màu ${selectedColor} của `} {product.name} ({lightboxActiveIndex + 1}/{galleryImages.length})
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 hover:bg-white/10 text-white rounded-full transition-colors focus:outline-none cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Content Lightbox */}
          <div className="flex-1 w-full max-w-7xl mx-auto flex items-center justify-between relative py-6">
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleLightboxPrev(); }}
                className="p-3 bg-white/5 hover:bg-white/15 active:scale-95 text-white rounded-full transition-all focus:outline-none border border-white/5 cursor-pointer"
                title="Ảnh trước"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <div className="flex-1 h-full max-h-[70vh] flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
              {galleryImages[lightboxActiveIndex]?.type === 'video' ? (
                <div className="w-full max-w-3xl aspect-video relative">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(galleryImages[lightboxActiveIndex].url)}?autoplay=1&rel=0`}
                    className="w-full h-full object-contain absolute inset-0 border-0"
                    title="Lightbox Video"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : (
                <img 
                  src={galleryImages[lightboxActiveIndex]?.url} 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" 
                  alt="" 
                />
              )}
            </div>

            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleLightboxNext(); }}
                className="p-3 bg-white/5 hover:bg-white/15 active:scale-95 text-white rounded-full transition-all focus:outline-none border border-white/5 cursor-pointer"
                title="Ảnh tiếp theo"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom strip */}
          <div
            className="py-4 shrink-0 w-full flex justify-center gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onClick={(e) => e.stopPropagation()}
          >
            {galleryImages.map((img, idx) => (
              <div
                key={idx}
                onClick={(e) => { e.stopPropagation(); setLightboxActiveIndex(idx); }}
                className={`w-14 h-14 rounded-md p-1 bg-white cursor-pointer transition-all border flex items-center justify-center overflow-hidden ${
                  lightboxActiveIndex === idx
                    ? 'border-2 border-blue-600 opacity-100 scale-105 shadow-md'
                    : 'border-gray-200 opacity-50 hover:opacity-80'
                }`}
              >
                {img.type === 'video' ? (
                  <div className="w-full h-full bg-black flex items-center justify-center rounded relative overflow-hidden">
                    <Play size={16} className="text-white z-10 animate-pulse" />
                    <div className="absolute inset-0 bg-black/40" />
                  </div>
                ) : (
                  <img src={img.url} className="w-full h-full object-contain rounded" alt="" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
