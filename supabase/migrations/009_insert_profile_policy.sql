-- Agregar política INSERT para profiles (necesaria para el trigger handle_new_user)
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()));
