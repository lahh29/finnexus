'use client';

import React, { useState, useEffect, useCallback, useMemo, useContext, forwardRef } from 'react';
import { useAuth } from '../firebase/auth-provider';
import { useFinance, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../hooks/useFinance';
import { useCards, CARD_GRADIENTS } from '../hooks/useCards';
import { useSubscriptions, SUBSCRIPTION_CATEGORIES } from '../hooks/useSubscriptions';
import { useThemeMounted } from '../components/theme-provider';
import { useCurrency } from '../context/CurrencyContext';
import { 
  Plus, TrendingUp, TrendingDown, Trash2, X, CreditCard, 
  Wallet, Calendar, LayoutGrid, ChartPie, LogOut, 
  ArrowRight, User, Moon, Sun, ChevronRight, Bell,
  Sparkles, CircleDollarSign, Receipt, Eye, EyeOff,
  Check, AlertCircle, Target, PiggyBank, Settings, CheckCircle
} from 'lucide-react';

// ============================================
// BRAND & ICONS
// ============================================

const BrandLogo = ({ size = 'default' }) => {
  const sizes = {
    small: { container: 'gap-2', icon: 'w-7 h-7', text: 'text-base' },
    default: { container: 'gap-2.5', icon: 'w-8 h-8', text: 'text-lg' },
    large: { container: 'gap-3', icon: 'w-10 h-10', text: 'text-xl' },
  };
  const s = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center ${s.container}`}>
      <div className={`${s.icon} rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center`}>
        <CircleDollarSign className="w-1/2 h-1/2 text-primary" />
      </div>
      <span className={`font-semibold ${s.text} text-foreground tracking-tight`}>
        Fin<span className="text-primary">Nexus</span>
      </span>
    </div>
  );
};

const CategoryIcon = ({ category, type = 'expense', size = 'default' }) => {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const cat = categories.find(c => c.id === category) || categories.find(c => c.id === 'other');
  
  const sizes = {
    small: 'w-8 h-8 rounded-lg',
    default: 'w-10 h-10 rounded-xl',
    large: 'w-12 h-12 rounded-2xl',
  };

  const colorMap = {
    orange: 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/20',
    blue: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/20',
    pink: 'bg-pink-500/10 text-pink-500 dark:bg-pink-500/20',
    red: 'bg-red-500/10 text-red-500 dark:bg-red-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20',
    gray: 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20',
    amber: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20',
    slate: 'bg-slate-500/10 text-slate-500 dark:bg-slate-500/20',
    green: 'bg-green-500/10 text-green-500 dark:bg-green-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20',
  };

  return (
    <div className={`${sizes[size]} ${colorMap[cat?.color] || colorMap.slate} flex items-center justify-center flex-shrink-0`}>
      {type === 'income' ? (
        <TrendingUp className="w-1/2 h-1/2" />
      ) : (
        <TrendingDown className="w-1/2 h-1/2" />
      )}
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

export default function Home() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <DashboardSkeleton />;
  }
  
  if (!user) return <LoginPage />;
  return <Dashboard user={user} />;
}

// ============================================
// LOGIN PAGE
// ============================================

function LoginPage() {
  const { loginWithEmail, registerWithEmail, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setError('');
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        await loginWithEmail(email, pass);
      } else {
        await registerWithEmail(email, pass, name);
      }
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas. Verifica tus datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Mobile Layout */}
      <div className="flex-1 flex flex-col lg:hidden">
        <div className="px-6 pt-12 pb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <CircleDollarSign className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestiona tus finanzas de forma inteligente
          </p>
        </div>

        <div className="flex-1 bg-card rounded-t-[2rem] px-6 pt-8 pb-safe">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
            {!isLogin && (
              <InputField
                icon={<User className="w-5 h-5" />}
                type="text"
                placeholder="Nombre completo"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            )}
            
            <InputField
              icon={<span className="text-sm font-medium">@</span>}
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            
            <InputField
              icon={<span className="text-sm font-medium">•••</span>}
              type="password"
              placeholder="Contraseña"
              value={pass}
              onChange={e => setPass(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </form>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-2 min-h-[100dvh]">
        <div className="flex items-center justify-center p-12">
          <div className="w-full max-w-md space-y-8">
            <div>
              <BrandLogo size="large" />
              <h1 className="text-3xl font-bold text-foreground mt-8 mb-2">
                {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
              </h1>
              <p className="text-muted-foreground">
                Gestiona tus finanzas personales de forma inteligente
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <InputField
                  icon={<User className="w-5 h-5" />}
                  type="text"
                  placeholder="Nombre completo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              )}
              
              <InputField
                icon={<span className="text-sm font-medium">@</span>}
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
              
              <InputField
                icon={<span className="text-sm font-medium">•••</span>}
                type="password"
                placeholder="Contraseña"
                value={pass}
                onChange={e => setPass(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 dark:from-primary/10 dark:via-background dark:to-primary/5 flex items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative text-center max-w-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 dark:bg-primary/20 mb-8 ring-1 ring-primary/20">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Tu dinero, bajo control
            </h2>
            <p className="text-muted-foreground text-lg">
              Visualiza tus gastos, administra tus tarjetas y nunca pierdas de vista tus suscripciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const InputField = ({ icon, ...props }) => (
  <div className="relative group">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
      {icon}
    </div>
    <input
      {...props}
      className="w-full h-12 bg-secondary/50 dark:bg-secondary/30 border border-border/50 rounded-xl pl-12 pr-4 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
    />
  </div>
);

// ============================================
// DASHBOARD
// ============================================

function Dashboard({ user }) {
  const { logout } = useAuth();
  const { mounted } = useThemeMounted();
  const { formatCurrency } = useCurrency();
  
  const { 
    transactions, 
    balance, 
    income, 
    expense, 
    addTransaction, 
    deleteTransaction, 
    loadingData,
    expenseCategories,
    incomeCategories,
  } = useFinance();
  
  const { 
    cards, 
    addCard, 
    deleteCard,
    loadingCards,
    availableGradients,
    canAddMore: canAddMoreCards,
    totalDebt,
    totalLimit,
  } = useCards();
  
  const { 
    subs, 
    totals: subTotals,
    alerts: subAlerts,
    addSubscription, 
    deleteSubscription,
    markAsPaid,
    loadingSubs,
    categories: subCategories,
  } = useSubscriptions();
  
  const [activeModal, setActiveModal] = useState(null);
  const [currentView, setCurrentView] = useState('overview');
  const [showBalance, setShowBalance] = useState(true);

  const isLoading = loadingData || loadingCards || loadingSubs || !mounted;

  // Datos para reportes
  const reportData = useMemo(() => ({
    transactions,
    balance,
    income,
    expense,
    cards,
    subs,
    subTotals,
    totalDebt,
    totalLimit,
  }), [transactions, balance, income, expense, cards, subs, subTotals, totalDebt, totalLimit]);

  return (
    <div className="min-h-[100dvh] bg-secondary dark:bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 bottom-0 bg-card/50 dark:bg-card/30 backdrop-blur-xl border-r border-border/30 p-4 z-40">
        <div className="p-2 mb-6">
          <BrandLogo />
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem 
            icon={<LayoutGrid className="w-5 h-5" />} 
            label="Resumen" 
            active={currentView === 'overview'} 
            onClick={() => setCurrentView('overview')} 
          />
          <NavItem 
            icon={<Wallet className="w-5 h-5" />} 
            label="Tarjetas" 
            active={currentView === 'cards'} 
            onClick={() => setCurrentView('cards')} 
          />
          <NavItem 
            icon={<Calendar className="w-5 h-5" />} 
            label="Suscripciones" 
            active={currentView === 'subscriptions'} 
            onClick={() => setCurrentView('subscriptions')}
            badge={subAlerts.dueSoon.length + subAlerts.dueToday.length}
          />
          <NavItem 
            icon={<ChartPie className="w-5 h-5" />} 
            label="Reportes" 
            active={currentView === 'stats'} 
            onClick={() => setCurrentView('stats')} 
          />
        </nav>

        <UserProfile user={user} logout={logout} />
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between px-4 h-14">
            <BrandLogo size="small" />
            <div className="flex items-center gap-1">
              <UserProfile user={user} logout={logout} isMobile />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-6xl mx-auto">
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {currentView === 'overview' && (
                <OverviewView 
                  data={{ balance, income, expense, transactions, cards, subs, subTotals, subAlerts }}
                  actions={{ 
                    setActiveModal, 
                    deleteTransaction, 
                    deleteCard,
                    deleteSub: deleteSubscription,
                    setCurrentView,
                  }}
                  formatCurrency={formatCurrency}
                  showBalance={showBalance}
                  setShowBalance={setShowBalance}
                />
              )}
              {currentView === 'cards' && (
                <CardsView 
                  cards={cards}
                  addCard={() => setActiveModal('card')}
                  deleteCard={deleteCard}
                  formatCurrency={formatCurrency}
                  canAddMore={canAddMoreCards}
                />
              )}
              {currentView === 'subscriptions' && (
                <SubscriptionsView
                  subs={subs}
                  totals={subTotals}
                  alerts={subAlerts}
                  addSub={() => setActiveModal('subscription')}
                  deleteSub={deleteSubscription}
                  markAsPaid={markAsPaid}
                  formatCurrency={formatCurrency}
                  categories={subCategories}
                />
              )}
              {currentView === 'stats' && (
                <StatsView 
                  data={reportData}
                  formatCurrency={formatCurrency}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border/50 safe-area-bottom z-40">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          <MobileNavItem 
            icon={<LayoutGrid />} 
            label="Inicio" 
            active={currentView === 'overview'} 
            onClick={() => setCurrentView('overview')} 
          />
          <MobileNavItem 
            icon={<Wallet />} 
            label="Tarjetas" 
            active={currentView === 'cards'} 
            onClick={() => setCurrentView('cards')} 
          />
          
          {/* FAB */}
          <div className="relative -mt-6">
            <button
              onClick={() => setActiveModal('transaction')}
              className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          
          <MobileNavItem 
            icon={<Calendar />} 
            label="Pagos" 
            active={currentView === 'subscriptions'} 
            onClick={() => setCurrentView('subscriptions')}
            badge={subAlerts.dueSoon.length + subAlerts.dueToday.length}
          />
          <MobileNavItem 
            icon={<ChartPie />} 
            label="Stats" 
            active={currentView === 'stats'} 
            onClick={() => setCurrentView('stats')} 
          />
        </div>
      </nav>

      {/* Modals */}
      <Modal isOpen={activeModal === 'transaction'} onClose={() => setActiveModal(null)}>
        <TransactionForm 
          onClose={() => setActiveModal(null)} 
          onSubmit={addTransaction}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
        />
      </Modal>

      <Modal isOpen={activeModal === 'card'} onClose={() => setActiveModal(null)}>
        <CardForm 
          onClose={() => setActiveModal(null)} 
          onSubmit={addCard}
          gradients={availableGradients}
        />
      </Modal>

      <Modal isOpen={activeModal === 'subscription'} onClose={() => setActiveModal(null)}>
        <SubscriptionForm 
          onClose={() => setActiveModal(null)} 
          onSubmit={addSubscription}
          categories={subCategories}
        />
      </Modal>
    </div>
  );
}

// ============================================
// USER PROFILE & SETTINGS
// ============================================

const UserProfile = ({ user, logout, isMobile = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  if (isMobile) {
    return (
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors dark:hover:bg-secondary/50">
            <Settings className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="p-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {user.displayName?.[0] || user.email?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.displayName || 'Usuario'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <DropdownMenuSeparator />
          <ThemeSwitcher />
          <CurrencySwitcher />
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <div className="mt-auto border-t border-border/30 pt-4 cursor-pointer">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-secondary dark:hover:bg-white/5 transition-colors">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {user.displayName?.[0] || user.email?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.displayName || 'Usuario'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Settings className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="mb-2">
        <ThemeSwitcher />
        <CurrencySwitcher />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


const ThemeSwitcher = () => {
  const { theme, setTheme } = useThemeMounted();

  return (
    <div className="p-1">
      <div className="text-xs font-medium text-muted-foreground px-2 py-1">Tema</div>
      <div className="flex bg-secondary dark:bg-secondary/30 rounded-lg p-1 mt-1">
        <button
          onClick={() => setTheme('light')}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          <Sun className="w-4 h-4" /> Claro
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            theme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          <Moon className="w-4 h-4" /> Oscuro
        </button>
      </div>
    </div>
  );
};

const CurrencySwitcher = () => {
  const { currency, setCurrency, supportedCurrencies } = useCurrency();

  return (
    <div className="p-1">
      <div className="text-xs font-medium text-muted-foreground px-2 py-1">Moneda</div>
      <div className="space-y-1 mt-1">
        {supportedCurrencies.map(c => (
          <button
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-secondary dark:hover:bg-secondary/30"
          >
            <span>{c.code} - {c.name}</span>
            {currency === c.code && <CheckCircle className="w-4 h-4 text-primary" />}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// NAVIGATION COMPONENTS
// ============================================

const NavItem = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active 
        ? 'bg-primary text-primary-foreground' 
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-white/5'
    }`}
  >
    {icon}
    <span className="flex-1 text-left">{label}</span>
    {badge > 0 && (
      <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center ${
        active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

const MobileNavItem = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 min-w-[56px] relative ${
      active ? 'text-primary' : 'text-muted-foreground'
    }`}
  >
    <div className="relative">
      {icon}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[10px] font-semibold text-white flex items-center justify-center">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

// ============================================
// OVERVIEW VIEW
// ============================================

const OverviewView = ({ data, actions, formatCurrency, showBalance, setShowBalance }) => {
  const { balance, income, expense, transactions, cards, subs, subTotals, subAlerts } = data;

  return (
    <div className="space-y-6 animate-enter">
      {/* Balance Card */}
      <section className="rounded-3xl bg-foreground text-background p-6 md:p-8 relative overflow-hidden shadow-2xl group ring-1 ring-black/10 dark:ring-white/5">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-primary/20 blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-background/60">Balance Total</span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1.5 rounded-lg bg-background/10 text-background/70 hover:text-background transition-colors"
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="mb-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-background">
              {showBalance ? formatCurrency(balance) : '••••••'}
            </h2>
            <p className="text-sm text-background/50 mt-1">
              {showBalance ? `Descontando ${formatCurrency(subTotals.monthlyTotal)} de fijos` : '••••••'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-background/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-background/60 uppercase font-medium">Ingresos</span>
              </div>
              <p className="text-xl font-semibold text-background">
                {showBalance ? formatCurrency(income) : '••••'}
              </p>
            </div>
            <div className="flex-1 bg-background/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xs text-background/60 uppercase font-medium">Gastos</span>
              </div>
              <p className="text-xl font-semibold text-background">
                {showBalance ? formatCurrency(expense) : '••••'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-3 gap-3">
        <QuickAction 
          icon={<Plus className="w-5 h-5" />}
          label="Transacción"
          onClick={() => actions.setActiveModal('transaction')}
          primary
        />
        <QuickAction 
          icon={<CreditCard className="w-5 h-5" />}
          label="Tarjeta"
          onClick={() => actions.setActiveModal('card')}
        />
        <QuickAction 
          icon={<Calendar className="w-5 h-5" />}
          label="Suscripción"
          onClick={() => actions.setActiveModal('subscription')}
        />
      </section>

      {/* Alerts */}
      {(subAlerts.dueToday.length > 0 || subAlerts.dueSoon.length > 0) && (
        <section className="bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Bell className="w-4 h-4" />
            <span className="text-sm font-medium">
              {subAlerts.dueToday.length > 0 
                ? `${subAlerts.dueToday.length} pago(s) vence(n) hoy`
                : `${subAlerts.dueSoon.length} pago(s) próximo(s)`
              }
            </span>
          </div>
        </section>
      )}

      {/* Cards Preview */}
      {cards.length > 0 && (
        <section>
          <SectionHeader 
            title="Mis Tarjetas" 
            action="Ver todas"
            onAction={() => actions.setCurrentView('cards')}
          />
          <div className="relative -mx-4 px-4">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {cards.map((card, index) => (
                <div key={card.id} className="flex-shrink-0 w-72 snap-start">
                  <MiniCard card={card} formatCurrency={formatCurrency} />
                </div>
              ))}
              <div
                onClick={() => actions.setCurrentView('cards')}
                className="flex-shrink-0 w-72 snap-start flex flex-col items-center justify-center bg-card border-2 border-dashed border-border/50 rounded-2xl text-muted-foreground hover:text-primary hover:border-primary transition-all cursor-pointer"
              >
                <Plus className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Ver todas las tarjetas</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Transactions */}
      <section>
        <SectionHeader title="Últimas Transacciones" />
        <div className="space-y-2">
          {transactions.slice(0, 5).map(t => (
            <TransactionItem 
              key={t.id} 
              transaction={t} 
              formatCurrency={formatCurrency}
              onDelete={() => actions.deleteTransaction(t.id)}
            />
          ))}
          {transactions.length === 0 && (
            <EmptyState 
              icon={<Receipt className="w-8 h-8" />}
              message="No hay transacciones aún"
            />
          )}
        </div>
      </section>

      {/* Upcoming Payments */}
      {subs.length > 0 && (
        <section>
          <SectionHeader 
            title="Próximos Pagos"
            subtitle={`${formatCurrency(subTotals.monthlyTotal)}/mes`}
            action="Ver todos"
            onAction={() => actions.setCurrentView('subscriptions')}
          />
          <div className="space-y-2">
            {subs.slice(0, 3).map(sub => (
              <SubscriptionItem 
                key={sub.id} 
                subscription={sub} 
                formatCurrency={formatCurrency}
                onDelete={() => actions.deleteSub(sub.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const QuickAction = ({ icon, label, onClick, primary }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-95 ${
      primary 
        ? 'bg-primary text-primary-foreground' 
        : 'bg-card border border-border/50 text-foreground hover:bg-secondary dark:hover:bg-secondary/30'
    }`}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const SectionHeader = ({ title, subtitle, action, onAction }) => (
  <div className="flex items-center justify-between mb-3">
    <div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
    {action && (
      <button 
        onClick={onAction}
        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
      >
        {action}
        <ChevronRight className="w-4 h-4" />
      </button>
    )}
  </div>
);

const MiniCard = ({ card, formatCurrency }) => {
  const gradient = card.bgGradient || 'from-slate-600 to-slate-800';
  const utilizationPercent = card.limit > 0 ? Math.min((card.currentDebt / card.limit) * 100, 100) : 0;

  return (
    <div 
      className="bg-gradient-to-br rounded-2xl p-5 text-white h-44 flex flex-col justify-between shadow-lg"
      style={{ backgroundImage: `linear-gradient(to bottom right, ${gradient.replace('from-', '').replace(' to-', ',')})` }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-white/70 font-medium">{card.name}</p>
          <p className="text-2xl font-bold mt-0.5">{formatCurrency(card.currentDebt)}</p>
        </div>
        <CreditCard className="w-5 h-5 text-white/50" />
      </div>
      <div>
        <div className="flex justify-between text-xs text-white/70 mb-1">
          <span>Usado</span>
          <span>{Math.round(utilizationPercent)}%</span>
        </div>
        <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${utilizationPercent > 80 ? 'bg-red-400' : 'bg-white/80'}`}
            style={{ width: `${utilizationPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const TransactionItem = ({ transaction, formatCurrency, onDelete }) => {
  const isIncome = transaction.type === 'income';
  
  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 group">
      <CategoryIcon category={transaction.category} type={transaction.type} size="default" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{transaction.description}</p>
        <p className="text-xs text-muted-foreground capitalize">{transaction.category}</p>
      </div>
      <div className="text-right flex items-center gap-2">
        <p className={`font-semibold text-sm ${isIncome ? 'text-green-500' : 'text-foreground'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </p>
        <button 
          onClick={onDelete}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const SubscriptionItem = ({ subscription, formatCurrency, onDelete }) => {
  const isUrgent = subscription.daysLeft <= 3;
  
  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        isUrgent ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
      }`}>
        <Calendar className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{subscription.name}</p>
        <p className={`text-xs ${isUrgent ? 'text-amber-500 font-medium' : 'text-muted-foreground'}`}>
          {subscription.daysLeft === 0 ? '¡Vence hoy!' : `En ${subscription.daysLeft} días`}
        </p>
      </div>
      <div className="text-right flex items-center gap-2">
        <p className="font-semibold text-sm text-foreground">{formatCurrency(subscription.amount)}</p>
        <button 
          onClick={onDelete}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const EmptyState = ({ icon, message }) => (
  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
    <div className="w-12 h-12 rounded-full bg-secondary dark:bg-secondary/30 flex items-center justify-center mb-3">
      {icon}
    </div>
    <p className="text-sm">{message}</p>
  </div>
);

// ============================================
// CARDS VIEW
// ============================================

const CardsView = ({ cards, addCard, deleteCard, formatCurrency, canAddMore }) => (
  <div className="space-y-6 animate-enter">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mis Tarjetas</h1>
        <p className="text-sm text-muted-foreground">{cards.length} tarjeta(s) registrada(s)</p>
      </div>
      {canAddMore && (
        <button
          onClick={addCard}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      )}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map(card => (
        <CardItem 
          key={card.id} 
          card={card} 
          formatCurrency={formatCurrency}
          onDelete={() => deleteCard(card.id)}
        />
      ))}
      
      {cards.length === 0 && (
        <div className="col-span-full">
          <EmptyState 
            icon={<CreditCard className="w-8 h-8" />}
            message="No hay tarjetas registradas"
          />
        </div>
      )}
    </div>
  </div>
);

const CardItem = ({ card, formatCurrency, onDelete }) => {
  const gradient = card.bgGradient || 'from-slate-600 to-slate-800';
  const utilizationPercent = card.limit > 0 ? Math.min((card.currentDebt / card.limit) * 100, 100) : 0;
  const isHighUtilization = utilizationPercent > 80;

  return (
    <div 
      className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden group shadow-lg"
      style={{ backgroundImage: `linear-gradient(to bottom right, ${gradient.replace('from-', '').replace(' to-', ',')})` }}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzAwMDAwMCIgZmlsbC1vcGFjaXR5PSIwLjAzIj48L3JlY3Q+Cjwvc3ZnPg==')] opacity-50" />
      
      <div className="relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Tarjeta</p>
            <h3 className="text-xl font-bold mt-1">{card.name}</h3>
          </div>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-2xl sm:text-3xl font-bold">{formatCurrency(card.currentDebt)}</span>
            <span className="text-sm text-white/70">de {formatCurrency(card.limit)}</span>
          </div>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isHighUtilization ? 'bg-red-400' : 'bg-white/80'}`}
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
          <p className="text-xs text-white/60 mt-1">{Math.round(utilizationPercent)}% utilizado</p>
        </div>

        <div className="flex gap-3 text-xs">
          <div className="bg-black/20 backdrop-blur rounded-lg px-3 py-2">
            <span className="text-white/60">Corte</span>
            <span className="ml-2 text-white font-medium">Día {card.cutoffDay}</span>
          </div>
          <div className="bg-black/20 backdrop-blur rounded-lg px-3 py-2">
            <span className="text-white/60">Pago</span>
            <span className="ml-2 text-white font-medium">Día {card.paymentDay}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SUBSCRIPTIONS VIEW
// ============================================

const SubscriptionsView = ({ subs, totals, alerts, addSub, deleteSub, markAsPaid, formatCurrency, categories }) => (
  <div className="space-y-6 animate-enter">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Suscripciones</h1>
        <p className="text-sm text-muted-foreground">{formatCurrency(totals.monthlyTotal)}/mes</p>
      </div>
      <button
        onClick={addSub}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Agregar
      </button>
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <SummaryCard label="Este mes" value={formatCurrency(totals.thisMonthTotal)} />
      <SummaryCard label="Mensual" value={formatCurrency(totals.monthlyTotal)} />
      <SummaryCard label="Próx. 7 días" value={formatCurrency(totals.next7DaysTotal)} highlight={totals.next7DaysTotal > 0} />
      <SummaryCard label="Anual" value={formatCurrency(totals.annualTotal)} />
    </div>

    {/* Alerts */}
    {(alerts.overdue?.length > 0 || alerts.dueToday?.length > 0) && (
      <div className="bg-destructive/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Atención requerida</span>
        </div>
        <div className="space-y-2">
          {[...(alerts.overdue || []), ...(alerts.dueToday || [])].map(sub => (
            <div key={sub.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{sub.name}</span>
              <span className="text-destructive font-medium">{formatCurrency(sub.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Subscription List */}
    <div className="space-y-2">
      {subs.map(sub => (
        <SubscriptionDetailItem 
          key={sub.id} 
          subscription={sub} 
          formatCurrency={formatCurrency}
          onDelete={() => deleteSub(sub.id)}
          onMarkPaid={() => markAsPaid(sub.id)}
        />
      ))}
      
      {subs.length === 0 && (
        <EmptyState 
          icon={<Calendar className="w-8 h-8" />}
          message="No hay suscripciones registradas"
        />
      )}
    </div>
  </div>
);

const SummaryCard = ({ label, value, highlight }) => (
  <div className={`p-4 rounded-2xl ${highlight ? 'bg-amber-500/10 dark:bg-amber-500/20' : 'bg-card border border-border/50'}`}>
    <p className={`text-xs font-medium mb-1 ${highlight ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>{label}</p>
    <p className={`text-lg font-bold ${highlight ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>{value}</p>
  </div>
);

const SubscriptionDetailItem = ({ subscription, formatCurrency, onDelete, onMarkPaid }) => {
  const isUrgent = subscription.daysLeft <= 3;
  const isDueToday = subscription.daysLeft === 0;
  
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border group transition-colors ${
      isDueToday 
        ? 'bg-amber-500/5 border-amber-500/20' 
        : 'bg-card border-border/50 hover:border-border'
    }`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isDueToday ? 'bg-amber-500/10 text-amber-500' : 'bg-secondary dark:bg-secondary/30 text-muted-foreground'
      }`}>
        <Calendar className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{subscription.name}</p>
        <p className={`text-xs ${isUrgent ? 'text-amber-500 font-medium' : 'text-muted-foreground'}`}>
          {isDueToday ? '¡Vence hoy!' : subscription.daysLeft === 1 ? 'Mañana' : `En ${subscription.daysLeft} días`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <p className="font-semibold text-foreground">{formatCurrency(subscription.amount)}</p>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onMarkPaid}
            className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/10 transition-colors"
            title="Marcar como pagado"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STATS VIEW (REPORTES)
// ============================================

const StatsView = ({ data, formatCurrency }) => {
  const { transactions, balance, income, expense, cards, subs, subTotals, totalDebt, totalLimit } = data;

  // Transacciones del mes actual
  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions.filter(t => {
      const date = t.date instanceof Date ? t.date : new Date(t.date);
      return date >= startOfMonth;
    });
  }, [transactions]);

  // Transacciones del mes anterior
  const lastMonthTransactions = useMemo(() => {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return transactions.filter(t => {
      const date = t.date instanceof Date ? t.date : new Date(t.date);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    });
  }, [transactions]);

  // Gastos por categoría
  const expensesByCategory = useMemo(() => {
    const expenses = currentMonthTransactions.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const grouped = {};
    
    expenses.forEach(t => {
      const cat = t.category || 'other';
      if (!grouped[cat]) {
        grouped[cat] = { amount: 0, count: 0 };
      }
      grouped[cat].amount += t.amount;
      grouped[cat].count += 1;
    });

    return Object.entries(grouped)
      .map(([category, data]) => ({
        category,
        ...data,
        percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthTransactions]);

  // Tendencia mensual (últimos 6 meses)
  const monthlyTrend = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthTransactions = transactions.filter(t => {
        const date = t.date instanceof Date ? t.date : new Date(t.date);
        return date >= startOfMonth && date <= endOfMonth;
      });

      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({
        month: monthDate.toLocaleDateString('es-MX', { month: 'short' }),
        income: monthIncome,
        expense: monthExpense,
        net: monthIncome - monthExpense,
      });
    }

    return months;
  }, [transactions]);

  // Comparación mensual
  const monthComparison = useMemo(() => {
    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastExpense = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const incomeChange = lastIncome > 0 
      ? ((currentIncome - lastIncome) / lastIncome) * 100 
      : currentIncome > 0 ? 100 : 0;
    
    const expenseChange = lastExpense > 0 
      ? ((currentExpense - lastExpense) / lastExpense) * 100 
      : currentExpense > 0 ? 100 : 0;

    return {
      current: { income: currentIncome, expense: currentExpense },
      last: { income: lastIncome, expense: lastExpense },
      change: { income: incomeChange, expense: expenseChange },
    };
  }, [currentMonthTransactions, lastMonthTransactions]);

  // Utilización de crédito
  const creditUtilization = useMemo(() => {
    return totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;
  }, [totalDebt, totalLimit]);

  // Salud financiera
  const financialHealth = useMemo(() => {
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const fixedExpenseRatio = income > 0 ? ((subTotals?.monthlyTotal || 0) / income) * 100 : 0;
    
    let healthScore = 100;
    
    if (savingsRate < 0) healthScore -= 30;
    else if (savingsRate < 10) healthScore -= 20;
    else if (savingsRate < 20) healthScore -= 10;

    if (creditUtilization > 70) healthScore -= 25;
    else if (creditUtilization > 50) healthScore -= 15;
    else if (creditUtilization > 30) healthScore -= 5;

    if (fixedExpenseRatio > 50) healthScore -= 20;
    else if (fixedExpenseRatio > 30) healthScore -= 10;

    healthScore = Math.max(0, healthScore);

    const recommendations = [];
    if (savingsRate < 20) {
      recommendations.push('Intenta ahorrar al menos 20% de tus ingresos');
    }
    if (creditUtilization > 30) {
      recommendations.push('Reduce el uso de tus tarjetas de crédito');
    }
    if (fixedExpenseRatio > 30) {
      recommendations.push('Revisa tus suscripciones y gastos fijos');
    }

    return {
      score: Math.round(healthScore),
      savingsRate,
      fixedExpenseRatio,
      recommendations,
    };
  }, [income, expense, subTotals, creditUtilization]);

  // Top gastos
  const topExpenses = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [currentMonthTransactions]);

  // Proyección
  const projection = useMemo(() => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    const avgDailyIncome = income / dayOfMonth;
    const avgDailyExpense = expense / dayOfMonth;
    
    return {
      projectedIncome: avgDailyIncome * daysInMonth,
      projectedExpense: avgDailyExpense * daysInMonth,
      projectedBalance: (avgDailyIncome - avgDailyExpense) * daysInMonth,
    };
  }, [income, expense]);

  const getCategoryName = (category) => {
    const names = {
      food: 'Comida', transport: 'Transporte', entertainment: 'Entretenimiento',
      shopping: 'Compras', health: 'Salud', education: 'Educación',
      bills: 'Servicios', home: 'Hogar', salary: 'Salario',
      freelance: 'Freelance', investment: 'Inversiones', other: 'Otros',
    };
    return names[category] || category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      food: 'bg-orange-500', transport: 'bg-blue-500', entertainment: 'bg-purple-500',
      shopping: 'bg-pink-500', health: 'bg-red-500', education: 'bg-indigo-500',
      bills: 'bg-yellow-500', home: 'bg-amber-500', salary: 'bg-green-500',
      freelance: 'bg-cyan-500', investment: 'bg-emerald-500', other: 'bg-gray-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const getHealthColor = (score) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthLabel = (score) => {
    if (score >= 85) return 'Excelente';
    if (score >= 70) return 'Buena';
    if (score >= 50) return 'Regular';
    return 'Necesita atención';
  };

  // Si no hay datos
  if (transactions.length === 0 && cards.length === 0 && subs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-enter">
        <div className="w-20 h-20 rounded-full bg-secondary dark:bg-secondary/30 flex items-center justify-center mb-4">
          <ChartPie className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Sin datos suficientes</h2>
        <p className="text-muted-foreground max-w-xs">
          Agrega transacciones, tarjetas o suscripciones para ver tus reportes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground">Análisis detallado de tus finanzas</p>
      </div>

      {/* Salud Financiera */}
      <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Salud Financiera
          </h3>
          <div className={`text-2xl font-bold ${getHealthColor(financialHealth.score)}`}>
            {financialHealth.score}/100
          </div>
        </div>
        
        <div className="mb-4">
          <div className="h-3 bg-secondary dark:bg-secondary/30 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                financialHealth.score >= 85 ? 'bg-green-500' :
                financialHealth.score >= 70 ? 'bg-blue-500' :
                financialHealth.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${financialHealth.score}%` }}
            />
          </div>
          <p className={`text-sm mt-2 font-medium ${getHealthColor(financialHealth.score)}`}>
            {getHealthLabel(financialHealth.score)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tasa de ahorro</p>
            <p className={`text-lg font-bold ${financialHealth.savingsRate >= 20 ? 'text-green-500' : financialHealth.savingsRate >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
              {financialHealth.savingsRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Gastos fijos</p>
            <p className={`text-lg font-bold ${financialHealth.fixedExpenseRatio <= 30 ? 'text-green-500' : financialHealth.fixedExpenseRatio <= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
              {financialHealth.fixedExpenseRatio.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Uso de crédito</p>
            <p className={`text-lg font-bold ${creditUtilization <= 30 ? 'text-green-500' : creditUtilization <= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
              {creditUtilization.toFixed(1)}%
            </p>
          </div>
        </div>

        {financialHealth.recommendations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Recomendaciones</p>
            <div className="space-y-2">
              {financialHealth.recommendations.map((rec, i) => (
                <div key={i} className="text-sm p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comparación mensual */}
      <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
        <h3 className="font-semibold text-foreground mb-4">Este mes vs. Anterior</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Ingresos</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                monthComparison.change.income >= 0 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {monthComparison.change.income >= 0 ? '+' : ''}{monthComparison.change.income.toFixed(1)}%
              </span>
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(monthComparison.current.income)}</p>
            <p className="text-xs text-muted-foreground">Anterior: {formatCurrency(monthComparison.last.income)}</p>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Gastos</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                monthComparison.change.expense <= 0 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {monthComparison.change.expense >= 0 ? '+' : ''}{monthComparison.change.expense.toFixed(1)}%
              </span>
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(monthComparison.current.expense)}</p>
            <p className="text-xs text-muted-foreground">Anterior: {formatCurrency(monthComparison.last.expense)}</p>
          </div>
        </div>
      </div>

      {/* Tendencia mensual */}
      <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
        <h3 className="font-semibold text-foreground mb-4">Últimos 6 meses</h3>
        
        <div className="space-y-3">
          {monthlyTrend.map((month, i) => {
            const maxValue = Math.max(...monthlyTrend.map(m => Math.max(m.income, m.expense)));
            const incomeWidth = maxValue > 0 ? (month.income / maxValue) * 100 : 0;
            const expenseWidth = maxValue > 0 ? (month.expense / maxValue) * 100 : 0;
            
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{month.month}</span>
                  <span className={`font-medium ${month.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {month.net >= 0 ? '+' : ''}{formatCurrency(month.net)}
                  </span>
                </div>
                <div className="flex gap-1 h-2">
                  <div 
                    className="bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${incomeWidth}%` }}
                  />
                  <div 
                    className="bg-red-400 rounded-full transition-all duration-500"
                    style={{ width: `${expenseWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-muted-foreground">Ingresos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-400 rounded-full" />
            <span className="text-muted-foreground">Gastos</span>
          </div>
        </div>
      </div>

      {/* Gastos por categoría */}
      {expensesByCategory.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
          <h3 className="font-semibold text-foreground mb-4">Gastos por Categoría</h3>
          
          <div className="space-y-4">
            {/* Gráfico circular simple */}
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {expensesByCategory.reduce((acc, cat, i) => {
                    const prevOffset = acc.offset;
                    const dashArray = cat.percentage;
                    const colorClass = getCategoryColor(cat.category).replace('bg-', '');
                    
                    acc.elements.push(
                      <circle
                        key={cat.category}
                        className={`stroke-${colorClass}`}
                        style={{ stroke: `var(--${colorClass}, currentColor)` }}
                        strokeWidth="4"
                        strokeDasharray={`${dashArray} ${100 - dashArray}`}
                        strokeDashoffset={-prevOffset}
                        strokeLinecap="round"
                        fill="transparent"
                        r="16"
                        cx="18"
                        cy="18"
                      />
                    );
                    acc.offset += dashArray;
                    return acc;
                  }, { elements: [], offset: 0 }).elements}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-foreground">{formatCurrency(expense)}</span>
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
              </div>
            </div>
            
            {/* Lista */}
            <div className="space-y-3">
              {expensesByCategory.slice(0, 5).map((cat) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(cat.category)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate">
                        {getCategoryName(cat.category)}
                      </span>
                      <span className="text-sm text-foreground font-medium ml-2">
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary dark:bg-secondary/30 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getCategoryColor(cat.category)}`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top gastos */}
      {topExpenses.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
          <h3 className="font-semibold text-foreground mb-4">Mayores Gastos del Mes</h3>
          
          <div className="space-y-3">
            {topExpenses.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary dark:bg-secondary/30 flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground capitalize">{getCategoryName(t.category)}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen de tarjetas */}
      {cards.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Resumen de Tarjetas
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-secondary/50 dark:bg-secondary/20 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Deuda Total</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalDebt)}</p>
            </div>
            <div className="bg-secondary/50 dark:bg-secondary/20 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Crédito Disponible</p>
              <p className="text-lg font-bold text-green-500">{formatCurrency(totalLimit - totalDebt)}</p>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Utilización</span>
              <span className={`font-medium ${
                creditUtilization <= 30 ? 'text-green-500' : 
                creditUtilization <= 50 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {creditUtilization.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-secondary dark:bg-secondary/30 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  creditUtilization <= 30 ? 'bg-green-500' : 
                  creditUtilization <= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(creditUtilization, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Resumen de suscripciones */}
      {subs.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Resumen de Suscripciones
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 dark:bg-secondary/20 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Gasto Mensual</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(subTotals?.monthlyTotal || 0)}</p>
            </div>
            <div className="bg-secondary/50 dark:bg-secondary/20 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Gasto Anual</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(subTotals?.annualTotal || 0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Proyección */}
      <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-primary" />
          Proyección del Mes
        </h3>
        
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-green-500/10 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Ingresos Est.</p>
            <p className="text-sm font-bold text-green-500">{formatCurrency(projection.projectedIncome)}</p>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Gastos Est.</p>
            <p className="text-sm font-bold text-red-500">{formatCurrency(projection.projectedExpense)}</p>
          </div>
          <div className={`rounded-xl p-3 ${projection.projectedBalance >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'}`}>
            <p className="text-xs text-muted-foreground mb-1">Balance Est.</p>
            <p className={`text-sm font-bold ${projection.projectedBalance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
              {formatCurrency(projection.projectedBalance)}
            </p>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-3">
          Basado en tu promedio diario actual
        </p>
      </div>
    </div>
  );
};

// ============================================
// MODAL & FORMS
// ============================================

const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className="relative w-full max-w-lg bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-enter"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const TransactionForm = ({ onClose, onSubmit, expenseCategories, incomeCategories }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('food');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { currency, formatCurrency } = useCurrency();

  const categories = type === 'income' ? incomeCategories : expenseCategories;
  
  useEffect(() => {
    // Reset category when type changes
    setCategory(type === 'expense' ? 'food' : 'salary');
  }, [type]);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(
        amount,
        description || (type === 'expense' ? 'Gasto' : 'Ingreso'),
        type,
        category
      );
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Nueva Transacción</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-secondary dark:bg-secondary/30 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex bg-secondary dark:bg-secondary/30 rounded-xl p-1 mb-6">
        <button
          onClick={() => setType('expense')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            type === 'expense' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          Gasto
        </button>
        <button
          onClick={() => setType('income')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            type === 'income' ? 'bg-card text-green-500 shadow-sm' : 'text-muted-foreground'
          }`}
        >
          Ingreso
        </button>
      </div>

      <div className="text-center mb-6">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monto ({currency})</label>
        <div className="flex items-baseline justify-center mt-2">
          <span className={`text-3xl font-bold mr-1 ${amount ? (type === 'income' ? 'text-green-500' : 'text-foreground') : 'text-muted-foreground/30'}`}>{formatCurrency(0).charAt(0)}</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className={`text-5xl font-bold bg-transparent outline-none text-center max-w-[200px] placeholder:text-muted-foreground/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${type === 'income' ? 'text-green-500' : 'text-foreground'}`}
            autoFocus
          />
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Descripción (opcional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full h-12 bg-secondary dark:bg-secondary/30 rounded-xl px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="mb-6">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Categoría</label>
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 6).map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                category === cat.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary dark:bg-secondary/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!amount || isSubmitting}
        className={`w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
          !amount 
            ? 'bg-secondary dark:bg-secondary/30 text-muted-foreground cursor-not-allowed'
            : type === 'income'
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          <>
            <Check className="w-5 h-5" />
            Guardar {type === 'income' ? 'Ingreso' : 'Gasto'}
          </>
        )}
      </button>
    </div>
  );
};

const CardForm = ({ onClose, onSubmit, gradients }) => {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [debt, setDebt] = useState('');
  const [cutoffDay, setCutoffDay] = useState('');
  const [paymentDay, setPaymentDay] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(gradients?.[0]?.value || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(name, limit, cutoffDay, paymentDay, debt, selectedGradient);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Nueva Tarjeta</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-secondary dark:bg-secondary/30 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Nombre (ej. Nu, BBVA)"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full h-12 bg-secondary dark:bg-secondary/30 rounded-xl px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Límite"
            value={limit}
            onChange={e => setLimit(e.target.value)}
            className="h-12 bg-secondary dark:bg-secondary/30 rounded-xl px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="Deuda actual"
            value={debt}
            onChange={e => setDebt(e.target.value)}
            className="h-12 bg-secondary dark:bg-secondary/30 rounded-xl px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5 ml-1">Día de corte</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="1-31"
              min="1"
              max="31"
              value={cutoffDay}
              onChange={e => setCutoffDay(e.target.value)}
              className="w-full h-12 bg-secondary dark:bg-secondary/30 rounded-xl px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5 ml-1">Día de pago</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="1-31"
              min="1"
              max="31"
              value={paymentDay}
              onChange={e => setPaymentDay(e.target.value)}
              className="w-full h-12 bg-secondary dark:bg-secondary/30 rounded-xl px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {(gradients || []).map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGradient(g.value)}
                className={`w-10 h-10 rounded-xl bg-gradient-to-br transition-all ${
                  selectedGradient === g.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : ''
                }`}
                style={{ backgroundImage: `linear-gradient(to bottom right, ${g.value.replace('from-', '').replace(' to-', ',')})` }}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5" />
              Crear Tarjeta
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const SubscriptionForm = ({ onClose, onSubmit, categories }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDay, setPaymentDay] = useState('');
  const [category, setCategory] = useState('streaming');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(name, amount, paymentDay, category);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayCategories = (categories || []).slice(0, 6);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Nueva Suscripción</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-secondary dark:bg-secondary/30 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">Categoría</label>
          <div className="flex flex-wrap gap-2">
            {displayCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  category === cat.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary dark:bg-secondary/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          placeholder="Nombre (ej. Netflix, Spotify)"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full h-12 bg-secondary dark:bg-secondary/30 rounded-xl px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Monto"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="h-12 bg-secondary dark:bg-secondary/30 rounded-xl px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="Día de pago (1-31)"
            min="1"
            max="31"
            value={paymentDay}
            onChange={e => setPaymentDay(e.target.value)}
            className="h-12 bg-secondary dark:bg-secondary/30 rounded-xl px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5" />
              Crear Suscripción
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ============================================
// DROPDOWN MENU
// ============================================

const DropdownMenuContext = React.createContext();

function DropdownMenu({ open, onOpenChange, children }) {
  return (
    <DropdownMenuContext.Provider value={{ open, onOpenChange }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ children, asChild = false }) {
  const { onOpenChange, open } = useContext(DropdownMenuContext);
  if (asChild) {
    return React.cloneElement(React.Children.only(children), {
      onClick: () => onOpenChange(!open),
    });
  }
  return <div onClick={() => onOpenChange(!open)}>{children}</div>;
}

function DropdownMenuContent({ children, align = 'start', side = 'bottom', className = '' }) {
  const { open, onOpenChange } = useContext(DropdownMenuContext);
  
  const alignClass = { 'start': 'left-0', 'end': 'right-0' }[align];
  const sideClass = { 'top': 'bottom-full mb-2', 'bottom': 'top-full mt-2' }[side];

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    
    // Close on click outside
    const handleClickOutside = (event) => {
      // This is a simplified check. A more robust solution might be needed
      // if the trigger is complex or portals are involved.
      if (event.target.closest('[data-radix-popper-content-wrapper]')) {
        return;
      }
      onOpenChange(false);
    };


    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Timeout to prevent closing immediately on trigger click
      // setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // document.removeEventListener('click', handleClickOutside);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      data-radix-popper-content-wrapper
      className={`absolute z-50 min-w-[14rem] bg-card rounded-xl border border-border/50 shadow-2xl p-1 dropdown-content animate-scale-in ${sideClass} ${alignClass} ${className}`}
    >
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child, { onOpenChange })
          : child
      )}
    </div>
  );
}


function DropdownMenuItem({ children, onSelect, onOpenChange }) {
  return (
    <button
      onClick={() => {
        if (onSelect) onSelect();
        if (onOpenChange) onOpenChange(false);
      }}
      className="w-full text-left flex items-center px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-secondary dark:hover:bg-secondary/30 transition-colors"
    >
      {children}
    </button>
  );
}

function DropdownMenuSeparator() {
  return <div className="h-px bg-border/50 my-1" />;
}


// ============================================
// SKELETON
// ============================================

const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Balance Card Skeleton */}
    <div className="rounded-3xl bg-card h-56 p-6">
      <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
      <div className="h-12 bg-muted rounded w-1/2 mb-6"></div>
      <div className="flex gap-4">
        <div className="flex-1 bg-muted/50 rounded-xl h-20"></div>
        <div className="flex-1 bg-muted/50 rounded-xl h-20"></div>
      </div>
    </div>
    
    {/* Actions Skeleton */}
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-card h-24 rounded-2xl"></div>
      <div className="bg-card h-24 rounded-2xl"></div>
      <div className="bg-card h-24 rounded-2xl"></div>
    </div>

    {/* List Skeleton */}
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-xl h-16">
          <div className="w-10 h-10 rounded-xl bg-muted"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-muted rounded w-1/4"></div>
        </div>
      ))}
    </div>
  </div>
);
