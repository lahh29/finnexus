'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../firebase/auth';
import { useFinance } from '../hooks/useFinance';
import { useCards } from '../hooks/useCards';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useTheme } from 'next-themes';
import { 
  Plus, TrendingUp, TrendingDown, Trash2, X, CreditCard, 
  Home as HomeIcon, Tv, Zap, LayoutGrid, PieChart, 
  LogOut, ArrowRight, User, Hexagon, Moon, Sun
} from 'lucide-react';

const BrandLogo = ({ className = "w-8 h-8", dark = false }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="relative flex items-center justify-center group">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative w-10 h-10 transform group-hover:rotate-12 transition-transform duration-500 ease-out z-10">
        <path d="M20 12C15.5817 12 12 15.5817 12 20C12 24.4183 15.5817 28 20 28C24.4183 28 28 24.4183 28 20" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M28 20C28 15.5817 24.4183 12 20 12" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="3" fill="hsl(var(--foreground))"/>
      </svg>
    </div>
    <span className={`font-bold text-xl tracking-tight text-foreground`}>
      Fin<span className="text-primary">Nexus</span>
    </span>
  </div>
);

export default function Home() {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-background"><div className="w-10 h-10 border-4 border-primary rounded-full animate-spin border-t-transparent"></div></div>;
  if (!user) return <LoginPage />;

  return <Dashboard user={user} />;
}

function LoginPage() {
  const { loginWithEmail, registerWithEmail, loading: authLoading } = useAuth();
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

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-background"><div className="w-10 h-10 border-4 border-primary rounded-full animate-spin border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-secondary/50 font-sans text-foreground">
      <div className="flex flex-col justify-center items-center p-8 lg:p-20 order-2 lg:order-1 relative">
        <div className="w-full max-w-[380px] space-y-10 animate-enter z-10">
          <div className="text-center lg:text-left">
            <BrandLogo className="mb-8 justify-center lg:justify-start" />
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">{isLogin ? 'Bienvenido' : 'Crear Cuenta'}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">Gestiona tu patrimonio con inteligencia.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="group relative">
                 <User className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                 <input type="text" placeholder="Nombre completo" className="w-full bg-card border border-border rounded-2xl px-12 py-3.5 text-base font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div className="group relative">
               <div className="absolute left-4 top-3.5 text-muted-foreground text-sm font-bold">@</div>
               <input type="email" placeholder="correo@ejemplo.com" className="w-full bg-card border border-border rounded-2xl px-12 py-3.5 text-base font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="group relative">
               <div className="absolute left-4 top-3.5 text-muted-foreground text-sm font-bold">***</div>
               <input type="password" placeholder="Contraseña" className="w-full bg-card border border-border rounded-2xl px-12 py-3.5 text-base font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" value={pass} onChange={e => setPass(e.target.value)} />
            </div>
            {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm font-medium border border-destructive/20 flex items-center gap-2"><X className="w-4 h-4"/>{error}</div>}
            <button className="w-full bg-foreground text-background font-bold rounded-2xl px-6 py-4 active:scale-95 hover:bg-foreground/90 transition-all shadow-xl shadow-gray-200 dark:shadow-black/20 flex items-center justify-center gap-3">
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center pt-2">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
              {isLogin ? '¿Nuevo aquí? Crea tu cuenta gratis' : '¿Ya tienes cuenta? Ingresa ahora'}
            </button>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex relative bg-foreground order-1 lg:order-2 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"></div>
        <div className="relative z-10 text-center px-12 max-w-2xl">
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
            <Hexagon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-5xl font-bold text-background mb-6 tracking-tight leading-tight">El sistema operativo de tus finanzas.</h2>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user }) {
  const { logout } = useAuth();
  const { transactions, balance, income, expense, addTransaction, deleteTransaction, loadingData } = useFinance();
  const { cards, addCard, deleteCard, loadingCards } = useCards();
  const { subs, totalFixed, addSubscription, deleteSubscription, loadingSubs } = useSubscriptions();
  
  const [activeModal, setActiveModal] = useState(null);
  const [currentView, setCurrentView] = useState('overview');

  const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  
  const isLoading = loadingData || loadingCards || loadingSubs;

  const renderContent = () => {
    if (isLoading) {
      return <DashboardSkeleton />;
    }
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
    <div className="min-h-screen bg-background font-sans text-foreground">
      <aside className="hidden md:flex flex-col w-[270px] fixed left-4 top-4 bottom-4 bg-card/80 backdrop-blur-2xl rounded-[2.5rem] border border-border/60 shadow-[0_8px_32px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.1)] z-50 p-6 justify-between transition-all duration-300">
        <div>
          <div className="px-2 mb-12 mt-4"><BrandLogo /></div>
          <nav className="space-y-2">
            <SidebarItem icon={<LayoutGrid />} label="Resumen" active={currentView === 'overview'} onClick={() => setCurrentView('overview')} />
            <SidebarItem icon={<CreditCard />} label="Billetera" active={currentView === 'cards'} onClick={() => setCurrentView('cards')} />
            <SidebarItem icon={<PieChart />} label="Reportes" active={currentView === 'stats'} onClick={() => setCurrentView('stats')} />
          </nav>
        </div>
        <UserProfile user={user} logout={logout} />
      </aside>

      <main className="flex-1 md:ml-[290px] p-4 md:p-8 lg:p-10 pb-32 md:pb-8 max-w-[1400px]">
        <div className="md:hidden flex justify-between items-center mb-8 pt-2">
          <BrandLogo className="scale-90" />
          <button onClick={logout} className="p-2 bg-card rounded-full shadow-sm text-muted-foreground"><LogOut className="w-5 h-5"/></button>
        </div>
        <div className="hidden md:flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{currentView === 'overview' ? 'Panel de Control' : currentView === 'cards' ? 'Mis Tarjetas' : 'Análisis'}</h1>
            <p className="text-muted-foreground font-medium mt-1">Resumen financiero en tiempo real</p>
          </div>
          <button onClick={() => setActiveModal('transaction')} className="group relative px-6 py-3 bg-foreground text-background rounded-2xl font-bold text-sm shadow-xl shadow-gray-200 dark:shadow-black/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all overflow-hidden">
            <div className="absolute inset-0 bg-white/10 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva Transacción</span>
          </button>
        </div>
        {renderContent()}
      </main>

      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-foreground/90 backdrop-blur-xl rounded-[2rem] p-2 flex justify-between items-center z-40 shadow-2xl shadow-black/20 text-gray-400">
        <MobileNavItem icon={<LayoutGrid />} active={currentView === 'overview'} onClick={() => setCurrentView('overview')} />
        <button onClick={() => setActiveModal('transaction')} className="w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center -mt-8 border-4 border-background active:scale-95 transition-transform"><Plus className="w-6 h-6" /></button>
        <MobileNavItem icon={<CreditCard />} active={currentView === 'cards'} onClick={() => setCurrentView('cards')} />
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center" onClick={() => setActiveModal(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>
          <div className="relative z-[110] w-full max-w-md bg-card md:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden animate-enter" onClick={e => e.stopPropagation()}>
             {activeModal === 'transaction' && <TransactionForm close={() => setActiveModal(null)} add={addTransaction} />}
             {activeModal === 'card' && <CardForm close={() => setActiveModal(null)} add={addCard} />}
             {activeModal === 'sub' && <SubForm close={() => setActiveModal(null)} add={addSubscription} />}
          </div>
        </div>
      )}
    </div>
  );
}

const OverviewView = ({ data, actions, fmt }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-enter">
    <div className="lg:col-span-8 space-y-8">
      <div className="rounded-[2.5rem] bg-foreground text-background p-8 md:p-10 relative overflow-hidden shadow-2xl group ring-1 ring-white/10 dark:ring-white/5">
        <div className="absolute top-[-50%] right-[-30%] w-[800px] h-[800px] bg-blue-600/20 blur-[150px] rounded-full pointer-events-none opacity-60"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-8">
          <div className="flex-1">
            <div className="text-blue-300 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div> Balance Total
            </div>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4 text-background">{fmt(data.balance)}</h2>
            <div className="inline-flex items-center gap-2 text-gray-300 text-xs font-semibold bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>{fmt(data.totalFixed)} en gastos fijos</span>
            </div>
          </div>
          <div className="w-full md:w-auto flex-shrink-0 flex md:flex-col gap-4">
             <div className="flex-1 bg-white/5 p-5 rounded-2xl backdrop-blur-md border border-white/5 hover:bg-white/10 transition-colors">
                <p className="text-[10px] text-gray-300 uppercase font-bold tracking-wide mb-1 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-green-400"/>Ingresos</p>
                <p className="text-2xl font-semibold text-background">{fmt(data.income)}</p>
             </div>
             <div className="flex-1 bg-white/5 p-5 rounded-2xl backdrop-blur-md border border-white/5 hover:bg-white/10 transition-colors">
                <p className="text-[10px] text-gray-300 uppercase font-bold tracking-wide mb-1 flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5 text-red-400"/>Gastos</p>
                <p className="text-2xl font-semibold text-background">{fmt(data.expense)}</p>
             </div>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-[2.5rem] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-border/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-foreground tracking-tight">Billetera</h3>
          <button onClick={() => actions.changeView('cards')} className="text-primary text-sm font-bold hover:bg-accent px-4 py-2 rounded-xl transition-all">Ver todo</button>
        </div>
        <div className="relative h-44 flex items-center">
          {data.cards.map((c, i) => (
            <div key={c.id} className="absolute w-full max-w-sm transition-all duration-300 ease-out" style={{ transform: `translateX(${i * 20}px) translateY(${i * -10}px) rotate(${i * 2}deg)`, zIndex: data.cards.length - i }}>
              <CardItem card={c} formatCurrency={fmt} deleteCard={actions.delCard} inStack={true} />
            </div>
          ))}
          {data.cards.length < 5 && (
            <button onClick={actions.addCard} className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-40 bg-card border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-accent transition-all group gap-2 shadow-sm" style={{ zIndex: 0 }}>
              <div className="w-10 h-10 bg-secondary group-hover:bg-primary/10 rounded-full flex items-center justify-center transition-colors"><Plus className="w-5 h-5"/></div>
              <span className="text-xs font-bold">Nueva</span>
            </button>
          )}
        </div>
      </div>
    </div>
    <div className="lg:col-span-4 space-y-8">
      <div className="bg-card rounded-[2.5rem] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-border/50 h-fit">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-foreground">Pagos Próximos</h3>
          <button onClick={actions.addSub} className="w-9 h-9 flex items-center justify-center bg-secondary rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"><Plus className="w-4 h-4"/></button>
        </div>
        <div className="space-y-5">
          {data.subs.map(sub => (
            <div key={sub.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${sub.category === 'home' ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-500' : sub.category === 'entertainment' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-500' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-500'}`}>
                  {sub.category === 'home' ? <HomeIcon className="w-5 h-5" /> : sub.category === 'entertainment' ? <Tv className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{sub.name}</p>
                  <p className={`text-xs font-medium ${sub.daysLeft <= 3 ? 'text-destructive' : 'text-muted-foreground'}`}>{sub.daysLeft === 0 ? '¡Vence hoy!' : `${sub.daysLeft} días restantes`}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-foreground">{fmt(sub.amount)}</p>
                <button onClick={() => actions.delSub(sub.id)} className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 hover:underline font-medium transition-opacity">Eliminar</button>
              </div>
            </div>
          ))}
          {data.subs.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Estás al día 🎉</p>}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-5 px-1 text-foreground">Historial</h3>
        <div className="space-y-3">
          {data.transactions.slice(0, 5).map(t => (
            <div key={t.id} className="bg-card p-5 rounded-3xl flex justify-between items-center shadow-sm border border-transparent hover:border-border transition-all hover:shadow-md group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-500/10 text-green-600' : 'bg-secondary text-muted-foreground'}`}>
                  {t.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{t.description}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">{t.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-foreground'}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</p>
                <button onClick={() => actions.delTrans(t.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
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
       <button onClick={add} className="h-60 border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-card transition-all group bg-card/50"><div className="w-14 h-14 bg-card shadow-sm group-hover:shadow-md rounded-full flex items-center justify-center mb-3 transition-all"><Plus className="w-6 h-6"/></div><span className="font-bold">Agregar Tarjeta</span></button>
    </div>
  </div>
);

const StatsView = () => (
   <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground animate-enter text-center">
     <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6"><PieChart className="w-10 h-10 text-muted-foreground/50" /></div>
     <h3 className="text-xl font-bold text-foreground mb-2">Análisis Inteligente</h3>
     <p className="max-w-xs">Tus gráficos detallados estarán disponibles en la próxima actualización.</p>
   </div>
);

const UserProfile = ({ user, logout }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="group relative">
      <div className="flex items-center gap-4 px-2 py-4">
        <div className="w-10 h-10 rounded-full bg-secondary shadow-sm flex items-center justify-center text-foreground font-bold border border-border">{user.displayName ? user.displayName[0] : 'U'}</div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-bold truncate text-foreground">{user.displayName}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Cuenta Pro</p>
        </div>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-border">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button onClick={logout} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-destructive/20 hover:text-destructive ml-1">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


const SidebarItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group ${active ? 'bg-foreground text-background shadow-lg shadow-gray-200 dark:shadow-black/20 scale-105' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
    <span className={`${active ? 'text-background' : 'text-muted-foreground group-hover:text-foreground'}`}>{icon}</span> {label}
  </button>
);

const MobileNavItem = ({ icon, active, onClick }) => (
  <button onClick={onClick} className={`p-4 rounded-2xl transition-all ${active ? 'bg-white/10 text-white' : 'text-gray-500'}`}></button>
);

const CardItem = ({ card, formatCurrency, deleteCard, inStack = false }) => {
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

  const cardHeight = inStack ? 'h-40' : 'h-56';

  return (
    <div
      style={bgStyle}
      className={`${cardHeight} rounded-[1.75rem] p-6 text-white shadow-xl relative flex flex-col justify-between group transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden`}
    >
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">
            {inStack ? card.name.split(' ')[0] : 'Banco'}
          </p>
          {!inStack && <h4 className="font-bold text-2xl tracking-tight">{card.name}</h4>}
        </div>
        {!inStack && <CreditCard className="w-8 h-8 opacity-50" />}
      </div>
      <div className="relative z-10 space-y-3">
        {!inStack && (
          <>
            <div className="flex justify-between text-xs font-bold opacity-90">
              <span>{formatCurrency(card.currentDebt)}</span>
              <span>{Math.round((card.currentDebt / card.limit) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${(card.currentDebt / card.limit) > 0.8 ? 'bg-[#FF453A]' : 'bg-white'}`}
                style={{ width: `${Math.min((card.currentDebt / card.limit) * 100, 100)}%` }}
              ></div>
            </div>
          </>
        )}
        <div className="flex justify-between items-end">
          <p className="text-[10px] font-semibold bg-black/20 px-2.5 py-1.5 rounded-lg backdrop-blur-md border border-white/10">
            Corte: Día {card.cutoffDay} ({card.daysToCutoff} d)
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

const TransactionForm = ({ close, add }) => {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('expense');

  return (
    <div className="p-8 bg-card">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-extrabold text-foreground">Nueva Transacción</h3>
        <button onClick={close} className="w-9 h-9 flex items-center justify-center bg-secondary rounded-full hover:bg-border transition-colors">
          <X className="w-5 h-5 text-muted-foreground"/>
        </button>
      </div>

      <div className="flex bg-secondary p-1.5 rounded-2xl mb-8 relative">
        <button 
          onClick={() => setType('expense')} 
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            type === 'expense' 
              ? 'bg-card text-foreground shadow-sm scale-[1.02]' 
              : 'text-muted-foreground hover:text-foreground/80'
          }`}
        >
          Gasto
        </button>
        <button 
          onClick={() => setType('income')} 
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            type === 'income' 
              ? 'bg-card text-green-600 shadow-sm scale-[1.02]' 
              : 'text-muted-foreground hover:text-foreground/80'
          }`}
        >
          Ingreso
        </button>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col items-center justify-center py-4 relative group">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 opacity-50 group-focus-within:opacity-100 transition-opacity">
            Monto
          </label>
          <div className="flex items-baseline justify-center">
            <span className={`text-4xl font-bold mr-1 transition-colors ${!amount ? 'text-border' : type === 'expense' ? 'text-foreground' : 'text-green-600'}`}>$</span>
            <input 
              type="number" 
              autoFocus 
              placeholder="0" 
              className="w-full max-w-[200px] text-center text-7xl font-extrabold bg-transparent outline-none placeholder-border text-foreground caret-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 m-0 leading-none"
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
            />
          </div>
        </div>
        <div className="bg-secondary rounded-2xl px-5 py-4 flex items-center gap-4 border border-transparent focus-within:border-border focus-within:bg-card transition-all">
          <div className={`p-2.5 rounded-full ${type === 'expense' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
            {type === 'expense' ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
          </div>
          <div className="flex-1">
             <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Concepto</label>
             <input 
               type="text" 
               placeholder="Ej. Supermercado, Uber..." 
               className="w-full bg-transparent font-bold text-lg outline-none text-foreground placeholder-muted-foreground"
               value={desc} 
               onChange={e => setDesc(e.target.value)} 
             />
          </div>
        </div>

        <button 
          onClick={() => { if(amount) { add(amount, desc || (type === 'expense' ? 'Gasto General' : 'Ingreso Extra'), type, 'General'); close(); } }} 
          disabled={!amount} 
          className={`w-full py-4 rounded-2xl font-bold text-lg text-background shadow-xl flex justify-center items-center gap-2 active:scale-95 transition-all duration-300 ${
            !amount ? 'bg-secondary text-muted-foreground cursor-not-allowed shadow-none' : type === 'expense' ? 'bg-foreground shadow-gray-400/30 dark:shadow-black/30' : 'bg-green-600 text-white shadow-green-200 dark:shadow-green-900/50'
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
  const inputClass = "w-full bg-secondary border-0 rounded-2xl px-5 py-4 text-base font-medium outline-none transition-all focus:bg-card focus:ring-2 focus:ring-primary/20 focus:shadow-lg";
  return (
    <div className="p-8 bg-card">
      <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-extrabold text-foreground">Nueva Tarjeta</h3><button onClick={close} className="w-9 h-9 flex items-center justify-center bg-secondary rounded-full hover:bg-border"><X className="w-5 h-5 text-muted-foreground"/></button></div>
      <div className="space-y-4"><input className={inputClass} placeholder="Nombre (Ej. Nu, BBVA)" value={f.name} onChange={e => setF({...f, name: e.target.value})} /><div className="grid grid-cols-2 gap-4"><input type="number" className={inputClass} placeholder="Límite Total" value={f.limit} onChange={e => setF({...f, limit: e.target.value})} /><input type="number" className={inputClass} placeholder="Deuda Actual" value={f.debt} onChange={e => setF({...f, debt: e.target.value})} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-2">Día Corte</label><input type="number" className={inputClass} placeholder="Ej. 15" value={f.cut} onChange={e => setF({...f, cut: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-2">Día Pago</label><input type="number" className={inputClass} placeholder="Ej. 5" value={f.pay} onChange={e => setF({...f, pay: e.target.value})} /></div></div><button onClick={() => { if(f.name) { add(f.name, f.limit, f.cut, f.pay, f.debt); close(); } }} className="w-full py-4 mt-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg active:scale-95 transition-all">Crear Tarjeta</button></div>
    </div>
  );
};

const SubForm = ({ close, add }) => {
  const [f, setF] = useState({ name: '', amount: '', day: '', cat: 'service' });
  const inputClass = "w-full bg-secondary border-0 rounded-2xl px-5 py-4 text-base font-medium outline-none transition-all focus:bg-card focus:ring-2 focus:ring-primary/20 focus:shadow-lg";
  return (
    <div className="p-8 bg-card">
      <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-extrabold text-foreground">Pago Fijo</h3><button onClick={close} className="w-9 h-9 flex items-center justify-center bg-secondary rounded-full hover:bg-border"><X className="w-5 h-5 text-muted-foreground"/></button></div>
      <div className="flex justify-center gap-6 mb-8">{[{id:'home', icon:HomeIcon, color:'text-orange-600', bg:'bg-orange-100', darkBg:'dark:bg-orange-500/10'}, {id:'entertainment', icon:Tv, color:'text-purple-600', bg:'bg-purple-100', darkBg:'dark:bg-purple-500/10'}, {id:'service', icon:Zap, color:'text-blue-600', bg:'bg-blue-100', darkBg:'dark:bg-blue-500/10'}].map(c => (<button key={c.id} onClick={() => setF({...f, cat: c.id})} className={`p-4 rounded-2xl transition-all ${f.cat === c.id ? `${c.bg} ${c.darkBg} ring-4 ring-border/50 scale-110` : 'bg-secondary hover:bg-border'}`}><c.icon className={`w-6 h-6 ${f.cat === c.id ? c.color : 'text-muted-foreground'}`} /></button>))}</div>
      <div className="space-y-4"><input className={inputClass} placeholder="Nombre (Ej. Netflix)" value={f.name} onChange={e => setF({...f, name: e.target.value})} /><div className="grid grid-cols-2 gap-4"><input type="number" className={inputClass} placeholder="Monto" value={f.amount} onChange={e => setF({...f, amount: e.target.value})} /><input type="number" max="31" className={inputClass} placeholder="Día (1-31)" value={f.day} onChange={e => setF({...f, day: e.target.value})} /></div><button onClick={() => { if(f.name) { add(f.name, f.amount, f.day, f.cat); close(); } }} className="w-full py-4 mt-4 bg-foreground text-background font-bold rounded-2xl shadow-lg active:scale-95 transition-all">Programar</button></div>
    </div>
  );
};


const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
    <div className="lg:col-span-8 space-y-8">
      {/* Balance Card Skeleton */}
      <div className="rounded-[2.5rem] bg-secondary p-8 md:p-10 h-[216px]">
        <div className="h-4 bg-muted rounded-full w-1/4 mb-4"></div>
        <div className="h-12 bg-muted rounded-lg w-1/2 mb-4"></div>
        <div className="h-6 bg-muted rounded-full w-1/3"></div>
      </div>
      {/* Cards Skeleton */}
      <div className="bg-card rounded-[2.5rem] p-8 border border-border/50">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-muted rounded-full w-1/3"></div>
          <div className="h-8 bg-muted rounded-lg w-20"></div>
        </div>
        <div className="relative h-44 flex items-center">
          <div className="absolute w-full max-w-sm h-40 rounded-3xl bg-secondary"></div>
          <div className="absolute w-full max-w-sm h-40 rounded-3xl bg-muted right-0"></div>
        </div>
      </div>
    </div>
    <div className="lg:col-span-4 space-y-8">
      {/* Subscriptions Skeleton */}
      <div className="bg-card rounded-[2.5rem] p-8 border border-border/50 h-fit">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-muted rounded-full w-2/3"></div>
          <div className="w-9 h-9 bg-muted rounded-full"></div>
        </div>
        <div className="space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded-full w-24"></div>
                  <div className="h-3 bg-muted rounded-full w-16"></div>
                </div>
              </div>
              <div className="h-5 bg-muted rounded-full w-12"></div>
            </div>
          ))}
        </div>
      </div>
      {/* History Skeleton */}
      <div>
        <div className="h-6 bg-muted rounded-full w-1/3 mb-5 px-1"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card p-5 rounded-3xl flex justify-between items-center border border-border/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded-full w-32"></div>
                  <div className="h-3 bg-muted rounded-full w-20"></div>
                </div>
              </div>
              <div className="h-5 bg-muted rounded-full w-16"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
