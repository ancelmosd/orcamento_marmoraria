import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";

import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const upload = multer({ dest: '/tmp' }); // Vercel only allows writing to /tmp

const app = express();
app.use(express.json());

// API Routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
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
      
      const formatted = delayedQuotes.map(q => ({
        id: q.id,
        project_name: q.project_name,
        client_name: q.clients?.name,
        delivery_date: q.delivery_date
      }));
      
      res.json(formatted);
    } catch (e) {
      console.error(e);
      res.status(500).json([]);
    }
  });

  app.get("/api/stats", async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Helper to calculate trend percentage
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const [
      pendingQuotes, pendingCurrent, pendingLast,
      totalClients, clientsCurrent, clientsLast,
      monthlyRevenue, revenueLast,
      inProduction, prodCurrent, prodLast,
      approvedQuotes, approvedCurrent, approvedLast
    ] = await Promise.all([
      prisma.quotes.count({ where: { status: 'Pendente' } }),
      prisma.quotes.count({ where: { status: 'Pendente', created_at: { gte: startOfMonth } } }),
      prisma.quotes.count({ where: { status: 'Pendente', created_at: { gte: startOfLastMonth, lt: startOfMonth } } }),
      
      prisma.clients.count(),
      prisma.clients.count({ where: { created_at: { gte: startOfMonth } } }),
      prisma.clients.count({ where: { created_at: { gte: startOfLastMonth, lt: startOfMonth } } }),

      prisma.quotes.aggregate({ 
        _sum: { total_value: true }, 
        where: { status: { in: ['Aprovado', 'Em Produção', 'Entregue'] }, created_at: { gte: startOfMonth } } 
      }),
      prisma.quotes.aggregate({ 
        _sum: { total_value: true }, 
        where: { status: { in: ['Aprovado', 'Em Produção', 'Entregue'] }, created_at: { gte: startOfLastMonth, lt: startOfMonth } } 
      }),

      prisma.quotes.count({ where: { status: 'Em Produção' } }),
      prisma.quotes.count({ where: { status: 'Em Produção', created_at: { gte: startOfMonth } } }),
      prisma.quotes.count({ where: { status: 'Em Produção', created_at: { gte: startOfLastMonth, lt: startOfMonth } } }),

      prisma.quotes.count({ where: { status: 'Aprovado' } }),
      prisma.quotes.count({ where: { status: 'Aprovado', created_at: { gte: startOfMonth } } }),
      prisma.quotes.count({ where: { status: 'Aprovado', created_at: { gte: startOfLastMonth, lt: startOfMonth } } }),
    ]);

    res.json({
      pendingQuotes,
      pendingQuotesTrend: calculateTrend(pendingCurrent, pendingLast),
      approvedQuotes,
      approvedQuotesTrend: calculateTrend(approvedCurrent, approvedLast),
      totalClients,
      totalClientsTrend: calculateTrend(clientsCurrent, clientsLast),
      monthlyRevenue: monthlyRevenue._sum.total_value || 0,
      monthlyRevenueTrend: calculateTrend(monthlyRevenue._sum.total_value || 0, (revenueLast._sum.total_value as any) || 0),
      inProduction,
      inProductionTrend: calculateTrend(prodCurrent, prodLast)
    });
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
      // Partial update for quantity only
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
    await prisma.services.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  });

  app.get("/api/description-templates", async (req, res) => {
    const templates = await prisma.description_templates.findMany();
    res.json(templates);
  });

  app.post("/api/description-templates", async (req, res) => {
    const { text } = req.body;
    try {
      const template = await prisma.description_templates.create({
        data: { text }
      });
      res.json({ id: template.id });
    } catch (e) {
      res.status(400).json({ error: "Template already exists" });
    }
  });

  app.delete("/api/description-templates/:id", async (req, res) => {
    const { id } = req.params;
    await prisma.description_templates.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  });

  app.get("/api/quotes", async (req, res) => {
    const quotesList = await prisma.quotes.findMany({
      include: {
        clients: true
      },
      orderBy: { created_at: 'desc' }
    });
    
    const formatted = quotesList.map(q => ({
      ...q,
      client_name: q.clients?.name
    }));
    
    res.json(formatted);
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
        quote_items: {
          include: {
            materials: true
          }
        },
        quote_services: true
      }
    });
    
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    
    // Format to match old structure
    res.json({
      ...quote,
      client_name: quote.clients?.name,
      items: quote.quote_items.map(item => ({
        ...item,
        material_name: item.materials?.name
      })),
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
    const plans = await prisma.cut_plans.findMany({
      orderBy: { created_at: 'desc' }
    });
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
    const plan = await prisma.cut_plans.findUnique({
      where: { id: parseInt(id) }
    });
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.json({
      ...plan,
      items: JSON.parse(plan.items),
      plan: JSON.parse(plan.plan),
      manual_positions: JSON.parse(plan.manual_positions)
    });
  });

  app.delete("/api/cut-plans/:id", async (req, res) => {
    const { id } = req.params;
    await prisma.cut_plans.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  });

  // Module Templates API
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
    await prisma.module_templates.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  });

  // Supplies API
  app.get("/api/supplies", async (req, res) => {
    const suppliesList = await prisma.supplies.findMany();
    res.json(suppliesList);
  });

  app.post("/api/supplies", async (req, res) => {
    const { name, price_per_meter, minutes_per_meter } = req.body;
    const supply = await prisma.supplies.create({
      data: { name, price_per_meter, minutes_per_meter }
    });
    res.json({ id: supply.id });
  });

  app.put("/api/supplies/:id", async (req, res) => {
    const { id } = req.params;
    const { name, price_per_meter, minutes_per_meter } = req.body;
    await prisma.supplies.update({
      where: { id: parseInt(id) },
      data: { name, price_per_meter, minutes_per_meter }
    });
    res.json({ success: true });
  });

  app.delete("/api/supplies/:id", async (req, res) => {
    const { id } = req.params;
    await prisma.supplies.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  });

  // Backup and Restore (Novo Sistema JSON Universal)
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
      res.setHeader('Content-Disposition', `attachment; filename=backup_marmoraria_${new Date().toISOString().split('T')[0]}.json`);
      res.send(JSON.stringify(backupData, null, 2));
    } catch (error) {
      console.error("Backup error:", error);
      res.status(500).json({ error: "Falha ao gerar backup" });
    }
  });

  app.post("/api/restore", upload.single('backup'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

    try {
      const fileContent = fs.readFileSync(req.file.path, 'utf-8');
      const backup = JSON.parse(fileContent);
      const { data } = backup;

      await prisma.$transaction(async (tx) => {
        // 1. Limpar dados existentes (em ordem de dependência)
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

        // 2. Inserir dados do backup
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
      res.json({ success: true, message: "Restauração concluída com sucesso!" });
    } catch (error) {
      console.error("Restore error:", error);
      res.status(500).json({ error: "Falha ao processar arquivo de backup" });
    }
  });

  // Export for Vercel
  export default app;

  // Listen locally if not on Vercel
  if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
