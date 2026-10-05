# Continuação do projeto Salinas House Hotel

Você (Claude Code) está retomando um projeto já em andamento. Este arquivo é o
prompt de continuação. **Cole também o arquivo `PROMPT-salinas-house-hotel-v2.md`
original nesta mesma mensagem** (ou peça pro usuário colar o conteúdo) — ele tem
a spec completa: conteúdo real dos textos, JSON de dados, paleta, tipografia,
CTAs por seção e os critérios de aceite de performance/acessibilidade. Este
arquivo aqui só descreve **o que já foi feito** e **o que falta**, não repete
a spec inteira.

## Estado atual (outubro/2026): site institucional pronto, reservas a caminho de um PMS

Blocos A a D concluídos: páginas satélite, `README.md`, `IMAGENS.md` e fotos
reais já estão no projeto.

**Decisão sobre reservas:** o hotel vai contratar um PMS com channel manager
(Hospedin ou Cloudbeds), possivelmente com IA de atendimento no WhatsApp
(Asksuite). Por isso:
- o sistema de reservas próprio (Neon, `/admin`, `/minha-conta`, `/api/*`) foi
  **guardado no branch `sistema-reservas-proprio`** e não está no `main`;
- o `main` continua 100% estático e `/reservar` envia o pedido pelo WhatsApp;
- quando o PMS for contratado, basta preencher `hotel.json → motorReservas`
  com a URL do motor de reservas (ver `src/lib/reserva.ts` e o README).

O projeto já roda (`npm install && npm run dev`), builda sem erros
(`npm run build`) e passa `npx astro check` com 0 erros. Antes de continuar,
rode essas três coisas pra confirmar que nada quebrou na cópia/transferência.

### O que já existe

- **Stack**: Astro 7 (static output), React em 3 ilhas, o máximo permitido (`Will.tsx`, o assistente virtual; `MobileMenu.tsx`;
  `AbasQuartos.tsx` que renderiza `Galeria.tsx`), Tailwind v4, `@astrojs/sitemap`.
- **Tailwind v4 é CSS-first**: os tokens de cor/tipografia NÃO estão em
  `tailwind.config.mjs` — estão no bloco `@theme` dentro de
  `src/styles/global.css`. Isso é uma mudança deliberada em relação ao que a
  spec original sugeria (ela foi escrita pensando em Tailwind v3), porque a
  versão instalada pelo `astro add tailwind` já vem em v4.
- **Fontes self-hosted**: só o subset **latin** de Fraunces e Inter foi copiado
  pra `public/fonts/` (cobre toda acentuação do português, U+0000–00FF). Não
  uso o pacote `@fontsource-variable/*` direto — foi removido depois de copiar
  os `.woff2` porque ele carregava subsets desnecessários (vietnamese,
  cyrillic, etc.) e tinha paths hasheados imprevisíveis pro preload do LCP.
- **Imagens em `src/assets/images/`, NÃO em `public/images/`** — desvio
  deliberado da estrutura de pastas sugerida na spec original. Motivo: só
  imagens importadas de `src/` passam pelo pipeline do Astro que gera
  AVIF/WebP responsivos (`<Image>`/`<Picture>` do `astro:assets`); tudo em
  `public/` é servido cru, sem otimização. Como o site é estático (build +
  deploy), trocar foto dá o mesmo trabalho em qualquer uma das duas pastas —
  então priorizei a que cumpre as metas de performance da seção 9.
- **Fotos reais** do hotel já substituíram os placeholders (lista em `IMAGENS.md`).
- **Tokens de cor extras** que não estavam na spec original, criados durante a
  auditoria de acessibilidade porque o `cobre` puro (`#A97142`) não passa
  contraste AA em texto pequeno:
  - `cobreTexto` (`#8a5c34`) — usar em texto pequeno sobre fundo claro (`areia`/`linho`).
  - `cobreClaro` (`#c99159`) — usar em texto pequeno sobre fundo escuro (`verdeEsc`).
  - `cobre` puro (`#A97142`) só deve ser usado decorativamente (underline, borda,
    ícone), nunca como cor de texto pequeno.
- **Utilitário `.bleed-inset-left`** em `global.css` — técnica pra fotos
  sangrarem até a borda da viewport (100vw) mantendo o texto alinhado ao
  container de 1440px. Usado em `OHotel.astro`. Reaproveitar se precisar de
  mais blocos full-bleed.
- **`Astro.site`** está como `https://salinas-house-hotel-one.vercel.app`
  em `astro.config.mjs`. **Trocar pelo domínio próprio quando houver um**,
  porque `sitemap.xml`, `canonical`, JSON-LD e OG tags dependem disso.
- **JSON-LD** (`src/components/seo/JsonLd.astro`) já implementado: schema.org
  `Hotel` completo + `HotelRoom` pra cada um dos 5 quartos (com `occupancy`
  extraído via regex das specs tipo "Até 2 hóspedes" — a Suíte Presidencial
  não tem esse campo porque a spec não dá esse número, e a regra é não
  inventar dado).
- **`robots.txt`** criado em `public/`, apontando pro sitemap.
- Testei tudo com Playwright (instalado temporariamente via
  `npm i -D playwright`, depois **desinstalado** — não deve estar no
  `package.json` final) tirando screenshots reais e clicando nas interações
  (abas de quartos, menu mobile, mapa lazy, formulário de contato). Isso já
  pegou e corrigiu 4 bugs reais:
  1. Botão "Reservar" do header vazando no mobile (conflito de classes no
     componente `Botao.astro`).
  2. Título da seção Acomodações cortado atrás do header fixo em navegação
     por âncora (faltava `scroll-margin-top` — agora é regra global `[id]`
     em `global.css`).
  3. `aria-controls` do botão de aba apontando pra um id que não existe
     (`AbasQuartos.tsx` — o painel usa `id={slug}` puro, sem prefixo).
  4. Contraste insuficiente em texto `osso/50` sobre `verdeEsc` (Footer e
     Contato) — subido pra `osso/60`.

### Último Lighthouse (outubro/2026, mobile, contra `npm run preview`)

| Página | Performance | Acessibilidade | Best Practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Home | 95 | 100 | 100 | 100 | 2.8s | 0.013 |
| /reservar | 98 | 100 | 100 | 100 | 2.3s | 0.012 |

## O que falta

1. **Contratar o PMS** e preencher `hotel.json → motorReservas`.
2. Depois da contratação:
   - atualizar a política de privacidade e os termos, citando o PMS como
     operador dos dados (LGPD); hoje eles dizem que o site não guarda dados;
   - decidir se o "Ver no Booking" do Hero (`Hero.astro`) vira reserva direta;
   - se o Asksuite entrar, trocar os números em `hotel.json → whatsapp` e
     decidir se o widget dele substitui o `WhatsAppFloat.astro`;
   - remover a integração Neon do projeto na Vercel (não é mais usada no `main`).
3. Definir o domínio próprio e atualizar `site` em `astro.config.mjs`.

## Regras que não podem ser esquecidas ao continuar

- Nenhum texto de conteúdo hardcoded em componente — tudo vem de
  `src/content/*.json`.
- Não inventar preço, nº de estrelas (exceto o `starRating: 3` do JSON-LD,
  que é uma instrução explícita da spec original, não invenção), nome de
  chef, prêmio ou depoimento.
- Três ilhas React no máximo, todas `client:visible` (nunca `client:load`).
- `prefers-reduced-motion` sempre respeitado (já tratado em `Reveal.astro`).
- Tom: hospitalidade mineira — acolhedor e direto, sem firula poética.
