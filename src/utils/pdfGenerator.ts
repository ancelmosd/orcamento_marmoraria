import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateQuotePDF = (quote: any, companySettings: any = null, type: string = 'standard', documentSettings: any = null, paymentSettings: any = null, extraData: any = null) => {
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
    const payment = paymentSettings || {
      executionDeadline: '25 dias após aprovação',
      paymentMethods: 'Boleto, Transferência Bancária, Dinheiro, Cartão de Crédito, PIX',
      conditions: 'A vista, Sinal',
      observations: 'Orçamento válido por 10 dias úteis.',
      pixKey: '',
      bankName: '',
      bankAgency: '',
      bankAccount: '',
      showLogo: true,
      showBankData: false,
      showSignature: true
    };

    if (payment.showLogo !== false) {
      let textX = 20;
      if (company.logo) {
        try {
          const imgProps = doc.getImageProperties(company.logo);
          const imgH = 25;
          const ratio = imgProps.width / imgProps.height;
          let imgW = imgH * ratio;
          
          // Trava de largura máxima para não invadir o resto do cabeçalho
          if (imgW > 70) {
            imgW = 70;
          }

          doc.addImage(company.logo, 'PNG', 20, 15, imgW, imgH, undefined, 'FAST');
          textX = 25 + imgW; // Margem de 5mm após a imagem
        } catch (e) {
          console.error('Erro ao adicionar logo:', e);
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(company.name, textX, 22);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(company.address, textX, 28);
      doc.text(`CNPJ: ${company.cnpj}`, textX, 32);
      doc.text(`Email: ${company.email}`, textX, 36);
      doc.text(`Whats: ${company.phone}`, textX, 40);
    }

    // Data no canto superior direito
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 20, 22, { align: 'right' });

    // -- TÍTULO DA PROPOSTA --
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(20, 48, pageWidth - 40, 10, 'F'); // 55 -> 48, 12 -> 10
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12); // 14 -> 12
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

    const title = type === 'recibo' ? 'RECIBO DE PAGAMENTO' : (type === 'comercial' ? 'PROPOSTA COMERCIAL' : 'ORÇAMENTO DETALHADO');
    doc.text(`${title} #${String(quote.id).padStart(3, '0')}`, 25, 54.5);

    if (type === 'recibo') {
      let currentY = 70;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      const clientName = quote.client_name || 'N/A';
      const amount = extraData?.amount || 0;
      const projectName = quote.project_name || 'Projeto';

      const receiptText = `Recebemos de ${clientName}, a quantia de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, referente a ${extraData?.description || 'pagamento'} do projeto "${projectName}".`;

      const splitText = doc.splitTextToSize(receiptText, pageWidth - 40);
      doc.text(splitText, 20, currentY);

      currentY += (splitText.length * 6) + 15;

      // Financial Summary Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Resumo Financeiro do Cliente', 20, currentY);
      currentY += 5;

      const payments = extraData?.payments || [];
      const tableData = payments.map((p: any) => [
        new Date(p.created_at).toLocaleDateString('pt-BR'),
        p.description || '-',
        p.due_date ? new Date(p.due_date).toLocaleDateString('pt-BR') : '-',
        `R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        p.status === 'pago' ? 'Pago' : (p.due_date && new Date(p.due_date) < new Date() ? 'Atrasado' : 'Pendente')
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Data', 'Descrição', 'Vencimento', 'Valor', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 20, right: 20 }
      });

      // Signature
      if (payment.showSignature) {
        const finalY = (doc as any).lastAutoTable.finalY + 35;
        
        if (payment.useDigitalSignature && payment.signatureImage) {
          try {
            doc.addImage(payment.signatureImage, 'PNG', pageWidth / 2 - 25, finalY - 9, 50, 15);
          } catch (e) {
            console.error('Error adding signature to receipt:', e);
          }
        }

        doc.setDrawColor(200, 200, 200);
        doc.line(60, finalY, pageWidth - 60, finalY);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(company.name, pageWidth / 2, finalY + 5, { align: 'center' });
      }

      const safeClientName = (quote.client_name || 'Cliente').replace(/\s+/g, '_');
      const safeProjectName = (quote.project_name || 'Projeto').replace(/\s+/g, '_');
      return doc.save(`recibo_${quote.id}_${safeClientName}_${safeProjectName}.pdf`);
    }

    // -- INFORMAÇÕES DO CLIENTE --
    let currentY = 63; // 68 -> 63
    doc.setFontSize(8.5); // 10 -> 8.5
    doc.setTextColor(0, 0, 0);

    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.client_name || 'N/A', 45, currentY);

    currentY += 5; // 6 -> 5
    doc.setFont('helvetica', 'bold');
    doc.text('Telefone:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.client_phone || 'N/A', 45, currentY);

    currentY += 5; // 6 -> 5
    doc.setFont('helvetica', 'bold');
    doc.text('Projeto:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.project_name || 'N/A', 45, currentY);

    // -- INFORMAÇÕES GERAIS --
    if (documentSettings?.generalInfo) {
      currentY += 2; // Reduzido de 5 para 2
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(20, currentY, pageWidth - 40, 7, 'F'); // 8 -> 7
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5); // 10 -> 8.5
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Informações Gerais', 25, currentY + 4.8);

      currentY += 10; // 12 -> 10
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5); // 9 -> 7.5
      doc.setTextColor(60, 60, 60);
      doc.setLineHeightFactor(1.1); // 1.15 -> 1.1
      const splitInfo = doc.splitTextToSize(documentSettings.generalInfo, pageWidth - 45);
      doc.text(splitInfo, 25, currentY);
      
      // Calcula altura do texto (fontSize 7.5pt * lineHeight 1.1)
      const textHeight = (splitInfo.length * (7.5 * 1.1)) / 2.83465;
      currentY += textHeight + 2; // Gap de 2mm após o texto
    }

    // -- CONTEÚDO DINÂMICO --
    if (type === 'comercial') {
      // Se já adicionamos o gap de 2mm acima, não precisamos de mais aqui
      if (!documentSettings?.generalInfo) currentY += 2; // Reduzido de 3 para 2
      // Bloco unificado: título + cabeçalho da tabela
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(20, currentY, pageWidth - 40, 14, 'F');

      // Linha 1: Serviços / Produtos
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Serviços / Produtos', 25, currentY + 4.5);

      // Linha 2: Descrição | Unidade | Preço Unitário | Qtd. | Total
      doc.setFontSize(8.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      // doc.setTextColor(100, 100, 100);
      const colX = [25, 105, 130, 160, pageWidth - 25];
      doc.text('Descrição', colX[0], currentY + 11);
      doc.text('Unidade', colX[1], currentY + 11);
      doc.text('Preço Unitário', colX[2], currentY + 11);
      doc.text('Qtd.', colX[3], currentY + 11);
      doc.text('Total', colX[4], currentY + 11, { align: 'right' });

      currentY += 14;

      if (quote.origin === 'quick' && quote.metadata) {
        try {
          const rawMeta = typeof quote.metadata === 'string' ? JSON.parse(quote.metadata) : quote.metadata;
          // Suporte ao novo formato (objeto) e antigo (array)
          const modules = Array.isArray(rawMeta) ? rawMeta : (rawMeta.modules || []);
          const compProducts = rawMeta.complementaryProducts || [];

          const modulesBody = [
            ...modules.map((mod: any) => {
              let description = (mod.templateName || 'Módulo');

              // Medidas: L x P
              description += `\nMedidas: ${mod.dimensions?.L || 0} x ${mod.dimensions?.P || 0} mm`;

              // Chapa: Nome do Material
              if (mod.materialName) {
                description += `\nChapa: ${mod.materialName}`;
              }

              if (mod.details) {
                const indented = mod.details.split('\n').map((l: string) => '  ' + l).join('\n');
                description += '\n' + indented;
              }
              const modQty = mod.moduleQuantity || 1;
              const subtotal = mod.subtotal || 0;
              const unitPrice = subtotal / modQty;

              return [
                description,
                'unid.',
                `R$ ${unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                modQty.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                `R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ];
            }),
            ...compProducts.map((prod: any) => {
              let description = (prod.name || 'Produto Complementar');
              if (prod.details) {
                description += `\n${prod.details}`;
              }
              const qty = Number(prod.quantity) || 0;
              const unitPrice = Number(prod.price) || 0;
              const total = qty * unitPrice;

              return [
                description,
                prod.unit || 'un',
                `R$ ${unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                qty.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ];
            })
          ];

          autoTable(doc, {
            startY: currentY,
            body: modulesBody,
            showHead: false,
            theme: 'plain',
            styles: { fontSize: 7.5, cellPadding: 3, textColor: [40, 40, 40] },
            margin: { left: 20, right: 20 },
            columnStyles: {
              0: { cellWidth: 80 },
              1: { halign: 'center' },
              2: { halign: 'right' },
              3: { halign: 'center' },
              4: { halign: 'right' }
            },
            willDrawCell: (data) => {
              if (data.column.index === 0 && data.section === 'body') {
                (data.cell as any).rawText = [...data.cell.text];
                data.cell.text = data.cell.text.map(() => '');
              }
            },
            didDrawPage: (data) => {
              currentY = data.cursor ? data.cursor.y : currentY;
            },
            didDrawCell: (data) => {
              if (data.column.index === 0 && data.section === 'body') {
                const cell = data.cell;
                const textLines = (cell as any).rawText;
                if (textLines && textLines.length > 0) {
                  const x = cell.x + cell.padding('left');
                  let y = cell.y + cell.padding('top') + 3.5;

                  // Nome do Módulo (Negrito, +10%)
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(10.5);
                  doc.setTextColor(40, 40, 40);
                  doc.text(textLines[0], x, y);

                  // Detalhes, Medidas e Chapa (Normal, 9pt)
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(9);
                  doc.setTextColor(100, 100, 100);

                  for (let i = 1; i < textLines.length; i++) {
                    y += 4.5;
                    doc.text(textLines[i], x, y);
                  }
                }
              }
            }
          });
          currentY = (doc as any).lastAutoTable.finalY + 10;
        } catch (e) {
          doc.setFont('helvetica', 'normal');
          doc.text(quote.project_name || 'Serviços de marmoraria.', 20, currentY + 5);
          currentY += 15;
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.text('Referente ao projeto: ' + (quote.project_name || 'Serviços de marmoraria.'), 20, currentY + 5);
        currentY += 15;
      }
    } else {
      // -- DETALHAMENTO TÉCNICO (ITEMS E SERVIÇOS) --
      if (!documentSettings?.generalInfo) currentY += 2; // Reduzido de 6 para 2
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(20, currentY, pageWidth - 40, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhamento Técnico', 25, currentY + 5.5);

      currentY += 6; // Reduzido de 10 para 6

      const body = [
        ...(quote.items || []).map((item: any) => [
          item.description || 'Peça em Mármore/Granito',
          'un',
          `R$ ${(item.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          (item.quantity || 1).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
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
    }

    // -- TOTAIS --
    // Ler valores do metadata (novo formato) ou dos serviços (formato antigo)
    let metaData: any = null;
    if (quote.metadata) {
      try {
        metaData = typeof quote.metadata === 'string' ? JSON.parse(quote.metadata) : quote.metadata;
      } catch (e) { }
    }

    let installationValue = 0;
    let deliveryValue = 0;
    let discountValue = 0;
    let discountLabel = 'Desconto';

    if (metaData && metaData.modules) {
      // Novo formato: ler direto do metadata
      const rate = Number(metaData.installationRate) || 0;
      const fee = Number(metaData.deliveryFee) || 0;
      const dv = Number(metaData.discountValue) || 0;
      const dt = metaData.discountType || 'fixed';

      // Calcular área total dos módulos para montagem
      let totalArea = 0;
      (metaData.modules || []).forEach((mod: any) => {
        const modQty = mod.moduleQuantity || 1;
        (mod.parts || []).forEach((part: any) => {
          totalArea += (part.width * part.length * part.quantity * modQty) / 1000000;
        });
      });

      installationValue = rate * totalArea;
      deliveryValue = fee;

      // Calcular desconto
      const subtotalForDiscount = (quote.total_value || 0) + (dt === 'percent' ? ((quote.total_value || 0) * dv / (100 - dv)) : dv);
      if (dt === 'percent') {
        discountValue = quote.discount || 0;
        discountLabel = `Desconto (${dv}%)`;
      } else {
        discountValue = dv;
      }
    } else {
      // Formato antigo: tentar ler dos serviços
      const installationService = (quote.services || []).find((s: any) => s.description && s.description.toLowerCase().includes('montagem'));
      const deliveryService = (quote.services || []).find((s: any) => s.description && s.description.toLowerCase().includes('entrega'));
      installationValue = installationService ? (installationService.quantity * installationService.unit_price) : 0;
      deliveryValue = deliveryService ? (deliveryService.quantity * deliveryService.unit_price) : 0;
      discountValue = quote.discount || 0;
    }

    const baseSubtotal = (quote.total_value || 0) + discountValue - installationValue - deliveryValue;

    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    doc.text('Subtotal:', pageWidth - 80, currentY);
    doc.text(`R$ ${baseSubtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, currentY, { align: 'right' });

    if (installationValue > 0) {
      currentY += 4;
      doc.text('Taxa de Montagem:', pageWidth - 80, currentY);
      doc.text(`R$ ${installationValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, currentY, { align: 'right' });
    }

    if (deliveryValue > 0) {
      currentY += 4;
      doc.text('Taxa de Entrega:', pageWidth - 80, currentY);
      doc.text(`R$ ${deliveryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, currentY, { align: 'right' });
    }

    if (discountValue > 0) {
      currentY += 4;
      doc.setTextColor(200, 0, 0);
      doc.text(`${discountLabel}:`, pageWidth - 80, currentY);
      doc.text(`- R$ ${discountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, currentY, { align: 'right' });
    }

    currentY += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Total Geral:', pageWidth - 80, currentY);
    doc.text(`R$ ${(quote.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, currentY, { align: 'right' });

    // -- CONDIÇÕES E PAGAMENTO --
    currentY += 10;
    if (currentY > pageHeight - 30) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(20, currentY, pageWidth - 40, 7, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Condições e Pagamento', 25, currentY + 4.8);

    // Ajuste do cabeçalho caso showLogo seja false (podemos pular ou mudar o estilo)
    // Atualmente só temos texto, então vamos manter o texto mas respeitar a flag se no futuro tivermos imagem.
    // Se showLogo for false, talvez o cliente queira ocultar o nome da empresa no topo? 
    // O pedido diz "Exibir Logo", mas como não temos upload de imagem ainda, vou assumir que se refere ao bloco do nome.

    currentY += 9;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Prazo de execução:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    
    const signalPercent = (metaData && metaData.signalPercentage) || 50;
    const deadlineText = payment.useDynamicDeadline 
      ? `Até ${quote.delivery_date ? new Date(quote.delivery_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'a combinar'} se sinal de ${signalPercent}% for pago em até dois dias apartir da data do orçamento`
      : (payment.executionDeadline || 'A combinar');
      
    doc.text(deadlineText, 58, currentY);

    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Formas de pagamento:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(payment.paymentMethods || 'A combinar', 58, currentY);

    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Condições:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    
    let conditionsText = payment.conditions || 'A combinar';
    if (metaData && metaData.paymentCondition) {
      if (metaData.paymentCondition === 'avista') {
        conditionsText = 'Pagamento à vista';
      } else {
        const signal = metaData.signalPercentage || 50;
        const remainder = metaData.remainderType === 'avista' ? 'à vista' : `em ${metaData.installments} parcelas`;
        conditionsText = `Sinal de ${signal}% e o restante ${remainder}`;
      }
    }
    
    doc.text(conditionsText, 58, currentY);

    if (payment.showBankData) {
      currentY += 4;
      doc.setFont('helvetica', 'bold');
      doc.text('Dados Bancários:', 20, currentY);
      doc.setFont('helvetica', 'normal');
      let bankInfo = '';
      if (payment.bankName) bankInfo += `Banco: ${payment.bankName} `;
      if (payment.bankAgency) bankInfo += `Ag: ${payment.bankAgency} `;
      if (payment.bankAccount) bankInfo += `Cc: ${payment.bankAccount}`;
      doc.text(bankInfo || 'Não informado', 58, currentY);

      if (payment.pixKey) {
        currentY += 4;
        doc.setFont('helvetica', 'bold');
        doc.text('Chave PIX:', 20, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(payment.pixKey, 58, currentY);
      }
    }

    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    const obsLines = doc.splitTextToSize(payment.observations || 'Orçamento válido por 10 dias úteis.', pageWidth - 80);
    doc.text(obsLines, 58, currentY);
    currentY += (obsLines.length * 3.5);

    // -- ASSINATURAS --
    if (payment.showSignature !== false) {
      currentY += 12;
      if (currentY > pageHeight - 25) {
        doc.addPage();
        currentY = pageHeight - 40;
      }

      doc.setDrawColor(200, 200, 200);
      
      if (payment.useDigitalSignature && payment.signatureImage) {
        try {
          doc.addImage(payment.signatureImage, 'PNG', 30, currentY - 9, 50, 15);
        } catch (e) {
          console.error('Error adding digital signature:', e);
        }
      }

      doc.line(20, currentY, 90, currentY);
      doc.line(pageWidth - 90, currentY, pageWidth - 20, currentY);

      doc.setFontSize(7);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(company.name, 55, currentY + 4, { align: 'center' });
      doc.text(quote.client_name || 'Cliente', pageWidth - 55, currentY + 4, { align: 'center' });
    }

    // -- RODAPÉ --
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.text(`Agradecemos a preferência! Equipe ${company.name}.`, pageWidth / 2, pageHeight - 8, { align: 'center' });

    const safeClientName = (quote.client_name || 'Cliente').replace(/\s+/g, '_');
    const safeProjectName = (quote.project_name || 'Projeto').replace(/\s+/g, '_');
    const typeLabel = type === 'comercial' ? 'proposta' : 'orcamento';
    const fileName = `${typeLabel}_${quote.id || '0'}_${safeClientName}_${safeProjectName}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
