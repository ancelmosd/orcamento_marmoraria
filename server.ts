import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("marmoraria.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity REAL DEFAULT 0,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    minutes_per_meter REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    project_name TEXT,
    total_value REAL,
    discount REAL DEFAULT 0,
    status TEXT DEFAULT 'Rascunho',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS quote_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER,
    material_id INTEGER,
    length REAL,
    width REAL,
    quantity INTEGER,
    subtotal_m2 REAL,
    description TEXT,
    FOREIGN KEY (quote_id) REFERENCES quotes(id),
    FOREIGN KEY (material_id) REFERENCES materials(id)
  );

  CREATE TABLE IF NOT EXISTS quote_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER,
    service_id INTEGER,
    quantity REAL,
    unit_price REAL,
    description TEXT,
    FOREIGN KEY (quote_id) REFERENCES quotes(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  CREATE TABLE IF NOT EXISTS description_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL UNIQUE
  );
`);

  // Seed initial data if empty
  try {
    db.prepare("ALTER TABLE quote_items ADD COLUMN description TEXT").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE quote_services ADD COLUMN description TEXT").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE services ADD COLUMN minutes_per_meter REAL DEFAULT 0").run();
  } catch (e) {}
  const clientCount = db.prepare("SELECT COUNT(*) as count FROM clients").get() as { count: number };
  if (clientCount.count === 0) {
    db.prepare("INSERT INTO clients (name, document, phone, address) VALUES (?, ?, ?, ?)").run(
      "Ancelmo Siqueira Dias", "93421818304", "89994384164", "Rua Principal, 123"
    );
    db.prepare("INSERT INTO clients (name, document, phone, address) VALUES (?, ?, ?, ?)").run(
      "Ricardo Oliveira", "123.456.789-00", "(11) 98877-6655", "Av. das Américas, 500 - RJ"
    );
    db.prepare("INSERT INTO materials (name, price, quantity, description) VALUES (?, ?, ?, ?)").run(
      "Mármore Carrara", 850, 15.5, "Mármore italiano clássico"
    );
    db.prepare("INSERT INTO materials (name, price, quantity, description) VALUES (?, ?, ?, ?)").run(
      "Granito São Gabriel", 420, 42.0, "Granito brasileiro de granulação fina"
    );
    db.prepare("INSERT INTO services (name, price, description, minutes_per_meter) VALUES (?, ?, ?, ?)").run(
      "Meia Esquadria 45°", 120, "Corte preciso em 45 graus", 15
    );
    db.prepare("INSERT INTO description_templates (text) VALUES (?)").run("Bancada Pia");
    db.prepare("INSERT INTO description_templates (text) VALUES (?)").run("Rodapé");
    db.prepare("INSERT INTO description_templates (text) VALUES (?)").run("Soleira");
    db.prepare("INSERT INTO description_templates (text) VALUES (?)").run("Peitoril");
    db.prepare("INSERT INTO description_templates (text) VALUES (?)").run("Ilha");
  } else {
    // Ensure Ancelmo is there for the demo
    const ancelmo = db.prepare("SELECT * FROM clients WHERE name = ?").get("Ancelmo Siqueira Dias");
    if (!ancelmo) {
      db.prepare("INSERT INTO clients (name, document, phone, address) VALUES (?, ?, ?, ?)").run(
        "Ancelmo Siqueira Dias", "93421818304", "89994384164", "Rua Principal, 123"
      );
    }
  }

  // Add cut_plans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cut_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      items TEXT NOT NULL,
      plan TEXT NOT NULL,
      manual_positions TEXT NOT NULL,
      sheet_width INTEGER,
      sheet_height INTEGER,
      saw_thickness INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/stats", (req, res) => {
    const pendingQuotes = db.prepare("SELECT COUNT(*) as count FROM quotes WHERE status = 'Pendente'").get() as any;
    const totalClients = db.prepare("SELECT COUNT(*) as count FROM clients").get() as any;
    const monthlyRevenue = db.prepare("SELECT SUM(total_value) as total FROM quotes WHERE status IN ('Aprovado', 'Em Produção', 'Entregue')").get() as any;
    const inProduction = db.prepare("SELECT COUNT(*) as count FROM quotes WHERE status = 'Em Produção'").get() as any;
    
    res.json({
      pendingQuotes: pendingQuotes.count || 0,
      totalClients: totalClients.count || 0,
      monthlyRevenue: monthlyRevenue.total || 0,
      inProduction: inProduction.count || 0
    });
  });

  app.get("/api/clients", (req, res) => {
    const clients = db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all();
    res.json(clients);
  });

  app.post("/api/clients", (req, res) => {
    const { name, document, phone, address } = req.body;
    const result = db.prepare("INSERT INTO clients (name, document, phone, address) VALUES (?, ?, ?, ?)").run(name, document, phone, address);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/clients/:id", (req, res) => {
    const { id } = req.params;
    const { name, document, phone, address } = req.body;
    db.prepare("UPDATE clients SET name = ?, document = ?, phone = ?, address = ? WHERE id = ?").run(name, document, phone, address, id);
    res.json({ success: true });
  });

  app.delete("/api/clients/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM clients WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/materials", (req, res) => {
    const materials = db.prepare("SELECT * FROM materials").all();
    res.json(materials);
  });

  app.post("/api/materials", (req, res) => {
    const { name, price, quantity, description } = req.body;
    const result = db.prepare("INSERT INTO materials (name, price, quantity, description) VALUES (?, ?, ?, ?)").run(name, price, quantity, description);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/materials/:id", (req, res) => {
    const { id } = req.params;
    const { name, price, quantity, description } = req.body;
    
    if (name !== undefined) {
      db.prepare("UPDATE materials SET name = ?, price = ?, quantity = ?, description = ? WHERE id = ?")
        .run(name, price, quantity, description, id);
    } else {
      // Partial update for quantity only (from the quick add button)
      db.prepare("UPDATE materials SET quantity = ? WHERE id = ?").run(quantity, id);
    }
    res.json({ success: true });
  });

  app.delete("/api/materials/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM materials WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/services", (req, res) => {
    const services = db.prepare("SELECT * FROM services").all();
    res.json(services);
  });

  app.post("/api/services", (req, res) => {
    const { name, price, description, minutes_per_meter } = req.body;
    const result = db.prepare("INSERT INTO services (name, price, description, minutes_per_meter) VALUES (?, ?, ?, ?)").run(name, price, description, minutes_per_meter || 0);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/services/:id", (req, res) => {
    const { id } = req.params;
    const { name, price, description, minutes_per_meter } = req.body;
    db.prepare("UPDATE services SET name = ?, price = ?, description = ?, minutes_per_meter = ? WHERE id = ?").run(name, price, description, minutes_per_meter || 0, id);
    res.json({ success: true });
  });

  app.delete("/api/services/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM services WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/description-templates", (req, res) => {
    const templates = db.prepare("SELECT * FROM description_templates").all();
    res.json(templates);
  });

  app.post("/api/description-templates", (req, res) => {
    const { text } = req.body;
    try {
      const result = db.prepare("INSERT INTO description_templates (text) VALUES (?)").run(text);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Template already exists" });
    }
  });

  app.delete("/api/description-templates/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM description_templates WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/quotes", (req, res) => {
    const quotes = db.prepare(`
      SELECT q.*, c.name as client_name 
      FROM quotes q 
      JOIN clients c ON q.client_id = c.id 
      ORDER BY q.created_at DESC
    `).all();
    res.json(quotes);
  });

  app.post("/api/quotes", (req, res) => {
    const { client_id, project_name, total_value, discount, items, services } = req.body;
    const insertQuote = db.prepare("INSERT INTO quotes (client_id, project_name, total_value, discount, status) VALUES (?, ?, ?, ?, 'Pendente')");
    const insertItem = db.prepare("INSERT INTO quote_items (quote_id, material_id, length, width, quantity, subtotal_m2, description) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const insertService = db.prepare("INSERT INTO quote_services (quote_id, service_id, quantity, unit_price, description) VALUES (?, ?, ?, ?, ?)");
    
    const transaction = db.transaction((quoteData, itemData, serviceData) => {
      const result = insertQuote.run(quoteData.client_id, quoteData.project_name, quoteData.total_value, quoteData.discount);
      const quoteId = result.lastInsertRowid;
      
      for (const item of itemData) {
        insertItem.run(quoteId, item.material_id, item.length, item.width, item.quantity, item.subtotal_m2, item.description);
      }
      
      if (serviceData) {
        for (const service of serviceData) {
          insertService.run(quoteId, service.service_id, service.quantity, service.unit_price, service.description);
        }
      }
      
      return quoteId;
    });

    const quoteId = transaction({ client_id, project_name, total_value, discount }, items, services);
    res.json({ id: quoteId });
  });

  app.get("/api/quotes/:id", (req, res) => {
    const { id } = req.params;
    const quote = db.prepare("SELECT * FROM quotes WHERE id = ?").get(id) as any;
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    
    const items = db.prepare(`
      SELECT qi.*, m.name as material_name 
      FROM quote_items qi 
      JOIN materials m ON qi.material_id = m.id 
      WHERE qi.quote_id = ?
    `).all(id);
    const services = db.prepare("SELECT * FROM quote_services WHERE quote_id = ?").all(id);
    
    res.json({ ...quote, items, services });
  });

  app.put("/api/quotes/:id", (req, res) => {
    const { id } = req.params;
    const { client_id, project_name, total_value, discount, items, services } = req.body;
    
    const updateQuote = db.prepare("UPDATE quotes SET client_id = ?, project_name = ?, total_value = ?, discount = ? WHERE id = ?");
    const deleteItems = db.prepare("DELETE FROM quote_items WHERE quote_id = ?");
    const deleteServices = db.prepare("DELETE FROM quote_services WHERE quote_id = ?");
    const insertItem = db.prepare("INSERT INTO quote_items (quote_id, material_id, length, width, quantity, subtotal_m2, description) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const insertService = db.prepare("INSERT INTO quote_services (quote_id, service_id, quantity, unit_price, description) VALUES (?, ?, ?, ?, ?)");
    
    const transaction = db.transaction((quoteData, itemData, serviceData) => {
      updateQuote.run(quoteData.client_id, quoteData.project_name, quoteData.total_value, quoteData.discount, id);
      
      deleteItems.run(id);
      for (const item of itemData) {
        insertItem.run(id, item.material_id, item.length, item.width, item.quantity, item.subtotal_m2, item.description);
      }
      
      deleteServices.run(id);
      if (serviceData) {
        for (const service of serviceData) {
          insertService.run(id, service.service_id, service.quantity, service.unit_price, service.description);
        }
      }
      
      return id;
    });

    transaction({ client_id, project_name, total_value, discount }, items, services);
    res.json({ success: true });
  });

  app.patch("/api/quotes/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE quotes SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  });

  app.delete("/api/quotes/:id", (req, res) => {
    const { id } = req.params;
    // Delete items and services first due to foreign keys (though SQLite might handle it if ON DELETE CASCADE was used, but let's be safe)
    db.prepare("DELETE FROM quote_items WHERE quote_id = ?").run(id);
    db.prepare("DELETE FROM quote_services WHERE quote_id = ?").run(id);
    db.prepare("DELETE FROM quotes WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/cut-plans", (req, res) => {
    const plans = db.prepare("SELECT * FROM cut_plans ORDER BY created_at DESC").all();
    res.json(plans);
  });

  app.post("/api/cut-plans", (req, res) => {
    const { name, items, plan, manual_positions, sheet_width, sheet_height, saw_thickness } = req.body;
    const result = db.prepare(`
      INSERT INTO cut_plans (name, items, plan, manual_positions, sheet_width, sheet_height, saw_thickness) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, JSON.stringify(items), JSON.stringify(plan), JSON.stringify(manual_positions), sheet_width, sheet_height, saw_thickness);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/cut-plans/:id", (req, res) => {
    const { id } = req.params;
    const plan = db.prepare("SELECT * FROM cut_plans WHERE id = ?").get(id) as any;
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.json({
      ...plan,
      items: JSON.parse(plan.items),
      plan: JSON.parse(plan.plan),
      manual_positions: JSON.parse(plan.manual_positions)
    });
  });

  app.delete("/api/cut-plans/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM cut_plans WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
