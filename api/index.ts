import "dotenv/config";
import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import fs from "fs";

const prisma = new PrismaClient();
const upload = multer({ dest: '/tmp' }); // Vercel only allows writing to /tmp

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API Routes
app.get("/api/notifications", async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar notificações dispensadas
    const dismissed = await prisma.dismissed_notifications.findMany();
    const dismissedKeys = new Set(dismissed.map(d => d.notification_key));

    const delayedQuotes = await prisma.quotes.findMany({
      where: {
        status: { notIn: ['Entregue', 'Cancelado'] },
        delivery_date: {
          not: null,
          lt: today
        }
      },
      include: {
        clients: true
      },
      orderBy: {
        delivery_date: 'asc'
      }
    });
    
    const formattedDelayedQuotes = delayedQuotes.map(q => ({
      id: q.id,
      type: 'quote_delay' as const,
      project_name: q.project_name,
      client_name: q.clients?.name,
      delivery_date: q.delivery_date
    }));

    // Overdue payments
    const overduePayments = await prisma.payments.findMany({
      where: {
        status: 'pendente',
        due_date: { lt: new Date() }
      },
      include: { clients: true }
    });

    const formattedOverduePayments = overduePayments.map(p => ({
      id: p.id,
      type: 'payment_overdue' as const,
      amount: p.amount,
      client_name: p.clients?.name,
      due_date: p.due_date?.toISOString()
    }));
    
    // Filtrar notificações dispensadas
    const allNotifications = [...formattedDelayedQuotes, ...formattedOverduePayments];
    const filtered = allNotifications.filter(n => !dismissedKeys.has(`${n.type}-${n.id}`));

    res.json(filtered);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

// Dispensar notificação individual
app.post("/api/notifications/dismiss", async (req, res) => {
  try {
    const { key } = req.body;
    await prisma.dismissed_notifications.upsert({
      where: { notification_key: key },
      update: {},
      create: { notification_key: key }
    });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao dispensar notificação' });
  }
});

// Dispensar todas as notificações
app.post("/api/notifications/dismiss-all", async (req, res) => {
  try {
    const { keys } = req.body;
    for (const key of keys) {
      await prisma.dismissed_notifications.upsert({
        where: { notification_key: key },
        update: {},
        create: { notification_key: key }
      });
    }
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao dispensar notificações' });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const calculateTrend = (current: number, previous: number) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const results = await Promise.all([
      prisma.quotes.count({ where: { status: 'Pendente' } }).catch(() => 0),
      prisma.quotes.count({ where: { status: 'Pendente', created_at: { gte: startOfMonth } } }).catch(() => 0),
      prisma.quotes.count({ where: { status: 'Pendente', created_at: { gte: startOfLastMonth, lt: startOfMonth } } }).catch(() => 0),
      
      prisma.clients.count().catch(() => 0),
      prisma.clients.count({ where: { created_at: { gte: startOfMonth } } }).catch(() => 0),
      prisma.clients.count({ where: { created_at: { gte: startOfLastMonth, lt: startOfMonth } } }).catch(() => 0),

      prisma.quotes.aggregate({ 
        _sum: { total_value: true }, 
        where: { status: { in: ['Aprovado', 'Em Produção', 'Entregue'] }, created_at: { gte: startOfMonth } } 
      }).catch(() => ({ _sum: { total_value: 0 } })),
      prisma.quotes.aggregate({ 
        _sum: { total_value: true }, 
        where: { status: { in: ['Aprovado', 'Em Produção', 'Entregue'] }, created_at: { gte: startOfLastMonth, lt: startOfMonth } } 
      }).catch(() => ({ _sum: { total_value: 0 } })),

      prisma.quotes.count({ where: { status: 'Em Produção' } }).catch(() => 0),
      prisma.quotes.count({ where: { status: 'Em Produção', created_at: { gte: startOfMonth } } }).catch(() => 0),
      prisma.quotes.count({ where: { status: 'Em Produção', created_at: { gte: startOfLastMonth, lt: startOfMonth } } }).catch(() => 0),

      prisma.quotes.count({ where: { status: 'Aprovado' } }).catch(() => 0),
      prisma.quotes.count({ where: { status: 'Aprovado', created_at: { gte: startOfMonth } } }).catch(() => 0),
      prisma.quotes.count({ where: { status: 'Aprovado', created_at: { gte: startOfLastMonth, lt: startOfMonth } } }).catch(() => 0),

      prisma.payments.aggregate({
        _sum: { amount: true },
        where: { status: 'pendente', due_date: { gte: now } }
      }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.payments.aggregate({
        _sum: { amount: true },
        where: { status: 'pendente', due_date: { lt: now } }
      }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.payments.aggregate({
        _sum: { amount: true },
        where: { status: 'pago' }
      }).catch(() => ({ _sum: { amount: 0 } }))
    ]);

    const [
      pendingQuotes, pendingCurrent, pendingLast,
      totalClients, clientsCurrent, clientsLast,
      monthlyRevenue, revenueLast,
      inProduction, prodCurrent, prodLast,
      approvedQuotes, approvedCurrent, approvedLast,
      receivableAgg, overdueAgg, receivedAgg
    ] = results;

    const currentRev = monthlyRevenue?._sum?.total_value || 0;
    const lastRev = revenueLast?._sum?.total_value || 0;

    res.json({
      pendingQuotes: pendingQuotes || 0,
      pendingQuotesTrend: calculateTrend(pendingCurrent || 0, pendingLast || 0),
      approvedQuotes: approvedQuotes || 0,
      approvedQuotesTrend: calculateTrend(approvedCurrent || 0, approvedLast || 0),
      totalClients: totalClients || 0,
      totalClientsTrend: calculateTrend(clientsCurrent || 0, clientsLast || 0),
      monthlyRevenue: currentRev,
      monthlyRevenueTrend: calculateTrend(currentRev, lastRev),
      inProduction: inProduction || 0,
      inProductionTrend: calculateTrend(prodCurrent || 0, prodLast || 0),
      totalReceivable: receivableAgg?._sum?.amount || 0,
      totalOverdue: overdueAgg?._sum?.amount || 0,
      totalReceived: receivedAgg?._sum?.amount || 0
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get("/api/clients", async (req, res) => {
  const clients = await prisma.clients.findMany({
    orderBy: { created_at: 'desc' }
  });
  res.json(clients);
});

app.post("/api/clients", async (req, res) => {
  const { name, document, phone, address } = req.body;
  const client = await prisma.clients.create({
    data: { name, document, phone, address }
  });
  res.json({ id: client.id });
});

app.get("/api/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = parseInt(id);
    const client = await prisma.clients.findUnique({
      where: { id: clientId }
    });
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  } catch (e) {
    res.status(500).json(null);
  }
});

app.put("/api/clients/:id", async (req, res) => {
  const { id } = req.params;
  const { name, document, phone, address } = req.body;
  await prisma.clients.update({
    where: { id: parseInt(id) },
    data: { name, document, phone, address }
  });
  res.json({ success: true });
});

app.delete("/api/clients/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.clients.delete({
    where: { id: parseInt(id) }
  });
  res.json({ success: true });
});

app.get("/api/payments", async (req, res) => {
  try {
    const { client_id } = req.query;
    const payments = await prisma.payments.findMany({
      where: { client_id: parseInt(client_id as string) },
      orderBy: { created_at: 'desc' }
    });
    res.json(payments || []);
  } catch (e) {
    res.json([]);
  }
});

app.post("/api/payments", async (req, res) => {
  const { client_id, amount, due_date, payment_date, status, description } = req.body;
  const payment = await prisma.payments.create({
    data: {
      client_id: parseInt(client_id),
      amount,
      due_date: due_date ? new Date(due_date) : null,
      payment_date: payment_date ? new Date(payment_date) : null,
      status,
      description
    }
  });
  res.json(payment);
});

app.patch("/api/payments/:id", async (req, res) => {
  const { id } = req.params;
  const { status, payment_date, description } = req.body;
  await prisma.payments.update({
    where: { id: parseInt(id) },
    data: { status, payment_date: payment_date ? new Date(payment_date) : undefined, description }
  });
  res.json({ success: true });
});

app.delete("/api/payments/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.payments.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

app.get("/api/materials", async (req, res) => {
  const materials = await prisma.materials.findMany();
  res.json(materials);
});

app.post("/api/materials", async (req, res) => {
  const { name, price, quantity, description } = req.body;
  const material = await prisma.materials.create({
    data: { name, price, quantity, description }
  });
  res.json({ id: material.id });
});

app.put("/api/materials/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, quantity, description } = req.body;
  
  if (name !== undefined) {
    await prisma.materials.update({
      where: { id: parseInt(id) },
      data: { name, price, quantity, description }
    });
  } else {
    await prisma.materials.update({
      where: { id: parseInt(id) },
      data: { quantity }
    });
  }
  res.json({ success: true });
});

app.delete("/api/materials/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.materials.delete({
    where: { id: parseInt(id) }
  });
  res.json({ success: true });
});

app.get("/api/remnants", async (req, res) => {
  const remnants = await prisma.remnants.findMany({
    include: { materials: true },
    orderBy: { created_at: 'desc' }
  });
  res.json(remnants.map(r => ({ ...r, material_name: r.materials?.name })));
});

app.post("/api/remnants", async (req, res) => {
  const { material_id, width, length, quantity, location, observations } = req.body;
  const remnant = await prisma.remnants.create({
    data: {
      material_id: parseInt(material_id),
      width: parseFloat(width),
      length: parseFloat(length),
      quantity: parseInt(quantity) || 1,
      location,
      observations
    }
  });
  res.json(remnant);
});

app.delete("/api/remnants/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.remnants.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

app.get("/api/services", async (req, res) => {
  const servicesList = await prisma.services.findMany();
  res.json(servicesList);
});

app.post("/api/services", async (req, res) => {
  const { name, price, description, minutes_per_meter, category } = req.body;
  const service = await prisma.services.create({
    data: { name, price, description, minutes_per_meter: minutes_per_meter || 0, category: category || 'other' }
  });
  res.json({ id: service.id });
});

app.put("/api/services/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, description, minutes_per_meter, category } = req.body;
  await prisma.services.update({
    where: { id: parseInt(id) },
    data: { name, price, description, minutes_per_meter: minutes_per_meter || 0, category: category || 'other' }
  });
  res.json({ success: true });
});

app.delete("/api/services/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.services.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

app.get("/api/description-templates", async (req, res) => {
  const templates = await prisma.description_templates.findMany();
  res.json(templates);
});

app.post("/api/description-templates", async (req, res) => {
  const { text } = req.body;
  try {
    const template = await prisma.description_templates.create({ data: { text } });
    res.json({ id: template.id });
  } catch (e) {
    res.status(400).json({ error: "Template already exists" });
  }
});

app.delete("/api/description-templates/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.description_templates.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

app.get("/api/quotes", async (req, res) => {
  const { client_id } = req.query;
  const where = client_id ? { client_id: parseInt(client_id as string) } : {};
  const quotesList = await prisma.quotes.findMany({
    where,
    include: { clients: true },
    orderBy: { created_at: 'desc' }
  });
  res.json(quotesList.map(q => ({ ...q, client_name: q.clients?.name })));
});

// Fotos de Orçamentos
app.get("/api/quotes/:id/photos", async (req, res) => {
  const { id } = req.params;
  try {
    const photos = await prisma.quote_photos.findMany({
      where: { quote_id: parseInt(id) },
      orderBy: { created_at: 'desc' }
    });
    res.json(photos);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar fotos' });
  }
});

app.post("/api/quotes/:id/photos", async (req, res) => {
  const { id } = req.params;
  const { url, description } = req.body;
  try {
    const photo = await prisma.quote_photos.create({
      data: {
        quote_id: parseInt(id),
        url,
        description
      }
    });
    res.json(photo);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao salvar foto' });
  }
});

app.delete("/api/photos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.quote_photos.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao deletar foto' });
  }
});

app.post("/api/quotes", async (req, res) => {
  const { client_id, project_name, total_value, discount, delivery_date, items, services } = req.body;
  const quote = await prisma.quotes.create({
    data: {
      client_id: parseInt(client_id),
      project_name,
      total_value,
      discount: discount || 0,
      delivery_date: delivery_date || null,
      status: 'Pendente',
      quote_items: {
        create: items.map((item: any) => ({
          material_id: parseInt(item.material_id),
          length: item.length,
          width: item.width,
          quantity: item.quantity,
          subtotal_m2: item.subtotal_m2,
          description: item.description
        }))
      },
      quote_services: {
        create: services ? services.map((s: any) => ({
          service_id: parseInt(s.service_id),
          quantity: s.quantity,
          unit_price: s.unit_price,
          description: s.description
        })) : []
      }
    }
  });
  res.json({ id: quote.id });
});

app.get("/api/quotes/:id", async (req, res) => {
  const { id } = req.params;
  const quote = await prisma.quotes.findUnique({
    where: { id: parseInt(id) },
    include: {
      clients: true,
      quote_items: { include: { materials: true } },
      quote_services: true
    }
  });
  if (!quote) return res.status(404).json({ error: "Quote not found" });
  res.json({
    ...quote,
    client_name: quote.clients?.name,
    items: quote.quote_items.map(item => ({ ...item, material_name: item.materials?.name })),
    services: quote.quote_services
  });
});

app.put("/api/quotes/:id", async (req, res) => {
  const { id } = req.params;
  const { client_id, project_name, total_value, discount, delivery_date, items, services } = req.body;
  await prisma.$transaction([
    prisma.quotes.update({
      where: { id: parseInt(id) },
      data: {
        client_id: parseInt(client_id),
        project_name,
        total_value,
        discount: discount || 0,
        delivery_date: delivery_date || null
      }
    }),
    prisma.quote_items.deleteMany({ where: { quote_id: parseInt(id) } }),
    prisma.quote_services.deleteMany({ where: { quote_id: parseInt(id) } }),
    prisma.quote_items.createMany({
      data: items.map((item: any) => ({
        quote_id: parseInt(id),
        material_id: parseInt(item.material_id),
        length: item.length,
        width: item.width,
        quantity: item.quantity,
        subtotal_m2: item.subtotal_m2,
        description: item.description
      }))
    }),
    prisma.quote_services.createMany({
      data: services ? services.map((s: any) => ({
        quote_id: parseInt(id),
        service_id: parseInt(s.service_id),
        quantity: s.quantity,
        unit_price: s.unit_price,
        description: s.description
      })) : []
    })
  ]);
  res.json({ success: true });
});

app.patch("/api/quotes/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  await prisma.quotes.update({
    where: { id: parseInt(id) },
    data: { status }
  });
  res.json({ success: true });
});

app.delete("/api/quotes/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.$transaction([
    prisma.quote_items.deleteMany({ where: { quote_id: parseInt(id) } }),
    prisma.quote_services.deleteMany({ where: { quote_id: parseInt(id) } }),
    prisma.quotes.delete({ where: { id: parseInt(id) } })
  ]);
  res.json({ success: true });
});

app.get("/api/cut-plans", async (req, res) => {
  const plans = await prisma.cut_plans.findMany({ orderBy: { created_at: 'desc' } });
  res.json(plans);
});

app.post("/api/cut-plans", async (req, res) => {
  const { name, items, plan, manual_positions, sheet_width, sheet_height, saw_thickness } = req.body;
  const cutPlan = await prisma.cut_plans.create({
    data: {
      name,
      items: JSON.stringify(items),
      plan: JSON.stringify(plan),
      manual_positions: JSON.stringify(manual_positions),
      sheet_width,
      sheet_height,
      saw_thickness
    }
  });
  res.json({ id: cutPlan.id });
});

app.get("/api/cut-plans/:id", async (req, res) => {
  const { id } = req.params;
  const planDetails = await prisma.cut_plans.findUnique({ where: { id: parseInt(id) } });
  if (!planDetails) return res.status(404).json({ error: "Plan not found" });
  res.json({
    ...planDetails,
    items: JSON.parse(planDetails.items),
    plan: JSON.parse(planDetails.plan),
    manual_positions: JSON.parse(planDetails.manual_positions)
  });
});

app.delete("/api/cut-plans/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.cut_plans.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

app.get("/api/module-templates", async (req, res) => {
  const templates = await prisma.module_templates.findMany();
  res.json(templates.map((t: any) => ({ ...t, parts: JSON.parse(t.parts) })));
});

app.post("/api/module-templates", async (req, res) => {
  const { name, description, parts } = req.body;
  const template = await prisma.module_templates.create({
    data: { name, description, parts: JSON.stringify(parts) }
  });
  res.json({ id: template.id });
});

app.put("/api/module-templates/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, parts } = req.body;
  await prisma.module_templates.update({
    where: { id: parseInt(id) },
    data: { name, description, parts: JSON.stringify(parts) }
  });
  res.json({ success: true });
});

app.delete("/api/module-templates/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.module_templates.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

app.get("/api/supplies", async (req, res) => {
  const suppliesList = await prisma.supplies.findMany();
  res.json(suppliesList);
});

app.post("/api/supplies", async (req, res) => {
  const { name, price_per_meter, minutes_per_meter, unit } = req.body;
  const supply = await prisma.supplies.create({
    data: { name, price_per_meter, minutes_per_meter, unit: unit || 'm' }
  });
  res.json({ id: supply.id });
});

app.put("/api/supplies/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price_per_meter, minutes_per_meter, unit } = req.body;
  await prisma.supplies.update({
    where: { id: parseInt(id) },
    data: { name, price_per_meter, minutes_per_meter, unit: unit || 'm' }
  });
  res.json({ success: true });
});

app.delete("/api/supplies/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.supplies.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

app.get("/api/backup", async (req, res) => {
  try {
    const [
      clients, materials, services, quotes, quote_items, 
      quote_services, cut_plans, description_templates, 
      module_templates, supplies
    ] = await Promise.all([
      prisma.clients.findMany(),
      prisma.materials.findMany(),
      prisma.services.findMany(),
      prisma.quotes.findMany(),
      prisma.quote_items.findMany(),
      prisma.quote_services.findMany(),
      prisma.cut_plans.findMany(),
      prisma.description_templates.findMany(),
      prisma.module_templates.findMany(),
      prisma.supplies.findMany()
    ]);
    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      data: {
        clients, materials, services, quotes, quote_items, 
        quote_services, cut_plans, description_templates, 
        module_templates, supplies
      }
    };
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    res.status(500).json({ error: "Failed to generate backup" });
  }
});

app.post("/api/restore", upload.single('backup'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const backup = JSON.parse(fileContent);
    const { data } = backup;
    await prisma.$transaction(async (tx) => {
      await tx.quote_services.deleteMany();
      await tx.quote_items.deleteMany();
      await tx.quotes.deleteMany();
      await tx.clients.deleteMany();
      await tx.materials.deleteMany();
      await tx.services.deleteMany();
      await tx.cut_plans.deleteMany();
      await tx.description_templates.deleteMany();
      await tx.module_templates.deleteMany();
      await tx.supplies.deleteMany();
      if (data.clients?.length) await tx.clients.createMany({ data: data.clients });
      if (data.materials?.length) await tx.materials.createMany({ data: data.materials });
      if (data.services?.length) await tx.services.createMany({ data: data.services });
      if (data.quotes?.length) await tx.quotes.createMany({ data: data.quotes });
      if (data.quote_items?.length) await tx.quote_items.createMany({ data: data.quote_items });
      if (data.quote_services?.length) await tx.quote_services.createMany({ data: data.quote_services });
      if (data.cut_plans?.length) await tx.cut_plans.createMany({ data: data.cut_plans });
      if (data.description_templates?.length) await tx.description_templates.createMany({ data: data.description_templates });
      if (data.module_templates?.length) await tx.module_templates.createMany({ data: data.module_templates });
      if (data.supplies?.length) await tx.supplies.createMany({ data: data.supplies });
    });
    fs.unlinkSync(req.file.path);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to restore backup" });
  }
});

export default app;
