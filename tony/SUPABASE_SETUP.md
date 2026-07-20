# Supabase - Tony & Eiko

## Base pronta

Arquivos criados:

- `supabase_schema.sql`: schema principal completo.
- `supabase/migrations/202607162235_tony_eiko_base.sql`: migration para versionar.
- `supabase/seed/tony_eiko_seed.sql`: dados iniciais de servicos, equipe e horarios.

## O que a base cobre

- Login via Supabase Auth.
- Perfis `client`, `staff` e `admin`.
- Servicos editaveis.
- Equipe editavel.
- Vinculo profissional x servico.
- Agenda com status `pending`, `accepted`, `completed`, `declined` e `cancelled`.
- Multiplos servicos por agendamento.
- Horarios de atendimento e bloqueios de agenda.
- RLS inicial para separar cliente, profissional e gestao.

## Como aplicar manualmente

1. Abrir o projeto no Supabase.
2. Ir em `SQL Editor`.
3. Executar o conteudo de `supabase_schema.sql`.
4. Executar o conteudo de `supabase/seed/tony_eiko_seed.sql`.
5. Criar usuarios em `Authentication > Users`.
6. Inserir os perfis correspondentes na tabela `profiles`.
7. Para usuarios profissionais, vincular `profiles.id` em `professionals.profile_id`.

## Exemplo de perfil admin

Depois de criar o usuario pelo Supabase Auth, copiar o `id` do usuario e executar:

```sql
insert into public.profiles (id, full_name, role, phone)
values ('ID_DO_USUARIO_AUTH', 'Gestao Tony & Eiko', 'admin', null)
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  phone = excluded.phone,
  active = true;
```

## Proximo passo tecnico

O frontend ja esta preparado para conectar ao Supabase usando:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Nao colocar `service_role` no frontend.

## Como ativar no app

1. Copiar `.env.example` para `.env.local`.
2. Preencher `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Rodar `npm run dev`.
4. Entrar com um usuario criado em `Authentication > Users`.

Sem essas variaveis, o app abre em modo teste local para demonstracao.
