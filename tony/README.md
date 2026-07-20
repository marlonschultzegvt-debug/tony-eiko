# Tony & Eiko Hair Studio App

App de agendamento criado a partir do prototipo HTML enviado pelo Marlon.

## O que esta pronto

- Jornada do cliente: escolha de servicos, profissional, data, horario e confirmacao.
- Painel interno: agenda, indicadores, servicos e equipe.
- Status de atendimento: pendente, aceito, concluido e recusado.
- Bloqueio visual de horarios ja ocupados por profissional.
- Estado salvo no navegador via `localStorage`.
- Assets extraidos do HTML original: logo e imagem principal.
- Estrutura PWA: `manifest`, icone, service worker e base instalavel.
- Aba de implantacao com roadmap para banco, login, WhatsApp e PWA.
- Aba de configuracao operacional com nome do salao, WhatsApp, endereco, Instagram e exportacao de backup JSON.
- Login simulado por perfil: cliente, profissional e gestao.
- Esqueleto Supabase em `supabase_schema.sql` com tabelas, indices, RLS e politicas iniciais.

## Como rodar

```bash
npm install
npm run dev -- --port 5190
```

Acesse:

```text
http://localhost:5190/
```

## Como gerar versao final

```bash
npm run build
```

Os arquivos finais ficam em `dist/`.

## Como validar como app instalavel

1. Rode o servidor com `npm run dev -- --port 5190`.
2. Acesse pelo celular em uma rede que alcance o servidor.
3. No Chrome/Android, use "Adicionar a tela inicial" quando o navegador oferecer.
4. Em iPhone, use Compartilhar -> Adicionar a Tela de Inicio.

Observacao: a instalacao PWA pode depender de HTTPS em ambiente publico. Em validacao local/rede interna, alguns navegadores limitam o aviso automatico de instalacao.

## Estrutura para Supabase

O arquivo `supabase_schema.sql` prepara a base para:

- perfis com papeis `client`, `staff` e `admin`;
- servicos e profissionais;
- vinculo entre profissionais e servicos;
- agendamentos com status;
- configuracao operacional do salao;
- politicas RLS iniciais.

Antes de executar em producao, revisar regras de acesso, nomes dos campos e fluxo real de cadastro/login.

## Proximos passos recomendados

- Conectar banco real, preferencialmente Supabase.
- Trocar login simulado por autenticao real.
- Integrar WhatsApp para confirmacao e lembretes.
- Criar regras reais de duracao por servico e bloqueio de agenda.
- Importar/exportar dados via painel administrativo com permissao segura.
- Publicar primeiro em staging para validacao da Tony & Eiko.
