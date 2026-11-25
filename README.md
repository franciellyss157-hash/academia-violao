# Sussurro

Aplicativo mobile de relacionamentos em português do Brasil, com visual luxuoso
(preto/vinho, rosa-neon e dourado), abertura animada de 5 segundos, match, chat
privado por créditos, figurinhas animadas, pagamento Pix com aprovação manual do
ADM e painel administrativo completo.

> Conteúdo restrito a maiores de 18 anos, com termos, LGPD e moderação.

## Stack

| Camada | Tecnologia |
| --- | --- |
| App | React Native + Expo (Expo Router), roda em Android/iOS e na web |
| API | Node.js + Express |
| Banco | PostgreSQL |
| Auth | JWT + bcrypt (senha do ADM lida de variável de ambiente) |
| Arquivos | Upload local com pasta privada para comprovantes e selfies |

O backend foi escrito em Node/Express para rodar completo dentro do ambiente de
desenvolvimento sem depender de um projeto externo. A camada de dados está
isolada em `server/routes/*` + `lib/api.ts`; para migrar para **Supabase** basta
trocar as chamadas de `lib/api.ts` pelos métodos do `supabase-js` e mover as
tabelas de `server/db.js` para o Postgres do Supabase (o schema já é SQL puro).
Firebase exigiria reescrever as regras de créditos/pagamentos em Cloud Functions.

## Estrutura de pastas

```
app/                     telas (Expo Router)
  index.tsx              abertura animada de 5s (partículas, glow, ondas, slogan)
  auth.tsx               escolha Usuário / ADM
  login.tsx register.tsx admin-login.tsx
  (tabs)/                Descobrir · Matches · Conversas · Agenda · Perfil
  chat/[id].tsx          conversa privada (1 crédito por mensagem)
  user/[id].tsx          perfil público, curtir, convidar, bloquear, denunciar
  credits.tsx            pacotes Básico / Plus / VIP
  order/[id].tsx         Pix: chave, valor, código, envio do comprovante, status
  transactions.tsx       histórico de transações
  stickers.tsx           pacotes de figurinhas animadas
  sticker-studio.tsx     criador de figurinha (foto recortada + texto + emoji)
  inspiration.tsx        cartões de frases e dicas de abertura
  verification.tsx       verificação de identidade por selfie
  edit-profile.tsx privacy.tsx notifications.tsx
  admin/                 Pagamentos · Usuários · Denúncias · Pacotes · Ganhos
components/              design system (Screen, NeonButton, Glass, Avatar, …)
  Particles.tsx          partículas, corações flutuantes e orbes de brilho
  MatchOverlay.tsx       animação de match com explosão de corações
  StickerView.tsx        figurinha animada
lib/                     api, sessão, tema, fontes, formatação
server/                  API Express
  db.js                  schema + seed (pacotes, figurinhas, frases, perfis demo)
  auth.js                JWT, hash do ADM e bloqueio por tentativas
  lib/fraud.js           regras antifraude (hash, duplicidade, valor, limite)
  lib/upload.js          upload público/privado
  routes/                auth, profile, social, chat, stickers, payments, admin, misc
  tests/                 testes das regras antifraude
```

## Banco de dados

`server/db.js` cria o schema na primeira execução (idempotente) e popula:

- `users`, `photos`, `likes`, `matches`, `messages`, `invites`
- `stickers`, `sticker_unlocks`
- `notifications`, `appointments`, `reports`, `blocks`
- `packages`, `orders`, `receipt_submissions`, `admin_alerts`, `admin_attempts`, `inspiration`

Seed: 3 pacotes (R$ 0,99 / R$ 1,99 / R$ 9,99), 3 pacotes de figurinhas, 16 cartões
de frases/aberturas e 6 perfis de demonstração (e-mails `@demo.sussurro`) para o
Descobrir não começar vazio.

## Como rodar

1. `npm install`
2. Suba um Postgres e informe `DATABASE_URL`.
3. `npm run api` (porta 4000) — cria as tabelas e o seed automaticamente.
4. `npm run web` (porta 3000) ou `npm start` para Android/iOS.

### Variáveis de ambiente

Veja `.env.example`. As principais:

- `DATABASE_URL` — conexão Postgres.
- `JWT_SECRET` — assinatura das sessões.
- `ADMIN_EMAIL` — padrão `francielly.ss157@gmail.com`.
- `ADMIN_PASSWORD` — **nunca fica no código**. O servidor gera o hash no boot
  (`bcrypt`) e bloqueia o acesso por 15 minutos após 5 tentativas erradas.
  Também é possível informar `ADMIN_PASSWORD_HASH`.
- `PIX_KEY` / `PIX_HOLDER` — chave Pix exibida no app (padrão: e-mail do ADM).
- `EXPO_PUBLIC_API_URL` — URL pública da API para o app web.
- `CORS_ORIGINS` — origens extras liberadas (lista separada por vírgula).

## Pagamento Pix com aprovação manual

1. Usuário escolhe o pacote → `POST /api/orders` gera um **código único** (`SS-XXXXXX`).
2. A tela mostra chave Pix, valor exato e botão “Copiar chave”.
3. Usuário envia a foto do comprovante + valor pago + nome do pagador
   (`POST /api/orders/:id/receipt`). O pedido vai para **Em análise**.
4. O ADM aprova (`+créditos` e benefícios do pacote) ou recusa com motivo obrigatório;
   o usuário recebe notificação com o motivo e pode reenviar.

Status: `awaiting_receipt` → `under_review` → `approved` | `rejected`.

### Proteção contra fraude

- Hash SHA-256 de cada comprovante em `receipt_submissions`; o mesmo arquivo não
  pode ser usado em outro pedido (`comprovante já usado`).
- Valor informado diferente do pacote gera alerta (`valor divergente`).
- Limite de 3 comprovantes por usuário por dia (`RECEIPT_DAILY_LIMIT`).
- 3 recusas seguidas marcam o usuário para análise; o ADM pode suspender/banir.
- Créditos só são liberados na aprovação — nunca automaticamente.
- Comprovantes e selfies ficam em `server/uploads/private` e só o ADM e o próprio
  usuário conseguem abrir (checagem por token em `/api/files/private/:name`).

## Painel ADM

Aba **Pagamentos** (fila com filtros por status, data e usuário, comprovante com
zoom, aprovar/recusar com motivo, alertas antifraude), **Usuários** (suspender,
banir, reativar, verificar perfil, conceder créditos), **Denúncias** (resolver ou
arquivar com nota), **Pacotes** (preço, créditos, benefício, ativo) e **Ganhos**
(somente pagamentos aprovados, por dia/semana/mês).

## Regras de produto implementadas

- Cadastro 18+ (data de nascimento + aceite dos termos) e login por e-mail/senha.
- Perfil com fotos, bio, interesses e intenção (amizade, namoro, relacionamento
  sério, algo casual), verificação por selfie com selo dourado.
- Descobrir, curtir (limite diário: 10 livre / 50 VIP), match recíproco, convites.
- Chat privado: **1 crédito por mensagem**; sem créditos o app oferece os pacotes.
- Pacotes: Básico (20 créditos + destaque 24h), Plus (50 créditos + figurinhas
  exclusivas + ver quem curtiu você) e VIP (120 créditos + selo, destaque,
  figurinhas premium e mais curtidas por dia).
- Figurinhas animadas por pacote e criador de figurinha própria.
- Agenda de encontros com visão diária, semanal e mensal.
- Notificações internas para match, mensagem, convite, encontro, verificação e
  pagamento. Push nativo (EAS) pode ser ligado depois em `expo-notifications`;
  a notificação em tempo real do app web usa a central de notificações.
- Privacidade: visibilidade do perfil, bloquear, denunciar, LGPD e regras de uso.

## Testes

```
npm test          # regras antifraude (hash, duplicidade, valor, limite, código)
```

## Observações de ambiente de preview

- `BASE44_PREVIEW_MODE=1` é repassado pelo Compose e usado apenas para
  comportamentos de preview; sem ele o app se comporta como em produção.
- Na web, as fontes são baixadas e registradas via `FontFace` a partir dos bytes
  (`lib/fonts.ts`), porque alguns proxies bloqueiam o download feito pelo CSS
  `@font-face`. No nativo o carregamento usa `expo-font`.
- O app web consome a API por `EXPO_PUBLIC_API_URL` (origem separada, autenticação
  por Bearer token, sem cookies).
