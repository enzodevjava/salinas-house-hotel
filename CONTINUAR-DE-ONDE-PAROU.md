# Continuação do projeto Salinas House Hotel

Você (Claude Code) está retomando um projeto já em andamento. Este arquivo é o
prompt de continuação. **Cole também o arquivo `PROMPT-salinas-house-hotel-v2.md`
original nesta mesma mensagem** (ou peça pro usuário colar o conteúdo) — ele tem
a spec completa: conteúdo real dos textos, JSON de dados, paleta, tipografia,
CTAs por seção e os critérios de aceite de performance/acessibilidade. Este
arquivo aqui só descreve **o que já foi feito** e **o que falta**, não repete
a spec inteira.

## Estado atual: Blocos A, B e C 100% prontos. Bloco D em andamento.

O projeto já roda (`npm install && npm run dev`), builda sem erros
(`npm run build`) e passa `npx astro check` com 0 erros. Antes de continuar,
rode essas três coisas pra confirmar que nada quebrou na cópia/transferência.

### O que já existe

- **Stack**: Astro 7 (static output), React só em 2 ilhas (`MobileMenu.tsx`,
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
- **Todas as fotos são placeholders gerados** (retângulo colorido com nome do
  arquivo + dimensões escritas em cima), nomeados corretamente, esperando as
  fotos reais do cliente.
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
- **`Astro.site`** está setado como `https://salinas-house-hotel.vercel.app`
  em `astro.config.mjs` — é um placeholder (é a URL do protótipo antigo
  mencionado na spec). **Trocar pelo domínio real quando o cliente definir um**,
  porque `sitemap.xml`, `canonical`, JSON-LD e OG tags todos dependem disso.
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

### Último Lighthouse rodado (antes das correções de acessibilidade acima)

Contra o build de produção (`npm run build && npm run preview`), mobile:

| Métrica | Resultado |
|---|---|
| Performance | 99 |
| Accessibility | 93 (ainda não revalidado depois do fix) |
| Best Practices | 100 |
| SEO | 100 |
| LCP | 1.7s |
| CLS | 0.013 |
| TBT | 30ms |

**Os dois findings de acessibilidade (aria-controls inválido + contraste)
já foram corrigidos no código**, mas o Lighthouse não foi re-rodado depois
da correção porque a sessão foi interrompida. **Primeira coisa a fazer:**
rodar de novo e confirmar que bateu 100 em acessibilidade.

## O que falta (Bloco D, a partir daqui)

1. **Revalidar Lighthouse** (mobile, contra `npm run preview` do build de
   produção) depois das correções de acessibilidade. Se ainda faltar algo,
   inspecionar `categories.accessibility.auditRefs` no JSON de saída do
   `lighthouse` CLI pra achar o quê.
2. **Páginas satélite** (nenhuma existe ainda, só `src/pages/index.astro`):
   - `src/pages/politica-de-privacidade.astro` — escrever do zero pra
     hotelaria/LGPD (não usar texto de e-commerce). Cobrir: dados coletados
     (nome/telefone/mensagem do formulário de contato; dados de navegação),
     finalidade, base legal, compartilhamento, direitos do titular (art. 18
     LGPD), contato do controlador (usar `hotel.email`).
   - `src/pages/termos.astro`.
   - `src/pages/404.astro` — customizada, com link de volta pra home e CTA
     de WhatsApp (reaproveitar `linkWhatsApp`/`MENSAGENS.flutuante` de
     `src/lib/whatsapp.ts`).
   - Todas devem usar `Base.astro`, ter `Header`/`Footer`, e as duas
     primeiras precisam de link no `Footer.astro` (já existem os `<a>`
     apontando pra `/politica-de-privacidade` e `/termos` — só faltam as
     páginas).
3. **README.md** — está com o boilerplate genérico do `astro create`, precisa
   ser reescrito com: como rodar (`npm install && npm run dev`), como trocar
   as fotos (nome de arquivo + proporção esperada de cada uma — ver
   `src/content/quartos.json`, `salinas.json`, e os imports em
   `OHotel.astro`/`RestauranteBar.astro`/`Eventos.astro`), como editar os
   textos (apontar pros 4 JSONs em `src/content/`), como fazer deploy na
   Vercel (mencionar que precisa atualizar `site` em `astro.config.mjs` pro
   domínio real antes do deploy).
4. **IMAGENS.md** — lista de todas as ~32 fotos necessárias com nome de
   arquivo exato, proporção e uma linha do que deve aparecer. Ver
   `src/content/quartos.json` (specs de cada galeria) e os componentes de
   seção pra pegar a lista completa de imports de imagem.
5. Depois de tudo isso: build final, `astro check` final, e uma última
   passada visual (Playwright ou navegador mesmo) pra garantir que nada
   quebrou.

## Regras que não podem ser esquecidas ao continuar

- Nenhum texto de conteúdo hardcoded em componente — tudo vem de
  `src/content/*.json`.
- Não inventar preço, nº de estrelas (exceto o `starRating: 3` do JSON-LD,
  que é uma instrução explícita da spec original, não invenção), nome de
  chef, prêmio ou depoimento.
- Três ilhas React no máximo, todas `client:visible` (nunca `client:load`).
- `prefers-reduced-motion` sempre respeitado (já tratado em `Reveal.astro`).
- Tom: hospitalidade mineira — acolhedor e direto, sem firula poética.
