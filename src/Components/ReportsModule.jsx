import { useState, useMemo } from 'react';
import { useBookings } from '../context/BookingContext';
import { useApp } from '../context/AppContext';
import { formatCOP } from '../utils/format';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const PERIOD_OPTIONS = [
  { value: 'today',   label: 'Hoy' },
  { value: 'week',    label: 'Esta semana' },
  { value: 'month',   label: 'Este mes' },
  { value: 'year',    label: 'Este año' },
];

function getDateRange(period, customDate) {
  const now = new Date();
  let start, end;

  if (period === 'custom-day' && customDate) {
    const [year, month, day] = customDate.split('-').map(Number);
    start = new Date(year, month - 1, day, 0, 0, 0, 0);
    end = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { start, end };
  }

  end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === 'today') {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    start = new Date(now);
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    start = new Date(now.getFullYear(), 0, 1);
  }
  return { start, end };
}

function isInRange(dateStr, start, end) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

const CHART_COLORS = {
  orange: 'rgba(249, 115, 22, 1)',
  orangeAlpha: 'rgba(249, 115, 22, 0.15)',
  green: 'rgba(34, 197, 94, 1)',
  greenAlpha: 'rgba(34, 197, 94, 0.15)',
  blue: 'rgba(59, 130, 246, 1)',
  blueAlpha: 'rgba(59, 130, 246, 0.15)',
  purple: 'rgba(168, 85, 247, 1)',
  purpleAlpha: 'rgba(168, 85, 247, 0.15)',
  red: 'rgba(239, 68, 68, 1)',
  redAlpha: 'rgba(239, 68, 68, 0.15)',
};

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#a3a3a3', font: { family: 'Inter, sans-serif', size: 11 } } },
    tooltip: {
      backgroundColor: '#1a1a1a',
      borderColor: '#333',
      borderWidth: 1,
      titleColor: '#fff',
      bodyColor: '#a3a3a3',
    }
  },
  scales: {
    x: { ticks: { color: '#525252' }, grid: { color: 'rgba(255,255,255,0.03)' } },
    y: { ticks: { color: '#525252' }, grid: { color: 'rgba(255,255,255,0.05)' } }
  }
};

function StatCard({ label, value, icon, color = 'orange', sub }) {
  const colors = {
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    green:  'text-green-400 bg-green-500/10 border-green-500/20',
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    red:    'text-red-400 bg-red-500/10 border-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };
  return (
    <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5 space-y-3">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${colors[color]}`}>
        <span className="text-lg">{icon}</span>
      </div>
      <div>
        <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">{label}</p>
        <p className={`font-black text-2xl tracking-tight mt-0.5 ${colors[color].split(' ')[0]}`}>{value}</p>
        {sub && <p className="text-neutral-600 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ReportsModule() {
  const { bookings } = useBookings();
  const { expenses, branches } = useApp();
  const [period, setPeriod] = useState('month');
  const [customDate, setCustomDate] = useState(() => {
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const { start, end } = useMemo(() => getDateRange(period, customDate), [period, customDate]);

  const filteredBookings = useMemo(() =>
    bookings.filter(b =>
      isInRange(b.createdAt || b.date, start, end) &&
      (selectedBranch === 'all' || (b.branchId || 'branch-1') === selectedBranch)
    ),
    [bookings, start, end, selectedBranch]
  );

  const filteredExpenses = useMemo(() =>
    expenses.filter(e =>
      isInRange(e.date || e.createdAt, start, end) &&
      (selectedBranch === 'all' || e.branchId === selectedBranch)
    ),
    [expenses, start, end, selectedBranch]
  );

  const stats = useMemo(() => {
    const completed = filteredBookings.filter(b => b.status === 'completed');
    const cancelled = filteredBookings.filter(b => b.status === 'cancelled');
    const income = completed.reduce((s, b) => s + (b.servicePrice || 0), 0);
    const expensesAmt = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const profit = income - expensesAmt;

    // Servicios más solicitados
    const serviceCount = {};
    filteredBookings.forEach(b => {
      if (b.service) serviceCount[b.service] = (serviceCount[b.service] || 0) + 1;
    });
    const topServ = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Trabajadores con más clientes
    const workerCount = {};
    filteredBookings.forEach(b => {
      if (b.workerName) workerCount[b.workerName] = (workerCount[b.workerName] || 0) + 1;
    });
    const topWork = Object.entries(workerCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Clientes frecuentes
    const clientCount = {};
    filteredBookings.forEach(b => {
      if (b.clientName) clientCount[b.clientName] = (clientCount[b.clientName] || 0) + 1;
    });
    const freqClients = Object.entries(clientCount).sort((a, b) => b[1] - a[1]).filter(([, c]) => c > 1).slice(0, 5);

    // Gráfico: Citas por estado
    const statusD = {
      labels: ['Pendiente', 'Confirmada', 'En proceso', 'Finalizada', 'Cancelada'],
      datasets: [{
        data: [
          filteredBookings.filter(b => b.status === 'pending').length,
          filteredBookings.filter(b => b.status === 'confirmed').length,
          filteredBookings.filter(b => b.status === 'in_progress').length,
          completed.length,
          cancelled.length,
        ],
        backgroundColor: [
          'rgba(234,179,8,0.7)', 'rgba(59,130,246,0.7)', 'rgba(249,115,22,0.7)',
          'rgba(34,197,94,0.7)', 'rgba(239,68,68,0.7)'
        ],
        borderWidth: 0,
      }]
    };

    // Gráfico: Servicios top (barras)
    const servicesChartD = {
      labels: topServ.map(([s]) => s.length > 18 ? s.slice(0, 18) + '…' : s),
      datasets: [{
        label: 'Citas',
        data: topServ.map(([, c]) => c),
        backgroundColor: CHART_COLORS.orangeAlpha,
        borderColor: CHART_COLORS.orange,
        borderWidth: 2,
        borderRadius: 8,
      }]
    };

    // Gráfico: Trabajadores top (barras horizontales)
    const workersChartD = {
      labels: topWork.map(([w]) => w),
      datasets: [{
        label: 'Citas',
        data: topWork.map(([, c]) => c),
        backgroundColor: CHART_COLORS.blueAlpha,
        borderColor: CHART_COLORS.blue,
        borderWidth: 2,
        borderRadius: 8,
      }]
    };

    return {
      completedBookings: completed,
      cancelledBookings: cancelled,
      totalIncome: income,
      totalExpensesAmt: expensesAmt,
      netProfit: profit,
      topServices: topServ,
      topWorkers: topWork,
      frequentClients: freqClients,
      statusData: statusD,
      servicesChartData: servicesChartD,
      workersChartData: workersChartD
    };
  }, [filteredBookings, filteredExpenses]);

  const {
    completedBookings,
    cancelledBookings,
    totalIncome,
    totalExpensesAmt,
    netProfit,
    topServices,
    topWorkers,
    frequentClients,
    statusData,
    servicesChartData,
    workersChartData
  } = stats;

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();

      const periodLabel = period === 'custom-day'
        ? `Día Específico (${customDate})`
        : (PERIOD_OPTIONS.find(p => p.value === period)?.label || period);
      const branchNameLabel = selectedBranch === 'all' ? 'Todas las sedes' : (branches.find(b => b.id === selectedBranch)?.name || 'Sede');

      doc.setFillColor(18, 18, 18);
      doc.rect(0, 0, 210, 297, 'F');
      doc.setTextColor(249, 115, 22);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('BarberNike - Reporte de Gestión', 14, 22);
      doc.setTextColor(160, 160, 160);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Sede: ${branchNameLabel}  |  Período: ${periodLabel}  |  Generado: ${new Date().toLocaleDateString('es-CO')}`, 14, 30);

      // Estadísticas principales
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen General', 14, 44);

      autoTable(doc, {
        startY: 48,
        head: [['Métrica', 'Valor']],
        body: [
          ['Total de citas', filteredBookings.length],
          ['Citas completadas', completedBookings.length],
          ['Citas canceladas', cancelledBookings.length],
          ['Ingresos totales', formatCOP(totalIncome)],
          ['Gastos totales', formatCOP(totalExpensesAmt)],
          ['Ganancia neta', formatCOP(netProfit)],
        ],
        theme: 'grid',
        styles: { fillColor: [26, 26, 26], textColor: [200, 200, 200], lineColor: [60, 60, 60] },
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [32, 32, 32] },
      });

      let y = doc.lastAutoTable.finalY + 10;

      // Servicios top
      if (topServices.length > 0) {
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Servicios Más Solicitados', 14, y);
        autoTable(doc, {
          startY: y + 4,
          head: [['Servicio', 'Citas']],
          body: topServices.map(([s, c]) => [s, c]),
          theme: 'grid',
          styles: { fillColor: [26, 26, 26], textColor: [200, 200, 200], lineColor: [60, 60, 60] },
          headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [32, 32, 32] },
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      // Trabajadores top
      if (topWorkers.length > 0) {
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Trabajadores con Más Clientes', 14, y);
        autoTable(doc, {
          startY: y + 4,
          head: [['Trabajador', 'Citas']],
          body: topWorkers.map(([w, c]) => [w, c]),
          theme: 'grid',
          styles: { fillColor: [26, 26, 26], textColor: [200, 200, 200], lineColor: [60, 60, 60] },
          headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [32, 32, 32] },
        });
      }

      doc.save(`reporte_barbernike_${period === 'custom-day' ? `dia_${customDate}` : period}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error exportando PDF:', err);
      setError('Error al exportar PDF. Intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const XLSXModule = await import('xlsx-js-style');
      const XLSX = XLSXModule.default && XLSXModule.default.utils ? XLSXModule.default : XLSXModule;
      const wb = XLSX.utils.book_new();
      
      const periodLabel = period === 'custom-day'
        ? `Día Específico (${customDate})`
        : (PERIOD_OPTIONS.find(p => p.value === period)?.label || period);
      const branchNameLabel = selectedBranch === 'all' ? 'Todas las sedes' : (branches.find(b => b.id === selectedBranch)?.name || 'Sede');

      // --- ESTILOS COMPARTIDOS ---
      const STYLE_MAIN_TITLE = {
        font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'F97316' } }, // Naranja corporativo
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const STYLE_SECTION_HEADER = {
        font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '262626' } }, // Gris oscuro
        alignment: { horizontal: 'left', vertical: 'center' }
      };

      const STYLE_TABLE_HEADER = {
        font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'F97316' } }, // Naranja corporativo
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          bottom: { style: 'medium', color: { rgb: '171717' } }
        }
      };

      const STYLE_LABEL_BOLD = {
        font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '262626' } },
        alignment: { horizontal: 'left', vertical: 'center' }
      };

      const STYLE_TEXT_LEFT = {
        font: { name: 'Segoe UI', sz: 9 },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          bottom: { style: 'thin', color: { rgb: 'E5E5E5' } }
        }
      };

      const STYLE_TEXT_CENTER = {
        font: { name: 'Segoe UI', sz: 9 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          bottom: { style: 'thin', color: { rgb: 'E5E5E5' } }
        }
      };

      const STYLE_NUMBER_RIGHT = {
        font: { name: 'Segoe UI', sz: 9 },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          bottom: { style: 'thin', color: { rgb: 'E5E5E5' } }
        }
      };

      const STYLE_TOTAL_ROW = {
        font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '171717' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        fill: { fgColor: { rgb: 'F5F5F5' } },
        border: {
          top: { style: 'thin', color: { rgb: '171717' } },
          bottom: { style: 'double', color: { rgb: '171717' } }
        }
      };

      const STYLE_TOTAL_LABEL = {
        font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '171717' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        fill: { fgColor: { rgb: 'F5F5F5' } },
        border: {
          top: { style: 'thin', color: { rgb: '171717' } },
          bottom: { style: 'double', color: { rgb: '171717' } }
        }
      };

      // --- FUNCIONES AUXILIARES ---
      const cCell = (val, style, type = 's', format = undefined) => {
        const cell = { v: val, t: type, s: style };
        if (format) cell.z = format;
        return cell;
      };

      const fCell = (formula, style, format = '"$"#,##0') => {
        return { f: formula, t: 'n', z: format, s: style };
      };

      const calculateColumnWidths = (rows) => {
        if (!rows || rows.length === 0) return [];
        const colWidths = rows[0].map(() => ({ wch: 12 })); // Ancho mínimo inicial 12

        rows.forEach(row => {
          row.forEach((cell, cIndex) => {
            if (!cell) return;
            let valStr = '';
            
            if (cell.v !== undefined && cell.v !== null) {
              if (cell.t === 'n' && cell.z) {
                // Estimación del tamaño con formato de moneda/número
                const numericVal = Number(cell.v);
                valStr = '$' + numericVal.toLocaleString('es-CO');
              } else {
                valStr = String(cell.v);
              }
            } else if (cell.f) {
              valStr = '$99,999,999'; // Tamaño estimado para filas de fórmulas
            } else {
              valStr = String(cell);
            }

            // Ignorar filas de títulos, secciones o banners combinados
            const isBannerRow = row.some(c => c && (c.s === STYLE_MAIN_TITLE || c.s === STYLE_SECTION_HEADER)) || 
                               (cIndex === 0 && row.length > 1 && (!row[1] || row[1].v === undefined || row[1].v === ''));
            
            if (!isBannerRow) {
              const len = valStr.length;
              if (cIndex < colWidths.length && len > colWidths[cIndex].wch) {
                colWidths[cIndex].wch = len + 3; // Añadir padding
              }
            }
          });
        });

        // Limitar el ancho máximo a 45 para evitar columnas exageradamente anchas
        return colWidths.map(w => ({ wch: Math.min(w.wch, 45) }));
      };

      // ==========================================
      // HOJA 1: RESUMEN DE GESTIÓN
      // ==========================================
      const summaryRows = [];
      const summaryMerges = [];
      const summaryRowHeights = [];

      const addSummaryRow = (rowCells, hpx = 20) => {
        summaryRows.push(rowCells);
        summaryRowHeights.push({ hpx });
        return summaryRows.length - 1;
      };

      // Banner principal
      const rSummaryTitle = addSummaryRow([
        cCell('BARBERNIKE - REPORTE DE GESTIÓN DE NEGOCIO', STYLE_MAIN_TITLE),
        cCell('', STYLE_MAIN_TITLE),
        cCell('', STYLE_MAIN_TITLE)
      ], 38);
      summaryMerges.push({ s: { r: rSummaryTitle, c: 0 }, e: { r: rSummaryTitle, c: 2 } });

      addSummaryRow([cCell('', {}), cCell('', {}), cCell('', {})], 10); // Espacio

      // Metadatos
      const rSummaryInfo = addSummaryRow([
        cCell('INFORMACIÓN DEL REPORTE', STYLE_SECTION_HEADER),
        cCell('', STYLE_SECTION_HEADER),
        cCell('', STYLE_SECTION_HEADER)
      ], 26);
      summaryMerges.push({ s: { r: rSummaryInfo, c: 0 }, e: { r: rSummaryInfo, c: 2 } });

      addSummaryRow([cCell('Sede:', STYLE_LABEL_BOLD), cCell(branchNameLabel.toUpperCase(), STYLE_TEXT_LEFT), cCell('', STYLE_TEXT_LEFT)], 20);
      addSummaryRow([cCell('Período:', STYLE_LABEL_BOLD), cCell(periodLabel.toUpperCase(), STYLE_TEXT_LEFT), cCell('', STYLE_TEXT_LEFT)], 20);
      addSummaryRow([
        cCell('Generado el:', STYLE_LABEL_BOLD),
        cCell(`${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}`, STYLE_TEXT_LEFT),
        cCell('', STYLE_TEXT_LEFT)
      ], 20);

      addSummaryRow([cCell('', {}), cCell('', {}), cCell('', {})], 12); // Espacio

      // KPIs
      const rKpisHeader = addSummaryRow([
        cCell('INDICADORES CLAVE (KPIs)', STYLE_SECTION_HEADER),
        cCell('', STYLE_SECTION_HEADER),
        cCell('', STYLE_SECTION_HEADER)
      ], 26);
      summaryMerges.push({ s: { r: rKpisHeader, c: 0 }, e: { r: rKpisHeader, c: 2 } });

      addSummaryRow([
        cCell('Métrica', STYLE_TABLE_HEADER),
        cCell('Valor', STYLE_TABLE_HEADER),
        cCell('Detalle', STYLE_TABLE_HEADER)
      ], 24);

      addSummaryRow([cCell('Total de citas registradas', STYLE_TEXT_LEFT), cCell(filteredBookings.length, STYLE_NUMBER_RIGHT, 'n', '#,##0'), cCell('Todas las citas registradas en el período', STYLE_TEXT_LEFT)], 20);
      addSummaryRow([cCell('Citas completadas (finalizadas)', STYLE_TEXT_LEFT), cCell(completedBookings.length, STYLE_NUMBER_RIGHT, 'n', '#,##0'), cCell('Citas facturadas y cobradas con éxito', STYLE_TEXT_LEFT)], 20);
      addSummaryRow([cCell('Citas canceladas', STYLE_TEXT_LEFT), cCell(cancelledBookings.length, STYLE_NUMBER_RIGHT, 'n', '#,##0'), cCell('Citas no concretadas o canceladas', STYLE_TEXT_LEFT)], 20);
      addSummaryRow([cCell('Ingresos totales por citas', STYLE_TEXT_LEFT), cCell(totalIncome, STYLE_NUMBER_RIGHT, 'n', '"$"#,##0'), cCell('Recaudación bruta por servicios en la sede', STYLE_TEXT_LEFT)], 20);
      addSummaryRow([cCell('Gastos totales del período', STYLE_TEXT_LEFT), cCell(totalExpensesAmt, STYLE_NUMBER_RIGHT, 'n', '"$"#,##0'), cCell('Costos y egresos operativos registrados', STYLE_TEXT_LEFT)], 20);
      
      const STYLE_NET_PROFIT = {
        font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: netProfit >= 0 ? '16A34A' : 'DC2626' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: { bottom: { style: 'thin', color: { rgb: 'E5E5E5' } } }
      };
      addSummaryRow([cCell('Ganancia neta estimada', STYLE_TEXT_LEFT), cCell(netProfit, STYLE_NET_PROFIT, 'n', '"$"#,##0'), cCell('Diferencia neta (Ingresos - Gastos)', STYLE_TEXT_LEFT)], 20);

      addSummaryRow([cCell('', {}), cCell('', {}), cCell('', {})], 12); // Espacio

      // Rankings de servicios
      if (topServices.length > 0) {
        const rTopServTitle = addSummaryRow([
          cCell('TOP 5 - SERVICIOS MÁS SOLICITADOS', STYLE_SECTION_HEADER),
          cCell('', STYLE_SECTION_HEADER),
          cCell('', STYLE_SECTION_HEADER)
        ], 26);
        summaryMerges.push({ s: { r: rTopServTitle, c: 0 }, e: { r: rTopServTitle, c: 2 } });

        addSummaryRow([
          cCell('Servicio', STYLE_TABLE_HEADER),
          cCell('Citas Registradas', STYLE_TABLE_HEADER),
          cCell('Detalle', STYLE_TABLE_HEADER)
        ], 24);

        topServices.forEach(([s, c]) => {
          addSummaryRow([
            cCell(s, STYLE_TEXT_LEFT),
            cCell(c, STYLE_NUMBER_RIGHT, 'n', '#,##0'),
            cCell('Citas agendadas por clientes', STYLE_TEXT_LEFT)
          ], 20);
        });

        addSummaryRow([cCell('', {}), cCell('', {}), cCell('', {})], 12); // Espacio
      }

      // Rankings de trabajadores
      if (topWorkers.length > 0) {
        const rTopWorkTitle = addSummaryRow([
          cCell('TOP 5 - ESPECIALISTAS CON MÁS CITAS', STYLE_SECTION_HEADER),
          cCell('', STYLE_SECTION_HEADER),
          cCell('', STYLE_SECTION_HEADER)
        ], 26);
        summaryMerges.push({ s: { r: rTopWorkTitle, c: 0 }, e: { r: rTopWorkTitle, c: 2 } });

        addSummaryRow([
          cCell('Especialista', STYLE_TABLE_HEADER),
          cCell('Clientes Atendidos', STYLE_TABLE_HEADER),
          cCell('Detalle', STYLE_TABLE_HEADER)
        ], 24);

        topWorkers.forEach(([w, c]) => {
          addSummaryRow([
            cCell(w, STYLE_TEXT_LEFT),
            cCell(c, STYLE_NUMBER_RIGHT, 'n', '#,##0'),
            cCell('Servicios atendidos por este barbero', STYLE_TEXT_LEFT)
          ], 20);
        });

        addSummaryRow([cCell('', {}), cCell('', {}), cCell('', {})], 12); // Espacio
      }

      // Clientes frecuentes
      if (frequentClients.length > 0) {
        const rFreqClTitle = addSummaryRow([
          cCell('CLIENTES FRECUENTES', STYLE_SECTION_HEADER),
          cCell('', STYLE_SECTION_HEADER),
          cCell('', STYLE_SECTION_HEADER)
        ], 26);
        summaryMerges.push({ s: { r: rFreqClTitle, c: 0 }, e: { r: rFreqClTitle, c: 2 } });

        addSummaryRow([
          cCell('Cliente', STYLE_TABLE_HEADER),
          cCell('Citas Programadas', STYLE_TABLE_HEADER),
          cCell('Detalle', STYLE_TABLE_HEADER)
        ], 24);

        frequentClients.forEach(([cl, c]) => {
          addSummaryRow([
            cCell(cl, STYLE_TEXT_LEFT),
            cCell(c, STYLE_NUMBER_RIGHT, 'n', '#,##0'),
            cCell('Citas agendadas por este cliente', STYLE_TEXT_LEFT)
          ], 20);
        });
      }

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!merges'] = summaryMerges;
      wsSummary['!rows'] = summaryRowHeights;
      wsSummary['!cols'] = calculateColumnWidths(summaryRows);
      wsSummary['!views'] = [{ showGridLines: true }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

      // ==========================================
      // HOJA 2: DETALLE DE CITAS
      // ==========================================
      const bookingsRows = [];
      const bookingsMerges = [];
      const bookingsRowHeights = [];

      const addBookingRow = (rowCells, hpx = 20) => {
        bookingsRows.push(rowCells);
        bookingsRowHeights.push({ hpx });
        return bookingsRows.length - 1;
      };

      // Banner principal de citas
      const rBookTitle = addBookingRow([
        cCell('BARBERNIKE - DETALLE DE CITAS', STYLE_MAIN_TITLE),
        cCell('', STYLE_MAIN_TITLE),
        cCell('', STYLE_MAIN_TITLE),
        cCell('', STYLE_MAIN_TITLE),
        cCell('', STYLE_MAIN_TITLE),
        cCell('', STYLE_MAIN_TITLE),
        cCell('', STYLE_MAIN_TITLE)
      ], 38);
      bookingsMerges.push({ s: { r: rBookTitle, c: 0 }, e: { r: rBookTitle, c: 6 } });

      // Subbanner informativo
      const rBookSub = addBookingRow([
        cCell(`Sede: ${branchNameLabel.toUpperCase()}  |  Período: ${periodLabel.toUpperCase()}`, {
          font: { name: 'Segoe UI', sz: 9, italic: true, color: { rgb: 'E5E5E5' } },
          fill: { fgColor: { rgb: '262626' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        }),
        cCell('', {}), cCell('', {}), cCell('', {}), cCell('', {}), cCell('', {}), cCell('', {})
      ], 24);
      bookingsMerges.push({ s: { r: rBookSub, c: 0 }, e: { r: rBookSub, c: 6 } });

      addBookingRow([cCell('', {}), cCell('', {}), cCell('', {}), cCell('', {}), cCell('', {}), cCell('', {}), cCell('', {})], 10); // Espacio

      // Cabeceras de tabla
      addBookingRow([
        cCell('Fecha y Hora', STYLE_TABLE_HEADER),
        cCell('Cliente', STYLE_TABLE_HEADER),
        cCell('Servicio', STYLE_TABLE_HEADER),
        cCell('Especialista', STYLE_TABLE_HEADER),
        cCell('Sede', STYLE_TABLE_HEADER),
        cCell('Estado', STYLE_TABLE_HEADER),
        cCell('Valor', STYLE_TABLE_HEADER)
      ], 25);

      const statusLabels = {
        pending: 'Pendiente',
        confirmed: 'Confirmada',
        in_progress: 'En proceso',
        completed: 'Finalizada',
        cancelled: 'Cancelada'
      };

      filteredBookings.forEach(b => {
        // Color según estado
        let colorEstado = '525252'; // Neutral
        if (b.status === 'completed') colorEstado = '16A34A'; // Verde
        if (b.status === 'cancelled') colorEstado = 'DC2626'; // Rojo
        if (b.status === 'pending') colorEstado = 'D97706'; // Naranja/Ambar
        if (b.status === 'confirmed') colorEstado = '2563EB'; // Azul

        const styleEstado = {
          font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: colorEstado } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: { bottom: { style: 'thin', color: { rgb: 'E5E5E5' } } }
        };

        addBookingRow([
          cCell(`${b.date} ${b.time || ''}`.trim(), STYLE_TEXT_CENTER),
          cCell(b.clientName || '', STYLE_TEXT_LEFT),
          cCell(b.service || '', STYLE_TEXT_LEFT),
          cCell(b.workerName || '', STYLE_TEXT_LEFT),
          cCell(b.branchName || 'Sede Norte', STYLE_TEXT_LEFT),
          cCell(statusLabels[b.status] || b.status || '', styleEstado),
          cCell(b.servicePrice || 0, STYLE_NUMBER_RIGHT, 'n', '"$"#,##0')
        ], 20);
      });

      // Total con fórmula
      const totalBookingsRowNumber = 4 + filteredBookings.length;
      addBookingRow([
        cCell('', STYLE_TOTAL_LABEL),
        cCell('', STYLE_TOTAL_LABEL),
        cCell('', STYLE_TOTAL_LABEL),
        cCell('', STYLE_TOTAL_LABEL),
        cCell('', STYLE_TOTAL_LABEL),
        cCell('TOTAL INGRESOS CITAS:', STYLE_TOTAL_LABEL),
        fCell(`=SUM(G5:G${totalBookingsRowNumber})`, STYLE_TOTAL_ROW)
      ], 24);

      const wsBookings = XLSX.utils.aoa_to_sheet(bookingsRows);
      wsBookings['!merges'] = bookingsMerges;
      wsBookings['!rows'] = bookingsRowHeights;
      wsBookings['!cols'] = calculateColumnWidths(bookingsRows);
      wsBookings['!views'] = [{ showGridLines: true }];
      XLSX.utils.book_append_sheet(wb, wsBookings, 'Citas');

      // ==========================================
      // HOJA 3: DETALLE DE GASTOS
      // ==========================================
      const expensesRows = [];
      const expensesMerges = [];
      const expensesRowHeights = [];

      const addExpenseRow = (rowCells, hpx = 20) => {
        expensesRows.push(rowCells);
        expensesRowHeights.push({ hpx });
        return expensesRows.length - 1;
      };

      // Banner principal de gastos
      const rExpTitle = addExpenseRow([
        cCell('BARBERNIKE - DETALLE DE GASTOS OPERATIVOS', STYLE_MAIN_TITLE),
        cCell('', STYLE_MAIN_TITLE),
        cCell('', STYLE_MAIN_TITLE),
        cCell('', STYLE_MAIN_TITLE),
        cCell('', STYLE_MAIN_TITLE)
      ], 38);
      expensesMerges.push({ s: { r: rExpTitle, c: 0 }, e: { r: rExpTitle, c: 4 } });

      // Subbanner informativo
      const rExpSub = addExpenseRow([
        cCell(`Sede: ${branchNameLabel.toUpperCase()}  |  Período: ${periodLabel.toUpperCase()}`, {
          font: { name: 'Segoe UI', sz: 9, italic: true, color: { rgb: 'E5E5E5' } },
          fill: { fgColor: { rgb: '262626' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        }),
        cCell('', {}), cCell('', {}), cCell('', {}), cCell('', {})
      ], 24);
      expensesMerges.push({ s: { r: rExpSub, c: 0 }, e: { r: rExpSub, c: 4 } });

      addExpenseRow([cCell('', {}), cCell('', {}), cCell('', {}), cCell('', {}), cCell('', {})], 10); // Espacio

      // Cabeceras de tabla
      const STYLE_EXPENSE_HEADER = {
        font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'B91C1C' } }, // Color rojo/carne para representar egresos
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { bottom: { style: 'medium', color: { rgb: '171717' } } }
      };

      addExpenseRow([
        cCell('Fecha', STYLE_EXPENSE_HEADER),
        cCell('Categoría', STYLE_EXPENSE_HEADER),
        cCell('Descripción', STYLE_EXPENSE_HEADER),
        cCell('Sede', STYLE_EXPENSE_HEADER),
        cCell('Monto', STYLE_EXPENSE_HEADER)
      ], 25);

      filteredExpenses.forEach(e => {
        addExpenseRow([
          cCell(e.date || '', STYLE_TEXT_CENTER),
          cCell(e.category || 'Otros', STYLE_TEXT_LEFT),
          cCell(e.description || '', STYLE_TEXT_LEFT),
          cCell(branches.find(b => b.id === e.branchId)?.name || 'General (Todas)', STYLE_TEXT_LEFT),
          cCell(e.amount || 0, STYLE_NUMBER_RIGHT, 'n', '"$"#,##0')
        ], 20);
      });

      // Total con fórmula
      const totalExpensesRowNumber = 4 + filteredExpenses.length;
      addExpenseRow([
        cCell('', STYLE_TOTAL_LABEL),
        cCell('', STYLE_TOTAL_LABEL),
        cCell('', STYLE_TOTAL_LABEL),
        cCell('TOTAL GASTOS:', STYLE_TOTAL_LABEL),
        fCell(`=SUM(E5:E${totalExpensesRowNumber})`, STYLE_TOTAL_ROW)
      ], 24);

      const wsExpenses = XLSX.utils.aoa_to_sheet(expensesRows);
      wsExpenses['!merges'] = expensesMerges;
      wsExpenses['!rows'] = expensesRowHeights;
      wsExpenses['!cols'] = calculateColumnWidths(expensesRows);
      wsExpenses['!views'] = [{ showGridLines: true }];
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Gastos');

      XLSX.writeFile(wb, `reporte_barbernike_${period === 'custom-day' ? `dia_${customDate}` : period}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Error exportando Excel:', err);
      setError('Error al exportar Excel. Intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-black text-2xl">Reportes</h2>
          <p className="text-neutral-500 text-sm mt-1">Estadísticas y análisis del negocio</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Selector de Sede */}
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="bg-neutral-800 border border-white/5 rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-neutral-300 hover:text-white outline-none cursor-pointer"
          >
            <option value="all">Todas las Sedes</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Selector de período */}
          <div className="flex bg-neutral-800/60 border border-white/5 rounded-2xl p-1 gap-1">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  period === opt.value
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => setPeriod('custom-day')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                period === 'custom-day'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Día Específico
            </button>
          </div>

          {/* Selector de fecha específico */}
          {period === 'custom-day' && (
            <input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              className="bg-neutral-800 border border-white/5 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-wider text-neutral-300 hover:text-white outline-none cursor-pointer focus:border-orange-500 transition-all"
            />
          )}
          {/* Exportar */}
          <button
            onClick={exportPDF}
            disabled={exporting}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
          >
            📄 PDF
          </button>
          <button
            onClick={exportExcel}
            disabled={exporting}
            className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
          >
            📊 Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-bold text-center animate-fade-in">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard label="Total citas" value={filteredBookings.length} icon="📅" color="blue" />
        <StatCard label="Completadas" value={completedBookings.length} icon="✅" color="green" />
        <StatCard label="Canceladas" value={cancelledBookings.length} icon="❌" color="red" />
        <StatCard label="Ingresos" value={formatCOP(totalIncome)} icon="💰" color="orange" />
        <StatCard
          label="Ganancia neta"
          value={formatCOP(netProfit)}
          icon={netProfit >= 0 ? '📈' : '📉'}
          color={netProfit >= 0 ? 'green' : 'red'}
          sub={`Gastos: ${formatCOP(totalExpensesAmt)}`}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Estado de citas - Doughnut */}
        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6">
          <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4">Estado de citas</h3>
          <div className="h-52">
            <Doughnut
              data={statusData}
              options={{
                ...chartDefaults,
                scales: undefined,
                cutout: '65%',
                plugins: {
                  ...chartDefaults.plugins,
                  legend: { position: 'right', labels: { color: '#a3a3a3', boxWidth: 12, font: { size: 11 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Servicios top - Bar */}
        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6">
          <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4">Servicios más solicitados</h3>
          <div className="h-52">
            {topServices.length > 0 ? (
              <Bar data={servicesChartData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }} />
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-600 text-sm">Sin datos en este período</div>
            )}
          </div>
        </div>

        {/* Trabajadores top - Bar */}
        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6">
          <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4">Trabajadores con más citas</h3>
          <div className="h-52">
            {topWorkers.length > 0 ? (
              <Bar data={workersChartData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }} />
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-600 text-sm">Sin datos en este período</div>
            )}
          </div>
        </div>

        {/* Clientes frecuentes */}
        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6">
          <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4">Clientes frecuentes</h3>
          {frequentClients.length > 0 ? (
            <div className="space-y-2.5">
              {frequentClients.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 text-xs font-black flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{name}</p>
                    <div className="w-full bg-neutral-800 rounded-full h-1 mt-1">
                      <div
                        className="bg-orange-500 h-1 rounded-full transition-all"
                        style={{ width: `${Math.min((count / (frequentClients[0]?.[1] || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-neutral-400 text-xs font-black">{count} citas</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-neutral-600 text-sm">
              No hay clientes con más de una cita en este período
            </div>
          )}
        </div>
      </div>

      {/* Lista de citas recientes */}
      <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6">
        <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4">
          Citas del período ({filteredBookings.length})
        </h3>
        {filteredBookings.length === 0 ? (
          <div className="text-center py-10 text-neutral-600 text-sm">No hay citas en este período</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-neutral-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                  <th className="text-left pb-3">Fecha</th>
                  <th className="text-left pb-3">Cliente</th>
                  <th className="text-left pb-3">Servicio</th>
                  <th className="text-left pb-3">Especialista</th>
                  <th className="text-left pb-3">Sede</th>
                  <th className="text-left pb-3">Estado</th>
                  <th className="text-right pb-3">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {filteredBookings.slice(0, 20).map(b => {
                  const statusMap = {
                    pending: { label: 'Pendiente', cls: 'text-yellow-400' },
                    confirmed: { label: 'Confirmada', cls: 'text-blue-400' },
                    in_progress: { label: 'En proceso', cls: 'text-orange-400' },
                    completed: { label: 'Finalizada', cls: 'text-green-400' },
                    cancelled: { label: 'Cancelada', cls: 'text-red-400' },
                  };
                  const st = statusMap[b.status] || { label: b.status, cls: 'text-neutral-400' };
                  return (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-neutral-400">{b.date} {b.time}</td>
                      <td className="py-3 text-white font-medium">{b.clientName || '-'}</td>
                      <td className="py-3 text-neutral-300">{b.service || '-'}</td>
                      <td className="py-3 text-neutral-300">{b.workerName || '-'}</td>
                      <td className="py-3 text-neutral-300">{b.branchName || 'Sede Norte'}</td>
                      <td className="py-3"><span className={`text-xs font-bold ${st.cls}`}>{st.label}</span></td>
                      <td className="py-3 text-right text-orange-400 font-bold">{formatCOP(b.servicePrice || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredBookings.length > 20 && (
              <p className="text-neutral-600 text-xs text-center mt-3">
                Mostrando 20 de {filteredBookings.length}. Exporta para ver todos.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
