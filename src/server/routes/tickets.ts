import express from 'express';
import db from '../db.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = express.Router();

// Get tickets for a raffle
router.get('/raffle/:raffleId', authenticateToken, (req, res) => {
  const { raffleId } = req.params;
  console.log('Obteniendo boletas para la rifa ID:', raffleId);
  try {
    const tickets = db.prepare('SELECT * FROM tickets WHERE raffle_id = ? ORDER BY number ASC').all(raffleId);
    console.log(`Se encontraron ${tickets.length} boletas.`);
    res.json(tickets);
  } catch (error: any) {
    console.error('Error al obtener boletas:', error);
    res.status(500).json({ error: 'Error al obtener boletas', details: error.message });
  }
});

// Sell/Update ticket
router.patch('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { customer_name, customer_phone, status, payment_amount } = req.body;

  try {
    const ticket = db.prepare(`
      SELECT t.*, r.ticket_value 
      FROM tickets t 
      JOIN raffles r ON t.raffle_id = r.id 
      WHERE t.id = ?
    `).get(id) as any;
    
    if (!ticket) return res.status(404).json({ error: 'Boleta no encontrada' });

    const amount = Number(payment_amount || 0);
    
    const transaction = db.transaction(() => {
      // If there's a payment, we need to handle it carefully
      let newTotalPaid = ticket.total_paid + amount;
      let newStatus = status || ticket.status;

      // Business Rule: Total paid cannot exceed ticket value
      if (amount > 0) {
        if (newTotalPaid > ticket.ticket_value) {
          throw new Error(`El abono ($${amount.toLocaleString()}) excede el valor pendiente de la boleta ($${(ticket.ticket_value - ticket.total_paid).toLocaleString()})`);
        }
        
        // Business Rule: If fully paid, status must be 'pagado'
        if (newTotalPaid >= ticket.ticket_value) {
          newStatus = 'pagado';
        } else if (newStatus === 'disponible' && newTotalPaid > 0) {
          newStatus = 'pendiente';
        }
      }

      // Update ticket info
      db.prepare(`
        UPDATE tickets 
        SET customer_name = COALESCE(?, customer_name),
            customer_phone = COALESCE(?, customer_phone),
            status = ?,
            total_paid = ?
        WHERE id = ?
      `).run(customer_name, customer_phone, newStatus, newTotalPaid, id);

      // Record payment if amount > 0
      if (amount > 0) {
        db.prepare('INSERT INTO payments (ticket_id, amount) VALUES (?, ?)').run(id, amount);
      }
      
      return { newStatus, newTotalPaid };
    });

    const result = transaction();
    res.json({ 
      message: 'Boleta actualizada correctamente', 
      status: result.newStatus, 
      total_paid: result.newTotalPaid 
    });
  } catch (error: any) {
    console.error('Error al actualizar boleta:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar boleta' });
  }
});

// Get payment history for a ticket
router.get('/:id/payments', authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    const payments = db.prepare('SELECT * FROM payments WHERE ticket_id = ? ORDER BY payment_date DESC').all();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial de pagos' });
  }
});

export default router;
