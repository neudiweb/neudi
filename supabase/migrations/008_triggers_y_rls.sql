-- 005_part8 - Triggers y RLS Policies (LO MAS IMPORTANTE)

-- Triggers updated_at
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER business_exceptions_updated_at BEFORE UPDATE ON public.business_exceptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER business_hours_updated_at BEFORE UPDATE ON public.business_hours FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger auth
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;

-- === RLS POLICIES (EXACTAS DEL BACKUP) ===

-- businesses policies
CREATE POLICY "public_read_businesses" ON public.businesses FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY "Members can view their businesses" ON public.businesses FOR SELECT TO authenticated USING (is_business_member(id));
CREATE POLICY "Owners can update their businesses" ON public.businesses FOR UPDATE TO authenticated USING (has_business_role(id, ARRAY['OWNER'::business_role])) WITH CHECK (has_business_role(id, ARRAY['OWNER'::business_role]));

-- profiles policies
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((id = auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));

-- business_members policies
CREATE POLICY "Members can view business members" ON public.business_members FOR SELECT TO authenticated USING (is_business_member(business_id));
CREATE POLICY "Owners and admins can add members" ON public.business_members FOR INSERT TO authenticated WITH CHECK (has_business_role(business_id, ARRAY['OWNER'::business_role, 'ADMIN'::business_role]));
CREATE POLICY "Owners can remove members" ON public.business_members FOR DELETE TO authenticated USING (has_business_role(business_id, ARRAY['OWNER'::business_role]));
CREATE POLICY "Owners can update members" ON public.business_members FOR UPDATE TO authenticated USING (has_business_role(business_id, ARRAY['OWNER'::business_role])) WITH CHECK (has_business_role(business_id, ARRAY['OWNER'::business_role]));

-- services policies
CREATE POLICY "public_read_services" ON public.services FOR SELECT TO anon,authenticated USING (is_active = true);
CREATE POLICY "Members can view services" ON public.services FOR SELECT TO authenticated USING (is_business_member(business_id));
CREATE POLICY "Owners and admins can create services" ON public.services FOR INSERT TO authenticated WITH CHECK (has_business_role(business_id, ARRAY['OWNER'::business_role, 'ADMIN'::business_role]));
CREATE POLICY "Owners and admins can delete services" ON public.services FOR DELETE TO authenticated USING (has_business_role(business_id, ARRAY['OWNER'::business_role, 'ADMIN'::business_role]));
CREATE POLICY "Owners and admins can update services" ON public.services FOR UPDATE TO authenticated USING (has_business_role(business_id, ARRAY['OWNER'::business_role, 'ADMIN'::business_role])) WITH CHECK (has_business_role(business_id, ARRAY['OWNER'::business_role, 'ADMIN'::business_role]));

-- business_hours policies
CREATE POLICY "public_read_business_hours" ON public.business_hours FOR SELECT TO public,authenticated USING (is_active = true);
CREATE POLICY "Members can view business hours" ON public.business_hours FOR SELECT TO authenticated USING (is_business_member(business_id));
CREATE POLICY "Owners and admins can create business hours" ON public.business_hours FOR INSERT TO authenticated WITH CHECK (has_business_role(business_id, ARRAY['OWNER'::business_role, 'ADMIN'::business_role]));
CREATE POLICY "Owners and admins can delete business hours" ON public.business_hours FOR DELETE TO authenticated USING (has_business_role(business_id, ARRAY['OWNER'::business_role, 'ADMIN'::business_role]));
CREATE POLICY "Owners and admins can update business hours" ON public.business_hours FOR UPDATE TO authenticated USING (has_business_role(business_id, ARRAY['OWNER'::business_role, 'ADMIN'::business_role])) WITH CHECK (has_business_role(business_id, ARRAY['OWNER'::business_role, 'ADMIN'::business_role]));

-- business_exceptions policies
CREATE POLICY "public_read_business_exceptions" ON public.business_exceptions FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY "Members can view business exceptions" ON public.business_exceptions FOR SELECT TO authenticated USING (is_business_member(business_id));
CREATE POLICY "Owners and admins can create exceptions" ON public.business_exceptions FOR INSERT TO authenticated WITH CHECK (has_business_role(business_id, ARRAY['OWNER'::business_role, 'ADMIN'::business_role]));
CREATE POLICY "Owners and admins can delete exceptions" ON public.business_exceptions FOR DELETE TO authenticated USING (has_business_role(business_id, ARRAY['OWNER'::business_role, 'ADMIN'::business_role]));
CREATE POLICY "Owners and admins can update exceptions" ON public.business_exceptions FOR UPDATE TO authenticated USING (has_business_role(business_id, ARRAY['OWNER'::business_role, 'ADMIN'::business_role])) WITH CHECK (has_business_role(business_id, ARRAY['OWNER'::business_role, 'ADMIN'::business_role]));

-- customers policies
CREATE POLICY "Members can view customers" ON public.customers FOR SELECT TO authenticated USING (is_business_member(business_id));
CREATE POLICY "Members can create customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
CREATE POLICY "Members can update customers" ON public.customers FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));

-- appointments policies
CREATE POLICY "Members can view appointments" ON public.appointments FOR SELECT TO authenticated USING (is_business_member(business_id));
CREATE POLICY "Members can create appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (is_business_member(business_id));
CREATE POLICY "Members can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (is_business_member(business_id)) WITH CHECK (is_business_member(business_id));

-- appointment_services policies
CREATE POLICY "Allow authenticated users to read appointment_services" ON public.appointment_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public to read appointment_services via RPC" ON public.appointment_services FOR SELECT TO public USING (true);
