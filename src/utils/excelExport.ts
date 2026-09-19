import * as XLSX from 'xlsx';
import { MonthlyScoreRecord } from '../types';
import { formatMonthName } from './academicYear';

export function exportMonthlyScoreToExcel(
  records: MonthlyScoreRecord[],
  monthOrPeriod: number | string,
  year: string = '2026-2027',
  schoolName: string = 'TRƯỜNG THPT CHU VĂN AN'
) {
  const isNumericMonth = typeof monthOrPeriod === 'number';
  const periodTitle = isNumericMonth ? formatMonthName(monthOrPeriod).toUpperCase() : String(monthOrPeriod).toUpperCase();
  const sheetTag = isNumericMonth ? `T${monthOrPeriod < 10 ? '0' + monthOrPeriod : monthOrPeriod}` : 'BaoCao';

  // Format data for Excel worksheet matching official school template
  const rows: (string | number)[][] = [
    ['SỞ GIÁO DỤC VÀ ĐÀO TẠO', '', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
    [schoolName.toUpperCase(), '', '', '', 'Độc lập - Tự do - Hạnh phúc'],
    ['', '', '', '', ''],
    [`BẢNG TỔNG HỢP CHẤM ĐIỂM THI ĐUA XẾP LOẠI CBVC - ${periodTitle}`],
    [`Năm học: ${year} (Thang điểm chuẩn: 230 điểm/tháng)`],
    ['', '', '', '', ''],
    [
      'STT',
      'Mã CBVC',
      'Họ và tên',
      'Chức vụ / Công tác',
      'Tổ chuyên môn',
      'Điểm nền',
      'Điểm Cộng (Ghi rõ nội dung cộng)',
      'Tổng điểm cộng',
      'Điểm Trừ (Ghi rõ nội dung trừ)',
      'Tổng điểm trừ',
      'Tổng điểm (Sau cộng trừ)',
      'Điểm chốt BGH',
      'Trạng thái duyệt',
      'Xếp loại dự kiến',
      'Ghi chú BGH'
    ],
  ];

  records.forEach((rec, idx) => {
    // Format bonus text: "+ 6đ(TTCM) + 3đ(phó BT)"
    const bonusText = rec.bonusItems.length > 0
      ? rec.bonusItems.map(b => `+${b.points}đ (${b.title.replace(/^\+?\d+đ\s*/, '')})`).join('; ')
      : '-';

    // Format penalty text: "- 2đ(Đi họp muộn)"
    const penaltyText = rec.penaltyItems.length > 0
      ? rec.penaltyItems.map(p => `-${p.points}đ (${p.title.replace(/^-?\d+đ\s*/, '')})`).join('; ')
      : '-';

    // Projected ranking badge
    const finalScore = rec.bghApprovedScore ?? rec.totalScore;
    let rankBadge = 'Hoàn thành tốt nhiệm vụ';
    if (finalScore >= 235) {
      rankBadge = 'Hoàn thành xuất sắc nhiệm vụ (Dự kiến Top 20%)';
    } else if (finalScore < 225) {
      rankBadge = 'Cần phấn đấu thêm';
    }

    const statusText = rec.status === 'approved'
      ? 'Đã duyệt chốt điểm'
      : rec.status === 'submitted'
      ? 'Chờ BGH duyệt'
      : rec.status === 'locked'
      ? 'Đã khóa sổ'
      : 'Bản nháp';

    rows.push([
      idx + 1,
      rec.staffCode,
      rec.staffName,
      rec.position,
      rec.departmentName,
      rec.baseScore,
      bonusText,
      rec.totalBonus,
      penaltyText,
      rec.totalPenalty,
      rec.totalScore,
      rec.bghApprovedScore ?? 'Chưa chốt',
      statusText,
      rankBadge,
      rec.bghNotes || ''
    ]);
  });

  // Summary row
  const totalStaff = records.length;
  const avgScore = totalStaff > 0
    ? (records.reduce((acc, r) => acc + (r.bghApprovedScore ?? r.totalScore), 0) / totalStaff).toFixed(1)
    : 0;

  rows.push(['', '', '', '', '']);
  rows.push(['', '', 'TỔNG CỘNG / TRUNG BÌNH:', '', '', '', '', '', '', '', '', Number(avgScore), '', '', '']);
  rows.push(['', '', '', '', '']);
  rows.push([
    '',
    '',
    'NGƯỜI LẬP BẢNG',
    '',
    'TỔ TRƯỞNG CHUYÊN MÔN',
    '',
    'BAN THI ĐUA NHÀ TRƯỜNG',
    '',
    'HIỆU TRƯỞNG PHÊ DUYỆT'
  ]);
  rows.push([
    '',
    '',
    '(Ký và ghi rõ họ tên)',
    '',
    '(Ký và ghi rõ họ tên)',
    '',
    '(Ký và ghi rõ họ tên)',
    '',
    '(Ký tên và đóng dấu)'
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 10 }, // Ma CBVC
    { wch: 24 }, // Ho va ten
    { wch: 28 }, // Chuc vu
    { wch: 22 }, // To CM
    { wch: 10 }, // Diem nen
    { wch: 38 }, // Diem cong
    { wch: 14 }, // Tong cong
    { wch: 30 }, // Diem tru
    { wch: 14 }, // Tong tru
    { wch: 14 }, // Tong diem
    { wch: 14 }, // Diem chot BGH
    { wch: 18 }, // Trang thai
    { wch: 32 }, // Xep loai
    { wch: 36 }, // Ghi chu
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `ThiDua_${sheetTag}`);

  // Trigger download
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const cleanTag = isNumericMonth ? `Thang_${monthOrPeriod < 10 ? '0' + monthOrPeriod : monthOrPeriod}` : String(monthOrPeriod).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Bang_Tong_Hop_Thi_Dua_${cleanTag}_${year}_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
