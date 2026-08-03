import React, { useState } from 'react';
import { Star, Check, AlertCircle, ThumbsUp, MessageSquare } from 'lucide-react';
import { reviewService } from '../../../services/reviewService';

const decodeHtml = (html) => {
  if (!html) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

export default function ProductReviews({ productId, reviews, currentUser, stats, onReviewSubmitted, productName }) {
  const [writeRating, setWriteRating] = useState(5);
  const [writeComment, setWriteComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setReviewError("Vui lòng đăng nhập để gửi đánh giá.");
      return;
    }
    if (!writeComment || writeComment.trim().length < 10) {
      setReviewError("Nội dung đánh giá phải có tối thiểu 10 ký tự.");
      return;
    }
    
    setIsSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      await reviewService.create({
        productId: parseInt(productId),
        rating: writeRating,
        comment: writeComment
      });
      setReviewSuccess("Cảm ơn bạn đã gửi đánh giá! Đánh giá của bạn đã được ghi nhận.");
      setWriteComment('');
      setWriteRating(5);
      setShowReviewForm(false);
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá:", err);
      setReviewError(err.message || err || "Có lỗi xảy ra khi gửi đánh giá. Vui lòng kiểm tra lại đơn hàng của bạn.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Bảng thống kê đánh giá (TGDĐ Style) */}
      <div className="grid grid-cols-1 md:grid-cols-12 bg-gray-50 rounded-xl p-6 md:p-8 items-center gap-6 md:gap-10 border border-gray-100">
        {/* Cột trái: Điểm trung bình */}
        <div className="md:col-span-5 text-center border-b md:border-b-0 md:border-r border-gray-200/80 pb-6 md:pb-0 md:pr-10">
          <div className="flex items-center justify-center gap-2">
            <span className="text-5xl font-black text-orange-500 tracking-tight">{stats.average}</span>
            <span className="text-2xl font-bold text-gray-400">/5</span>
          </div>
          <div className="flex justify-center text-yellow-400 my-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={20}
                fill={i < Math.round(stats.average) ? "currentColor" : "none"}
                stroke="currentColor"
                className="text-yellow-400"
              />
            ))}
          </div>
          <p className="text-xs font-bold text-blue-600">{stats.total} đánh giá thực tế</p>
          <p className="text-[11px] font-semibold text-gray-400 mt-0.5">{stats.satisfiedPercent}% khách hàng hài lòng</p>
        </div>

        {/* Cột phải: Thanh tỉ lệ % */}
        <div className="md:col-span-7 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center text-xs font-bold text-gray-600 gap-3">
              <span className="w-3 text-right">{star}</span>
              <Star size={12} fill="currentColor" className="text-yellow-400 shrink-0" />
              <div className="flex-1 bg-gray-200/70 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.percentages[star]}%` }}
                ></div>
              </div>
              <span className="w-10 text-right text-gray-400 font-semibold">{stats.percentages[star]}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Khu vực nút Viết đánh giá & Form */}
      <div className="border-t border-b border-gray-100 py-6 flex flex-col items-center">
        {!showReviewForm ? (
          <div className="text-center space-y-3">
            <p className="text-xs text-gray-400 font-medium">Bạn đã từng mua và trải nghiệm sản phẩm này?</p>
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  setReviewError("Vui lòng đăng nhập tài khoản Khách hàng để viết đánh giá.");
                } else {
                  setReviewError('');
                  setShowReviewForm(true);
                }
              }}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs rounded-md transition-all uppercase tracking-wider shadow-sm"
            >
              Viết đánh giá của bạn
            </button>
            {reviewError && (
              <p className="text-red-500 text-xs font-bold flex items-center gap-1 justify-center mt-2 animate-bounce">
                <AlertCircle size={14} />
                <span>{reviewError}</span>
              </p>
            )}
            {reviewSuccess && (
              <p className="text-green-600 text-xs font-bold flex items-center gap-1 justify-center mt-2">
                <Check size={14} className="bg-green-100 text-green-600 rounded-full p-0.5" />
                <span>{reviewSuccess}</span>
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="w-full max-w-xl bg-gray-50 rounded-xl p-6 border border-gray-200/60 space-y-4 animate-in zoom-in-95 duration-200">
            <h4 className="font-black text-gray-800 text-sm">Đánh giá sản phẩm {productName}</h4>
            
            {/* Chọn sao */}
            <div className="space-y-1">
              <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider">Số sao của bạn *</label>
              <div className="flex gap-2 text-gray-300">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setWriteRating(star)}
                    className="transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                  >
                    <Star
                      size={24}
                      fill={star <= writeRating ? "currentColor" : "none"}
                      stroke="currentColor"
                      className={star <= writeRating ? "text-yellow-400" : "text-gray-300"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Nhập bình luận */}
            <div className="space-y-1">
              <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider">Ý kiến chia sẻ *</label>
              <textarea
                rows="3"
                value={writeComment}
                onChange={(e) => setWriteComment(e.target.value)}
                placeholder="Mời bạn chia sẻ cảm nhận về thiết kế, tính năng, hiệu năng máy (Tối thiểu 10 ký tự)..."
                className="w-full bg-white border border-gray-200 rounded-md p-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
              ></textarea>
            </div>

            {reviewError && (
              <p className="text-red-500 text-xs font-bold flex items-center gap-1">
                <AlertCircle size={14} className="shrink-0" />
                <span>{reviewError}</span>
              </p>
            )}

            <div className="flex items-center gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  setReviewError('');
                }}
                className="px-4 py-2 text-gray-500 hover:text-gray-800 text-xs font-bold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-black rounded-md uppercase tracking-wider transition cursor-pointer"
              >
                {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Danh sách bình luận khách hàng */}
      <div className="space-y-6 divide-y divide-gray-100">
        {reviews.length > 0 ? (
          reviews.map((rev) => (
            <div key={rev.id} className="pt-6 first:pt-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-gray-800 text-xs">{rev.username}</span>
                <span className="inline-flex items-center gap-0.5 bg-green-50 border border-green-200 text-green-600 px-2 py-0.5 rounded text-[9px] font-bold">
                  <Check size={10} strokeWidth={3} />
                  <span>Đã mua tại PhoneShop</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      fill={i < rev.rating ? "currentColor" : "none"}
                      stroke="currentColor"
                      className="text-yellow-400 shrink-0"
                    />
                  ))}
                </div>
                <span className="text-[10px] text-gray-400 font-semibold">
                  {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <p className="text-gray-700 text-xs font-medium leading-relaxed">
                {decodeHtml(rev.comment)}
              </p>

              <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold">
                <button type="button" className="flex items-center gap-1.5 hover:text-blue-600 transition cursor-pointer">
                  <ThumbsUp size={11} />
                  <span>Hữu ích</span>
                </button>
                <span className="text-gray-200">|</span>
                <span>Đã dùng khoảng 1 ngày</span>
              </div>

              {rev.adminReply && (
                <div className="bg-gray-50 border border-gray-200/50 border-l-4 border-l-blue-500 rounded-r-md p-4 mt-3 ml-2 space-y-1.5">
                  <p className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                    <MessageSquare size={13} className="shrink-0" />
                    <span>Phản hồi của QTV</span>
                  </p>
                  <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                    {decodeHtml(rev.adminReply)}
                  </p>
                  {rev.repliedAt && (
                    <p className="text-[9px] text-gray-400 font-bold tracking-tight">
                      Phản hồi lúc {new Date(rev.repliedAt).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400 space-y-2">
            <MessageSquare className="mx-auto opacity-30" size={48} strokeWidth={1} />
            <p className="text-xs font-bold text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</p>
            <p className="text-[11px] text-gray-400 font-medium">Hãy là người đầu tiên trải nghiệm và chia sẻ nhận xét!</p>
          </div>
        )}
      </div>
    </div>
  );
}
