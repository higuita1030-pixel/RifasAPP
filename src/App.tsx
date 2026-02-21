import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Download, 
  ChevronRight,
  Search,
  Phone,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from './services/api.ts';
import html2canvas from 'html2canvas';

// Types
interface User {
  id: number;
  username: string;
  role: 'admin' | 'vendedor';
}

interface Raffle {
  id: number;
  name: string;
  description: string;
  prize_cost: number;
  ticket_value: number;
  draw_date: string;
  lottery_reference: string;
  status: 'activa' | 'finalizada';
}

interface TicketData {
  id: number;
  raffle_id: number;
  number: string;
  status: 'disponible' | 'pendiente' | 'pagado';
  customer_name: string | null;
  customer_phone: string | null;
  total_paid: number;
}

// Components
const Login = ({ onLogin }: { onLogin: (user: User, token: string) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.auth.login({ username, password });
      onLogin(res.user, res.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#5A5A40] rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1a1a1a]">Rifas Pro</h1>
          <p className="text-gray-500 mt-2">Gestión administrativa profesional</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all"
              placeholder="Tu usuario"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5A5A40] text-white py-4 rounded-full font-medium hover:bg-[#4a4a35] transition-colors disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Entrar al Sistema'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ raffleId }: { raffleId: number }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.dashboard.getStats(raffleId);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [raffleId]);

  if (loading) return <div className="p-8 text-center">Cargando estadísticas...</div>;
  if (!data) return <div className="p-8 text-center">No se encontraron datos.</div>;

  const { stats, pending_customers, paid_customers } = data;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Vendido" 
          value={`$${stats.total_sold.toLocaleString()}`} 
          icon={<DollarSign className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard 
          title="Recaudado Real" 
          value={`$${stats.total_collected.toLocaleString()}`} 
          icon={<CheckCircle2 className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard 
          title="Pendiente" 
          value={`$${stats.total_pending.toLocaleString()}`} 
          icon={<Clock className="text-amber-600" />}
          color="bg-amber-50"
        />
        <StatCard 
          title="Ocupación" 
          value={`${stats.occupation_percentage}%`} 
          icon={<TrendingUp className="text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Customers */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
            <AlertCircle className="text-amber-500" />
            Clientes Pendientes
          </h3>
          <div className="space-y-4">
            {pending_customers.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-medium">{c.customer_name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone size={12} /> {c.customer_phone}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Números: {c.numbers}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-600 font-bold">-${c.balance.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {pending_customers.length === 0 && <p className="text-gray-400 text-center py-4">No hay pagos pendientes.</p>}
          </div>
        </div>

        {/* Paid Customers */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 className="text-green-500" />
            Clientes al Día
          </h3>
          <div className="space-y-4">
            {paid_customers.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-medium">{c.customer_name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone size={12} /> {c.customer_phone}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Números: {c.numbers}</p>
                </div>
                <div className="text-green-600">
                  <CheckCircle2 size={20} />
                </div>
              </div>
            ))}
            {paid_customers.length === 0 && <p className="text-gray-400 text-center py-4">Aún no hay clientes con pago completo.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const RaffleGrid = ({ raffleId, onUpdate }: { raffleId: number, onUpdate: () => void }) => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.tickets.getByRaffle(raffleId);
        setTickets(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [raffleId]);

  const handleTicketClick = (ticket: TicketData) => {
    setSelectedTicket(ticket);
  };

  if (loading) return <div className="p-8 text-center">Cargando tablero...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {tickets.map((ticket) => (
          <button
            key={ticket.id}
            onClick={() => handleTicketClick(ticket)}
            className={`
              aspect-square rounded-xl flex items-center justify-center font-bold text-lg transition-all
              ${ticket.status === 'disponible' ? 'bg-white border border-gray-200 text-gray-400 hover:border-[#5A5A40] hover:text-[#5A5A40]' : ''}
              ${ticket.status === 'pendiente' ? 'bg-amber-100 text-amber-700 border border-amber-200' : ''}
              ${ticket.status === 'pagado' ? 'bg-green-100 text-green-700 border border-green-200' : ''}
            `}
          >
            {ticket.number}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedTicket && (
          <TicketModal 
            ticket={selectedTicket} 
            onClose={() => setSelectedTicket(null)} 
            onSave={() => {
              setSelectedTicket(null);
              onUpdate();
              // Re-fetch tickets
              api.tickets.getByRaffle(raffleId).then(setTickets);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const TicketModal = ({ ticket, onClose, onSave }: { ticket: TicketData, onClose: () => void, onSave: () => void }) => {
  const [name, setName] = useState(ticket.customer_name || '');
  const [phone, setPhone] = useState(ticket.customer_phone || '');
  const [status, setStatus] = useState(ticket.status);
  const [payment, setPayment] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.tickets.update(ticket.id, {
        customer_name: name,
        customer_phone: phone,
        status: status,
        payment_amount: payment
      });
      onSave();
    } catch (err) {
      alert('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-serif font-bold">Boleta #{ticket.number}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Comprador</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5A5A40]"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5A5A40]"
              placeholder="Número de contacto"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5A5A40]"
              >
                <option value="disponible">Disponible</option>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registrar Abono ($)</label>
              <input
                type="number"
                value={payment}
                onChange={(e) => setPayment(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5A5A40]"
                placeholder="0"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl">
            <p className="text-sm text-gray-500">Total Recaudado en esta boleta:</p>
            <p className="text-xl font-bold text-[#5A5A40]">${ticket.total_paid.toLocaleString()}</p>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-[#5A5A40] text-white py-4 rounded-full font-medium hover:bg-[#4a4a35] transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [activeRaffle, setActiveRaffle] = useState<Raffle | null>(null);
  const [view, setView] = useState<'dashboard' | 'tickets' | 'raffles' | 'wallet'>('dashboard');
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [isStatusMode, setIsStatusMode] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      fetchRaffles();
    }
  }, [user]);

  const fetchRaffles = async () => {
    try {
      const res = await api.raffles.getAll();
      setRaffles(res);
      if (res.length > 0 && !activeRaffle) {
        setActiveRaffle(res[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = (u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const [showNewRaffleModal, setShowNewRaffleModal] = useState(false);

  const handleCreateRaffle = async (data: any) => {
    console.log('Iniciando proceso de creación de rifa en frontend:', data);
    try {
      const response = await api.raffles.create(data);
      console.log('Rifa creada exitosamente. Respuesta del servidor:', response);
      
      setShowNewRaffleModal(false);
      
      // Refetch all raffles to ensure state is synced with DB
      const updatedRaffles = await api.raffles.getAll();
      setRaffles(updatedRaffles);
      
      // Find the new raffle by ID (ensuring type match with Number())
      const newRaffleId = Number(response.id);
      const newRaffle = updatedRaffles.find((r: any) => Number(r.id) === newRaffleId);
      
      if (newRaffle) {
        console.log('Estableciendo la nueva rifa como activa:', newRaffle);
        setActiveRaffle(newRaffle);
        // Force view to dashboard to see the new raffle stats
        setView('dashboard');
      } else if (updatedRaffles.length > 0) {
        console.warn('No se encontró la rifa recién creada en la lista, usando la primera disponible');
        setActiveRaffle(updatedRaffles[0]);
      }
      
      alert('Rifa creada exitosamente');
    } catch (err: any) {
      console.error('Error crítico al crear rifa:', err);
      alert(`Error al crear rifa: ${err.message || 'Error desconocido'}`);
    }
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-100 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center">
            <Ticket className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-serif font-bold">Rifas Pro</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
          />
          <NavItem 
            active={view === 'tickets'} 
            onClick={() => setView('tickets')} 
            icon={<Ticket size={20} />} 
            label="Boletas" 
          />
          <NavItem 
            active={view === 'wallet'} 
            onClick={() => setView('wallet')} 
            icon={<Wallet size={20} />} 
            label="Cartera" 
          />
          {user.role === 'admin' && (
            <NavItem 
              active={view === 'raffles'} 
              onClick={() => setView('raffles')} 
              icon={<Settings size={20} />} 
              label="Configuración" 
            />
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Users size={20} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-bold">{user.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1a1a1a]">
              {view === 'dashboard' ? 'Resumen General' : view === 'tickets' ? 'Control de Boletas' : 'Gestión de Rifas'}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <select 
                value={activeRaffle?.id || ''} 
                onChange={(e) => setActiveRaffle(raffles.find(r => r.id === Number(e.target.value)) || null)}
                className="bg-transparent border-none text-[#5A5A40] font-medium outline-none cursor-pointer"
              >
                {raffles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
                {raffles.length === 0 && <option value="">No hay rifas activas</option>}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            {activeRaffle && (
              <button 
                onClick={() => setIsStatusMode(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                <Download size={20} />
                Modo Estado
              </button>
            )}
            {user.role === 'admin' && (
              <button 
                onClick={() => setShowNewRaffleModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#5A5A40] text-white rounded-full font-medium hover:bg-[#4a4a35] transition-colors"
              >
                <Plus size={20} />
                Nueva Rifa
              </button>
            )}
          </div>
        </header>

        <AnimatePresence>
          {showNewRaffleModal && (
            <NewRaffleModal 
              onClose={() => setShowNewRaffleModal(false)} 
              onSave={handleCreateRaffle} 
            />
          )}
        </AnimatePresence>

        {isStatusMode && activeRaffle && (
          <StatusView 
            raffleId={activeRaffle.id} 
            onClose={() => setIsStatusMode(false)} 
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={view + (activeRaffle?.id || 0)}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeRaffle ? (
              <>
                {view === 'dashboard' && <Dashboard raffleId={activeRaffle.id} />}
                {view === 'tickets' && <RaffleGrid raffleId={activeRaffle.id} onUpdate={fetchRaffles} />}
                {view === 'raffles' && <RaffleSettings raffle={activeRaffle} onUpdate={fetchRaffles} />}
                {view === 'wallet' && <WalletView raffleId={activeRaffle.id} />}
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-300">
                <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-serif font-bold text-gray-500">No hay rifas seleccionadas</h3>
                <p className="text-gray-400">Crea una nueva rifa para comenzar.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

const WalletView = ({ raffleId }: { raffleId: number }) => {
  const [wallet, setWallet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await api.dashboard.getWallet(raffleId);
        setWallet(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, [raffleId]);

  const filteredWallet = wallet
    .filter(item => {
      const matchesSearch = item.customer_name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || item.status === filter;
      return matchesSearch && matchesFilter;
    });

  if (loading) return <div className="p-8 text-center">Cargando cartera...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5A5A40]"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${filter === 'all' ? 'bg-[#5A5A40] text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('pendiente')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${filter === 'pendiente' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            Pendientes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-6 font-serif font-bold text-gray-600">Cliente</th>
                <th className="p-6 font-serif font-bold text-gray-600">Números</th>
                <th className="p-6 font-serif font-bold text-gray-600">Total Compra</th>
                <th className="p-6 font-serif font-bold text-gray-600">Abonado</th>
                <th className="p-6 font-serif font-bold text-gray-600">Saldo</th>
                <th className="p-6 font-serif font-bold text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredWallet.map((item, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-6">
                    <p className="font-bold text-gray-900">{item.customer_name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone size={12} /> {item.customer_phone}
                    </p>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-wrap gap-1">
                      {item.numbers.split(',').map((n: string) => (
                        <span key={n} className="px-2 py-1 bg-gray-100 rounded-md text-xs font-mono">{n}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-6 font-medium">${item.total_purchase.toLocaleString()}</td>
                  <td className="p-6 text-green-600 font-medium">${item.total_paid.toLocaleString()}</td>
                  <td className="p-6 text-red-600 font-bold">${item.balance.toLocaleString()}</td>
                  <td className="p-6">
                    <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${item.status === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredWallet.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            No se encontraron registros.
          </div>
        )}
      </div>
    </div>
  );
};

const StatusView = ({ raffleId, onClose }: { raffleId: number, onClose: () => void }) => {
  const [raffle, setRaffle] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const captureRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rafflesList = await api.raffles.getAll();
        const rData = rafflesList.find((r: any) => r.id === raffleId);
        const tData = await api.tickets.getByRaffle(raffleId);
        setRaffle(rData);
        setTickets(tData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [raffleId]);

  const handleCapture = async () => {
    if (!captureRef.current) return;
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#1a1a1a'
      });
      const link = document.createElement('a');
      link.download = `rifa_${raffleId}_estado.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error capturando imagen:', err);
      alert('La captura automática falló. Por favor toma un pantallazo manual.');
    }
  };

  if (loading) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white z-[200]">Cargando...</div>;
  if (!raffle) return null;

  const soldCount = tickets.filter(t => t.status !== 'disponible').length;

  return (
    <div className="fixed inset-0 bg-black z-[100] overflow-y-auto flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-[500px] flex justify-between mb-4 no-capture">
        <button onClick={onClose} className="text-white bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-colors">Salir</button>
        <button onClick={handleCapture} className="text-white bg-blue-600 px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Download size={18} /> Capturar
        </button>
      </div>

      <div 
        ref={captureRef}
        className="w-full max-w-[500px] aspect-[9/16] bg-[#1a1a1a] text-white p-8 flex flex-col shadow-2xl rounded-lg"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold uppercase mb-2 tracking-wider">{raffle.name}</h1>
          <p className="text-xl text-gray-300 mb-1">Premio: {raffle.description}</p>
          <div className="flex justify-center gap-4 text-sm text-gray-400">
            <span>Valor: ${raffle.ticket_value.toLocaleString()}</span>
            <span>Fecha: {raffle.draw_date}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Sorteo: {raffle.lottery_reference}</p>
        </div>

        <div className="grid grid-cols-10 gap-1 mb-8">
          {tickets.map((t) => (
            <div 
              key={t.id}
              className={`aspect-square rounded-sm flex items-center justify-center text-[10px] font-bold ${
                t.status === 'pagado' ? 'bg-green-500' : 
                t.status === 'pendiente' ? 'bg-amber-500' : 'bg-zinc-700'
              }`}
            >
              {t.number}
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-6">
          <div className="flex justify-between gap-4 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-zinc-700 rounded-sm"></div>
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
              <span>Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span>Pagado</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${soldCount}%` }}
              ></div>
            </div>
            <p className="text-center text-sm font-bold">Progreso: {soldCount}% Vendido</p>
          </div>

          <p className="text-center text-[10px] text-gray-500 italic">Generado por Rifas Pro</p>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all
      ${active ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20' : 'text-gray-500 hover:bg-gray-50'}
    `}
  >
    {icon}
    <span className="font-medium">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </button>
);

const NewRaffleModal = ({ onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prize_cost: '',
    ticket_value: '',
    draw_date: '',
    lottery_reference: 'Lotería de Medellín'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      prize_cost: Number(formData.prize_cost),
      ticket_value: Number(formData.ticket_value)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-serif font-bold">Nueva Rifa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Rifa</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5A5A40]"
              placeholder="Ej: Rifa Navideña"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Premio</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5A5A40]"
              placeholder="Ej: Moto Pulsar NS 200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo Premio ($)</label>
              <input
                type="number"
                required
                value={formData.prize_cost}
                onChange={(e) => setFormData({ ...formData, prize_cost: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5A5A40]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Boleta ($)</label>
              <input
                type="number"
                required
                value={formData.ticket_value}
                onChange={(e) => setFormData({ ...formData, ticket_value: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5A5A40]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del Sorteo</label>
            <input
              type="date"
              required
              value={formData.draw_date}
              onChange={(e) => setFormData({ ...formData, draw_date: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5A5A40]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia Sorteo</label>
            <input
              type="text"
              value={formData.lottery_reference}
              onChange={(e) => setFormData({ ...formData, lottery_reference: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#5A5A40]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#5A5A40] text-white py-4 rounded-full font-medium hover:bg-[#4a4a35] transition-colors mt-4"
          >
            Crear Rifa y Generar 100 Números
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const RaffleSettings = ({ raffle, onUpdate }: { raffle: Raffle, onUpdate: () => void }) => {
  const [status, setStatus] = useState(raffle.status);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.raffles.updateStatus(raffle.id, newStatus);
      setStatus(newStatus as any);
      onUpdate();
    } catch (err) {
      alert('Error al actualizar');
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 max-w-2xl">
      <h3 className="text-2xl font-serif font-bold mb-8">Configuración de la Rifa</h3>
      
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-500 mb-1">Costo del Premio</p>
            <p className="text-xl font-bold">${raffle.prize_cost.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Valor por Boleta</p>
            <p className="text-xl font-bold">${raffle.ticket_value.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Fecha del Sorteo</p>
            <p className="text-xl font-bold">{raffle.draw_date}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Referencia</p>
            <p className="text-xl font-bold">{raffle.lottery_reference}</p>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-4">Estado de la Rifa</p>
          <div className="flex gap-4">
            <button 
              onClick={() => handleStatusChange('activa')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${status === 'activa' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-400'}`}
            >
              Activa
            </button>
            <button 
              onClick={() => handleStatusChange('finalizada')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${status === 'finalizada' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-400'}`}
            >
              Finalizada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
