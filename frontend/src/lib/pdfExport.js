import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportDailyRevenuePDF = (transactions, summaryData) => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // 1. HEADER (Kop Surat)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(120, 53, 15); // amber-900 (Primary color)
  doc.text("OGUT COFFEE", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("POINT OF SALES SYSTEM", 14, 26);
  doc.text("Laporan Rekapitulasi Pendapatan Harian", 14, 32);
  
  // Tanggal Laporan
  doc.setFont("helvetica", "normal");
  doc.text(`Tanggal: ${dateStr}`, 14, 40);

  // 2. RINGKASAN (Summary Cards)
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, 46, 182, 30, 3, 3, 'FD'); // Background box

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  
  // Kolom 1: Total Transaksi
  doc.text("Total Transaksi", 20, 56);
  doc.setFontSize(16);
  doc.text(`${summaryData.totalTransactions} Nota`, 20, 66);
  
  // Kolom 2: Total Pendapatan
  doc.setFontSize(12);
  doc.text("Total Pendapatan Kotor", 80, 56);
  doc.setFontSize(16);
  doc.setTextColor(22, 163, 74); // green-600
  doc.text(`Rp ${summaryData.totalGrossRevenue.toLocaleString('id-ID')}`, 80, 66);

  // Kolom 3: Metode Pembayaran Terbesar
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Metode Favorit", 140, 56);
  doc.setFontSize(14);
  const favoriteMethod = Object.entries(summaryData.paymentMethods).sort((a,b) => b[1] - a[1])[0];
  doc.text(favoriteMethod ? favoriteMethod[0] : '-', 140, 66);

  // 3. TABEL RINCIAN TRANSAKSI
  doc.setFontSize(14);
  doc.text("Rincian Transaksi", 14, 90);

  const tableColumn = ["No", "ID Transaksi", "Waktu", "Metode", "Total (Rp)"];
  const tableRows = [];

  transactions.forEach((tx, index) => {
    const txTime = new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const txData = [
      index + 1,
      tx.id.split('-')[0].toUpperCase(), // Short ID
      txTime,
      tx.payment_method,
      tx.total_amount.toLocaleString('id-ID')
    ];
    tableRows.push(txData);
  });

  const result = autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 96,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [120, 53, 15], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 15 },
      3: { cellWidth: 35 },
      4: { halign: 'right', cellWidth: 40 }
    }
  });

  // 4. FOOTER
  const finalY = result.finalY || 96;
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  doc.text("Dokumen ini dihasilkan secara otomatis oleh Sistem Ogut POS.", 14, finalY + 20);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, finalY + 26);

  // 5. SIMPAN PDF
  const filename = `Laporan_Harian_Ogut_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
