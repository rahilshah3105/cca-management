import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal from './Modal';

const ExportData = () => {
  const store = useStore();
  const [showModal, setShowModal] = useState(false);

  const generatePDF = (type) => {
    const doc = new jsPDF();
    const currentDate = format(new Date(), 'dd MMM yyyy, HH:mm');
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text('CCA Management Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${currentDate}`, 14, 30);

    if (type === 'funds') {
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241); // Primary color
      doc.text('Fund Management Data', 14, 40);

      const tableColumn = ["Date", "Type", "Player", "Amount (Rs)"];
      const tableRows = [];

      let totalIncome = 0;
      let totalExpense = 0;

      // Sort funds by date ascending
      const sortedFunds = [...store.funds].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      sortedFunds.forEach(fund => {
        const player = store.players.find(p => p.id === fund.playerId);
        const fundData = [
          format(new Date(fund.date), 'dd/MM/yyyy'),
          fund.type,
          player ? player.name : 'Unknown',
          fund.type === 'INCOME' ? `+${fund.amount}` : `-${fund.amount}`
        ];
        tableRows.push(fundData);

        if (fund.type === 'INCOME') totalIncome += fund.amount;
        if (fund.type === 'EXPENSE') totalExpense += fund.amount;
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { fontSize: 9 }
      });

      // Add Summary
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 45;
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Summary:`, 14, finalY + 10);
      doc.setTextColor(16, 185, 129); // Success
      doc.text(`Total Income: Rs ${totalIncome}`, 14, finalY + 18);
      doc.setTextColor(239, 68, 68); // Danger
      doc.text(`Total Expense: Rs ${totalExpense}`, 14, finalY + 26);
      doc.setTextColor(15, 23, 42);
      doc.setFont(undefined, 'bold');
      doc.text(`Current Balance: Rs ${totalIncopeme - totalExpense}`, 14, finalY + 34);

      const fundPdfBlob = doc.output('blob');
      const fundUrl = URL.createObjectURL(fundPdfBlob);
      const fundLink = document.createElement('a');
      fundLink.href = fundUrl;
      fundLink.download = `CCA_Funds_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(fundLink);
      fundLink.click();
      document.body.removeChild(fundLink);
      URL.revokeObjectURL(fundUrl);

    } else if (type === 'balls') {
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241); // Primary color
      doc.text('Ball Inventory Data', 14, 40);

      const tableColumn = ["Date", "Type", "Qty", "Player (If Lost)", "Reason"];
      const tableRows = [];

      let totalAdded = 0;
      let totalLost = 0;

      // Sort balls by date ascending
      const sortedBalls = [...store.balls].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      sortedBalls.forEach(ball => {
        const player = store.players.find(p => p.id === ball.playerId);
        const ballData = [
          format(new Date(ball.date), 'dd/MM/yyyy'),
          ball.type,
          ball.quantity,
          ball.type === 'LOST' ? (player ? player.name : 'Unknown') : '-',
          ball.type === 'LOST' ? ball.reason : '-'
        ];
        tableRows.push(ballData);

        if (ball.type === 'ADDED') totalAdded += ball.quantity;
        if (ball.type === 'LOST') totalLost += ball.quantity;
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { fontSize: 9 }
      });

      // Add Summary
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 45;
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Summary:`, 14, finalY + 10);
      doc.setTextColor(16, 185, 129); 
      doc.text(`Total Balls Added: ${totalAdded}`, 14, finalY + 18);
      doc.setTextColor(239, 68, 68); 
      doc.text(`Total Balls Lost: ${totalLost}`, 14, finalY + 26);
      doc.setTextColor(15, 23, 42);
      doc.setFont(undefined, 'bold');
      doc.text(`Current Stock: ${totalAdded - totalLost}`, 14, finalY + 34);

      const ballPdfBlob = doc.output('blob');
      const ballUrl = URL.createObjectURL(ballPdfBlob);
      const ballLink = document.createElement('a');
      ballLink.href = ballUrl;
      ballLink.download = `CCA_Balls_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(ballLink);
      ballLink.click();
      document.body.removeChild(ballLink);
      URL.revokeObjectURL(ballUrl);
    }

    setShowModal(false);
  };

  return (
    <>
      <button 
        className="nav-item" 
        onClick={() => setShowModal(true)}
        style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <Download size={20} />
        <span>Export Data</span>
      </button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Export PDF Report">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Please select which data section you would like to export as a PDF document.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => generatePDF('funds')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}
          >
            <FileText size={20} /> Export Fund Management
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={() => generatePDF('balls')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', background: 'var(--surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <FileText size={20} /> Export Ball Inventory
          </button>
        </div>
      </Modal>
    </>
  );
};

export default ExportData;
