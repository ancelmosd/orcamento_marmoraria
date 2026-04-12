import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateQuotePDF = (quote: any) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('ORÇAMENTO', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Nº: #${quote.id || '0'}`, pageWidth - 20, 20, { align: 'right' });

    // Company Info (Placeholder)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Marmoraria Premium', 20, 35);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Rua das Pedras, 123 - Centro', 20, 40);
    doc.text('Telefone: (11) 99999-9999', 20, 45);
    doc.text('Email: contato@marmorariapremium.com.br', 20, 50);

    // Client Info
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 55, pageWidth - 20, 55);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 20, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.client_name || 'N/A', 45, 65);
    
    doc.setFont('helvetica', 'bold');
    doc.text('PROJETO:', 20, 72);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.project_name || 'N/A', 45, 72);
    
    doc.setFont('helvetica', 'bold');
    doc.text('DATA:', 20, 79);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.created_at ? new Date(quote.created_at).toLocaleDateString('pt-BR') : 'N/A', 45, 79);

    // Items Table
    let currentY = 90;
    if (quote.items && quote.items.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Descrição', 'Largura', 'Compr.', 'Qtd', 'Área (m²)']],
        body: quote.items.map((item: any) => [
          item.description || 'Peça',
          `${item.width || 0} mm`,
          `${item.length || 0} mm`,
          item.quantity || 0,
          (item.subtotal_m2 || 0).toFixed(3)
        ]),
        headStyles: { fillColor: [50, 50, 50], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Services Table
    if (quote.services && quote.services.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('SERVIÇOS E ACABAMENTOS', 20, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Descrição', 'Qtd', 'V. Unitário', 'Total']],
        body: quote.services.map((service: any) => [
          service.description || 'Serviço',
          (service.quantity || 0).toFixed(2),
          `R$ ${(service.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `R$ ${((service.quantity || 0) * (service.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]),
        headStyles: { fillColor: [100, 100, 100], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 20;
    } else {
      currentY += 10;
    }

    // Summary
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 80, currentY - 5, pageWidth - 20, currentY - 5);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('VALOR TOTAL:', pageWidth - 80, currentY);
    doc.setTextColor(0, 100, 0);
    doc.text(`R$ ${(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 20, currentY, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('Este orçamento é válido por 10 dias.', pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
    doc.text('Gerado automaticamente pelo Sistema de Marmoraria.', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    const fileName = `Orcamento_${quote.id || '0'}_${(quote.client_name || 'Cliente').replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
