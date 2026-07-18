insert into public.business_settings (
  id,
  business_name,
  whatsapp,
  address,
  instagram,
  confirmation_note,
  opening_time,
  closing_time,
  slot_interval_minutes
) values (
  'main',
  'Tony & Eiko Hair Studio',
  '44999999999',
  'Maringa, PR',
  '@tony.eiko',
  'A equipe confirma o horario antes de efetivar o agendamento.',
  '09:00',
  '18:00',
  30
) on conflict (id) do update set
  business_name = excluded.business_name,
  whatsapp = excluded.whatsapp,
  address = excluded.address,
  instagram = excluded.instagram,
  confirmation_note = excluded.confirmation_note,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  slot_interval_minutes = excluded.slot_interval_minutes;

insert into public.services (id, name, category, description, price_cents, duration_minutes, sort_order) values
  ('corte-feminino', 'Corte Feminino Premium', 'Corte', 'Consultoria de visagismo, lavagem e finalizacao.', 16000, 60, 10),
  ('mechas', 'Mechas Iluminadas', 'Coloracao', 'Tecnica personalizada com diagnostico de fio.', 52000, 180, 20),
  ('morena-iluminada', 'Morena Iluminada', 'Coloracao', 'Contraste natural, brilho e acabamento sofisticado.', 46000, 150, 30),
  ('tratamento', 'Cronograma de Tratamento', 'Tratamento', 'Reconstrucao, nutricao e hidratacao conforme diagnostico.', 22000, 90, 40),
  ('barba-cabelo', 'Cabelo Masculino + Barba', 'Masculino', 'Corte, barba alinhada e acabamento com toalha quente.', 12000, 60, 50),
  ('penteado', 'Penteado Evento', 'Finalizacao', 'Producoes para eventos, fotos e ocasioes especiais.', 28000, 90, 60)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  price_cents = excluded.price_cents,
  duration_minutes = excluded.duration_minutes,
  sort_order = excluded.sort_order,
  active = true;

insert into public.professionals (id, name, role_description, initials, sort_order) values
  ('tony', 'Tony', 'Fundador e especialista em corte', 'T', 10),
  ('eiko', 'Eiko', 'Colorimetria, mechas e assinatura premium', 'E', 20),
  ('lara', 'Lara', 'Cortes, tratamentos e finalizacao', 'L', 30),
  ('bia', 'Bia', 'Coloracao e tratamentos de fibra', 'B', 40),
  ('rafa', 'Rafa', 'Masculino, barba e acabamento', 'R', 50)
on conflict (id) do update set
  name = excluded.name,
  role_description = excluded.role_description,
  initials = excluded.initials,
  sort_order = excluded.sort_order,
  active = true;

insert into public.professional_services (professional_id, service_id) values
  ('tony', 'corte-feminino'),
  ('tony', 'barba-cabelo'),
  ('eiko', 'corte-feminino'),
  ('eiko', 'mechas'),
  ('eiko', 'morena-iluminada'),
  ('eiko', 'penteado'),
  ('lara', 'corte-feminino'),
  ('lara', 'tratamento'),
  ('lara', 'penteado'),
  ('bia', 'mechas'),
  ('bia', 'morena-iluminada'),
  ('bia', 'tratamento'),
  ('rafa', 'barba-cabelo')
on conflict do nothing;

insert into public.availability_slots (professional_id, weekday, starts_at, ends_at)
select p.id, d.weekday, '09:00'::time, '12:00'::time
from public.professionals p
cross join (values (1), (2), (3), (4), (5), (6)) as d(weekday)
on conflict do nothing;

insert into public.availability_slots (professional_id, weekday, starts_at, ends_at)
select p.id, d.weekday, '13:30'::time, '18:00'::time
from public.professionals p
cross join (values (1), (2), (3), (4), (5), (6)) as d(weekday)
on conflict do nothing;
