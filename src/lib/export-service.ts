import { AttendanceRecord } from '@/types';
import { formatDate, formatTime, formatDuration } from './utils';

export interface ExportFilterOptions {
  department?: string;
  employee?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export function filterAttendanceRecords(
  records: AttendanceRecord[],
  filters: ExportFilterOptions
): AttendanceRecord[] {
  return records.filter((r) => {
    if (filters.department && filters.department !== 'all' && r.departmentName !== filters.department) {
      return false;
    }
    if (filters.employee && filters.employee !== 'all' && r.profileId !== filters.employee) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && r.status !== filters.status) {
      return false;
    }
    if (filters.startDate && r.attendanceDate < filters.startDate) {
      return false;
    }
    if (filters.endDate && r.attendanceDate > filters.endDate) {
      return false;
    }
    return true;
  });
}

/**
 * PRD Rule #65: Exports contain basic attendance/reporting info only.
 * Must NOT contain selfie images, GPS coordinates, or raw map evidence.
 * Using dynamic import for xlsx to avoid Webpack bundle initialization issues.
 */
export async function exportToExcel(records: AttendanceRecord[], fileName = 'Staff_Attendance_Report.xlsx') {
  const XLSX = await import('xlsx');

  const data = records.map((r) => ({
    'Employee Name': r.employeeName || 'N/A',
    'Employee ID': r.employeeId || 'N/A',
    'Department': r.departmentName || 'N/A',
    'Designation': r.designationTitle || 'N/A',
    'Date': formatDate(r.attendanceDate),
    'Check-in Time': formatTime(r.effectiveCheckinTime || r.checkinTime),
    'Check-out Time': formatTime(r.effectiveCheckoutTime || r.checkoutTime),
    'Working Duration': formatDuration(r.workingDurationMinutes),
    'Status': r.status.replace(/_/g, ' ').toUpperCase(),
    'Late Status': r.isLate ? 'Late' : 'On-Time',
    'Leave Type': r.leaveType ? (r.leaveType === 'first_half' ? '1st Half Leave' : '2nd Half Leave') : (r.status === 'leave' ? 'Full Day Leave' : '-'),
    'Type': r.isHrAdjusted ? 'HR Adjusted' : 'System Marked',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Dynamic import for jsPDF to prevent Webpack module evaluation issues.
 */
export async function exportToPDF(records: AttendanceRecord[], fileName = 'Staff_Attendance_Report.pdf') {
  const { default: jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default || autoTableModule;

  const doc = new jsPDF('landscape');

  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('Staff Attendance Report', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${records.length}`, 14, 25);

  const tableData = records.map((r) => [
    r.employeeName || 'N/A',
    r.employeeId || 'N/A',
    r.departmentName || 'N/A',
    formatDate(r.attendanceDate),
    formatTime(r.effectiveCheckinTime || r.checkinTime),
    formatTime(r.effectiveCheckoutTime || r.checkoutTime),
    formatDuration(r.workingDurationMinutes),
    r.status.replace(/_/g, ' ').toUpperCase(),
    r.isLate ? 'Late' : 'On-Time',
    r.isHrAdjusted ? 'HR Adjusted' : 'System Marked',
  ]);

  if (typeof (doc as any).autoTable === 'function') {
    (doc as any).autoTable({
      head: [[
        'Employee',
        'ID',
        'Department',
        'Date',
        'Check-in',
        'Check-out',
        'Duration',
        'Status',
        'Late',
        'Source'
      ]],
      body: tableData,
      startY: 32,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });
  } else if (typeof autoTable === 'function') {
    (autoTable as any)(doc, {
      head: [[
        'Employee',
        'ID',
        'Department',
        'Date',
        'Check-in',
        'Check-out',
        'Duration',
        'Status',
        'Late',
        'Source'
      ]],
      body: tableData,
      startY: 32,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });
  }

  doc.save(fileName);
}
