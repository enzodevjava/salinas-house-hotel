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
arquivos JSON em `src/content/`:

| Arquivo | O que controla |
|---|---|
| `hotel.json` | Nome, endereço, telefones, e-mail, redes sociais, textos de "O Hotel", "Restaurante & Bar" e "Eventos", números em destaque, link do mapa. |
| `quartos.json` | Os 5 tipos de quarto: nome, descrição, lista de specs e legendas das fotos de cada galeria. |
| `estrutura.json` | As comodidades do hotel (grid numerado da seção Estrutura + os 5 itens em destaque na barra de sinais rápidos logo abaixo do hero). |
| `salinas.json` | O parágrafo de introdução e as 5 atrações da região. |
| `faq.json` | Perguntas frequentes (seção de dúvidas do site). O Will também responde a partir delas. |
| `will.json` | Falas do Will, o assistente virtual do canto da tela, e as palavras e sinônimos que ele reconhece. |

Editar qualquer um desses arquivos e salvar já atualiza o conteúdo — não
precisa mexer em nenhum arquivo `.astro` ou `.tsx` pra trocar uma frase, uma
spec de quarto ou um número de telefone.

Os números de WhatsApp (`hotel.json → whatsapp`) e as mensagens
pré-preenchidas de cada botão (`src/lib/whatsapp.ts`) também ficam
centralizados — trocar o número em um lugar já atualiza todos os botões do
site.

## Como trocar as fotos

A lista completa das fotos, com nome de arquivo exato, proporção esperada e
uma linha do que deve aparecer em cada uma, está em
**[`IMAGENS.md`](./IMAGENS.md)**.

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

## Will, o assistente virtual

O botão "Will" no canto da tela (`src/components/layout/Will.tsx`) tira
dúvidas e monta o pedido de reserva, que sai pronto pro WhatsApp da recepção.
No celular a conversa abre em tela cheia. Ele **não usa IA**:

- Responde com o conteúdo de `faq.json` (perguntas frequentes) e
  `estrutura.json` (comodidades), além de `hotel.json` e `quartos.json`.
- Entende assuntos pelas palavras de `will.json → intencoes` (reserva, preço,
  cancelamento, eventos, como chegar…). `"palavra"` casa só a palavra inteira,
  `"radical*"` casa o começo da palavra e `"duas palavras"` casa a expressão.
- Assuntos de `soEquipe` (pagamento, senha do Wi-Fi…) e tudo o que ele não
  sabe viram uma pergunta pronta pro WhatsApp. Ele não chuta.
- A conversa fica guardada só no navegador, enquanto a aba estiver aberta.

Pra ele responder algo novo, basta adicionar a pergunta em `faq.json` (e, se
precisar, um sinônimo em `will.json → sinonimos`). A lógica fica em
`src/lib/will.ts`.

Custo: zero. Ligar uma IA de verdade depois exige uma API paga (ou um plano
gratuito com limites) e um pequeno servidor pra guardar a chave.

## Como ligar o motor de reservas do PMS

Hoje a reserva é um pedido: o formulário de `/reservar` monta a mensagem e
abre o WhatsApp da recepção. Quando o hotel contratar um PMS (Hospedin,
Cloudbeds etc.), coloque a URL do motor de reservas dele em
`hotel.json → motorReservas`:

```json
"motorReservas": "https://url-do-motor-de-reservas-do-pms"
```

Com isso, o botão "Reservar" do header e do menu mobile e os botões dos
quartos passam a levar direto para o motor, e `/reservar` redireciona pra
ele. Para voltar ao formulário do WhatsApp, deixe o campo como `null`.

Quando o PMS entrar, atualize também a política de privacidade e os termos:
eles dizem hoje que o site não processa reservas nem guarda dados.

O sistema de reservas próprio que chegou a ser construído (banco Neon,
painel `/admin`, área `/minha-conta`) está guardado no branch
`sistema-reservas-proprio`, caso precise ser consultado.

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
    layout/      Header, menu mobile, footer, Will (assistente virtual)
    sections/    Um bloco de conteúdo por arquivo (Hero, Acomodações, etc.) —
                 cada um é usado por uma página específica em src/pages/
    seo/         Dados estruturados (JSON-LD)
    ui/          Componentes reutilizáveis (botão, rótulo de seção, galeria,
                 card-resumo...)
  content/       Os JSONs de conteúdo — ver seção acima
  layouts/       Layout base (head, fontes, meta tags)
  lib/           Helpers de link do WhatsApp e do botão "Reservar"
  pages/         Uma rota por arquivo: home, acomodacoes, restaurante,
                 salinas, eventos, reservar, política de privacidade, termos, 404
  styles/        Tokens de design e estilos globais (Tailwind v4, config em CSS)
public/
  fonts/         Fraunces e Inter self-hosted (só o subset latin)
  og.jpg         Imagem de compartilhamento em redes sociais
  favicon.svg
```
