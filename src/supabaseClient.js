import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function mapServiceFromDb(row, proIds = []) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Math.round((row.price_cents || 0) / 100),
    duration: row.duration_minutes,
    desc: row.description || '',
    proIds,
  };
}

export function mapServiceToDb(service, sortOrder = 0) {
  return {
    id: service.id,
    name: service.name || 'Servico sem nome',
    category: service.category || 'Geral',
    description: service.desc || '',
    price_cents: Math.round(Number(service.price || 0) * 100),
    duration_minutes: Math.max(1, Math.round(Number(service.duration || 60))),
    active: true,
    sort_order: sortOrder,
  };
}

export function mapProfessionalFromDb(row, serviceIds = []) {
  return {
    id: row.id,
    name: row.name,
    role: row.role_description || '',
    initials: row.initials || '?',
    services: serviceIds,
  };
}

export function mapProfessionalToDb(pro, sortOrder = 0) {
  return {
    id: pro.id,
    name: pro.name || 'Profissional sem nome',
    role_description: pro.role || '',
    initials: pro.initials || '?',
    active: true,
    sort_order: sortOrder,
  };
}

export function mapSettingsFromDb(row) {
  return {
    businessName: row.business_name,
    whatsapp: row.whatsapp || '',
    address: row.address || '',
    instagram: row.instagram || '',
    confirmationNote: row.confirmation_note || '',
  };
}

export function mapSettingsToDb(settings) {
  return {
    id: 'main',
    business_name: settings.businessName || 'Tony & Eiko Hair Studio',
    whatsapp: settings.whatsapp || '',
    address: settings.address || '',
    instagram: settings.instagram || '',
    confirmation_note: settings.confirmationNote || '',
  };
}

export function mapAvailabilityFromDb(row) {
  return {
    id: row.id,
    proId: row.professional_id,
    weekday: row.weekday,
    startsAt: String(row.starts_at || '').slice(0, 5),
    endsAt: String(row.ends_at || '').slice(0, 5),
    active: row.active !== false,
  };
}

export function mapBlockedSlotFromDb(row) {
  const startsAt = new Date(row.starts_at);
  const endsAt = new Date(row.ends_at);

  return {
    id: row.id,
    proId: row.professional_id || 'todos',
    date: startsAt.toISOString().slice(0, 10),
    startsAt: startsAt.toTimeString().slice(0, 5),
    endsAt: endsAt.toTimeString().slice(0, 5),
    reason: row.reason || 'Agenda fechada',
  };
}

export function mapAppointmentFromDb(row) {
  const startsAt = new Date(row.starts_at);
  const serviceIds = (row.appointment_services || []).map((item) => item.service_id);

  return {
    id: row.id,
    client: row.client_name,
    phone: row.client_phone,
    note: row.note || '',
    serviceId: serviceIds[0],
    extraServiceIds: serviceIds.slice(1),
    proId: row.professional_id,
    date: startsAt.toISOString().slice(0, 10),
    time: startsAt.toTimeString().slice(0, 5),
    status: fromDbStatus(row.status),
    value: Math.round((row.value_cents || 0) / 100),
  };
}

export function toDbStatus(status) {
  return {
    pendente: 'pending',
    aceito: 'accepted',
    concluido: 'completed',
    recusado: 'declined',
    cancelado: 'cancelled',
  }[status] || status;
}

export function fromDbStatus(status) {
  return {
    pending: 'pendente',
    accepted: 'aceito',
    completed: 'concluido',
    declined: 'recusado',
    cancelled: 'cancelado',
  }[status] || status;
}
