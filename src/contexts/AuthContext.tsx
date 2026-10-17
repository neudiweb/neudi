import * as React from 'react';
import { supabase, type Profile, type BusinessMember } from '@/lib';

export interface User {
  email: string;
  businessName: string;
  businessSlug: string;
  hasProAccess: boolean;
  businessId: string;
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
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    businessName: string
  ) => Promise<{ error?: string }>;
  createBusiness: (businessName: string) => Promise<{ error?: string }>;
  loginDemo: () => Promise<{ error?: string }>;
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

function mapProfileToUser(fullName: string | null, email: string, businessSlug: string, businessId: string, plan: 'FREE' | 'PRO'): User {
  return {
    email,
    businessName: fullName ?? '',
    businessSlug,
    businessId,
    hasProAccess: plan === 'PRO',
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

    const { data: members, error: memberError } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', session.user.id) as { data: BusinessMember[] | null; error: string | null };

    if (memberError) {
      return { user: null, isLoading: false, onboardingRequired: false };
    }

    // User has no businesses → show onboarding
    if (!members || members.length === 0) {
      return { user: null, isLoading: false, onboardingRequired: true };
    }

    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('slug,id,plan')
      .in('id', members.map((m) => m.business_id))
      .limit(1) as { data: Array<{ slug: string; id: string; plan: 'FREE' | 'PRO' }>; error: string | null };

    if (bizError || !businesses?.[0]) {
      return { user: null, isLoading: false, onboardingRequired: false };
    }

    const biz = businesses[0];
    const user = mapProfileToUser(profile.full_name, session.user.email ?? '', biz.slug, biz.id, biz.plan);
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
        return { error: getAuthErrorMessage(error.message) };
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
    password: string,
    businessName: string
  ) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Step 1: Create Supabase auth user
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (authError) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: getAuthErrorMessage(authError.message) };
      }

      if (!authData.user) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: 'No se pudo crear la cuenta.' };
      }

      // Step 2: Create business (profile created automatically by handle_new_user trigger)
      const slug = generateSlug(businessName);

      const { data: businessData, error: bizError } = await supabase
        .from('businesses')
        .insert({
          name: businessName,
          slug,
          timezone: 'America/Argentina/Buenos_Aires',
          currency: 'ARS',
          plan: 'FREE',
        } as any)
        .select('id,plan')
        .single() as { data: { id: string; plan: 'FREE' | 'PRO' } | null; error: unknown };

      if (bizError) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: 'No se pudo crear el negocio.' };
      }

      if (!businessData) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: 'No se pudo crear el negocio.' };
      }

      // Step 4: Create business_members link
      await supabase.from('business_members').insert({
        user_id: authData.user.id,
        business_id: businessData.id,
        role: 'OWNER',
      } as any);

      const user = mapProfileToUser(name, email, slug, businessData.id, businessData.plan);
      setState({ user, isLoading: false });
      return {};
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { error: 'Error de red. Verificá tu conexión.' };
    }
  };

  const loginDemo = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    // Demo mode not available with Supabase Auth - redirect to real login
    setState((prev) => ({ ...prev, isLoading: false }));
    return { error: 'El modo demo requiere configuración de Supabase.' };
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
      } as any) as { data: Array<{ business_id: string }> | null; error: unknown };

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

  const logout = async () => {
    await supabase.auth.signOut();
    setState({ user: null, isLoading: false });
  };

  const ctxValue: AuthContextValue = {
    ...state,
    businessSlug: state.user?.businessSlug ?? '',
    hasProAccess: state.user?.hasProAccess ?? false,
    businessId: state.user?.businessId ?? '',
    login,
    register,
    createBusiness,
    loginDemo,
    logout,
  };

  return (
    <AuthContext.Provider value={ctxValue}>
      {children}
    </AuthContext.Provider>
  );
}

function getAuthErrorMessage(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Email o contraseña incorrectos.';
  }
  if (message.includes('email') && message.includes('already registered')) {
    return 'Ya existe una cuenta con ese email.';
  }
  if (
    message.includes('Password should be at least') ||
    message.includes('weak')
  ) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (message.includes('rate limit')) {
    return 'Demasiados intentos. Esperá un momento e intentá de nuevo.';
  }
  return 'Error inesperado. Intentá de nuevo.';
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
