import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ClipboardCheck,
  Crown,
  Database,
  Download,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  NotebookTabs,
  Plus,
  Scissors,
  Send,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import './styles.css';
import {
  hasSupabaseConfig,
  mapAppointmentFromDb,
  mapAvailabilityFromDb,
  mapBlockedSlotFromDb,
  mapProfessionalFromDb,
  mapProfessionalToDb,
  mapServiceFromDb,
  mapServiceToDb,
  mapSettingsFromDb,
  mapSettingsToDb,
  supabase,
  toDbStatus,
} from './supabaseClient';

const servicesInitial = [
  {
    id: 'corte-feminino',
    name: 'Corte Feminino Premium',
    category: 'Corte',
    price: 160,
    duration: 60,
    desc: 'Consultoria de visagismo, lavagem e finalizacao.',
    proIds: ['tony', 'eiko', 'lara'],
  },
  {
    id: 'mechas',
    name: 'Mechas Iluminadas',
    category: 'Coloracao',
    price: 520,
    duration: 180,
    desc: 'Tecnica personalizada com diagnostico de fio.',
    proIds: ['eiko', 'bia'],
  },
  {
    id: 'morena-iluminada',
    name: 'Morena Iluminada',
    category: 'Coloracao',
    price: 460,
    duration: 150,
    desc: 'Contraste natural, brilho e acabamento sofisticado.',
    proIds: ['eiko', 'bia'],
  },
  {
    id: 'tratamento',
    name: 'Cronograma de Tratamento',
    category: 'Tratamento',
    price: 220,
    duration: 90,
    desc: 'Reconstrucao, nutricao e hidratacao conforme diagnostico.',
    proIds: ['lara', 'bia'],
  },
  {
    id: 'barba-cabelo',
    name: 'Cabelo Masculino + Barba',
    category: 'Masculino',
    price: 120,
    duration: 60,
    desc: 'Corte, barba alinhada e acabamento com toalha quente.',
    proIds: ['tony', 'rafa'],
  },
  {
    id: 'penteado',
    name: 'Penteado Evento',
    category: 'Finalizacao',
    price: 280,
    duration: 90,
    desc: 'Producoes para eventos, fotos e ocasioes especiais.',
    proIds: ['lara', 'eiko'],
  },
];

const prosInitial = [
  { id: 'tony', name: 'Tony', role: 'Fundador e especialista em corte', initials: 'T', services: ['corte-feminino', 'barba-cabelo'] },
  { id: 'eiko', name: 'Eiko', role: 'Colorimetria, mechas e assinatura premium', initials: 'E', services: ['corte-feminino', 'mechas', 'morena-iluminada', 'penteado'] },
  { id: 'lara', name: 'Lara', role: 'Cortes, tratamentos e finalizacao', initials: 'L', services: ['corte-feminino', 'tratamento', 'penteado'] },
  { id: 'bia', name: 'Bia', role: 'Coloracao e tratamentos de fibra', initials: 'B', services: ['mechas', 'morena-iluminada', 'tratamento'] },
  { id: 'rafa', name: 'Rafa', role: 'Masculino, barba e acabamento', initials: 'R', services: ['barba-cabelo'] },
];

const seedAppointments = [
  {
    id: 'apt-001',
    client: 'Marina Lopes',
    phone: '44 99920-1122',
    serviceId: 'mechas',
    proId: 'eiko',
    date: isoDate(1),
    time: '10:00',
    status: 'aceito',
    value: 520,
  },
  {
    id: 'apt-002',
    client: 'Camila Torres',
    phone: '44 99841-2201',
    serviceId: 'corte-feminino',
    proId: 'lara',
    date: isoDate(1),
    time: '14:00',
    status: 'pendente',
    value: 160,
  },
  {
    id: 'apt-003',
    client: 'Renato Alves',
    phone: '44 99110-8842',
    serviceId: 'barba-cabelo',
    proId: 'tony',
    date: isoDate(2),
    time: '16:00',
    status: 'pendente',
    value: 120,
  },
  {
    id: 'apt-004',
    client: 'Julia Mendes',
    phone: '44 99887-4510',
    serviceId: 'tratamento',
    proId: 'bia',
    date: isoDate(-1),
    time: '09:00',
    status: 'concluido',
    value: 220,
  },
];

const slots = ['09:00', '10:00', '11:00', '13:30', '14:00', '15:00', '16:00', '17:00', '18:00'];
const storageKey = 'tony-eiko-app-state-v1';
const openWeekdaysDefault = [2, 3, 4, 5, 6];
const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function buildDefaultAvailability(prosList = prosInitial) {
  return prosList.flatMap((pro) => openWeekdaysDefault.flatMap((weekday) => [
    {
      id: `${pro.id}-${weekday}-manha`,
      proId: pro.id,
      weekday,
      startsAt: '09:00',
      endsAt: '12:00',
      active: true,
    },
    {
      id: `${pro.id}-${weekday}-tarde`,
      proId: pro.id,
      weekday,
      startsAt: '13:30',
      endsAt: '18:00',
      active: true,
    },
  ]));
}

const businessSettingsInitial = {
  businessName: 'Tony & Eiko Hair Studio',
  whatsapp: '44999999999',
  address: 'Maringa, PR',
  instagram: '@tony.eiko',
  confirmationNote: 'A equipe confirma o horario antes de efetivar o agendamento.',
};

const accessProfiles = [
  {
    id: 'cliente',
    dbRole: 'client',
    label: 'Cliente',
    title: 'Agendar atendimento',
    desc: 'Fluxo simples para escolher servico, profissional e horario.',
    loginTitle: 'Login do cliente',
    loginDesc: 'Acesso para agendar, acompanhar pedidos e manter seus dados de contato.',
    demoEmail: 'cliente@tonyeiko.com.br',
    demoName: 'Cliente Tony & Eiko',
    icon: CalendarDays,
  },
  {
    id: 'staff',
    dbRole: 'staff',
    label: 'Profissional',
    title: 'Agenda do profissional',
    desc: 'Visualiza solicitacoes e atualiza o status dos atendimentos.',
    loginTitle: 'Login do profissional',
    loginDesc: 'Acesso para agenda individual, confirmacao de horarios e status dos atendimentos.',
    demoEmail: 'profissional@tonyeiko.com.br',
    demoName: 'Profissional Tony & Eiko',
    icon: UserRound,
  },
  {
    id: 'admin',
    dbRole: 'admin',
    label: 'Gestao',
    title: 'Painel completo',
    desc: 'Acessa agenda, indicadores, servicos, equipe e configuracoes.',
    loginTitle: 'Login da gestao',
    loginDesc: 'Acesso completo para administrar agenda, equipe, servicos e configuracoes.',
    demoEmail: 'gestao@tonyeiko.com.br',
    demoName: 'Gestao Tony & Eiko',
    icon: LayoutDashboard,
  },
];

const demoPassword = 'tonyeiko123';

function isoDate(offset = 0) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function money(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dateLabel(value) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '');
}

function weekdayFromDate(value) {
  return new Date(`${value}T12:00:00`).getDay();
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value || '00:00').split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function slotEnd(time, durationMinutes = 60) {
  const total = timeToMinutes(time) + Math.max(1, Number(durationMinutes || 60));
  const hours = String(Math.floor(total / 60)).padStart(2, '0');
  const minutes = String(total % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function slotFitsWindow(slot, durationMinutes, window) {
  const start = timeToMinutes(slot);
  const end = start + Math.max(1, Number(durationMinutes || 60));
  return start >= timeToMinutes(window.startsAt) && end <= timeToMinutes(window.endsAt);
}

function isSlotBlocked(block, date, proId, slot, durationMinutes) {
  if (block.date !== date) return false;
  if (block.proId !== 'todos' && block.proId !== proId) return false;
  const start = timeToMinutes(slot);
  const end = start + Math.max(1, Number(durationMinutes || 60));
  return start < timeToMinutes(block.endsAt) && end > timeToMinutes(block.startsAt);
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && typeof saved === 'object') return saved;
  } catch {
    return null;
  }
  return null;
}

function App() {
  const saved = loadState();
  const [view, setView] = useState('home');
  const [step, setStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedPro, setSelectedPro] = useState('');
  const [selectedDate, setSelectedDate] = useState(isoDate(1));
  const [selectedTime, setSelectedTime] = useState('');
  const [client, setClient] = useState({ name: '', phone: '', note: '' });
  const [appointments, setAppointments] = useState(saved?.appointments || seedAppointments);
  const [services, setServices] = useState(saved?.services || servicesInitial);
  const [pros, setPros] = useState(saved?.pros || prosInitial);
  const [availability, setAvailability] = useState(saved?.availability || buildDefaultAvailability(saved?.pros || prosInitial));
  const [blockedSlots, setBlockedSlots] = useState(saved?.blockedSlots || []);
  const [settings, setSettings] = useState(saved?.settings || businessSettingsInitial);
  const [currentUser, setCurrentUser] = useState(saved?.currentUser || null);
  const [role, setRole] = useState('cliente');
  const [adminTab, setAdminTab] = useState('agenda');
  const [filterPro, setFilterPro] = useState('todos');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [backendMode, setBackendMode] = useState(hasSupabaseConfig ? 'supabase' : 'local');
  const [loadingData, setLoadingData] = useState(hasSupabaseConfig);
  const [syncError, setSyncError] = useState('');
  const [authError, setAuthError] = useState('');
  const [session, setSession] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) return undefined;

    let mounted = true;

    async function bootSupabase() {
      setLoadingData(true);
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session || null);
      await loadSupabaseData(data.session || null);
      if (data.session?.user) await applyUserProfile(data.session.user);
      if (mounted) setLoadingData(false);
    }

    bootSupabase().catch((error) => {
      if (!mounted) return;
      setSyncError(error.message || 'Falha ao carregar dados do Supabase.');
      setLoadingData(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession || null);
      if (nextSession?.user) {
        await applyUserProfile(nextSession.user);
        await loadSupabaseData(nextSession);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const selectedServiceObjects = services.filter((service) => selectedServices.includes(service.id));
  const total = selectedServiceObjects.reduce((sum, service) => sum + service.price, 0);
  const totalDuration = selectedServiceObjects.reduce((sum, service) => sum + service.duration, 0);

  const compatiblePros = useMemo(() => {
    if (!selectedServices.length) return pros;
    return pros
      .map((pro) => {
        const matchCount = selectedServices.filter((id) => pro.services.includes(id)).length;
        return { ...pro, matchCount, full: matchCount === selectedServices.length };
      })
      .filter((pro) => pro.matchCount > 0)
      .sort((a, b) => Number(b.full) - Number(a.full) || b.matchCount - a.matchCount);
  }, [pros, selectedServices]);

  const bookedTimes = appointments
    .filter((apt) => apt.date === selectedDate && apt.proId === selectedPro && apt.status !== 'recusado')
    .map((apt) => apt.time);

  const getSlotState = (date, proId, slot) => {
    if (!date || !proId) return { available: false, reason: 'Selecione profissional' };
    const weekday = weekdayFromDate(date);
    const windows = availability.filter((item) => item.proId === proId && item.weekday === weekday && item.active);
    if (!windows.length) return { available: false, reason: 'fechado' };
    if (!windows.some((window) => slotFitsWindow(slot, totalDuration || 60, window))) {
      return { available: false, reason: 'fora do horario' };
    }
    const block = blockedSlots.find((item) => isSlotBlocked(item, date, proId, slot, totalDuration || 60));
    if (block) return { available: false, reason: block.reason || 'bloqueado' };
    const taken = appointments.some((apt) => apt.date === date && apt.proId === proId && apt.time === slot && apt.status !== 'recusado');
    if (taken) return { available: false, reason: 'ocupado' };
    return { available: true, reason: '' };
  };

  const isDayAvailable = (date, proId = selectedPro) => {
    if (!proId) return true;
    return slots.some((slot) => getSlotState(date, proId, slot).available);
  };

  const days = Array.from({ length: 14 }, (_, index) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + index);
    return d.toISOString().slice(0, 10);
  });

  function persist(next = {}) {
    localStorage.setItem(storageKey, JSON.stringify({
      appointments: 'appointments' in next ? next.appointments : appointments,
      services: 'services' in next ? next.services : services,
      pros: 'pros' in next ? next.pros : pros,
      availability: 'availability' in next ? next.availability : availability,
      blockedSlots: 'blockedSlots' in next ? next.blockedSlots : blockedSlots,
      settings: 'settings' in next ? next.settings : settings,
      currentUser: 'currentUser' in next ? next.currentUser : currentUser,
    }));
  }

  async function applyUserProfile(user, expectedRole = '') {
    if (!hasSupabaseConfig || !user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, role, phone')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    const profileRole = data?.role || 'client';
    if (expectedRole && profileRole !== expectedRole) {
      await supabase.auth.signOut();
      throw new Error('Este usuario nao pertence ao perfil selecionado.');
    }

    const appRole = profileRole === 'client' ? 'cliente' : profileRole;
    const nextUser = {
      role: appRole,
      label: profileRole === 'admin' ? 'Gestao' : profileRole === 'staff' ? 'Profissional' : 'Cliente',
      name: data?.full_name || user.email || 'Usuario Tony & Eiko',
      email: user.email || '',
      phone: data?.phone || '',
    };

    setCurrentUser(nextUser);
    setRole(appRole === 'staff' ? 'staff' : 'admin');
    setAdminTab('agenda');
    setView(appRole === 'cliente' ? 'home' : 'admin');
    persist({ currentUser: nextUser });
  }

  async function loadSupabaseData(activeSession = session) {
    if (!hasSupabaseConfig) return;
    setSyncError('');

    const [
      settingsResult,
      servicesResult,
      professionalsResult,
      linksResult,
      availabilityResult,
      blockedSlotsResult,
      appointmentsResult,
    ] = await Promise.all([
      supabase.from('business_settings').select('*').eq('id', 'main').maybeSingle(),
      supabase.from('services').select('*').eq('active', true).order('sort_order'),
      supabase.from('professionals').select('*').eq('active', true).order('sort_order'),
      supabase.from('professional_services').select('*'),
      supabase.from('availability_slots').select('*').eq('active', true).order('weekday').order('starts_at'),
      activeSession
        ? supabase.from('blocked_slots').select('id, professional_id, starts_at, ends_at, reason').order('starts_at')
        : Promise.resolve({ data: [], error: null }),
      activeSession
        ? supabase.from('appointments').select('*, appointment_services(service_id, price_cents, duration_minutes)').order('starts_at')
        : Promise.resolve({ data: [], error: null }),
    ]);

    const firstError = [
      settingsResult.error,
      servicesResult.error,
      professionalsResult.error,
      linksResult.error,
      availabilityResult.error,
      blockedSlotsResult.error,
      appointmentsResult.error,
    ].find(Boolean);

    if (firstError) throw firstError;

    if (settingsResult.data) setSettings(mapSettingsFromDb(settingsResult.data));

    const links = linksResult.data || [];
    const nextServices = (servicesResult.data || []).map((service) => mapServiceFromDb(
      service,
      links.filter((link) => link.service_id === service.id).map((link) => link.professional_id),
    ));
    const nextPros = (professionalsResult.data || []).map((pro) => mapProfessionalFromDb(
      pro,
      links.filter((link) => link.professional_id === pro.id).map((link) => link.service_id),
    ));
    const nextAppointments = (appointmentsResult.data || []).map(mapAppointmentFromDb);

    if (nextServices.length) setServices(nextServices);
    if (nextPros.length) setPros(nextPros);
    if (availabilityResult.data?.length) {
      setAvailability(availabilityResult.data.map(mapAvailabilityFromDb).map((item) => (
        item.weekday === 1 ? { ...item, active: false } : item
      )));
    }
    setBlockedSlots((blockedSlotsResult.data || []).map(mapBlockedSlotFromDb));
    setAppointments(nextAppointments);
  }

  async function saveSupabaseCatalog(nextServices, nextPros, previousServices = services, previousPros = pros) {
    if (!hasSupabaseConfig || backendMode !== 'supabase' || currentUser?.role !== 'admin') return;

    const removedServiceIds = previousServices
      .map((service) => service.id)
      .filter((id) => !nextServices.some((service) => service.id === id));
    const removedProIds = previousPros
      .map((pro) => pro.id)
      .filter((id) => !nextPros.some((pro) => pro.id === id));

    const serviceRows = nextServices.map((service, index) => mapServiceToDb(service, (index + 1) * 10));
    const professionalRows = nextPros.map((pro, index) => mapProfessionalToDb(pro, (index + 1) * 10));
    const linkRows = nextPros.flatMap((pro) => pro.services.map((serviceId) => ({
      professional_id: pro.id,
      service_id: serviceId,
    })));

    const operations = [
      serviceRows.length ? supabase.from('services').upsert(serviceRows) : Promise.resolve({ error: null }),
      professionalRows.length ? supabase.from('professionals').upsert(professionalRows) : Promise.resolve({ error: null }),
      removedServiceIds.length ? supabase.from('services').update({ active: false }).in('id', removedServiceIds) : Promise.resolve({ error: null }),
      removedProIds.length ? supabase.from('professionals').update({ active: false }).in('id', removedProIds) : Promise.resolve({ error: null }),
      nextPros.length ? supabase.from('professional_services').delete().in('professional_id', nextPros.map((pro) => pro.id)) : Promise.resolve({ error: null }),
    ];

    const results = await Promise.all(operations);
    const firstError = results.find((result) => result.error)?.error;
    if (firstError) throw firstError;

    if (linkRows.length) {
      const { error } = await supabase.from('professional_services').insert(linkRows);
      if (error) throw error;
    }
  }

  async function saveSupabaseSettings(nextSettings) {
    if (!hasSupabaseConfig || backendMode !== 'supabase' || currentUser?.role !== 'admin') return;
    const { error } = await supabase.from('business_settings').upsert(mapSettingsToDb(nextSettings));
    if (error) throw error;
  }

  async function saveSupabaseAvailability(nextAvailability) {
    if (!hasSupabaseConfig || backendMode !== 'supabase' || currentUser?.role !== 'admin') return;
    const rows = nextAvailability.map((item) => ({
      professional_id: item.proId,
      weekday: item.weekday,
      starts_at: item.startsAt,
      ends_at: item.endsAt,
      active: item.active !== false,
    }));
    const { error } = await supabase
      .from('availability_slots')
      .upsert(rows, { onConflict: 'professional_id,weekday,starts_at,ends_at' });
    if (error) throw error;
  }

  async function updateSupabaseAppointmentStatus(id, status) {
    if (!hasSupabaseConfig || backendMode !== 'supabase') return;
    const { error } = await supabase
      .from('appointments')
      .update({ status: toDbStatus(status) })
      .eq('id', id);
    if (error) throw error;
  }

  function updateAppointments(nextAppointments) {
    setAppointments(nextAppointments);
    persist({ appointments: nextAppointments });
  }

  function updateStatus(id, status) {
    updateAppointments(appointments.map((apt) => (apt.id === id ? { ...apt, status } : apt)));
    updateSupabaseAppointmentStatus(id, status).catch((error) => setSyncError(error.message));
  }

  function updateCatalog(nextServices, nextPros) {
    saveSupabaseCatalog(nextServices, nextPros).catch((error) => setSyncError(error.message));
    setServices(nextServices);
    setPros(nextPros);
    persist({ services: nextServices, pros: nextPros });
  }

  function resetBooking() {
    setStep(0);
    setSelectedServices([]);
    setSelectedPro('');
    setSelectedDate(isoDate(1));
    setSelectedTime('');
    setClient({ name: '', phone: '', note: '' });
  }

  function createAppointment() {
    const mainService = selectedServiceObjects[0];
    const next = {
      id: `apt-${Date.now()}`,
      client: client.name.trim(),
      phone: client.phone.trim(),
      note: client.note.trim(),
      serviceId: mainService.id,
      extraServiceIds: selectedServices.slice(1),
      proId: selectedPro,
      date: selectedDate,
      time: selectedTime,
      status: 'pendente',
      value: total,
    };
    updateAppointments([next, ...appointments]);
    createSupabaseAppointment(next, selectedServiceObjects).catch((error) => setSyncError(error.message));
    setStep(4);
  }

  async function createSupabaseAppointment(next, servicesForAppointment) {
    if (!hasSupabaseConfig || backendMode !== 'supabase' || !session?.user) return;

    const startsAt = new Date(`${next.date}T${next.time}:00`);
    const endsAt = new Date(startsAt.getTime() + totalDuration * 60000);
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        client_profile_id: session.user.id,
        client_name: next.client,
        client_phone: next.phone,
        professional_id: next.proId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        duration_minutes: totalDuration,
        value_cents: Math.round(total * 100),
        status: 'pending',
        note: next.note,
        created_by: session.user.id,
      })
      .select('id')
      .single();

    if (error) throw error;

    const rows = servicesForAppointment.map((service) => ({
      appointment_id: data.id,
      service_id: service.id,
      price_cents: Math.round(service.price * 100),
      duration_minutes: service.duration,
    }));
    const { error: servicesError } = await supabase.from('appointment_services').insert(rows);
    if (servicesError) throw servicesError;

    await loadSupabaseData(session);
  }

  async function installApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function loginAs(profileId, identity = {}) {
    setBackendMode('local');
    const profile = accessProfiles.find((item) => item.id === profileId);
    const nextUser = {
      role: profile.id,
      label: profile.label,
      name: identity.name || profile.demoName,
      email: identity.email || profile.demoEmail,
      phone: identity.phone || '',
    };
    setCurrentUser(nextUser);
    setRole(profile.id === 'staff' ? 'staff' : 'admin');
    setAdminTab('agenda');
    setView(profile.id === 'cliente' ? 'home' : 'admin');
    persist({ currentUser: nextUser });
  }

  async function loginWithPassword(email, password, expectedRole) {
    if (!hasSupabaseConfig) return;
    setAuthError('');
    setLoadingData(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      setLoadingData(false);
      return;
    }

    setBackendMode('supabase');
    setSession(data.session || null);
    try {
      setBackendMode('supabase');
      setSession(data.session || null);
      await applyUserProfile(data.user, expectedRole);
      await loadSupabaseData(data.session);
    } catch (error) {
      setAuthError(error.message || 'Falha ao validar o perfil do usuario.');
    } finally {
      setLoadingData(false);
    }
  }

  async function logout() {
    if (hasSupabaseConfig && backendMode === 'supabase') {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setView('home');
    setStep(0);
    setBackendMode(hasSupabaseConfig ? 'supabase' : 'local');
    persist({ currentUser: null });
  }

  const currentTitle = view === 'booking'
    ? ['Servicos', 'Profissional', 'Data e horario', 'Confirmacao', 'Finalizado'][step]
    : view === 'team'
      ? 'Equipe'
      : view === 'admin'
        ? 'Painel'
        : 'Inicio';

  if (!currentUser) {
    return (
      <AccessGate
        settings={settings}
        profiles={accessProfiles}
        onLogin={loginAs}
        hasSupabaseConfig={hasSupabaseConfig}
        onPasswordLogin={loginWithPassword}
        loadingData={loadingData}
        authError={authError}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="desktop-panel">
        <div className="desktop-brand">
          <img src="/assets/tony-eiko-logo.jpg" alt="Tony & Eiko" />
          <div>
            <strong>Tony & Eiko</strong>
            <span>Hair Studio App</span>
          </div>
        </div>
        <div className="desktop-copy">
          <p>Agenda inteligente para cliente, equipe e gestao do salao em uma experiencia premium.</p>
        </div>
        <div className="desktop-metrics">
          <Metric icon={<CalendarDays />} label="Agendamentos" value={appointments.length} />
          <Metric icon={<ShieldCheck />} label="Pendentes" value={appointments.filter((a) => a.status === 'pendente').length} />
          <Metric icon={<Crown />} label="Ticket medio" value={money(averageTicket(appointments))} />
        </div>
      </aside>

      <section className="phone">
        <header className="topbar">
          <button className={`icon-btn ${view !== 'home' ? 'visible' : ''}`} onClick={() => {
            if (view === 'booking' && step > 0 && step < 4) setStep(step - 1);
            else {
              setView('home');
              if (step === 4) resetBooking();
            }
          }} aria-label="Voltar">
            <ArrowLeft size={21} />
          </button>
          <div className="logo-lockup">
            <img src="/assets/tony-eiko-logo.jpg" alt="Tony & Eiko" />
            <div>
              <strong>{currentTitle}</strong>
              <span>Tony & Eiko Hair Studio</span>
            </div>
          </div>
          <button className="icon-btn visible" onClick={logout} aria-label="Sair">
            <LogOut size={19} />
          </button>
        </header>

        {view === 'booking' && step < 4 && (
          <div className="progress" aria-label="Progresso do agendamento">
            {[0, 1, 2, 3].map((item) => <span key={item} className={item <= step ? 'done' : ''} />)}
          </div>
        )}

        <main className="screen">
          {view === 'home' && (
            <Home
              appointments={appointments}
              services={services}
              pros={pros}
              onBooking={() => { resetBooking(); setView('booking'); }}
              onTeam={() => setView('team')}
              onAdmin={() => { setView('admin'); setRole('admin'); }}
              canInstall={Boolean(installPrompt)}
              onInstall={installApp}
              currentUser={currentUser}
            />
          )}

          {view === 'booking' && (
            <Booking
              step={step}
              setStep={setStep}
              services={services}
              selectedServices={selectedServices}
              setSelectedServices={setSelectedServices}
              selectedServiceObjects={selectedServiceObjects}
              compatiblePros={compatiblePros}
              selectedPro={selectedPro}
              setSelectedPro={setSelectedPro}
              days={days}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              slots={slots}
              getSlotState={getSlotState}
              isDayAvailable={isDayAvailable}
              client={client}
              setClient={setClient}
              total={total}
              totalDuration={totalDuration}
              pros={pros}
              createAppointment={createAppointment}
              resetBooking={resetBooking}
              setView={setView}
            />
          )}

          {view === 'team' && <Team pros={pros} services={services} />}

          {view === 'admin' && (
            <Admin
              role={role}
              setRole={setRole}
              tab={adminTab}
              setTab={setAdminTab}
              appointments={appointments}
              services={services}
              pros={pros}
              filterPro={filterPro}
              setFilterPro={setFilterPro}
              updateStatus={updateStatus}
              setServices={(next) => {
                saveSupabaseCatalog(next, pros).catch((error) => setSyncError(error.message));
                setServices(next);
                persist({ services: next });
              }}
              setPros={(next) => {
                saveSupabaseCatalog(services, next).catch((error) => setSyncError(error.message));
                setPros(next);
                persist({ pros: next });
              }}
              setCatalog={updateCatalog}
              availability={availability}
              setAvailability={(next) => {
                saveSupabaseAvailability(next).catch((error) => setSyncError(error.message));
                setAvailability(next);
                persist({ availability: next });
              }}
              blockedSlots={blockedSlots}
              setBlockedSlots={(next) => {
                setBlockedSlots(next);
                persist({ blockedSlots: next });
              }}
              settings={settings}
              setSettings={(next) => {
                saveSupabaseSettings(next).catch((error) => setSyncError(error.message));
                setSettings(next);
                persist({ settings: next });
              }}
              currentUser={currentUser}
              backendMode={backendMode}
              syncError={syncError}
            />
          )}
        </main>
      </section>
    </div>
  );
}

function AccessGate({ settings, profiles, onLogin, hasSupabaseConfig: canUseSupabase, onPasswordLogin, loadingData, authError }) {
  const [selectedProfile, setSelectedProfile] = useState(profiles[0]?.id || 'cliente');
  const [credentials, setCredentials] = useState({ name: '', phone: '', email: profiles[0]?.demoEmail || '', password: demoPassword });
  const profile = profiles.find((item) => item.id === selectedProfile) || profiles[0];
  const Icon = profile.icon;

  function updateSelectedProfile(profileId) {
    const nextProfile = profiles.find((item) => item.id === profileId);
    setSelectedProfile(profileId);
    setCredentials({
      name: '',
      phone: '',
      email: nextProfile?.demoEmail || '',
      password: canUseSupabase ? '' : demoPassword,
    });
  }

  function submit(event) {
    event.preventDefault();
    if (canUseSupabase) {
      onPasswordLogin(credentials.email.trim(), credentials.password, profile.dbRole);
      return;
    }

    onLogin(profile.id, {
      name: credentials.name.trim() || profile.demoName,
      email: credentials.email.trim() || profile.demoEmail,
      phone: credentials.phone.trim(),
    });
  }

  return (
    <main className="access-shell">
      <section className="access-card">
        <div className="access-brand">
          <img src="/assets/tony-eiko-logo.jpg" alt="Tony & Eiko" />
          <div>
            <span>{canUseSupabase ? 'Acesso seguro' : 'Acesso de teste'}</span>
            <h1>{settings.businessName}</h1>
            <p>{canUseSupabase ? 'Entre com email e senha do perfil cadastrado no Supabase.' : 'Escolha um perfil e entre no modo teste para validar os fluxos.'}</p>
          </div>
        </div>

        <div className="login-tabs" role="tablist" aria-label="Tipo de login">
          {profiles.map((item) => {
            const TabIcon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={selectedProfile === item.id ? 'active' : ''}
                onClick={() => updateSelectedProfile(item.id)}
              >
                <TabIcon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>

        <form className="login-form" onSubmit={submit}>
          <div className="login-profile-summary">
            <Icon size={19} />
            <div>
              <b>{profile.loginTitle}</b>
              <span>{profile.loginDesc}</span>
            </div>
          </div>

          {!canUseSupabase && (
            <>
              <label>Nome</label>
              <input
                value={credentials.name}
                onChange={(event) => setCredentials({ ...credentials, name: event.target.value })}
                placeholder={profile.demoName}
                autoComplete="name"
              />
              <label>WhatsApp</label>
              <input
                value={credentials.phone}
                onChange={(event) => setCredentials({ ...credentials, phone: event.target.value })}
                placeholder="44 99999-9999"
                inputMode="tel"
                autoComplete="tel"
              />
            </>
          )}

            <label>Email</label>
            <input
              type="email"
              value={credentials.email}
              onChange={(event) => setCredentials({ ...credentials, email: event.target.value })}
              placeholder="gestao@tonyeiko.com.br"
              autoComplete="email"
            />
            <label>Senha</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
              placeholder="Senha cadastrada"
              autoComplete="current-password"
            />
            {authError && <p className="form-error">{authError}</p>}
            <button className="primary" disabled={loadingData || !credentials.email || !credentials.password}>
              <KeyRound size={17} /> {loadingData ? 'Entrando...' : `Entrar como ${profile.label}`}
            </button>
            {canUseSupabase && (
              <button
                type="button"
                className="secondary compact"
                onClick={() => onLogin(profile.id, {
                  name: credentials.name.trim() || profile.demoName,
                  email: credentials.email.trim() || profile.demoEmail,
                  phone: credentials.phone.trim(),
                })}
              >
                <Sparkles size={17} /> Testar como {profile.label}
              </button>
            )}
        </form>

        <div className="access-options">
          {profiles.map((profile) => {
            const Icon = profile.icon;
            return (
              <button key={profile.id} onClick={() => onLogin(profile.id)}>
                <Icon size={21} />
                <span>
                  <b>{profile.title}</b>
                  <small>{profile.desc}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="access-note">
          <KeyRound size={17} />
          <span>{canUseSupabase ? 'O login real valida o papel no Supabase. O modo teste serve apenas para demonstracao.' : `Conta de teste preenchida automaticamente. Senha local: ${demoPassword}.`}</span>
        </div>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric">
      {icon}
      <div>
        <b>{value}</b>
        <span>{label}</span>
      </div>
    </div>
  );
}

function Home({ appointments, services, pros, onBooking, onTeam, onAdmin, canInstall, onInstall, currentUser }) {
  const next = appointments
    .filter((apt) => apt.status !== 'recusado' && apt.date >= isoDate(0))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
  const pending = appointments.filter((apt) => apt.status === 'pendente').length;
  const featuredServices = services.slice(0, 3);

  return (
    <>
      <section className="hero">
        <img src="/assets/tony-eiko-hero.jpg" alt="Salao Tony & Eiko" />
        <div className="hero-content">
          <span>Agenda premium</span>
          <h1>Beleza, cuidado e horario certo.</h1>
          <p>Escolha servico, profissional e horario em poucos toques.</p>
        </div>
      </section>

      <section className="quick-actions" aria-label="Acoes principais">
        <button className="quick-card primary-card" onClick={onBooking}>
          <CalendarDays size={21} />
          <span>
            <b>Agendar atendimento</b>
            <small>Cliente escolhe servico, profissional e horario.</small>
          </span>
        </button>
        {currentUser.role === 'cliente' ? (
          <button className="quick-card" onClick={onTeam}>
            <Scissors size={21} />
            <span>
              <b>Conhecer equipe</b>
              <small>Veja os profissionais e especialidades do salao.</small>
            </span>
          </button>
        ) : (
          <button className="quick-card" onClick={onAdmin}>
            <LayoutDashboard size={21} />
            <span>
              <b>Painel da equipe</b>
              <small>Gestao de agenda, status e indicadores.</small>
            </span>
          </button>
        )}
      </section>

      <div className="value-grid">
        <div><Sparkles size={17} /><b>{services.length}</b><span>servicos</span></div>
        <div><UsersRound size={17} /><b>{pros.length}</b><span>profissionais</span></div>
        <div><Star size={17} /><b>4.9</b><span>experiencia</span></div>
      </div>

      <section className="panel">
        <div className="section-title">
          <h2>Servicos em destaque</h2>
          <button className="text-action" onClick={onBooking}>Ver agenda</button>
        </div>
        <div className="service-preview">
          {featuredServices.map((service) => (
            <div key={service.id}>
              <strong>{service.name}</strong>
              <span>{service.duration} min · {money(service.price)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>Proximo horario</h2>
          <span>{next ? dateLabel(next.date) : 'Livre'}</span>
        </div>
        {next ? (
          <AppointmentMini apt={next} services={services} pros={pros} />
        ) : (
          <p className="muted">Nenhum agendamento ativo no momento.</p>
        )}
      </section>

      <section className="benefit-grid">
        <div><CheckCircle2 size={17} /><span>Confirmacao pelo painel</span></div>
        <div><Clock3 size={17} /><span>Bloqueio de horarios ocupados</span></div>
        <div><NotebookTabs size={17} /><span>Historico salvo no navegador</span></div>
        <div><Smartphone size={17} /><span>Base pronta para instalar como app</span></div>
      </section>

      <section className="team-summary">
        <div>
          <span>Pendentes hoje</span>
          <b>{pending}</b>
        </div>
        <div>
          <span>Ticket medio</span>
          <b>{money(averageTicket(appointments))}</b>
        </div>
      </section>

      <button className="secondary" onClick={onTeam}><Scissors size={18} /> Ver equipe Tony & Eiko</button>
      {canInstall && (
        <button className="secondary install-button" onClick={onInstall}><Smartphone size={18} /> Instalar app</button>
      )}
    </>
  );
}

function Booking(props) {
  const {
    step,
    setStep,
    services,
    selectedServices,
    setSelectedServices,
    selectedServiceObjects,
    compatiblePros,
    selectedPro,
    setSelectedPro,
    days,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    slots,
    getSlotState,
    isDayAvailable,
    client,
    setClient,
    total,
    totalDuration,
    pros,
    createAppointment,
    resetBooking,
    setView,
  } = props;

  function toggleService(id) {
    setSelectedServices(selectedServices.includes(id)
      ? selectedServices.filter((serviceId) => serviceId !== id)
      : [...selectedServices, id]);
    setSelectedPro('');
    setSelectedTime('');
  }

  if (step === 0) {
    return (
      <>
        <StepHeader title="Escolha os servicos" sub="Voce pode selecionar mais de um servico no mesmo agendamento." />
        <div className="stack">
          {services.map((service) => (
            <button
              key={service.id}
              className={`service-card ${selectedServices.includes(service.id) ? 'selected' : ''}`}
              onClick={() => toggleService(service.id)}
            >
              <div>
                <span className="tag">{service.category}</span>
                <h3>{service.name}</h3>
                <p>{service.desc}</p>
                <div className="chips">
                  <span>{service.duration} min</span>
                  <strong>{money(service.price)}</strong>
                </div>
              </div>
              <span className="checkmark">{selectedServices.includes(service.id) && <Check size={15} />}</span>
            </button>
          ))}
        </div>
        <StickySummary total={total} label={`${selectedServices.length} selecionado(s)`}>
          <button className="primary" disabled={!selectedServices.length} onClick={() => setStep(1)}>Continuar</button>
        </StickySummary>
      </>
    );
  }

  if (step === 1) {
    return (
      <>
        <StepHeader title="Escolha o profissional" sub="O app destaca quem atende todos os servicos selecionados." />
        <div className="pro-grid">
          {compatiblePros.map((pro) => (
            <button key={pro.id} className={`pro-card ${selectedPro === pro.id ? 'selected' : ''}`} onClick={() => setSelectedPro(pro.id)}>
              <div className="avatar">{pro.initials}</div>
              <span className={pro.full ? 'badge ok' : 'badge warn'}>{pro.full ? 'match completo' : `${pro.matchCount} servico(s)`}</span>
              <h3>{pro.name}</h3>
              <p>{pro.role}</p>
            </button>
          ))}
        </div>
        <StickySummary total={total} label={`${totalDuration} min estimados`}>
          <button className="primary" disabled={!selectedPro} onClick={() => setStep(2)}>Ver horarios</button>
        </StickySummary>
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <StepHeader title="Data e horario" sub="Horarios ocupados ficam bloqueados automaticamente para o profissional." />
        <div className="calendar-nav">
          <button className="icon-mini"><ChevronLeft size={18} /></button>
          <strong>Proximos 14 dias</strong>
          <button className="icon-mini"><ChevronRight size={18} /></button>
        </div>
        <div className="day-strip">
          {days.map((day) => {
            const available = isDayAvailable(day);
            return (
              <button
                key={day}
                disabled={!available}
                className={`${selectedDate === day ? 'active' : ''} ${!available ? 'closed' : ''}`}
                onClick={() => { setSelectedDate(day); setSelectedTime(''); }}
              >
                <span>{new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                <b>{day.slice(-2)}</b>
                {!available && <small>fechado</small>}
              </button>
            );
          })}
        </div>
        <p className="slots-title">Horarios para {pros.find((pro) => pro.id === selectedPro)?.name}</p>
        <div className="slots">
          {slots.map((slot) => {
            const state = getSlotState(selectedDate, selectedPro, slot);
            return (
              <button
                key={slot}
                disabled={!state.available}
                className={`${selectedTime === slot ? 'selected' : ''} ${!state.available ? 'taken' : ''}`}
                onClick={() => setSelectedTime(slot)}
              >
                {slot}
                {!state.available && <span>{state.reason}</span>}
              </button>
            );
          })}
        </div>
        <StickySummary total={total} label={selectedTime || 'Escolha um horario'}>
          <button className="primary" disabled={!selectedTime} onClick={() => setStep(3)}>Confirmar dados</button>
        </StickySummary>
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        <StepHeader title="Confirme seu atendimento" sub="Preencha os dados para a equipe validar o agendamento." />
        <div className="form-card">
          <label>Nome completo</label>
          <input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} placeholder="Ex.: Ana Paula" />
          <label>WhatsApp</label>
          <input value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} placeholder="Ex.: 44 99999-9999" />
          <label>Observacao</label>
          <textarea value={client.note} onChange={(e) => setClient({ ...client, note: e.target.value })} placeholder="Preferencias, historico do cabelo ou observacao para a equipe" />
        </div>
        <div className="confirm-card">
          <Row label="Servicos" value={selectedServiceObjects.map((s) => s.name).join(', ')} />
          <Row label="Profissional" value={pros.find((pro) => pro.id === selectedPro)?.name} />
          <Row label="Data" value={dateLabel(selectedDate)} />
          <Row label="Horario" value={selectedTime} />
          <Row label="Duracao" value={`${totalDuration} min`} />
          <div className="total-row"><span>Total estimado</span><b>{money(total)}</b></div>
        </div>
        <StickySummary total={total} label="Pedido vai para aprovacao">
          <button className="primary" disabled={!client.name.trim() || !client.phone.trim()} onClick={createAppointment}>Solicitar agendamento</button>
        </StickySummary>
      </>
    );
  }

  return (
    <section className="success">
      <div className="success-icon"><CheckCircle2 size={34} /></div>
      <h2>Agendamento solicitado</h2>
      <p>A equipe recebe a solicitacao e pode aceitar, recusar ou concluir pelo painel interno.</p>
      <button className="primary" onClick={() => { resetBooking(); setView('home'); }}>Voltar ao inicio</button>
      <button className="secondary"><MessageCircle size={18} /> Abrir WhatsApp</button>
    </section>
  );
}

function StepHeader({ title, sub }) {
  return (
    <div className="step-header">
      <h2>{title}</h2>
      <p>{sub}</p>
    </div>
  );
}

function StickySummary({ total, label, children }) {
  return (
    <div className="sticky">
      <div><span>{label}</span><b>{money(total)}</b></div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return <div className="row"><span>{label}</span><b>{value}</b></div>;
}

function Team({ pros, services }) {
  return (
    <>
      <StepHeader title="Equipe Tony & Eiko" sub="Especialistas organizados por perfil de atendimento." />
      <div className="stack">
        {pros.map((pro) => (
          <article className="team-card" key={pro.id}>
            <div className="avatar">{pro.initials}</div>
            <div>
              <h3>{pro.name}</h3>
              <p>{pro.role}</p>
              <div className="chips">
                {pro.services.slice(0, 3).map((id) => <span key={id}>{services.find((s) => s.id === id)?.category}</span>)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function Admin(props) {
  const {
    role,
    setRole,
    tab,
    setTab,
    appointments,
    services,
    pros,
    filterPro,
    setFilterPro,
    updateStatus,
    setServices,
    setPros,
    setCatalog,
    availability,
    setAvailability,
    blockedSlots,
    setBlockedSlots,
    settings,
    setSettings,
    currentUser,
    backendMode,
    syncError,
  } = props;

  const filtered = appointments
    .filter((apt) => filterPro === 'todos' || apt.proId === filterPro)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  const revenue = appointments.filter((apt) => apt.status === 'concluido' || apt.status === 'aceito').reduce((sum, apt) => sum + apt.value, 0);
  const pending = appointments.filter((apt) => apt.status === 'pendente').length;
  const conversion = appointments.length ? Math.round((appointments.filter((apt) => apt.status !== 'recusado').length / appointments.length) * 100) : 0;
  const nextAppointment = filtered.find((apt) => apt.status !== 'recusado' && apt.date >= isoDate(0));
  const serviceUsage = appointments.reduce((acc, apt) => {
    acc[apt.serviceId] = (acc[apt.serviceId] || 0) + 1;
    return acc;
  }, {});
  const proUsage = appointments.reduce((acc, apt) => {
    acc[apt.proId] = (acc[apt.proId] || 0) + 1;
    return acc;
  }, {});

  const visibleTabs = [
    ['agenda', 'Agenda', CalendarDays],
    ['horarios', 'Horarios', Clock3],
    ['indicadores', 'Indicadores', BarChart3],
    ['servicos', 'Servicos', Scissors],
    ['equipe', 'Equipe', UsersRound],
    ['configuracao', 'Config', Settings2],
    ['implantacao', 'Implantacao', ClipboardCheck],
  ].filter(([id]) => currentUser.role === 'admin' || ['agenda', 'indicadores'].includes(id));

  return (
    <>
      <section className="admin-hero">
        <div>
          <span>{role === 'admin' ? 'Visao da gestao' : 'Visao do profissional'} · {backendMode === 'supabase' ? 'Supabase ativo' : 'modo teste local'}</span>
          <h2>{pending} solicitacao(oes) aguardando acao</h2>
          <p>{nextAppointment ? `Proximo atendimento: ${nextAppointment.time} em ${dateLabel(nextAppointment.date)}` : 'Sem proximos atendimentos na lista atual.'}</p>
        </div>
        <b>{money(revenue)}</b>
      </section>

      {syncError && (
        <div className="sync-alert">
          <ShieldCheck size={16} />
          <span>{syncError}</span>
        </div>
      )}

      {currentUser.role === 'admin' && (
        <div className="role-toggle">
          <button className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}><LayoutDashboard size={16} /> Gestao</button>
          <button className={role === 'staff' ? 'active' : ''} onClick={() => setRole('staff')}><UserRound size={16} /> Profissional</button>
        </div>
      )}

      <div className="admin-tabs">
        {visibleTabs.map(([id, label, Icon]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={15} /> {label}</button>
        ))}
      </div>

      {tab === 'agenda' && (
        <>
          <div className="filter-row">
            <select value={filterPro} onChange={(e) => setFilterPro(e.target.value)}>
              <option value="todos">Todos profissionais</option>
              {pros.map((pro) => <option key={pro.id} value={pro.id}>{pro.name}</option>)}
            </select>
          </div>
          <div className="stack">
            {filtered.map((apt) => (
              <AppointmentCard key={apt.id} apt={apt} services={services} pros={pros} updateStatus={updateStatus} />
            ))}
          </div>
        </>
      )}

      {tab === 'horarios' && (
        <ScheduleManager
          pros={pros}
          availability={availability}
          setAvailability={setAvailability}
          blockedSlots={blockedSlots}
          setBlockedSlots={setBlockedSlots}
          backendMode={backendMode}
        />
      )}

      {tab === 'indicadores' && (
        <>
          <div className="stat-grid">
            <Stat value={appointments.length} label="agendamentos no painel" />
            <Stat value={pending} label="solicitacoes pendentes" />
            <Stat value={money(revenue)} label="receita em agenda" />
            <Stat value={`${conversion}%`} label="aproveitamento" />
          </div>
          <div className="insight-card">
            <ShieldCheck size={18} />
            <div>
              <h3>Leitura operacional</h3>
              <p>O maior ganho do app e reduzir conversa manual no WhatsApp, evitar conflito de horario e dar controle para a equipe validar pedidos antes de confirmar.</p>
            </div>
          </div>
          <div className="chart-card">
            <h3>Distribuicao por status</h3>
            {['pendente', 'aceito', 'concluido', 'recusado'].map((status) => {
              const count = appointments.filter((apt) => apt.status === status).length;
              const pct = appointments.length ? (count / appointments.length) * 100 : 0;
              return (
                <div className="bar-row" key={status}>
                  <span>{status}</span>
                  <div><i style={{ width: `${pct}%` }} /></div>
                  <b>{count}</b>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'servicos' && (
        <ServiceManager
          services={services}
          pros={pros}
          usage={serviceUsage}
          setServices={setServices}
          setCatalog={setCatalog}
        />
      )}

      {tab === 'equipe' && (
        <TeamManager
          pros={pros}
          services={services}
          usage={proUsage}
          setPros={setPros}
          setCatalog={setCatalog}
        />
      )}

      {tab === 'configuracao' && (
        <SettingsPanel
          settings={settings}
          setSettings={setSettings}
          appointments={appointments}
          services={services}
          pros={pros}
        />
      )}

      {tab === 'implantacao' && <LaunchPlan />}
    </>
  );
}

function localDateTimeIso(date, time) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function ScheduleManager({ pros, availability, setAvailability, blockedSlots, setBlockedSlots, backendMode }) {
  const [blockForm, setBlockForm] = useState({
    proId: 'todos',
    date: isoDate(0),
    startsAt: '09:00',
    endsAt: '18:00',
    reason: 'Agenda fechada',
  });
  const [scheduleError, setScheduleError] = useState('');

  const openWeekdays = weekdayLabels.map((_, weekday) => availability.some((item) => item.weekday === weekday && item.active));

  function toggleWeekday(weekday) {
    const isOpen = openWeekdays[weekday];
    let next = availability.map((item) => (item.weekday === weekday ? { ...item, active: !isOpen } : item));

    if (!isOpen) {
      pros.forEach((pro) => {
        const hasMorning = next.some((item) => item.proId === pro.id && item.weekday === weekday && item.startsAt === '09:00' && item.endsAt === '12:00');
        const hasAfternoon = next.some((item) => item.proId === pro.id && item.weekday === weekday && item.startsAt === '13:30' && item.endsAt === '18:00');
        if (!hasMorning) {
          next.push({ id: `${pro.id}-${weekday}-manha`, proId: pro.id, weekday, startsAt: '09:00', endsAt: '12:00', active: true });
        }
        if (!hasAfternoon) {
          next.push({ id: `${pro.id}-${weekday}-tarde`, proId: pro.id, weekday, startsAt: '13:30', endsAt: '18:00', active: true });
        }
      });
    }

    setAvailability(next);
  }

  async function addBlock(event) {
    event.preventDefault();
    setScheduleError('');
    if (timeToMinutes(blockForm.endsAt) <= timeToMinutes(blockForm.startsAt)) {
      setScheduleError('O horario final precisa ser maior que o inicial.');
      return;
    }

    let nextBlock = {
      id: `block-${Date.now()}`,
      proId: blockForm.proId,
      date: blockForm.date,
      startsAt: blockForm.startsAt,
      endsAt: blockForm.endsAt,
      reason: blockForm.reason.trim() || 'Agenda fechada',
    };

    if (hasSupabaseConfig && backendMode === 'supabase') {
      const { data, error } = await supabase
        .from('blocked_slots')
        .insert({
          professional_id: blockForm.proId === 'todos' ? null : blockForm.proId,
          starts_at: localDateTimeIso(blockForm.date, blockForm.startsAt),
          ends_at: localDateTimeIso(blockForm.date, blockForm.endsAt),
          reason: nextBlock.reason,
        })
        .select('id, professional_id, starts_at, ends_at, reason')
        .single();
      if (error) {
        setScheduleError(error.message);
        return;
      }
      nextBlock = mapBlockedSlotFromDb(data);
    }

    setBlockedSlots([nextBlock, ...blockedSlots]);
  }

  async function removeBlock(id) {
    setScheduleError('');
    if (hasSupabaseConfig && backendMode === 'supabase') {
      const { error } = await supabase.from('blocked_slots').delete().eq('id', id);
      if (error) {
        setScheduleError(error.message);
        return;
      }
    }
    setBlockedSlots(blockedSlots.filter((block) => block.id !== id));
  }

  return (
    <>
      <section className="launch-card">
        <span>Agenda da gestao</span>
        <h2>Dias de funcionamento e bloqueios manuais.</h2>
        <p>Segunda-feira fica fechada por padrao. Use bloqueio manual para feriado, folga, viagem, curso ou agenda cheia.</p>
      </section>

      <article className="editor-card">
        <div className="editor-card-head simple">
          <div>
            <h3>Dias que abrem</h3>
            <p>Quando um dia esta fechado, ele some da escolha de horarios do cliente.</p>
          </div>
        </div>
        <div className="weekday-grid">
          {weekdayLabels.map((label, weekday) => (
            <button
              key={label}
              className={openWeekdays[weekday] ? 'active' : ''}
              onClick={() => toggleWeekday(weekday)}
            >
              <b>{label}</b>
              <span>{openWeekdays[weekday] ? 'Aberto' : 'Fechado'}</span>
            </button>
          ))}
        </div>
      </article>

      <form className="form-card schedule-form" onSubmit={addBlock}>
        <label>Fechar agenda para</label>
        <select value={blockForm.proId} onChange={(e) => setBlockForm({ ...blockForm, proId: e.target.value })}>
          <option value="todos">Todos profissionais</option>
          {pros.map((pro) => <option key={pro.id} value={pro.id}>{pro.name}</option>)}
        </select>

        <div className="editor-grid">
          <label>Data
            <input type="date" value={blockForm.date} onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })} />
          </label>
          <label>Motivo
            <input value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} />
          </label>
          <label>Inicio
            <input type="time" value={blockForm.startsAt} onChange={(e) => setBlockForm({ ...blockForm, startsAt: e.target.value })} />
          </label>
          <label>Fim
            <input type="time" value={blockForm.endsAt} onChange={(e) => setBlockForm({ ...blockForm, endsAt: e.target.value })} />
          </label>
        </div>

        {scheduleError && <p className="form-error">{scheduleError}</p>}
        <button className="primary"><Clock3 size={17} /> Fechar agenda</button>
      </form>

      <div className="section-title">
        <h2>Bloqueios ativos</h2>
        <span>{blockedSlots.length} registro(s)</span>
      </div>
      <div className="stack">
        {blockedSlots.length ? blockedSlots.map((block) => {
          const proName = block.proId === 'todos' ? 'Todos profissionais' : pros.find((pro) => pro.id === block.proId)?.name || 'Profissional';
          return (
            <article className="editor-row" key={block.id}>
              <div>
                <h3>{proName}</h3>
                <p>{dateLabel(block.date)} · {block.startsAt} ate {block.endsAt} · {block.reason}</p>
              </div>
              <button className="icon-danger" onClick={() => removeBlock(block.id)} aria-label="Remover bloqueio">
                <Trash2 size={16} />
              </button>
            </article>
          );
        }) : (
          <p className="muted">Nenhum bloqueio manual cadastrado.</p>
        )}
      </div>
    </>
  );
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createRecordId(prefix, items) {
  const existing = new Set(items.map((item) => item.id));
  let id = `${prefix}-${Date.now()}`;
  let index = 1;

  while (existing.has(id)) {
    id = `${prefix}-${Date.now()}-${index}`;
    index += 1;
  }

  return id;
}

function getServiceProIds(service, pros) {
  const fromService = Array.isArray(service.proIds) ? service.proIds : [];
  const fromPros = pros.filter((pro) => pro.services.includes(service.id)).map((pro) => pro.id);
  return Array.from(new Set([...fromService, ...fromPros]));
}

function ServiceManager({ services, pros, usage, setCatalog }) {
  const [draftServices, setDraftServices] = useState(services);
  const [draftPros, setDraftPros] = useState(pros);
  const [saveNotice, setSaveNotice] = useState('');

  useEffect(() => {
    setDraftServices(services);
    setDraftPros(pros);
  }, [services, pros]);

  const hasChanges = JSON.stringify(draftServices) !== JSON.stringify(services)
    || JSON.stringify(draftPros) !== JSON.stringify(pros);

  function addService() {
    setSaveNotice('');
    setDraftServices([...draftServices, {
      id: createRecordId('servico', draftServices),
      name: 'Novo servico',
      category: 'Novo',
      price: 100,
      duration: 60,
      desc: 'Editar descricao do servico.',
      proIds: [],
    }]);
  }

  function updateService(id, patch) {
    setSaveNotice('');
    setDraftServices(draftServices.map((service) => (service.id === id ? { ...service, ...patch } : service)));
  }

  function toggleProfessional(serviceId, proId) {
    setSaveNotice('');
    const service = draftServices.find((item) => item.id === serviceId);
    const currentProIds = getServiceProIds(service, draftPros);
    const nextProIds = currentProIds.includes(proId)
      ? currentProIds.filter((id) => id !== proId)
      : [...currentProIds, proId];
    const nextServices = draftServices.map((item) => (item.id === serviceId ? { ...item, proIds: nextProIds } : item));
    const nextPros = draftPros.map((pro) => {
      const nextServiceIds = nextProIds.includes(pro.id)
        ? Array.from(new Set([...pro.services, serviceId]))
        : pro.services.filter((id) => id !== serviceId);
      return { ...pro, services: nextServiceIds };
    });
    setDraftServices(nextServices);
    setDraftPros(nextPros);
  }

  function deleteService(id) {
    setSaveNotice('');
    const nextServices = draftServices.filter((service) => service.id !== id);
    const nextPros = draftPros.map((pro) => ({ ...pro, services: pro.services.filter((serviceId) => serviceId !== id) }));
    setDraftServices(nextServices);
    setDraftPros(nextPros);
  }

  function saveChanges() {
    setCatalog(draftServices, draftPros);
    setSaveNotice('Alteracoes salvas.');
  }

  function discardChanges() {
    setDraftServices(services);
    setDraftPros(pros);
    setSaveNotice('');
  }

  return (
    <>
      <div className="section-title editor-title">
        <h2>Servicos ativos</h2>
        <button className="icon-action" onClick={addService} aria-label="Adicionar servico"><Plus size={16} /></button>
      </div>

      <div className="editor-save-bar">
        <button className="primary" onClick={saveChanges} disabled={!hasChanges}>
          <Check size={17} /> Salvar alteracoes
        </button>
        <button className="secondary compact" onClick={discardChanges} disabled={!hasChanges}>Cancelar</button>
        <span>{hasChanges ? 'Existem alteracoes nao salvas.' : saveNotice || 'Tudo salvo.'}</span>
      </div>

      <div className="stack">
        {draftServices.map((service) => {
          const proIds = getServiceProIds(service, draftPros);
          return (
            <article className="editor-card" key={service.id}>
              <div className="editor-card-head">
                <div>
                  <span className="tag">{service.category || 'Sem categoria'}</span>
                  <h3>{service.name || 'Servico sem nome'}</h3>
                  <p>{service.duration || 0} min · {money(service.price || 0)} · {usage[service.id] || 0} agenda(s)</p>
                </div>
                <button className="icon-danger" onClick={() => deleteService(service.id)} aria-label="Excluir servico">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="editor-grid">
                <label>Nome
                  <input value={service.name} onChange={(e) => updateService(service.id, { name: e.target.value })} />
                </label>
                <label>Categoria
                  <input value={service.category} onChange={(e) => updateService(service.id, { category: e.target.value })} />
                </label>
                <label>Preco
                  <input type="number" inputMode="decimal" min="0" value={service.price} onChange={(e) => updateService(service.id, { price: normalizeNumber(e.target.value, service.price) })} />
                </label>
                <label>Duracao
                  <input type="number" inputMode="numeric" min="0" value={service.duration} onChange={(e) => updateService(service.id, { duration: normalizeNumber(e.target.value, service.duration) })} />
                </label>
              </div>

              <label className="editor-textarea">Descricao
                <textarea value={service.desc} onChange={(e) => updateService(service.id, { desc: e.target.value })} />
              </label>

              <div className="assignment-block">
                <span>Profissionais que atendem</span>
                <div className="pill-toggle-grid">
                  {draftPros.map((pro) => (
                    <button
                      key={pro.id}
                      className={proIds.includes(pro.id) ? 'active' : ''}
                      onClick={() => toggleProfessional(service.id, pro.id)}
                    >
                      {pro.initials} · {pro.name}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function TeamManager({ pros, services, usage, setCatalog }) {
  const [draftPros, setDraftPros] = useState(pros);
  const [draftServices, setDraftServices] = useState(services);
  const [saveNotice, setSaveNotice] = useState('');

  useEffect(() => {
    setDraftPros(pros);
    setDraftServices(services);
  }, [pros, services]);

  const hasChanges = JSON.stringify(draftPros) !== JSON.stringify(pros)
    || JSON.stringify(draftServices) !== JSON.stringify(services);

  function addProfessional() {
    setSaveNotice('');
    setDraftPros([...draftPros, { id: createRecordId('pro', draftPros), name: 'Novo profissional', role: 'Especialidade', initials: 'N', services: [] }]);
  }

  function updateProfessional(id, patch) {
    setSaveNotice('');
    setDraftPros(draftPros.map((pro) => (pro.id === id ? { ...pro, ...patch } : pro)));
  }

  function toggleService(proId, serviceId) {
    setSaveNotice('');
    const pro = draftPros.find((item) => item.id === proId);
    const nextServiceIds = pro.services.includes(serviceId)
      ? pro.services.filter((id) => id !== serviceId)
      : [...pro.services, serviceId];
    const nextPros = draftPros.map((item) => (item.id === proId ? { ...item, services: nextServiceIds } : item));
    const nextServices = draftServices.map((service) => {
      const currentProIds = getServiceProIds(service, nextPros);
      return { ...service, proIds: currentProIds };
    });
    setDraftPros(nextPros);
    setDraftServices(nextServices);
  }

  function deleteProfessional(id) {
    setSaveNotice('');
    const nextPros = draftPros.filter((pro) => pro.id !== id);
    const nextServices = draftServices.map((service) => ({
      ...service,
      proIds: getServiceProIds(service, nextPros).filter((proId) => proId !== id),
    }));
    setDraftPros(nextPros);
    setDraftServices(nextServices);
  }

  function saveChanges() {
    setCatalog(draftServices, draftPros);
    setSaveNotice('Alteracoes salvas.');
  }

  function discardChanges() {
    setDraftPros(pros);
    setDraftServices(services);
    setSaveNotice('');
  }

  return (
    <>
      <div className="section-title editor-title">
        <h2>Profissionais</h2>
        <button className="icon-action" onClick={addProfessional} aria-label="Adicionar profissional"><Plus size={16} /></button>
      </div>

      <div className="editor-save-bar">
        <button className="primary" onClick={saveChanges} disabled={!hasChanges}>
          <Check size={17} /> Salvar alteracoes
        </button>
        <button className="secondary compact" onClick={discardChanges} disabled={!hasChanges}>Cancelar</button>
        <span>{hasChanges ? 'Existem alteracoes nao salvas.' : saveNotice || 'Tudo salvo.'}</span>
      </div>

      <div className="stack">
        {draftPros.map((pro) => (
          <article className="editor-card" key={pro.id}>
            <div className="editor-card-head">
              <div className="editor-person">
                <div className="avatar">{pro.initials || '?'}</div>
                <div>
                  <h3>{pro.name || 'Profissional sem nome'}</h3>
                  <p>{pro.services.length} servico(s) · {usage[pro.id] || 0} agenda(s)</p>
                </div>
              </div>
              <button className="icon-danger" onClick={() => deleteProfessional(pro.id)} aria-label="Excluir profissional">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="editor-grid">
              <label>Nome
                <input value={pro.name} onChange={(e) => updateProfessional(pro.id, { name: e.target.value })} />
              </label>
              <label>Iniciais
                <input value={pro.initials} maxLength={3} onChange={(e) => updateProfessional(pro.id, { initials: e.target.value.toUpperCase() })} />
              </label>
            </div>

            <label className="editor-textarea">Funcao / especialidade
              <textarea value={pro.role} onChange={(e) => updateProfessional(pro.id, { role: e.target.value })} />
            </label>

            <div className="assignment-block">
              <span>Servicos habilitados</span>
              <div className="pill-toggle-grid">
                {draftServices.map((service) => (
                  <button
                    key={service.id}
                    className={pro.services.includes(service.id) ? 'active' : ''}
                    onClick={() => toggleService(pro.id, service.id)}
                  >
                    {service.category} · {service.name}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function SettingsPanel({ settings, setSettings, appointments, services, pros }) {
  const [draftSettings, setDraftSettings] = useState(settings);
  const [saveNotice, setSaveNotice] = useState('');

  useEffect(() => {
    setDraftSettings(settings);
  }, [settings]);

  const hasChanges = JSON.stringify(draftSettings) !== JSON.stringify(settings);

  function updateField(field, value) {
    setSaveNotice('');
    setDraftSettings({ ...draftSettings, [field]: value });
  }

  function saveChanges() {
    setSettings(draftSettings);
    setSaveNotice('Configuracao salva.');
  }

  function discardChanges() {
    setDraftSettings(settings);
    setSaveNotice('');
  }

  function exportBackup() {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings: draftSettings,
      appointments,
      services,
      pros,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tony-eiko-app-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <section className="launch-card">
        <span>Configuracao operacional</span>
        <h2>Dados usados para preparar a versao real do app.</h2>
        <p>Nesta fase os dados ficam no navegador. Em producao, isso deve ir para banco com login e permissao por perfil.</p>
      </section>

      <div className="form-card settings-form">
        <label>Nome do salao</label>
        <input value={draftSettings.businessName} onChange={(e) => updateField('businessName', e.target.value)} />
        <label>WhatsApp principal</label>
        <input value={draftSettings.whatsapp} onChange={(e) => updateField('whatsapp', e.target.value)} inputMode="tel" />
        <label>Endereco / cidade</label>
        <input value={draftSettings.address} onChange={(e) => updateField('address', e.target.value)} />
        <label>Instagram</label>
        <input value={draftSettings.instagram} onChange={(e) => updateField('instagram', e.target.value)} />
        <label>Mensagem de confirmacao</label>
        <textarea value={draftSettings.confirmationNote} onChange={(e) => updateField('confirmationNote', e.target.value)} />
      </div>

      <div className="editor-save-bar">
        <button className="primary" onClick={saveChanges} disabled={!hasChanges}>
          <Check size={17} /> Salvar configuracao
        </button>
        <button className="secondary compact" onClick={discardChanges} disabled={!hasChanges}>Cancelar</button>
        <span>{hasChanges ? 'Existem alteracoes nao salvas.' : saveNotice || 'Tudo salvo.'}</span>
      </div>

      <button className="secondary" onClick={exportBackup}><Download size={18} /> Exportar backup JSON</button>
    </>
  );
}

function LaunchPlan() {
  const items = [
    {
      icon: <Database size={18} />,
      title: 'Banco de dados',
      desc: 'Trocar localStorage por Supabase ou banco proprio para agenda, clientes, servicos e equipe.',
    },
    {
      icon: <ShieldCheck size={18} />,
      title: 'Login por perfil',
      desc: 'Separar acesso de cliente, profissional e administrador antes de operar com dados reais.',
    },
    {
      icon: <Send size={18} />,
      title: 'WhatsApp',
      desc: 'Enviar confirmacao, lembrete e aviso de alteracao de status por integracao oficial.',
    },
    {
      icon: <Smartphone size={18} />,
      title: 'App instalavel',
      desc: 'Publicar como PWA para o cliente salvar na tela inicial sem depender de loja de aplicativos.',
    },
  ];

  return (
    <>
      <section className="launch-card">
        <span>Roadmap MVP</span>
        <h2>O prototipo ja valida a experiencia. A proxima etapa e transformar em operacao real.</h2>
        <p>Este bloco deixa claro para a Tony o que esta pronto para demonstrar e o que precisa ser contratado/desenvolvido para producao.</p>
      </section>
      <div className="launch-list">
        {items.map((item) => (
          <article key={item.title}>
            <div>{item.icon}</div>
            <section>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </section>
          </article>
        ))}
      </div>
    </>
  );
}

function AppointmentMini({ apt, services, pros }) {
  const service = services.find((item) => item.id === apt.serviceId);
  const pro = pros.find((item) => item.id === apt.proId);
  return (
    <article className="mini-apt">
      <Clock3 size={18} />
      <div>
        <b>{apt.time} · {service?.name}</b>
        <span>{pro?.name} · {apt.client}</span>
      </div>
      <Status status={apt.status} />
    </article>
  );
}

function AppointmentCard({ apt, services, pros, updateStatus }) {
  const service = services.find((item) => item.id === apt.serviceId);
  const pro = pros.find((item) => item.id === apt.proId);
  return (
    <article className={`appointment ${apt.status}`}>
      <div className="appointment-head">
        <div className="date-box"><b>{apt.time}</b><span>{dateLabel(apt.date)}</span></div>
        <div>
          <h3>{apt.client}</h3>
          <p>{service?.name} com {pro?.name}</p>
        </div>
        <Status status={apt.status} />
      </div>
      <div className="appointment-meta">
        <span>{apt.phone}</span>
        <b>{money(apt.value)}</b>
      </div>
      {apt.note && <p className="note">{apt.note}</p>}
      <div className="actions">
        <button onClick={() => updateStatus(apt.id, 'aceito')}><Check size={15} /> Aceitar</button>
        <button onClick={() => updateStatus(apt.id, 'concluido')}><CheckCircle2 size={15} /> Concluir</button>
        <button className="danger" onClick={() => updateStatus(apt.id, 'recusado')}><X size={15} /> Recusar</button>
      </div>
    </article>
  );
}

function Status({ status }) {
  return <span className={`status ${status}`}>{status}</span>;
}

function Stat({ value, label }) {
  return (
    <div className="stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function EditorList({ items, title, icon, onAdd, render }) {
  return (
    <>
      <div className="section-title">
        <h2>{title}</h2>
        <button className="icon-action" onClick={onAdd}>{icon}</button>
      </div>
      <div className="stack">
        {items.map((item) => <article className="editor-row" key={item.id}>{render(item)}</article>)}
      </div>
    </>
  );
}

function averageTicket(appointments) {
  const valid = appointments.filter((apt) => apt.status !== 'recusado');
  if (!valid.length) return 0;
  return valid.reduce((sum, apt) => sum + apt.value, 0) / valid.length;
}

createRoot(document.getElementById('root')).render(<App />);
