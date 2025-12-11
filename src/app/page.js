'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../hooks/useFinance';
import { useCards } from '../hooks/useCards';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { 
  LogIn, Plus, TrendingUp, TrendingDown, Trash2, X, CreditCard, 
  Calendar, Home as HomeIcon, Tv, Zap, LayoutGrid, PieChart, 
  Wallet, LogOut, ArrowRight 
} from 'lucide-react';

// --- COMPONENTE PRINCIPAL ---
export default function Home() {
  const { user, logout } = useAuth();
  if (!user) return <LoginPage />;
  return <Dashboard user={user} logout={logout} />;
}

// --- PANTALLA DE LOGIN ---
function LoginPage() {
  const { loginWithEmail, registerWithEmail, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      isLogin ? await loginWithEmail(email, pass) : await registerWithEmail(email, pass, name);
    } catch (err) {
      setError('Error en credenciales. Intenta de nuevo.');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F5F5F7]">
      {/* Sección Izquierda (Formulario) */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-16 order-2 lg:order-1">
        <div className="w-full max-w-md space-y-8 animate-enter">
          <div className="text-center lg:text-left">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 mx-auto lg:mx-0 shadow-xl shadow-blue-500/30">
              <Wallet className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-[#1D1D1F] mb-2">
              {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
            </h1>
            <p className="text-gray-500">Tu control financiero personal, simplificado.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && <input type="text" placeholder="Tu nombre" className="ios-input" value={name} onChange={e => setName(e.target.value)} />}
            <input type="email" placeholder="correo@ejemplo.com" className="ios-input" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="••••••••" className="ios-input" value={pass} onChange={e => setPass(e.target.value)} />
            
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button className="ios-button w-full flex justify-center items-center gap-2">
              {isLogin ? 'Entrar' : 'Registrarse'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="text-center pt-4">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-medium text-gray-500 hover:text-blue-600 transition">
              {isLogin ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>

      {/* Sección Derecha (Visual) */}
      <div className="hidden lg:flex relative bg-black order-1 lg:order-2 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-90"></div>
        <img src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" alt="Finance" />
        <div className="relative z-10 text-white text-center p-12">
          <h2 className="text-5xl font-bold mb-6">Toma el control.</h2>
          <p className="text-xl text-blue-100 max-w-lg mx-auto leading-relaxed">Gestiona tarjetas, suscripciones y gastos en una interfaz diseñada para darte paz mental.</p>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD RESPONSIVE ---
function Dashboard({ user, logout }) {
  const { transactions, balance, income, expense, addTransaction, deleteTransaction } = useFinance();
  const { cards, addCard, deleteCard } = useCards();
  const { subs, totalFixed, addSubscription, deleteSubscription } = useSubscriptions();
  const [activeModal, setActiveModal] = useState(null);

  const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col md:flex-row">
      
      {/* 1. SIDEBAR (Solo Desktop) */}
      <aside className="hidden md:flex flex-col w-[280px] h-screen fixed left-0 top-0 bg-white/80 backdrop-blur-xl border-r border-gray-200 z-50 p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Mis Finanzas</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<LayoutGrid />} label="Resumen" active />
          <SidebarItem icon={<CreditCard />} label="Tarjetas" />
          <SidebarItem icon={<PieChart />} label="Estadísticas" />
        </nav>

        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
              {user.displayName ? user.displayName[0] : 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user.displayName}</p>
              <p className="text-xs text-gray-500 truncate">Plan Pro</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition">
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="flex-1 md:ml-[280px] p-4 md:p-8 lg:p-12 pb-32 md:pb-8 max-w-[1600px] mx-auto w-full">
        
        {/* Header Movil */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <span className="font-bold text-blue-600 text-lg">{user.displayName ? user.displayName[0] : 'U'}</span>
             </div>
             <div>
               <p className="text-xs text-gray-500 font-medium">Hola de nuevo,</p>
               <h1 className="text-xl font-bold">{user.displayName}</h1>
             </div>
          </div>
          <button onClick={logout} className="p-2 bg-white rounded-full shadow-sm text-gray-400"><LogOut className="w-5 h-5"/></button>
        </div>

        {/* Header Desktop */}
        <div className="hidden md:flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1D1D1F]">Panel de Control</h1>
            <p className="text-gray-500 mt-1">Tu resumen financiero en tiempo real</p>
          </div>
          <button onClick={() => setActiveModal('transaction')} className="ios-button py-3 px-5 flex items-center gap-2 text-sm">
            <Plus className="w-5 h-5" /> Nueva Transacción
          </button>
        </div>

        {/* GRID DE DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* COLUMNA IZQUIERDA (Principal) - Span 8 */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            
            {/* Balance Card (Grande) */}
            <div className="ios-card bg-[#1D1D1F] text-white p-6 md:p-10 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <p className="text-gray-400 font-medium mb-2">Disponible Neto</p>
                  <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-2">
                    {formatCurrency(balance - totalFixed)}
                  </h2>
                  <div className="flex items-center gap-2 text-gray-400 text-sm bg-white/10 px-3 py-1 rounded-lg w-fit backdrop-blur-md">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span>Descontando {formatCurrency(totalFixed)} de fijos</span>
                  </div>
                </div>
                <div className="flex gap-6 w-full md:w-auto bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                   <div>
                      <p className="text-xs text-gray-400 mb-1">Ingresos</p>
                      <p className="text-lg font-bold text-green-400 flex items-center gap-1"><TrendingUp className="w-4 h-4"/> +{formatCurrency(income)}</p>
                   </div>
                   <div className="w-px bg-white/20"></div>
                   <div>
                      <p className="text-xs text-gray-400 mb-1">Gastos</p>
                      <p className="text-lg font-bold text-red-400 flex items-center gap-1"><TrendingDown className="w-4 h-4"/> -{formatCurrency(expense)}</p>
                   </div>
                </div>
              </div>
              {/* Abstract Background */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/30 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/2 group-hover:bg-blue-600/40 transition-all duration-700"></div>
            </div>

            {/* Tarjetas de Crédito */}
            <div>
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-xl font-bold text-[#1D1D1F]">Mis Tarjetas</h3>
                <button onClick={() => setActiveModal('card')} className="text-blue-600 text-sm font-semibold hover:bg-blue-50 px-3 py-1 rounded-lg transition">+ Agregar</button>
              </div>
              
              {/* Grid en Desktop, Scroll en Mobile */}
              <div className="flex md:grid md:grid-cols-2 gap-4 overflow-x-auto pb-4 md:pb-0 snap-x hide-scrollbar">
                {cards.map((card) => (
                  <div key={card.id} className={`snap-center min-w-[300px] h-52 rounded-[2rem] p-6 text-white shadow-lg relative flex flex-col justify-between bg-gradient-to-br ${card.bgGradient} ios-card-hover group`}>
                     <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Banco</p>
                          <h4 className="font-bold text-xl">{card.name}</h4>
                        </div>
                        <CreditCard className="w-6 h-6 opacity-80" />
                     </div>
                     
                     <div className="space-y-3">
                        <div className="flex justify-between text-xs font-medium opacity-90">
                          <span>Deuda: {formatCurrency(card.currentDebt)}</span>
                          <span>{Math.round((card.currentDebt/card.limit)*100)}% usado</span>
                        </div>
                        <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                          <div className={`h-full rounded-full transition-all duration-1000 ${ (card.currentDebt / card.limit) > 0.8 ? 'bg-red-400' : 'bg-white' }`} style={{ width: `${Math.min((card.currentDebt / card.limit) * 100, 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="text-xs bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
                            Corte: Día {card.cutoffDay} ({card.daysToCutoff} días)
                          </p>
                          <button onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </div>
                  </div>
                ))}
                
                {/* Botón Agregar (Card Style) */}
                <button onClick={() => setActiveModal('card')} className="snap-center min-w-[100px] md:w-full h-52 border-2 border-dashed border-gray-300 rounded-[2rem] flex flex-col items-center justify-center text-gray-400 hover:bg-white hover:border-blue-300 hover:text-blue-500 transition-all group">
                   <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-50 flex items-center justify-center mb-2 transition-colors">
                     <Plus className="w-6 h-6" />
                   </div>
                   <span className="font-medium text-sm">Nueva Tarjeta</span>
                </button>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA (Secundaria) - Span 4 */}
          <div className="lg:col-span-4 space-y-6 lg:space-y-8">
            
            {/* Pagos Fijos */}
            <div className="ios-card p-6 h-fit">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Próximos Pagos</h3>
                <button onClick={() => setActiveModal('sub')} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-blue-50 hover:text-blue-600 transition"><Plus className="w-4 h-4"/></button>
              </div>
              <div className="space-y-4">
                {subs.length === 0 ? <p className="text-center text-gray-400 text-sm py-4">Todo al día</p> : subs.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${sub.category === 'home' ? 'bg-orange-100 text-orange-600' : sub.category === 'entertainment' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {sub.category === 'home' ? <HomeIcon className="w-5 h-5" /> : sub.category === 'entertainment' ? <Tv className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{sub.name}</p>
                        <p className="text-xs text-gray-500">{sub.daysLeft === 0 ? '¡Hoy!' : `${sub.daysLeft} días`}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(sub.amount)}</p>
                      <button onClick={() => deleteSubscription(sub.id)} className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 hover:underline">Borrar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Últimos Movimientos */}
            <div>
              <h3 className="font-bold text-lg mb-4 px-1">Historial Reciente</h3>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="ios-card p-4 flex justify-between items-center hover:bg-white transition-colors border-transparent hover:border-blue-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}>
                        {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#1D1D1F]">{t.description}</p>
                        <p className="text-xs text-gray-400 capitalize">{t.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-[#1D1D1F]'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                      <button onClick={() => deleteTransaction(t.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Sin movimientos</p>}
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* MOBILE NAV (Solo Móvil) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 p-4 pb-6 flex justify-around items-center z-40">
        <MobileNavItem icon={<LayoutGrid />} active />
        <button onClick={() => setActiveModal('transaction')} className="w-14 h-14 bg-[#007AFF] rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center -mt-8 active:scale-95 transition-transform text-white">
          <Plus className="w-7 h-7" />
        </button>
        <MobileNavItem icon={<CreditCard />} />
      </div>

      {/* MODALES REUTILIZABLES */}
      {activeModal === 'transaction' && <Modal close={() => setActiveModal(null)}><TransactionForm close={() => setActiveModal(null)} add={addTransaction} /></Modal>}
      {activeModal === 'card' && <Modal close={() => setActiveModal(null)}><CardForm close={() => setActiveModal(null)} add={addCard} /></Modal>}
      {activeModal === 'sub' && <Modal close={() => setActiveModal(null)}><SubForm close={() => setActiveModal(null)} add={addSubscription} /></Modal>}
    </div>
  );
}

// --- SUB-COMPONENTES DE UI ---

const SidebarItem = ({ icon, label, active }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-[#1D1D1F]'}`}>
    {icon} {label}
  </button>
);

const MobileNavItem = ({ icon, active }) => (
  <button className={`p-2 rounded-xl ${active ? 'text-blue-600' : 'text-gray-400'}`}>
    {icon}
  </button>
);

const Modal = ({ children, close }) => (
  <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-enter" onClick={close}>
    <div className="w-full max-w-md bg-[#F5F5F7] md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

// --- FORMULARIOS (Limpios y reutilizables) ---

const TransactionForm = ({ close, add }) => {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('expense');
  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-xl">Nuevo Movimiento</h3>
        <button onClick={close} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"><X className="w-4 h-4"/></button>
      </div>
      <div className="flex bg-gray-200/50 p-1 rounded-2xl mb-6">
        {['expense', 'income'].map(t => (
          <button key={t} onClick={() => setType(t)} className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${type === t ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>
            {t === 'expense' ? 'Gasto' : 'Ingreso'}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        <div className="relative">
          <span className="absolute left-4 top-4 text-gray-400 text-lg">$</span>
          <input type="number" autoFocus placeholder="0.00" className="ios-input pl-8 text-2xl font-bold" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <input type="text" placeholder="¿En qué gastaste?" className="ios-input" value={desc} onChange={e => setDesc(e.target.value)} />
        <button onClick={() => { if(amount) { add(amount, desc || 'Sin concepto', type, 'General'); close(); } }} className="ios-button w-full mt-2">Guardar</button>
      </div>
    </div>
  );
};

const CardForm = ({ close, add }) => {
  const [f, setF] = useState({ name: '', limit: '', debt: '', cut: '', pay: '' });
  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl">Nueva Tarjeta</h3><button onClick={close} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"><X className="w-4 h-4"/></button></div>
      <div className="space-y-4">
        <input className="ios-input" placeholder="Nombre del Banco" value={f.name} onChange={e => setF({...f, name: e.target.value})} />
        <div className="grid grid-cols-2 gap-4">
          <input type="number" className="ios-input" placeholder="Límite" value={f.limit} onChange={e => setF({...f, limit: e.target.value})} />
          <input type="number" className="ios-input" placeholder="Deuda Actual" value={f.debt} onChange={e => setF({...f, debt: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1"><label className="text-xs text-gray-500 ml-2">Día de Corte</label><input type="number" className="ios-input" placeholder="Ej. 15" value={f.cut} onChange={e => setF({...f, cut: e.target.value})} /></div>
          <div className="space-y-1"><label className="text-xs text-gray-500 ml-2">Día de Pago</label><input type="number" className="ios-input" placeholder="Ej. 5" value={f.pay} onChange={e => setF({...f, pay: e.target.value})} /></div>
        </div>
        <button onClick={() => { if(f.name) { add(f.name, f.limit, f.cut, f.pay, f.debt); close(); } }} className="ios-button w-full mt-2">Guardar Tarjeta</button>
      </div>
    </div>
  );
};

const SubForm = ({ close, add }) => {
  const [f, setF] = useState({ name: '', amount: '', day: '', cat: 'service' });
  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl">Pago Recurrente</h3><button onClick={close} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"><X className="w-4 h-4"/></button></div>
      <div className="flex justify-center gap-4 mb-6">
        {[{id:'home', icon:HomeIcon, color:'text-orange-600', bg:'bg-orange-100'}, {id:'entertainment', icon:Tv, color:'text-purple-600', bg:'bg-purple-100'}, {id:'service', icon:Zap, color:'text-blue-600', bg:'bg-blue-100'}].map(c => (
          <button key={c.id} onClick={() => setF({...f, cat: c.id})} className={`p-4 rounded-2xl transition-all ${f.cat === c.id ? `${c.bg} ring-2 ring-offset-2 ring-gray-200 scale-110` : 'bg-white hover:bg-gray-50'}`}>
            <c.icon className={`w-6 h-6 ${f.cat === c.id ? c.color : 'text-gray-400'}`} />
          </button>
        ))}
      </div>
      <div className="space-y-4">
        <input className="ios-input" placeholder="Nombre (Ej. Renta)" value={f.name} onChange={e => setF({...f, name: e.target.value})} />
        <div className="grid grid-cols-2 gap-4">
          <input type="number" className="ios-input" placeholder="$ Monto" value={f.amount} onChange={e => setF({...f, amount: e.target.value})} />
          <input type="number" max="31" className="ios-input" placeholder="Día (1-31)" value={f.day} onChange={e => setF({...f, day: e.target.value})} />
        </div>
        <button onClick={() => { if(f.name) { add(f.name, f.amount, f.day, f.cat); close(); } }} className="ios-button w-full mt-2">Guardar Pago</button>
      </div>
    </div>
  );
};