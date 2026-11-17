-- Indexes

CREATE INDEX idx_business_members_business_id ON public.business_members USING btree (business_id);
CREATE INDEX idx_business_members_user_id ON public.business_members USING btree (user_id);
CREATE INDEX idx_services_business_id ON public.services USING btree (business_id);
CREATE INDEX idx_business_hours_business_id ON public.business_hours USING btree (business_id);
CREATE INDEX idx_business_exceptions_business_date ON public.business_exceptions USING btree (business_id, date);
CREATE INDEX idx_customers_business_id ON public.customers USING btree (business_id);
CREATE INDEX idx_appointments_business_id ON public.appointments USING btree (business_id);
CREATE INDEX idx_appointments_customer_id ON public.appointments USING btree (customer_id);
CREATE INDEX idx_appointments_start_at ON public.appointments USING btree (business_id, start_at);
CREATE INDEX idx_appointments_status ON public.appointments USING btree (business_id, status);
CREATE INDEX idx_appointment_services_appointment_id ON public.appointment_services USING btree (appointment_id);
CREATE INDEX idx_appointment_services_service_id ON public.appointment_services USING btree (service_id);
