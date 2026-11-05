import * as React from 'react';
import { supabase, type Profile, type BusinessMember } from '@/lib';

export interface UserBusiness {
  businessId: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO';
  role: 'OWNER' | 'ADMIN' | 'STAFF';
}

export interface User {
  email: string;
  businessName: string;
  businessSlug: string;
  hasProAccess: boolean;
  businessId: string;
  businesses: UserBusiness[];
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  onboardingRequired?: boolean;
}

interface AuthContextValue extends AuthState {
  businessSlug: string;
  hasProAccess: boolean;
  businessId: string;
  businesses: UserBusiness[];
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ error?: string }>;
  createBusiness: (businessName: string) => Promise<{ error?: string }>;
  switchBusiness: (businessId: string) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function mapProfileToUser(fullName: string | null, email: string, businessSlug: string, businessId: string, plan: 'FREE' | 'PRO', businesses: UserBusiness[]): User {
  return {
    email,
    businessName: fullName ?? '',
    businessSlug,
    businessId,
    hasProAccess: plan === 'PRO',
    businesses,
  };
}

async function loadUserFromSession(): Promise<AuthState> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { user: null, isLoading: false, onboardingRequired: false };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle() as { data: Profile | null; error: string | null };

    if (profileError || !profile) {
      return { user: null, isLoading: false, onboardingRequired: false };
    }

    // Usar la nueva RPC que devuelve TODOS los negocios del usuario
    const { data: businessesData, error: bizError } = await supabase
      .rpc('get_user_businesses') as { data: Array<{
        business_id: string;
        name: string;
        slug: string;
        plan: 'FREE' | 'PRO';
        is_active: boolean;
        role: 'OWNER' | 'ADMIN' | 'STAFF';
      }> | null; error: unknown };

    if (bizError) {
      return { user: null, isLoading: false, onboardingRequired: false };
    }

    // User has no businesses → show onboarding
    if (!businessesData || businessesData.length === 0) {
      return { user: null, isLoading: false, onboardingRequired: true };
    }

    // Convertir al formato UserBusiness
    const userBusinesses: UserBusiness[] = businessesData.map(b => ({
      businessId: b.business_id,
      name: b.name,
      slug: b.slug,
      plan: b.plan,
      role: b.role,
    }));

    // Check if there's a saved business preference
    const savedBusinessId = typeof window !== 'undefined' ? sessionStorage.getItem('selectedBusinessId') : null;
    const primaryBiz = savedBusinessId 
      ? (userBusinesses.find(b => b.businessId === savedBusinessId) || userBusinesses[0])
      : userBusinesses[0];
    
    const user = mapProfileToUser(
      profile.full_name,
      session.user.email ?? '',
      primaryBiz.slug,
      primaryBiz.businessId,
      primaryBiz.plan,
      userBusinesses
    );
    return { user, isLoading: false, onboardingRequired: false };
  } catch {
    return { user: null, isLoading: false, onboardingRequired: false };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    isLoading: true,
    onboardingRequired: false,
  });

  React.useEffect(() => {
    let mounted = true;

    async function init() {
      if (!mounted) return;

      // First load from persisted session
      const initial = await loadUserFromSession();
      setState(initial);

      // Listen for auth changes
      const { data: listener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mounted) return;

          if (session?.user) {
            const loaded = await loadUserFromSession();
            setState(loaded);
          } else {
            setState({ user: null, isLoading: false });
          }
        }
      );

      return () => {
        mounted = false;
        listener.subscription.unsubscribe();
      };
    }

    init();
  }, []);

  const login = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        const message = error.message ?? '';
        const code = error.code;
        console.log('Supabase auth error:', { message, code });
        const mapped = getAuthErrorMessage(message, code);
        console.log('Mapped error:', mapped);
        return { error: mapped };
      }

      const loaded = await loadUserFromSession();
      setState(loaded);
      return {};
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { error: 'Error de red. Verificá tu conexión.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (authError) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: getAuthErrorMessage(authError.message, authError.code) };
      }

      if (!authData.user) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: 'No se pudo crear la cuenta.' };
      }

      // Profile created automatically by handle_new_user trigger
      setState({ user: null, isLoading: false });
      return {};
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { error: 'Error de red. Verificá tu conexión.' };
    }
  };

  const createBusiness = async (businessName: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const slug = generateSlug(businessName);

      const { data, error: rpcError } = await supabase.rpc('create_business_for_current_user', {
        p_name: businessName,
        p_slug: slug,
        p_timezone: 'America/Argentina/Buenos_Aires',
        p_currency: 'ARS',
      } as any) as { data: string | null; error: unknown };

      if (rpcError) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: 'No se pudo crear el negocio. Intentá de nuevo.' };
      }

      // RPC returned business_id — reload session to pick up the new membership
      const loaded = await loadUserFromSession();
      setState(loaded);
      return {};
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { error: 'Error de red. Verificá tu conexión.' };
    }
  };

  const switchBusiness = async (businessId: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Reload all businesses
      const { data: businessesData, error: rpcError } = await supabase
        .rpc('get_user_businesses') as { data: Array<{
          business_id: string;
          name: string;
          slug: string;
          plan: 'FREE' | 'PRO';
          is_active: boolean;
          role: 'OWNER' | 'ADMIN' | 'STAFF';
        }> | null; error: unknown };

      if (rpcError) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: 'No se pudo obtener la lista de negocios.' };
      }

      if (!businessesData || businessesData.length === 0) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: 'No tenés negocios asociados.' };
      }

      const userBusinesses: UserBusiness[] = businessesData.map(b => ({
        businessId: b.business_id,
        name: b.name,
        slug: b.slug,
        plan: b.plan,
        role: b.role,
      }));

      const target = userBusinesses.find((b) => b.businessId === businessId);
      if (!target) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: 'Negocio no encontrado.' };
      }

      // Get profile for full_name
      const session = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.data.session?.user.id ?? '')
        .maybeSingle() as { data: { full_name: string } | null; error: unknown };

      const user = mapProfileToUser(
        profile?.full_name ?? '',
        session.data.session?.user.email ?? '',
        target.slug,
        target.businessId,
        target.plan,
        userBusinesses
      );
      setState({ user, isLoading: false });
      
      // Save selected business preference
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('selectedBusinessId', businessId);
      }
      
      // Force full reload to pick up the new business
      window.location.reload();
      return {};
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { error: 'Error de red. Verificá tu conexión.' };
    }
  };

  const resetPassword = async (email: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/neudi/reset-password`,
      });

      if (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: 'No se pudo enviar el correo de recuperación.' };
      }

      setState((prev) => ({ ...prev, isLoading: false }));
      return {};
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { error: 'Error de red. Verificá tu conexión.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setState({ user: null, isLoading: false });
  };

  const ctxValue: AuthContextValue = {
    ...state,
    businessSlug: state.user?.businessSlug ?? '',
    hasProAccess: state.user?.hasProAccess ?? false,
    businessId: state.user?.businessId ?? '',
    businesses: state.user?.businesses ?? [],
    login,
    register,
    createBusiness,
    switchBusiness,
    resetPassword,
    logout,
  };

  return (
    <AuthContext.Provider value={ctxValue}>
      {children}
    </AuthContext.Provider>
  );
}

function getAuthErrorMessage(message: string, code?: string): string {
  if (code === 'invalid_credentials') {
    return 'Email o contraseña incorrectos. Verificá tus datos e intentá de nuevo.';
  }
  if (message.includes('Invalid login credentials') || message.includes('Credenciales de inicio de sesión no válidas')) {
    return 'Email o contraseña incorrectos. Verificá tus datos e intentá de nuevo.';
  }
  if (message.includes('email') && message.includes('password')) {
    return 'Email o contraseña incorrectos. Verificá tus datos e intentá de nuevo.';
  }
  if (message.includes('Invalid API key') || message.includes('API key')) {
    return 'Error de configuración. Contactá al administrador.';
  }
  if (message.includes('email') && message.includes('already registered') || message.includes('already been used')) {
    return 'Ya existe una cuenta con ese email.';
  }
  if (
    message.includes('Password should be at least') ||
    message.includes('weak') ||
    message.includes('Contraseña')
  ) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (message.includes('rate limit') || message.includes('Too many requests') || message.includes('demasiados')) {
    return 'Demasiados intentos. Esperá un momento e intentá de nuevo.';
  }
  if (message.includes('User not found') || message.includes('no user record') || message.includes('not found')) {
    return 'No se encontró una cuenta con ese email.';
  }
  return 'Error inesperado. Intentá de nuevo.';
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
