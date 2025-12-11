'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../hooks/useFinance';
import { useCards } from '../hooks/useCards';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { 
  Plus, TrendingUp, TrendingDown, Trash2, X, CreditCard, 
  Home as HomeIcon, Tv, Zap, LayoutGrid, PieChart, 
  LogOut, ArrowRight, User, Hexagon 
} from 'lucide-react';

// --- COMPONENTE LOGO MODERNO ---
const BrandLogo = ({ className = "w-8 h-8", dark = false }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="relative flex items-center justify-center group">
      <div className={`absolute inset-0 rounded-xl blur-md opacity-40 transition-colors duration-500 ${dark ? 'bg-white' : 'bg-blue-600'}`}></div>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative w-10 h-10 transform group-hover:rotate-12 transition-transform duration-500 ease-out z-10">
        <rect x="8" y="8" width="24" height="24" rx="7" fill={dark ? "#FFF" : "#000"} fillOpacity="0.1"/>
        <path d="M20 12C15.5817 12 12 15.5817 12 20C12 24.4183 15.5817 28 20 28C24.4183 28 28 24.4183 28 20" stroke={dark ? "#FFF" : "#1D1D1F"} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M28 20C28 15.5817 24.4183 12 20 12" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="3" fill={dark ? "#FFF" : "#1D1D1F"}/>
      </svg>
    </div>
    <span className={`font-bold text-xl tracking-tight ${dark ? 'text-white' : 'text-[#1D1D1F]'}`}>
      Fin<span className="text-[#007AFF]">Nexus</span>
    </span>
  </div>
);

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
      setError('Credenciales incorrectas. Verifica tus datos.');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F2F4F7]"><div className="w-10 h-10 border-4 border-[#007AFF] rounded-full animate-spin border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F2F4F7] font-sans text-[#1D1D1F]">
      {/* Panel Izquierdo */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-20 order-2 lg:order-1 relative">
        <div className="w-full max-w-[380px] space-y-10 animate-enter z-10">
          <div className="text-center lg:text-left">
            <BrandLogo className="mb-8 justify-center lg:justify-start" />
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">{isLogin ? 'Bienvenido' : 'Crear Cuenta'}</h1>
            <p className="text-gray-500 text-lg leading-relaxed">Gestiona tu patrimonio con inteligencia.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="group relative">
                 <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#007AFF] transition-colors" />
                 <input type="text" placeholder="Nombre completo" className="w-full bg-white border border-gray-200 rounded-2xl px-12 py-3.5 text-base font-medium outline-none transition-all focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div className="group relative">
               <div className="absolute left-4 top-3.5 text-gray-400 text-sm font-bold">@</div>
               <input type="email" placeholder="correo@ejemplo.com" className="w-full bg-white border border-gray-200 rounded-2xl px-12 py-3.5 text-base font-medium outline-none transition-all focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="group relative">
               <div className="absolute left-4 top-3.5 text-gray-400 text-sm font-bold">***</div>
               <input type="password" placeholder="Contraseña" className="w-full bg-white border border-gray-200 rounded-2xl px-12 py-3.5 text-base font-medium outline-none transition-all focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10" value={pass} onChange={e => setPass(e.target.value)} />
            </div>
            {error && <div className="bg-red-50 text-red-500 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2"><X className="w-4 h-4"/>{error}</div>}
            <button className="w-full bg-[#1D1D1F] text-white font-bold rounded-2xl px-6 py-4 active:scale-95 hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3">
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center pt-2">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-semibold text-gray-500 hover:text-[#007AFF] transition-colors">
              {isLogin ? '¿Nuevo aquí? Crea tu cuenta gratis' : '¿Ya tienes cuenta? Ingresa ahora'}
            </button>
          </div>
        </div>
      </div>
      {/* Panel Derecho */}
      <div className="hidden lg:flex relative bg-[#050505] order-1 lg:order-2 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"></div>
        <div className="relative z-10 text-center px-12 max-w-2xl">
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
            <Hexagon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-5xl font-bold text-white mb-6 tracking-tight leading-tight">El sistema operativo de tus finanzas.</h2>
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
  const [currentView, setCurrentView] = useState('overview');

  const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const renderContent = () => {
    switch(currentView) {
      case 'cards': return <CardsView cards={cards} add={() => setActiveModal('card')} del={deleteCard} fmt={formatCurrency} />;
      case 'stats': return <StatsView />;
      default: return (
        <OverviewView 
          data={{balance, income, expense, transactions, cards, subs, totalFixed}} 
          actions={{addTrans: () => setActiveModal('transaction'), addSub: () => setActiveModal('sub'), addCard: () => setActiveModal('card'), delTrans: deleteTransaction, delSub: deleteSubscription, delCard: deleteCard, changeView: setCurrentView}} 
          fmt={formatCurrency} 
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans text-[#1D1D1F]">
      
      {/* SIDEBAR FLOTANTE */}
      <aside className="hidden md:flex flex-col w-[270px] fixed left-4 top-4 bottom-4 bg-white/85 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] z-50 p-6 justify-between transition-all duration-300">
        <div>
          <div className="px-2 mb-12 mt-4"><BrandLogo /></div>
          <nav className="space-y-2">
            <SidebarItem icon={<LayoutGrid />} label="Resumen" active={currentView === 'overview'} onClick={() => setCurrentView('overview')} />
            <SidebarItem icon={<CreditCard />} label="Billetera" active={currentView === 'cards'} onClick={() => setCurrentView('cards')} />
            <SidebarItem icon={<PieChart />} label="Reportes" active={currentView === 'stats'} onClick={() => setCurrentView('stats')} />
          </nav>
        </div>
        <div className="group relative px-2 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 shadow-sm flex items-center justify-center text-[#1D1D1F] font-bold border border-gray-200">{user.displayName ? user.displayName[0] : 'U'}</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-[#1D1D1F]">{user.displayName}</p>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Cuenta Pro</p>
            </div>
            <button onClick={logout} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all duration-300">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 md:ml-[290px] p-4 md:p-8 lg:p-10 pb-32 md:pb-8 max-w-[1400px]">
        <div className="md:hidden flex justify-between items-center mb-8 pt-2">
          <BrandLogo className="scale-90" />
          <button onClick={logout} className="p-2 bg-white rounded-full shadow-sm text-gray-400"><LogOut className="w-5 h-5"/></button>
        </div>
        <div className="hidden md:flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight">{currentView === 'overview' ? 'Panel de Control' : currentView === 'cards' ? 'Mis Tarjetas' : 'Análisis'}</h1>
            <p className="text-gray-400 font-medium mt-1">Resumen financiero en tiempo real</p>
          </div>
          <button onClick={() => setActiveModal('transaction')} className="group relative px-6 py-3 bg-[#1D1D1F] text-white rounded-2xl font-bold text-sm shadow-xl shadow-gray-200 hover:shadow-2xl hover:-translate-y-0.5 transition-all overflow-hidden">
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva Transacción</span>
          </button>
        </div>
        {renderContent()}
      </main>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-[#1D1D1F]/90 backdrop-blur-xl rounded-[2rem] p-2 flex justify-between items-center z-40 shadow-2xl shadow-black/20 text-gray-400">
        <MobileNavItem icon={<LayoutGrid />} active={currentView === 'overview'} onClick={() => setCurrentView('overview')} />
        <button onClick={() => setActiveModal('transaction')} className="w-12 h-12 bg-[#007AFF] text-white rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center -mt-8 border-4 border-[#F2F4F7] active:scale-95 transition-transform"><Plus className="w-6 h-6" /></button>
        <MobileNavItem icon={<CreditCard />} active={currentView === 'cards'} onClick={() => setCurrentView('cards')} />
      </div>

      {/* MODALES */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center" onClick={() => setActiveModal(null)}>
          <div className="absolute inset-0 bg-[#050505]/40 backdrop-blur-sm transition-opacity"></div>
          <div className="relative z-[110] w-full max-w-md bg-white md:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden animate-enter" onClick={e => e.stopPropagation()}>
             {activeModal === 'transaction' && <TransactionForm close={() => setActiveModal(null)} add={addTransaction} />}
             {activeModal === 'card' && <CardForm close={() => setActiveModal(null)} add={addCard} />}
             {activeModal === 'sub' && <SubForm close={() => setActiveModal(null)} add={addSubscription} />}
          </div>
        </div>
      )}
    </div>
  );
}

// --- VISTAS ---
const OverviewView = ({ data, actions, fmt }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-enter">
    <div className="lg:col-span-8 space-y-8">
      {/* Balance Card Pro */}
      <div className="rounded-[2.5rem] bg-[#1D1D1F] text-white p-8 md:p-10 relative overflow-hidden shadow-2xl group ring-1 ring-white/10">
        <div className="absolute top-[-50%] right-[-30%] w-[800px] h-[800px] bg-blue-600/20 blur-[150px] rounded-full pointer-events-none opacity-60"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-8">
          
          <div className="flex-1">
            <div className="text-blue-300 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div> Balance Total
            </div>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4 text-white">{fmt(data.balance)}</h2>
            <div className="inline-flex items-center gap-2 text-gray-300 text-xs font-semibold bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>{fmt(data.totalFixed)} en gastos fijos</span>
            </div>
          </div>

          <div className="w-full md:w-auto flex-shrink-0 flex md:flex-col gap-4">
             <div className="flex-1 bg-white/5 p-5 rounded-2xl backdrop-blur-md border border-white/5 hover:bg-white/10 transition-colors">
                <p className="text-[10px] text-gray-300 uppercase font-bold tracking-wide mb-1 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-green-400"/>Ingresos</p>
                <p className="text-2xl font-semibold text-white">{fmt(data.income)}</p>
             </div>
             <div className="flex-1 bg-white/5 p-5 rounded-2xl backdrop-blur-md border border-white/5 hover:bg-white/10 transition-colors">
                <p className="text-[10px] text-gray-300 uppercase font-bold tracking-wide mb-1 flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5 text-red-400"/>Gastos</p>
                <p className="text-2xl font-semibold text-white">{fmt(data.expense)}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Tarjetas */}
      <div>
        <div className="flex justify-between items-center mb-5 px-1">
          <h3 className="text-xl font-bold text-[#1D1D1F] tracking-tight">Billetera</h3>
          <button onClick={() => actions.changeView('cards')} className="text-[#007AFF] text-sm font-bold hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">Ver detalles</button>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-6 snap-x hide-scrollbar">
          {data.cards.map(c => <div key={c.id} className="min-w-[320px] snap-center"><CardItem card={c} formatCurrency={fmt} deleteCard={actions.delCard} /></div>)}
          <button onClick={actions.addCard} className="snap-center min-w-[100px] h-56 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-400 hover:border-[#007AFF] hover:text-[#007AFF] hover:bg-white transition-all group gap-2"><div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-50 rounded-full flex items-center justify-center transition-colors"><Plus className="w-5 h-5"/></div><span className="text-xs font-bold">Nueva</span></button>
        </div>
      </div>
    </div>

    <div className="lg:col-span-4 space-y-8">
      {/* Pagos Fijos */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 h-fit">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-[#1D1D1F]">Pagos Próximos</h3>
          <button onClick={actions.addSub} className="w-9 h-9 flex items-center justify-center bg-[#F5F7FA] rounded-full hover:bg-[#007AFF] hover:text-white transition-colors"><Plus className="w-4 h-4"/></button>
        </div>
        <div className="space-y-5">
          {data.subs.map(sub => (
            <div key={sub.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${sub.category === 'home' ? 'bg-orange-50 text-orange-500' : sub.category === 'entertainment' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                  {sub.category === 'home' ? <HomeIcon className="w-5 h-5" /> : sub.category === 'entertainment' ? <Tv className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#1D1D1F]">{sub.name}</p>
                  <p className={`text-xs font-medium ${sub.daysLeft <= 3 ? 'text-red-500' : 'text-gray-400'}`}>{sub.daysLeft === 0 ? '¡Vence hoy!' : `${sub.daysLeft} días restantes`}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-[#1D1D1F]">{fmt(sub.amount)}</p>
                <button onClick={() => actions.delSub(sub.id)} className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 hover:underline font-medium transition-opacity">Eliminar</button>
              </div>
            </div>
          ))}
          {data.subs.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Estás al día 🎉</p>}
        </div>
      </div>

      {/* Movimientos */}
      <div>
        <h3 className="font-bold text-lg mb-5 px-1 text-[#1D1D1F]">Historial</h3>
        <div className="space-y-3">
          {data.transactions.slice(0, 5).map(t => (
            <div key={t.id} className="bg-white p-5 rounded-3xl flex justify-between items-center shadow-sm border border-transparent hover:border-gray-100 transition-all hover:shadow-md group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                  {t.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#1D1D1F]">{t.description}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">{t.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-[#1D1D1F]'}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</p>
                <button onClick={() => actions.delTrans(t.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const CardsView = ({ cards, add, del, fmt }) => (
  <div className="space-y-8 animate-enter">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
       {cards.map(c => <div key={c.id} className="h-full"><CardItem card={c} formatCurrency={fmt} deleteCard={del} /></div>)}
       <button onClick={add} className="h-60 border-2 border-dashed border-gray-300 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-400 hover:border-[#007AFF] hover:text-[#007AFF] hover:bg-white transition-all group bg-white/50"><div className="w-14 h-14 bg-white shadow-sm group-hover:shadow-md rounded-full flex items-center justify-center mb-3 transition-all"><Plus className="w-6 h-6"/></div><span className="font-bold">Agregar Tarjeta</span></button>
    </div>
  </div>
);

const StatsView = () => (
   <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 animate-enter text-center">
     <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6"><PieChart className="w-10 h-10 text-gray-300" /></div>
     <h3 className="text-xl font-bold text-[#1D1D1F] mb-2">Análisis Inteligente</h3>
     <p className="max-w-xs">Tus gráficos detallados estarán disponibles en la próxima actualización.</p>
   </div>
);

// --- COMPONENTES UI REUTILIZABLES ---
const SidebarItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group ${active ? 'bg-[#1D1D1F] text-white shadow-lg shadow-gray-300 scale-105' : 'text-gray-500 hover:bg-[#F5F7FA] hover:text-[#1D1D1F]'}`}>
    <span className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-[#1D1D1F]'}`}>{icon}</span> {label}
  </button>
);

const MobileNavItem = ({ icon, active, onClick }) => (
  <button onClick={onClick} className={`p-4 rounded-2xl transition-all ${active ? 'bg-white/10 text-white' : 'text-gray-500'}`}>{icon}</button>
);

const CardItem = ({ card, formatCurrency, deleteCard }) => {
  const gradients = {
    'from-blue-500 to-blue-700': 'linear-gradient(to bottom right, #3b82f6, #1d4ed8)',
    'from-purple-500 to-indigo-600': 'linear-gradient(to bottom right, #a855f7, #4f46e5)',
    'from-slate-700 to-black': 'linear-gradient(to bottom right, #334155, #000000)',
    'from-rose-400 to-orange-400': 'linear-gradient(to bottom right, #fb7185, #fb923c)',
    'from-emerald-500 to-teal-700': 'linear-gradient(to bottom right, #10b981, #0d9488)',
  };
  const bgStyle = {
    backgroundImage: gradients[card.bgGradient] || 'linear-gradient(to bottom right, #6b7280, #1f2937)',
  };

  return (
    <div
      style={bgStyle}
      className="h-56 rounded-[2.5rem] p-7 text-white shadow-xl relative flex flex-col justify-between group transition-all hover:-translate-y-2 hover:shadow-2xl overflow-hidden"
    >
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">Banco</p>
          <h4 className="font-bold text-2xl tracking-tight">{card.name}</h4>
        </div>
        <CreditCard className="w-8 h-8 opacity-50" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between text-xs font-bold opacity-90">
          <span>{formatCurrency(card.currentDebt)}</span>
          <span>{Math.round((card.currentDebt / card.limit) * 100)}%</span>
        </div>
        <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${(card.currentDebt / card.limit) > 0.8 ? 'bg-[#FF453A]' : 'bg-white'}`}
            style={{ width: `${Math.min((card.currentDebt / card.limit) * 100, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-end">
          <p className="text-[10px] font-semibold bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10">
            Corte: Día {card.cutoffDay} ({card.daysToCutoff} días)
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
            className="bg-white/20 p-2 rounded-full hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
    </div>
  );
};


// --- MODALES (NUEVO DISEÑO PREMIUM) ---

// 1. Transaction Form Rediseñado
const TransactionForm = ({ close, add }) => {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('expense');

  return (
    <div className="p-8 bg-white">
      {/* Header Modal */}
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-extrabold text-[#1D1D1F]">Nueva Transacción</h3>
        <button onClick={close} className="w-9 h-9 flex items-center justify-center bg-[#F5F7FA] rounded-full hover:bg-gray-200 transition-colors">
          <X className="w-5 h-5 text-gray-500"/>
        </button>
      </div>

      {/* Selector Gasto/Ingreso */}
      <div className="flex bg-[#F5F7FA] p-1.5 rounded-2xl mb-8 relative">
        <button 
          onClick={() => setType('expense')} 
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            type === 'expense' 
              ? 'bg-white text-[#1D1D1F] shadow-sm scale-[1.02]' 
              : 'text-gray-400 hover:text-gray-500'
          }`}
        >
          Gasto
        </button>
        <button 
          onClick={() => setType('income')} 
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            type === 'income' 
              ? 'bg-white text-green-600 shadow-sm scale-[1.02]' 
              : 'text-gray-400 hover:text-gray-500'
          }`}
        >
          Ingreso
        </button>
      </div>

      <div className="space-y-8">
        {/* INPUT GIGANTE SIN BORDES */}
        <div className="flex flex-col items-center justify-center py-4 relative group">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 opacity-50 group-focus-within:opacity-100 transition-opacity">
            Monto
          </label>
          <div className="flex items-baseline justify-center">
            <span className={`text-4xl font-bold mr-1 transition-colors ${!amount ? 'text-gray-200' : type === 'expense' ? 'text-[#1D1D1F]' : 'text-green-600'}`}>$</span>
            {/* Input invisible visualmente pero funcional */}
            <input 
              type="number" 
              autoFocus 
              placeholder="0" 
              className="w-full max-w-[200px] text-center text-7xl font-extrabold bg-transparent outline-none placeholder-gray-200 text-[#1D1D1F] caret-[#007AFF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 m-0 leading-none"
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
            />
          </div>
        </div>

        {/* Input Concepto Estilizado */}
        <div className="bg-[#F5F7FA] rounded-2xl px-5 py-4 flex items-center gap-4 border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-all">
          <div className={`p-2.5 rounded-full ${type === 'expense' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'}`}>
            {type === 'expense' ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
          </div>
          <div className="flex-1">
             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Concepto</label>
             <input 
               type="text" 
               placeholder="Ej. Supermercado, Uber..." 
               className="w-full bg-transparent font-bold text-lg outline-none text-[#1D1D1F] placeholder-gray-400"
               value={desc} 
               onChange={e => setDesc(e.target.value)} 
             />
          </div>
        </div>

        {/* Botón Guardar */}
        <button 
          onClick={() => { if(amount) { add(amount, desc || (type === 'expense' ? 'Gasto General' : 'Ingreso Extra'), type, 'General'); close(); } }} 
          disabled={!amount} 
          className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl flex justify-center items-center gap-2 active:scale-95 transition-all duration-300 ${
            !amount ? 'bg-gray-300 cursor-not-allowed shadow-none' : type === 'expense' ? 'bg-[#1D1D1F] shadow-gray-300' : 'bg-green-600 shadow-green-200'
          }`}
        >
          {amount ? `Guardar ${type === 'expense' ? 'Gasto' : 'Ingreso'}` : 'Ingresa un monto'}
        </button>
      </div>
    </div>
  );
};

const CardForm = ({ close, add }) => {
  const [f, setF] = useState({ name: '', limit: '', debt: '', cut: '', pay: '' });
  return (
    <div className="p-8 bg-white">
      <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-extrabold text-[#1D1D1F]">Nueva Tarjeta</h3><button onClick={close} className="w-9 h-9 flex items-center justify-center bg-[#F5F7FA] rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-500"/></button></div>
      <div className="space-y-4"><input className="ios-input" placeholder="Nombre (Ej. Nu, BBVA)" value={f.name} onChange={e => setF({...f, name: e.target.value})} /><div className="grid grid-cols-2 gap-4"><input type="number" className="ios-input" placeholder="Límite Total" value={f.limit} onChange={e => setF({...f, limit: e.target.value})} /><input type="number" className="ios-input" placeholder="Deuda Actual" value={f.debt} onChange={e => setF({...f, debt: e.target.value})} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-2">Día Corte</label><input type="number" className="ios-input" placeholder="Ej. 15" value={f.cut} onChange={e => setF({...f, cut: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-2">Día Pago</label><input type="number" className="ios-input" placeholder="Ej. 5" value={f.pay} onChange={e => setF({...f, pay: e.target.value})} /></div></div><button onClick={() => { if(f.name) { add(f.name, f.limit, f.cut, f.pay, f.debt); close(); } }} className="w-full py-4 mt-4 bg-[#007AFF] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">Crear Tarjeta</button></div>
    </div>
  );
};

const SubForm = ({ close, add }) => {
  const [f, setF] = useState({ name: '', amount: '', day: '', cat: 'service' });
  return (
    <div className="p-8 bg-white">
      <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-extrabold text-[#1D1D1F]">Pago Fijo</h3><button onClick={close} className="w-9 h-9 flex items-center justify-center bg-[#F5F7FA] rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-500"/></button></div>
      <div className="flex justify-center gap-6 mb-8">{[{id:'home', icon:HomeIcon, color:'text-orange-600', bg:'bg-orange-100'}, {id:'entertainment', icon:Tv, color:'text-purple-600', bg:'bg-purple-100'}, {id:'service', icon:Zap, color:'text-blue-600', bg:'bg-blue-100'}].map(c => (<button key={c.id} onClick={() => setF({...f, cat: c.id})} className={`p-4 rounded-2xl transition-all ${f.cat === c.id ? `${c.bg} ring-4 ring-gray-100 scale-110` : 'bg-gray-50 hover:bg-gray-100'}`}><c.icon className={`w-6 h-6 ${f.cat === c.id ? c.color : 'text-gray-400'}`} /></button>))}</div>
      <div className="space-y-4"><input className="ios-input" placeholder="Nombre (Ej. Netflix)" value={f.name} onChange={e => setF({...f, name: e.target.value})} /><div className="grid grid-cols-2 gap-4"><input type="number" className="ios-input" placeholder="Monto" value={f.amount} onChange={e => setF({...f, amount: e.target.value})} /><input type="number" max="31" className="ios-input" placeholder="Día (1-31)" value={f.day} onChange={e => setF({...f, day: e.target.value})} /></div><button onClick={() => { if(f.name) { add(f.name, f.amount, f.day, f.cat); close(); } }} className="w-full py-4 mt-4 bg-[#1D1D1F] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">Programar</button></div>
    </div>
  );
};
