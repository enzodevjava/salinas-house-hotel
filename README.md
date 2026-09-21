# Salinas House Hotel

Site institucional do Salinas House Hotel — Salinas, Minas Gerais. Construído
com [Astro](https://astro.build) (build 100% estático), React só nos
componentes interativos (menu mobile e abas de acomodações) e Tailwind CSS v4.

Multi-página: a home é um resumo curto com cards linkando pras páginas de
cada área (`/acomodacoes`, `/restaurante`, `/salinas`, `/eventos`), além de
`/reservar` e as páginas legais. O Header e o Footer leem a navegação de
`hotel.json → navegacao` — itens com `href` começando em `/#` são âncoras
dentro da home (ex: "O Hotel", "Estrutura", "Contato"), os demais são
páginas de verdade.

## Como rodar

Pré-requisito: Node.js 22.12 ou superior.

```bash
npm install
npm run dev
```

Abre em `http://localhost:4321`.

Outros comandos úteis:

```bash
npm run build     # gera a versão de produção em dist/
npm run preview   # serve a versão de produção localmente, pra testar antes do deploy
npx astro check   # checagem de tipos
```

## Como editar os textos

**Nenhum texto do site está escrito dentro dos componentes.** Tudo vem de
quatro arquivos JSON em `src/content/`:

| Arquivo | O que controla |
|---|---|
| `hotel.json` | Nome, endereço, telefones, e-mail, redes sociais, textos de "O Hotel", "Restaurante & Bar" e "Eventos", números em destaque, link do mapa. |
| `quartos.json` | Os 5 tipos de quarto: nome, descrição, lista de specs e legendas das fotos de cada galeria. |
| `estrutura.json` | As comodidades do hotel (grid numerado da seção Estrutura + os 5 itens em destaque na barra de sinais rápidos logo abaixo do hero). |
| `salinas.json` | O parágrafo de introdução e as 5 atrações da região. |

Editar qualquer um desses arquivos e salvar já atualiza o conteúdo — não
precisa mexer em nenhum arquivo `.astro` ou `.tsx` pra trocar uma frase, uma
spec de quarto ou um número de telefone.

Os números de WhatsApp (`hotel.json → whatsapp`) e as mensagens
pré-preenchidas de cada botão (`src/lib/whatsapp.ts`) também ficam
centralizados — trocar o número em um lugar já atualiza todos os botões do
site.

## Como trocar as fotos

Todas as fotos do site são **placeholders** (retângulos coloridos com o nome
do arquivo escrito em cima) até as fotos reais chegarem. A lista completa,
com nome de arquivo exato, proporção esperada e uma linha do que deve
aparecer em cada uma, está em **[`IMAGENS.md`](./IMAGENS.md)**.

Resumo rápido:

- Fotos do hotel, quartos, restaurante, eventos e região ficam em
  `src/assets/images/`, organizadas em subpastas (`hero/`, `hotel/`,
  `quartos/`, `restaurante/`, `salinas/`, `eventos/`).
- Pra trocar uma foto, **substitua o arquivo mantendo exatamente o mesmo
  nome**. O Astro já cuida de gerar os formatos AVIF/WebP otimizados e os
  tamanhos responsivos automaticamente no próximo build — não precisa
  redimensionar ou exportar nada manualmente, só usar uma foto de boa
  resolução (o `IMAGENS.md` diz a proporção e o tamanho mínimo de cada uma).
- A imagem de compartilhamento em redes sociais (`public/og.jpg`, 1200×630px)
  fica fora de `src/`, junto com o favicon.

> **Por que as fotos ficam em `src/assets/` e não em `public/`?** Só imagens
> importadas de dentro de `src/` passam pelo pipeline de otimização do Astro
> (que gera AVIF/WebP e várias larguras responsivas — essencial pras metas
> de performance do site). Como o site é estático, trocar uma foto exige
> redeploy de qualquer forma, então não há vantagem prática em usar
> `public/` aqui.

## Como fazer deploy (Vercel)

1. Suba o projeto pra um repositório Git (GitHub, GitLab ou Bitbucket).
2. Importe o repositório na [Vercel](https://vercel.com/new) — ela detecta o
   Astro automaticamente, sem configuração extra.
3. **Antes do primeiro deploy em produção**, atualize o campo `site` em
   `astro.config.mjs` para o domínio final do site:

   ```js
   export default defineConfig({
     site: 'https://www.salinashousehotel.com.br', // troque pelo domínio real
     // ...
   });
   ```

   Esse valor é usado para gerar o `sitemap.xml`, a URL canônica de cada
   página, as tags Open Graph e o JSON-LD — se ficar desatualizado, essas
   URLs vão apontar pro domínio errado.
4. Configure o domínio customizado nas configurações do projeto na Vercel.

## Estrutura do projeto

```
src/
  components/
    layout/      Header, menu mobile, footer, botão flutuante de WhatsApp
    sections/    Um bloco de conteúdo por arquivo (Hero, Acomodações, etc.) —
                 cada um é usado por uma página específica em src/pages/
    seo/         Dados estruturados (JSON-LD)
    ui/          Componentes reutilizáveis (botão, rótulo de seção, galeria,
                 card-resumo...)
  content/       Os 4 JSONs de conteúdo — ver seção acima
  layouts/       Layout base (head, fontes, meta tags)
  lib/           Helper de link do WhatsApp
  pages/         Uma rota por arquivo: home, acomodacoes, restaurante,
                 salinas, eventos, reservar, política de privacidade, termos, 404
  styles/        Tokens de design e estilos globais (Tailwind v4, config em CSS)
public/
  fonts/         Fraunces e Inter self-hosted (só o subset latin)
  og.jpg         Imagem de compartilhamento em redes sociais
  favicon.svg
```
