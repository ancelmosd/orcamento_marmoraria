import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

export const generateQuotePDF = (quote: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('ORÇAMENTO', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Nº: #${quote.id}`, pageWidth - 20, 20, { align: 'right' });

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
  doc.text(new Date(quote.created_at).toLocaleDateString('pt-BR'), 45, 79);

  // Items Table
  if (quote.items && quote.items.length > 0) {
    doc.autoTable({
      startY: 90,
      head: [['Descrição', 'Largura', 'Compr.', 'Qtd', 'Área (m²)']],
      body: quote.items.map((item: any) => [
        item.description || 'Peça',
        `${item.width} mm`,
        `${item.length} mm`,
        item.quantity,
        (item.subtotal_m2 || 0).toFixed(3)
      ]),
      headStyles: { fillStyle: 'F', fillColor: [50, 50, 50], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 }
    });
  }

  // Services Table
  const servicesStartY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 90;
  
  if (quote.services && quote.services.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('SERVIÇOS E ACABAMENTOS', 20, servicesStartY);
    
    doc.autoTable({
      startY: servicesStartY + 5,
      head: [['Descrição', 'Qtd', 'V. Unitário', 'Total']],
      body: quote.services.map((service: any) => [
        service.description || 'Serviço',
        service.quantity.toFixed(2),
        `R$ ${service.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${(service.quantity * service.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]),
      headStyles: { fillStyle: 'F', fillColor: [100, 100, 100], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 }
    });
  }

  // Summary
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : servicesStartY + 20;
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 80, finalY - 5, pageWidth - 20, finalY - 5);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('VALOR TOTAL:', pageWidth - 80, finalY);
  doc.setTextColor(0, 100, 0);
  doc.text(`R$ ${quote.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 20, finalY, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  doc.text('Este orçamento é válido por 10 dias.', pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
  doc.text('Gerado automaticamente pelo Sistema de Marmoraria.', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  doc.save(`Orcamento_${quote.id}_${quote.client_name.replace(/\s+/g, '_')}.pdf`);
};
