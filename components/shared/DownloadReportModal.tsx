"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, FileText, Table2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface Column {
  key: string;
  label: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  filename: string;
  columns: Column[];
  data: Record<string, any>[];
  onBeforeDownload?: (format: "pdf" | "csv") => Promise<void> | void;
  hideCsv?: boolean;
}

export default function DownloadReportModal({ open, onClose, title, filename, columns, data, onBeforeDownload, hideCsv }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);

  if (!open) return null;

  const downloadCSV = async () => {
    if (onBeforeDownload) { const r = await onBeforeDownload("csv"); if (r) return; }
    setCsvLoading(true);
    try {
      const headers = columns.map((c) => c.label);
      const rows = data.map((row) =>
        headers.map((_, i) => {
          const val = row[columns[i].key];
          const str = val == null ? "" : String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(",")
      );
      const csv = [headers.join(","), ...rows].join("\r\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("CSV downloaded!");
    } catch (e) { toast.error("Failed to download CSV"); }
    finally { setCsvLoading(false); onClose() }
  };

  const downloadPDF = async () => {
    if (onBeforeDownload) { const r = await onBeforeDownload("pdf"); if (r) return; }
    setPdfLoading(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.text(title, 14, 15);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}  |  ${data.length} records`, 14, 22);
      const headers = columns.map((c) => c.label);
      const rows = data.map((row) => columns.map((c) => {
        const val = row[c.key];
        return val == null ? "" : String(val);
      }));
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 28,
        styles: { fontSize: 6, cellPadding: 1.5 },
        headStyles: { fillColor: [139, 28, 45], fontSize: 7 },
        columnStyles: columns.reduce((acc, _, i) => {
          if (i === 0) acc[i] = { cellWidth: 30 };
          return acc;
        }, {} as Record<number, any>),
      });
      doc.save(`${filename}.pdf`);
      toast.success("PDF downloaded!");
    } catch (e) { toast.error("Failed to download PDF"); }
    finally { setPdfLoading(false); onClose() }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-charcoal-800 border border-white/10 rounded-2xl p-8 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Download Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-gray-400 text-sm mb-6">Choose a format to download the {title.toLowerCase()}</p>
        <div className={`grid ${hideCsv ? "grid-cols-1 max-w-[200px] mx-auto" : "grid-cols-2"} gap-4`}>
          <button
            onClick={downloadPDF}
            disabled={pdfLoading}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-red-500/50 transition-all disabled:opacity-50"
          >
            {pdfLoading ? <Loader2 className="w-8 h-8 text-red-500 animate-spin" /> : <FileText className="w-8 h-8 text-red-500" />}
            <span className="text-white font-medium text-sm">PDF</span>
          </button>
          {!hideCsv && (
            <button
              onClick={downloadCSV}
              disabled={csvLoading}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-green-500/50 transition-all disabled:opacity-50"
            >
              {csvLoading ? <Loader2 className="w-8 h-8 text-green-500 animate-spin" /> : <Table2 className="w-8 h-8 text-green-500" />}
              <span className="text-white font-medium text-sm">CSV</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
