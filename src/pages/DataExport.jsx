import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, CheckCircle, Database, Users, TrendingUp, BarChart2 } from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { useSettings } from '../context/SettingsContext';
import './FamilyManagement.css';

/* ── Toast ── */
const Toast = ({ toasts, remove }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`}>
        <span>{t.message}</span>
        <button className="toast-close" onClick={() => remove(t.id)}>✕</button>
      </div>
    ))}
  </div>
);
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  const remove = (id) => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, add, remove };
}

/* ── Helpers ── */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function assetsToCSVString(assets) {
  const headers = ['Name','Type','Symbol','Quantity','Avg Price','Current Price','Invested','Current Value','Profit/Loss','Allocation%','Owner'];
  const totalValue = assets.reduce((s, a) => s + a.currentPrice * a.quantity, 0);
  const rows = assets.map(a => {
    const invested = a.avgPrice * a.quantity;
    const current  = a.currentPrice * a.quantity;
    const pl       = current - invested;
    const alloc    = totalValue > 0 ? ((current / totalValue) * 100).toFixed(2) : '0.00';
    return [a.name, a.type, a.symbol, a.quantity, a.avgPrice, a.currentPrice, invested.toFixed(2), current.toFixed(2), pl.toFixed(2), alloc, a.owner || ''].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

function exportCSV(assets) {
  downloadBlob(new Blob([assetsToCSVString(assets)], { type: 'text/csv;charset=utf-8;' }), `vaultx_export_${Date.now()}.csv`);
}

async function exportPDF(assets, family) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape' });
  const totalValue = assets.reduce((s, a) => s + a.currentPrice * a.quantity, 0);
  const totalInvested = assets.reduce((s, a) => s + a.avgPrice * a.quantity, 0);
  const totalPL = totalValue - totalInvested;

  doc.setFontSize(18); doc.setTextColor(40); doc.text('VaultX Portfolio Report', 14, 20);
  doc.setFontSize(10); doc.setTextColor(100); doc.text(`Family: ${family.familyName}   |   Generated: ${new Date().toLocaleString()}`, 14, 28);
  doc.setFontSize(11); doc.setTextColor(40);
  doc.text(`Total Value: ₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 14, 38);
  doc.text(`Invested: ₹${totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 14, 45);
  doc.text(`P&L: ₹${totalPL.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${totalInvested > 0 ? ((totalPL / totalInvested) * 100).toFixed(2) : 0}%)`, 14, 52);

  autoTable(doc, {
    startY: 60,
    head: [['Asset','Type','Symbol','Qty','Avg Price','Curr Price','Invested','Current Val','P&L','Alloc%','Owner']],
    body: assets.map(a => {
      const iv = a.avgPrice * a.quantity, cv = a.currentPrice * a.quantity, pl = cv - iv;
      const alloc = totalValue > 0 ? ((cv / totalValue) * 100).toFixed(2) : '0';
      return [a.name, a.type, a.symbol, a.quantity, `₹${a.avgPrice}`, `₹${a.currentPrice}`, `₹${iv.toFixed(2)}`, `₹${cv.toFixed(2)}`, `₹${pl.toFixed(2)}`, `${alloc}%`, a.owner || ''];
    }),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        const val = parseFloat(data.cell.raw.replace('₹',''));
        data.cell.styles.textColor = val < 0 ? [220,38,38] : [22,163,74];
      }
    },
  });
  doc.save(`vaultx_report_${Date.now()}.pdf`);
}

async function exportExcel(assets) {
  const XLSX = await import('xlsx');
  const totalValue = assets.reduce((s, a) => s + a.currentPrice * a.quantity, 0);
  const rows = assets.map(a => {
    const iv = a.avgPrice * a.quantity, cv = a.currentPrice * a.quantity, pl = cv - iv;
    return { Name: a.name, Type: a.type, Symbol: a.symbol, Quantity: a.quantity, 'Avg Price': a.avgPrice, 'Current Price': a.currentPrice,
             'Invested (₹)': +iv.toFixed(2), 'Current Value (₹)': +cv.toFixed(2), 'P&L (₹)': +pl.toFixed(2),
             'Allocation': totalValue > 0 ? ((cv/totalValue)*100).toFixed(2)+'%' : '0%', Owner: a.owner || '' };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Portfolio');
  XLSX.writeFile(wb, `vaultx_export_${Date.now()}.xlsx`);
}

const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

/* ── Main ── */
const DataExport = () => {
  const { allAssets } = useAssets();
  const { family }    = useSettings();
  const { toasts, add: toast, remove } = useToast();
  const [loading, setLoading] = useState({ csv: false, pdf: false, xlsx: false });
  const setLoad = (key, val) => setLoading(p => ({ ...p, [key]: val }));

  const handleCSV = async () => {
    setLoad('csv', true); await new Promise(r => setTimeout(r, 500));
    try { exportCSV(allAssets); toast('CSV downloaded!', 'success'); } catch { toast('Export failed', 'error'); }
    setLoad('csv', false);
  };
  const handlePDF = async () => {
    setLoad('pdf', true);
    try { await exportPDF(allAssets, family); toast('PDF report downloaded!', 'success'); } catch(e) { console.error(e); toast('PDF failed', 'error'); }
    setLoad('pdf', false);
  };
  const handleExcel = async () => {
    setLoad('xlsx', true); await new Promise(r => setTimeout(r, 400));
    try { await exportExcel(allAssets); toast('Excel downloaded!', 'success'); } catch { toast('Excel failed', 'error'); }
    setLoad('xlsx', false);
  };

  const totalValue    = allAssets.reduce((s, a) => s + a.currentPrice * a.quantity, 0);
  const totalInvested = allAssets.reduce((s, a) => s + a.avgPrice * a.quantity, 0);
  const totalPL       = totalValue - totalInvested;
  const plPct         = totalInvested > 0 ? ((totalPL / totalInvested) * 100).toFixed(2) : 0;

  const formats = [
    { key: 'csv',  icon: '📄', label: 'CSV Export',    desc: 'Raw comma-separated data. Works with Excel, Google Sheets, and any data tool.', includes: 'Assets, Prices, P&L, Allocation', handler: handleCSV,   btnLabel: 'Export CSV',   BtnIcon: Download },
    { key: 'pdf',  icon: '📋', label: 'PDF Report',    desc: 'Professional report with summary stats and colour-coded P&L table.',           includes: 'Summary, Table, Colour P&L',   handler: handlePDF,   btnLabel: 'Export PDF',   BtnIcon: FileText },
    { key: 'xlsx', icon: '📊', label: 'Excel (.xlsx)', desc: 'Full spreadsheet in structured columns for advanced analysis and filtering.',   includes: 'All asset fields + formatting', handler: handleExcel, btnLabel: 'Export Excel', BtnIcon: FileSpreadsheet },
  ];

  return (
    <div className="page-container exp-wide">
      <Toast toasts={toasts} remove={remove} />

      <div className="page-header">
        <h1 className="page-title"><Download size={28} /> Data Export</h1>
        <p className="page-subtitle">Download your complete portfolio and family data in multiple formats.</p>
      </div>

      {/* Summary strip */}
      <div className="settings-card exp-summary-card">
        <div className="exp-summary-grid">
          <div className="exp-summary-item">
            <TrendingUp size={18} style={{ color: 'var(--accent-color)' }} />
            <div>
              <span className="exp-sum-num">{allAssets.length}</span>
              <span className="exp-sum-label">Total Assets</span>
            </div>
          </div>
          <div className="exp-summary-item">
            <Database size={18} style={{ color: 'var(--accent-color)' }} />
            <div>
              <span className="exp-sum-num">{[...new Set(allAssets.map(a => a.type))].length}</span>
              <span className="exp-sum-label">Asset Classes</span>
            </div>
          </div>
          <div className="exp-summary-item">
            <Users size={18} style={{ color: 'var(--accent-color)' }} />
            <div>
              <span className="exp-sum-num">{family.members.length}</span>
              <span className="exp-sum-label">Members</span>
            </div>
          </div>
          <div className="exp-summary-item">
            <BarChart2 size={18} style={{ color: 'var(--accent-color)' }} />
            <div>
              <span className="exp-sum-num">₹{(totalValue/100000).toFixed(1)}L</span>
              <span className="exp-sum-label">Portfolio Value</span>
            </div>
          </div>
          <div className="exp-summary-item">
            <BarChart2 size={18} style={{ color: totalPL >= 0 ? '#4ade80' : '#f87171' }} />
            <div>
              <span className="exp-sum-num" style={{ color: totalPL >= 0 ? '#4ade80' : '#f87171' }}>
                {totalPL >= 0 ? '+' : ''}{plPct}%
              </span>
              <span className="exp-sum-label">Overall P&L</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export format cards — 3-col grid */}
      <div className="exp-formats-grid">
        {formats.map(({ key, icon, label, desc, includes, handler, btnLabel, BtnIcon }) => (
          <div key={key} className={`export-card export-${key}`}>
            <div className="export-card-icon">{icon}</div>
            <div>
              <h3>{label}</h3>
              <p>{desc}</p>
            </div>
            <div className="exp-includes">
              <span>Includes:</span> {includes}
            </div>
            <button className="btn-primary" onClick={handler} disabled={loading[key]}>
              {loading[key] ? <><Spinner /> Exporting…</> : <><BtnIcon size={14} /> {btnLabel}</>}
            </button>
          </div>
        ))}
      </div>

      {/* Privacy note */}
      <div className="settings-card exp-privacy-note">
        <CheckCircle size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
        <div>
          <strong>Your data stays private</strong>
          <p>All exports are generated locally in your browser. No data is sent to external servers.</p>
        </div>
      </div>
    </div>
  );
};

export default DataExport;
