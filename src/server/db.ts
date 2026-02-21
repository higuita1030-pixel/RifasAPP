import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'rifas.db');
console.log('Inicializando base de datos en:', dbPath);
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDb() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'vendedor')) NOT NULL
    )
  `);

  // Raffles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS raffles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      prize_cost REAL NOT NULL,
      ticket_value REAL NOT NULL,
      draw_date TEXT NOT NULL,
      lottery_reference TEXT DEFAULT 'Lotería de Medellín',
      status TEXT CHECK(status IN ('activa', 'finalizada')) DEFAULT 'activa'
    )
  `);

  // Tickets table (00-99)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raffle_id INTEGER NOT NULL,
      number TEXT NOT NULL, -- '00' to '99'
      status TEXT CHECK(status IN ('disponible', 'pendiente', 'pagado')) DEFAULT 'disponible',
      customer_name TEXT,
      customer_phone TEXT,
      total_paid REAL DEFAULT 0,
      FOREIGN KEY (raffle_id) REFERENCES raffles(id) ON DELETE CASCADE,
      UNIQUE(raffle_id, number)
    )
  `);

  // Payments history
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    )
  `);

  // Create default admin if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('Juan');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('1234', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('Juan', hashedPassword, 'admin');
    console.log('Default admin created: Juan / 1234');
  }

  // Create sample raffle if none exist
  const raffleExists = db.prepare('SELECT id FROM raffles LIMIT 1').get();
  if (!raffleExists) {
    const transaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO raffles (name, description, prize_cost, ticket_value, draw_date, lottery_reference)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Gran Rifa de Inauguración', 'iPhone 15 Pro Max', 5000000, 50000, '2026-12-24', 'Lotería de Medellín');

      const raffleId = info.lastInsertRowid;
      const insertTicket = db.prepare('INSERT INTO tickets (raffle_id, number) VALUES (?, ?)');
      for (let i = 0; i < 100; i++) {
        insertTicket.run(raffleId, i.toString().padStart(2, '0'));
      }
    });
    transaction();
    console.log('Sample raffle created');
  }
}

export default db;
