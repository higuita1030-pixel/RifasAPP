import express from 'express';
import db from '../db.ts';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.ts';

const router = express.Router();

// Get all raffles
router.get('/', authenticateToken, (req, res) => {
  try {
    const raffles = db.prepare('SELECT * FROM raffles ORDER BY id DESC').all();
    res.json(raffles);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener rifas' });
  }
});

// Create raffle (Admin only)
router.post('/', authenticateToken, authorizeAdmin, (req, res) => {
  console.log('Recibida petición de creación de rifa:', req.body);
  const { name, description, prize_cost, ticket_value, draw_date, lottery_reference } = req.body;

  if (!name || !prize_cost || !ticket_value || !draw_date) {
    console.warn('Faltan campos obligatorios en la creación de rifa');
    return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, costo premio, valor boleta y fecha sorteo son requeridos.' });
  }

  try {
    const transaction = db.transaction(() => {
      console.log('Iniciando transacción de base de datos para rifa:', name);
      const info = db.prepare(`
        INSERT INTO raffles (name, description, prize_cost, ticket_value, draw_date, lottery_reference)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, description, prize_cost, ticket_value, draw_date, lottery_reference || 'Lotería de Medellín');

      const raffleId = info.lastInsertRowid;
      console.log('Rifa insertada con ID:', raffleId);

      // Create 100 tickets (00-99)
      console.log('Generando 100 boletas para la rifa ID:', raffleId);
      const insertTicket = db.prepare('INSERT INTO tickets (raffle_id, number) VALUES (?, ?)');
      for (let i = 0; i < 100; i++) {
        const num = i.toString().padStart(2, '0');
        insertTicket.run(raffleId, num);
      }

      return raffleId;
    });

    const id = transaction();
    console.log('Transacción completada exitosamente. Rifa ID:', id);
    res.status(201).json({ id, message: 'Rifa creada exitosamente con sus 100 números' });
  } catch (error: any) {
    console.error('Error detallado al crear la rifa:', error);
    res.status(500).json({ 
      error: 'Error interno al crear la rifa', 
      details: error.message,
      code: error.code 
    });
  }
});

// Update raffle status
router.patch('/:id/status', authenticateToken, authorizeAdmin, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!['activa', 'finalizada'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    db.prepare('UPDATE raffles SET status = ? WHERE id = ?').run(status, id);
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

export default router;
