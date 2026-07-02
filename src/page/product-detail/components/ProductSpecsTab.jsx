import React from 'react';
import { FileText } from 'lucide-react';

const getSummarySpecs = (specsInput) => {
  if (!specsInput) return [];
  try {
    let parsed = [];
    if (typeof specsInput === 'string') {
      parsed = JSON.parse(specsInput);
    } else if (Array.isArray(specsInput)) {
      parsed = specsInput;
    }
    if (!Array.isArray(parsed)) return [];

    const targetKeys = [
      "Công nghệ màn hình",
      "Kích thước màn hình",
      "Độ phân giải",
      "Hệ điều hành",
      "Camera sau",
      "Quay phim",
      "ROM",
      "RAM",
      "Dung lượng pin"
    ];

    const result = [];

    targetKeys.forEach(targetKey => {
      let foundValue = "";
      const targetKeyLower = targetKey.toLowerCase();

      for (const group of parsed) {
        if (!group.items || !Array.isArray(group.items)) continue;
        for (const item of group.items) {
          if (!item.key || !item.value) continue;
          const itemKey = item.key.trim().toLowerCase();

          let isMatch = false;
          if (targetKeyLower === "rom") {
            isMatch = itemKey === "rom" || itemKey.includes("bộ nhớ trong") || itemKey === "internal storage";
          } else if (targetKeyLower === "ram") {
            isMatch = itemKey === "ram" || itemKey === "bộ nhớ ram";
          } else {
            isMatch = itemKey.includes(targetKeyLower) || targetKeyLower.includes(itemKey);
          }

          if (isMatch) {
            foundValue = item.value;
            break;
          }
        }
        if (foundValue) break;
      }

      // Đổi nhãn hiển thị cho đẹp
      let displayKey = targetKey;
      if (targetKey === "ROM") displayKey = "Bộ nhớ trong (ROM)";
      if (targetKey === "RAM") displayKey = "Bộ nhớ đệm (RAM)";

      result.push({
        key: displayKey,
        value: foundValue || "Đang cập nhật"
      });
    });

    return result;
  } catch (e) {
    console.error("Error parsing specs summary:", e);
    return [];
  }
};

export default function ProductSpecsTab({ mergedSpecs, onOpenModal }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {mergedSpecs ? (
        <div>
          {/* Bảng tóm tắt thông số */}
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-xs border-collapse">
              <tbody>
                {getSummarySpecs(mergedSpecs).map((item, idx) => (
                  <tr 
                    key={idx} 
                    className="border-b border-gray-100/70 last:border-0 hover:bg-slate-50/50 transition-colors odd:bg-slate-50/30"
                  >
                    <td className="py-3.5 px-5 font-bold text-gray-500 w-1/3 border-r border-gray-100/30">
                      {item.key}
                    </td>
                    <td className="py-3.5 px-5 text-gray-800 font-semibold">
                      {item.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Nút mở Modal cấu hình đầy đủ */}
          <button
            type="button"
            onClick={onOpenModal}
            className="w-full mt-6 py-4 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-black rounded-md border border-blue-200 uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText size={15} />
            <span>Xem cấu hình chi tiết đầy đủ</span>
          </button>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400 font-semibold text-xs bg-gray-50/50 rounded-lg border border-gray-100">
          Thông số kỹ thuật đang được cập nhật.
        </div>
      )}
    </div>
  );
}
