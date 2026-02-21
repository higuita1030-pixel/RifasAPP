import express from 'express';
import db from '../db.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = express.Router();

router.get('/:raffleId', authenticateToken, (req, res) => {
  const { raffleId } = req.params;

  try {
    const raffle = db.prepare('SELECT * FROM raffles WHERE id = ?').get(raffleId) as any;
    if (!raffle) return res.status(404).json({ error: 'Rifa no encontrada' });

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status != 'disponible' THEN 1 ELSE 0 END) as sold_count,
        SUM(CASE WHEN status = 'pagado' THEN 1 ELSE 0 END) as paid_count,
        SUM(total_paid) as total_collected
      FROM tickets 
      WHERE raffle_id = ?
    `).get(raffleId) as any;

    const total_to_collect = stats.total_tickets * raffle.ticket_value;
    const projected_revenue = stats.sold_count * raffle.ticket_value;
    const total_pending = projected_revenue - stats.total_collected;
    
    // Utilidad proyectada = (Boletas vendidas * Valor boleta) - Costo premio
    const projected_utility = projected_revenue - raffle.prize_cost;
    
    // Utilidad real = Total recaudado - Costo premio
    const real_utility = stats.total_collected - raffle.prize_cost;

    const occupation_percentage = (stats.sold_count / stats.total_tickets) * 100;

    // Lists of customers
    const pending_customers = db.prepare(`
      SELECT customer_name, customer_phone, GROUP_CONCAT(number) as numbers, (COUNT(*) * ? - SUM(total_paid)) as balance
      FROM tickets 
      WHERE raffle_id = ? AND status = 'pendiente'
      GROUP BY customer_name, customer_phone
    `).all(raffle.ticket_value, raffleId);

    const paid_customers = db.prepare(`
      SELECT customer_name, customer_phone, GROUP_CONCAT(number) as numbers
      FROM tickets 
      WHERE raffle_id = ? AND status = 'pagado'
      GROUP BY customer_name, customer_phone
    `).all(raffleId);

    res.json({
      raffle,
      stats: {
        total_sold: projected_revenue,
        total_collected: stats.total_collected,
        total_pending,
        occupation_percentage,
        projected_utility,
        real_utility
      },
      pending_customers,
      paid_customers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/wallet/:raffleId', authenticateToken, (req, res) => {
  const { raffleId } = req.params;
  try {
    const raffle = db.prepare('SELECT * FROM raffles WHERE id = ?').get(raffleId) as any;
    if (!raffle) return res.status(404).json({ error: 'Rifa no encontrada' });

    const wallet = db.prepare(`
      SELECT 
        customer_name, 
        customer_phone, 
        GROUP_CONCAT(number) as numbers,
        COUNT(*) as ticket_count,
        (COUNT(*) * ?) as total_purchase,
        SUM(total_paid) as total_paid,
        ((COUNT(*) * ?) - SUM(total_paid)) as balance,
        CASE 
          WHEN SUM(total_paid) >= (COUNT(*) * ?) THEN 'pagado'
          ELSE 'pendiente'
        END as status
      FROM tickets 
      WHERE raffle_id = ? AND status != 'disponible'
      GROUP BY customer_name, customer_phone
      ORDER BY balance DESC
    `).all(raffle.ticket_value, raffle.ticket_value, raffle.ticket_value, raffleId);

    res.json(wallet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener cartera' });
  }
});

export default router;
