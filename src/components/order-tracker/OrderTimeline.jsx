import React from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';

export default function OrderTimeline({
  order,
  currentStep,
  steps,
  getStepTime
}) {
  return (
    <div className="space-y-6 pt-2 font-sans">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest pl-1">Trạng thái đơn hàng</h3>
      
      <div className="relative pl-8 md:pl-10 space-y-8">
        {/* Vertical line connecting steps */}
        <div className="absolute left-4 top-4 bottom-4 w-1 bg-gray-100 rounded-full">
          <div 
            className="w-full bg-green-500 rounded-full transition-all duration-700"
            style={{ height: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>

        {/* Render Steps */}
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = currentStep >= stepNum;
          const stepTime = getStepTime(order.createdAt, stepNum);

          return (
            <div key={idx} className="relative flex gap-4 md:gap-6 animate-in slide-in-from-left duration-300">
              {/* Circle Node */}
              <div className={`absolute -left-7 md:-left-[1.875rem] w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all ${
                isCompleted 
                  ? 'bg-green-500 border-green-100 text-white scale-110 shadow-md shadow-green-100' 
                  : 'bg-white border-gray-200 text-gray-300'
              }`}>
                {isCompleted ? <CheckCircle2 size={10} className="stroke-[3]" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>}
              </div>

              {/* Step Info */}
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h4 className={`text-sm font-black ${isCompleted ? 'text-gray-900 font-black' : 'text-gray-400'}`}>
                    {step.title}
                  </h4>
                  {stepTime && (
                    <span className="text-[10px] bg-gray-100 font-bold px-2 py-0.5 rounded text-gray-500 shrink-0">
                      {stepTime}
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isCompleted ? 'text-gray-600' : 'text-gray-400 opacity-60'}`}>
                  {step.desc}
                </p>

                {/* GHN tracking integration */}
                {step.hasTracking && isCompleted && (
                  <div className="mt-3 bg-gray-50 p-4 rounded-md border border-gray-100 flex flex-wrap items-center justify-between gap-4 animate-in zoom-in-95">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Đối tác giao nhận</span>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-orange-600 font-extrabold uppercase">Giao Hàng Nhanh</strong>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded">
                          Mã vận đơn: GHN-PS{order.id}128
                        </span>
                      </div>
                    </div>
                    <a 
                      href="https://giaohangnhanh.vn" 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-md text-[11px] font-black text-gray-700 flex items-center gap-1 transition-all"
                    >
                      Tra cứu trang GHN
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
