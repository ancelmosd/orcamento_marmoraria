import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateQuotePDF = (quote: any, companySettings: any = null) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // -- DADOS DA EMPRESA --
    const company = companySettings || {
      name: 'Marmoraria Premium',
      address: 'Av. Principal, 100 - Centro, São Raimundo Nonato/PI',
      cnpj: '00.000.000/0001-00',
      email: 'contato@marmorariapremium.com.br',
      phone: '(11) 99999-9999'
    };

    // -- CORES E ESTILOS --
    const primaryColor = [40, 40, 40]; // Cinza Escuro
    const secondaryColor = [100, 100, 100]; // Cinza Médio
    const accentColor = [240, 240, 240]; // Cinza Muito Claro (Fundo)
    
    // -- CABEÇALHO --
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(company.name, 20, 25);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(company.address, 20, 32);
    doc.text(`CNPJ: ${company.cnpj}`, 20, 37);
    doc.text(`Email: ${company.email}`, 20, 42);
    doc.text(`Whats: ${company.phone}`, 20, 47);

    // Data no canto superior direito
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 20, 25, { align: 'right' });

    // -- TÍTULO DA PROPOSTA --
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(20, 55, pageWidth - 40, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`PROPOSTA COMERCIAL #${String(quote.id).padStart(3, '0')}`, 25, 63);

    // -- INFORMAÇÕES DO CLIENTE --
    let currentY = 80;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.client_name || 'N/A', 45, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Telefone:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.client_phone || 'N/A', 45, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Projeto:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.project_name || 'N/A', 45, currentY);

    // -- INFORMAÇÕES GERAIS --
    currentY += 12;
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(20, currentY, pageWidth - 40, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Informações Gerais', 25, currentY + 5.5);

    currentY += 14;
    doc.setFont('helvetica', 'normal');
    doc.text('Prazo de execução:', 20, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text('25 dias após aprovação', 60, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.text('Entrega:', 20, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(quote.delivery_date ? new Date(quote.delivery_date).toLocaleDateString('pt-BR') : 'A combinar', 60, currentY);

    // -- SERVIÇOS / PRODUTOS --
    currentY += 12;
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(20, currentY, pageWidth - 40, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Serviços / Produtos', 25, currentY + 5.5);

    currentY += 10;
    
    // Preparar dados da tabela
    const body = [
      ...(quote.items || []).map((item: any) => [
        item.description || 'Peça em Mármore/Granito',
        'un',
        `R$ ${(item.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        (item.quantity || 1).toString(),
        `R$ ${((item.subtotal_m2 || 0) * (item.unit_price || 0) || (item.quantity * item.unit_price)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]),
      ...(quote.services || []).map((service: any) => [
        service.description || 'Serviço/Acabamento',
        'un',
        `R$ ${(service.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        (service.quantity || 0).toFixed(2),
        `R$ ${((service.quantity || 0) * (service.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ])
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Descrição', 'Unidade', 'Preço Unitário', 'Qtd', 'Total']],
      body: body,
      theme: 'plain',
      headStyles: { fontStyle: 'bold', textColor: [100, 100, 100], fillColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3, textColor: [40, 40, 40] },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' }
      },
      margin: { left: 20, right: 20 },
      didDrawPage: (data) => {
        currentY = data.cursor ? data.cursor.y : currentY;
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // -- TOTAIS --
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', pageWidth - 80, currentY);
    doc.text(`R$ ${(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 20, currentY, { align: 'right' });

    currentY += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Final:', pageWidth - 80, currentY);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`R$ ${(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 20, currentY, { align: 'right' });

    // -- CONDIÇÕES E PAGAMENTO --
    currentY += 20;
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(20, currentY, pageWidth - 40, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Condições e Pagamento', 25, currentY + 5.5);

    currentY += 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Formas de pagamento:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text('Boleto, Transferência Bancária, Dinheiro, Cartão de Crédito, PIX', 60, currentY);

    currentY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Condições:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text('A vista, Sinal', 60, currentY);

    currentY += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text('Orçamento válido por 10 dias úteis.', 60, currentY);

    // -- ASSINATURAS --
    currentY = pageHeight - 50;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, currentY, 90, currentY);
    doc.line(pageWidth - 90, currentY, pageWidth - 20, currentY);
    
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(company.name, 55, currentY + 5, { align: 'center' });
    doc.text(quote.client_name || 'Cliente', pageWidth - 55, currentY + 5, { align: 'center' });

    // -- RODAPÉ --
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text(`Agradecemos a preferência! Equipe ${company.name}.`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    const fileName = `Proposta_${quote.id || '0'}_${(quote.client_name || 'Cliente').replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
