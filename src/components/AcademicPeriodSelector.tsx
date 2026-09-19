import React from 'react';
import {
  SEMESTER_1_MONTHS,
  SEMESTER_2_MONTHS,
  PeriodSelection
} from '../utils/academicYear';

interface AcademicPeriodSelectorProps {
  selectedPeriod: PeriodSelection;
  onChangePeriod: (period: PeriodSelection) => void;
  showAnnual?: boolean;
  className?: string;
}

export const AcademicPeriodSelector: React.FC<AcademicPeriodSelectorProps> = ({
  selectedPeriod,
  onChangePeriod,
  showAnnual = true,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 ${className}`}
      aria-label="Chọn tháng hoặc kỳ đánh giá"
    >
      {/* Group 1: HK I (T9, T10, T11, T12, T1) */}
      <div className="flex shrink-0 items-center gap-1 bg-[#041d17] p-1 rounded-xl border border-[#0e4438]">
        <button
          type="button"
          onClick={() => onChangePeriod('hk1')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
            selectedPeriod === 'hk1'
              ? 'bg-amber-400 text-[#031713] border-amber-300 shadow-xs'
              : 'text-amber-300/90 hover:text-white bg-[#072a23] hover:bg-[#0a382e] border-[#1b7360]'
          }`}
          title="Tổng hợp điểm Học kỳ I (Tháng 9, 10, 11, 12, 1)"
        >
          HK I
        </button>
        {SEMESTER_1_MONTHS.map(m => (
          <button
            key={m}
            type="button"
            onClick={() => onChangePeriod(m)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedPeriod === m
                ? 'bg-amber-400 text-[#031713] shadow-xs'
                : 'text-emerald-300/80 hover:text-white hover:bg-[#072a23]'
            }`}
            title={`Tháng ${m} (Học kỳ I)`}
          >
            T{m}
          </button>
        ))}
      </div>

      {/* Group 2: HK II (T2, T3, T4, T5) */}
      <div className="flex shrink-0 items-center gap-1 bg-[#041d17] p-1 rounded-xl border border-[#0e4438]">
        <button
          type="button"
          onClick={() => onChangePeriod('hk2')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
            selectedPeriod === 'hk2'
              ? 'bg-amber-400 text-[#031713] border-amber-300 shadow-xs'
              : 'text-teal-300/90 hover:text-white bg-[#072d24] hover:bg-[#0a382e] border-[#145b4c]'
          }`}
          title="Tổng hợp điểm Học kỳ II (Tháng 2, 3, 4, 5)"
        >
          HK II
        </button>
        {SEMESTER_2_MONTHS.map(m => (
          <button
            key={m}
            type="button"
            onClick={() => onChangePeriod(m)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedPeriod === m
                ? 'bg-amber-400 text-[#031713] shadow-xs'
                : 'text-emerald-300/80 hover:text-white hover:bg-[#072a23]'
            }`}
            title={`Tháng ${m} (Học kỳ II)`}
          >
            T{m}
          </button>
        ))}
      </div>

      {/* Group 3: Cả năm (HK1 + HK2) */}
      {showAnnual && (
        <div className="flex shrink-0 items-center bg-[#041d17] p-1 rounded-xl border border-[#0e4438]">
          <button
            type="button"
            onClick={() => onChangePeriod('annual')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              selectedPeriod === 'annual'
                ? 'bg-amber-400 text-[#031713] border-amber-300 shadow-xs'
                : 'text-emerald-200 hover:text-white bg-[#062921] hover:bg-[#0a382e] border-[#0e4438]'
            }`}
            title="Tổng hợp điểm Cả năm học (HK1 + HK2 = 9 tháng)"
          >
            Cả năm
          </button>
        </div>
      )}
    </div>
  );
};
