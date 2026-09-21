# Lista de imagens — Salinas House Hotel

Situação atual: boa parte das fotos já tem uma versão real no site (algumas
vieram do hotel, outras foram reaproveitadas do site anterior). O que falta
está marcado com 📸 abaixo — essa é a lista pra fotografar.

**Como substituir/adicionar:** salve a foto final com exatamente o nome de
arquivo indicado, na pasta indicada, sobrescrevendo o que já existe. Use
sempre a maior resolução disponível — o "tamanho mínimo" é o mínimo
aceitável, não o ideal. O Astro gera automaticamente as versões otimizadas
(AVIF/WebP, vários tamanhos) a partir do arquivo original no próximo build.

---

## Hero (topo da home)

O banner do topo da home hoje é um rodízio (slideshow) de 3 fotos que já
existem no site — Suíte Presidencial, bar e recepção — não precisa de
nenhuma foto nova pra isso.

Pasta: `src/assets/images/hero/`

| Status | Arquivo | Proporção | Tamanho mínimo | O que deve aparecer |
|---|---|---|---|---|
| 📸 (opcional/bônus) | `hero-aerial-hd.jpg` | Larga (16:9+) | 2400×1350px | Foto aérea (drone) do hotel inteiro. Existe uma versão feita com upscale de IA a partir da foto original de 600×500px, usada hoje só nos dados de SEO (não aparece mais no banner). Se alguém tiver o arquivo original do drone em resolução maior, vale trocar — mas não é mais uma pendência urgente. |

## O Hotel

Pasta: `src/assets/images/hotel/`

| Status | Arquivo | Proporção | O que deve aparecer |
|---|---|---|---|
| ✅ | `recepcao.jpg` | — | Recepção do hotel. Já resolvida com foto real de boa resolução. |
| ✅ | `recepcao-lounge.jpg` | — | Lounge/sala de estar da recepção, ângulo mais amplo (adicionada, ainda não usada em nenhuma seção específica — disponível pra uso futuro). |

## Acomodações — galerias dos 5 quartos

Pasta: `src/assets/images/quartos/`

Proporção de todas: paisagem 4:3, mínimo 1600×1200px. A foto `-01` de cada
quarto é a que aparece primeiro na galeria.

### Suíte Presidencial

| Status | Arquivo | O que deve aparecer |
|---|---|---|
| ✅ | `suite-presidencial-01.jpg` | Ambiente geral (já resolvida) |
| 📸 | `suite-presidencial-02.jpg` | Cama king-size, close |
| ✅ | `suite-presidencial-03.jpg` | Sala de estar (já resolvida) |
| 📸 | `suite-presidencial-04.jpg` | Sala de jantar |
| 📸 | `suite-presidencial-05.jpg` | Banheiro com jacuzzi |
| 📸 | `suite-presidencial-06.jpg` | Sauna exclusiva |
| ✅ | `suite-presidencial-07.jpg` | Piscina privativa da varanda (já resolvida) |

### Quarto Individual Deluxe

| Status | Arquivo | O que deve aparecer |
|---|---|---|
| ✅ | `individual-deluxe-01.jpg` a `04.jpg` | Já resolvidas |
| ✅ | `individual-deluxe-05.jpg` | Cama com iluminação ambiente (adicionada) |

### Quarto Duplo Deluxe

| Status | Arquivo | O que deve aparecer |
|---|---|---|
| ✅ | `duplo-deluxe-01.jpg` a `03.jpg` | Já resolvidas |
| ✅ | `duplo-deluxe-04.jpg` | Cama de casal com teto decorado (adicionada) |

### Quarto Triplo Deluxe

| Status | Arquivo | O que deve aparecer |
|---|---|---|
| ✅ | `triplo-deluxe-01.jpg` a `02.jpg` | Já resolvidas |
| 📸 | `triplo-deluxe-03.jpg` | Banheiro privativo |
| ✅ | `triplo-deluxe-04.jpg` | As duas camas, outro quarto/decoração (adicionada) |

### Quarto Quádruplo Deluxe

| Status | Arquivo | O que deve aparecer |
|---|---|---|
| ✅ | `quadruplo-deluxe-01.jpg` a `03.jpg` | Já resolvidas |
| ✅ | `quadruplo-deluxe-04.jpg` | As três camas, ângulo do corredor (adicionada) |

## Restaurante & Bar

Pasta: `src/assets/images/restaurante/`

| Status | Arquivo | O que deve aparecer |
|---|---|---|
| ✅ | `restaurante-bar.jpg` | Foto ampla de destaque da seção (já resolvida) |
| ✅ | `restaurante-sala.jpg` | Salão do restaurante (já resolvida) |
| ✅ | `bar-cachacas.jpg` | Prateleira de cachaças (já resolvida) |

Nenhuma pendência aqui — só trocar se aparecer uma foto melhor no futuro.

## Estrutura

Esta seção não usa fotos.

## Salinas (a região)

Pasta: `src/assets/images/salinas/`

| Status | Arquivo | O que deve aparecer |
|---|---|---|
| ✅ | `museu-da-cachaca.jpg` | Museu da Cachaça (já resolvida) |
| ✅ | `alambiques-artesanais.jpg` | Alambique artesanal (já resolvida) |
| ✅ | `festival-mundial-da-cachaca.jpg` | Festival Mundial da Cachaça (já resolvida) |
| ✅ | `centro-de-salinas.jpg` | Centro da cidade (já resolvida) |

Nenhuma pendência aqui. O item "Aeroporto de Salinas" foi removido do site — não opera regularmente.

## Eventos

Pasta: `src/assets/images/eventos/`

| Status | Arquivo | O que deve aparecer |
|---|---|---|
| ✅ | `eventos.jpg` | Área externa/jardim do hotel (já resolvida) |

## Vídeos dos quartos (pausado)

Pasta: `public/videos/`

Os vídeos já foram processados (convertidos, comprimidos) e estão guardados
prontos pra usar, mas **a integração no site foi removida por enquanto** —
trabalhando só com fotos por decisão do momento.

| Arquivo | O que mostra |
|---|---|
| `suite-tour.mp4` + `suite-tour-poster.jpg` | Tour em vídeo pela Suíte Presidencial (com a mesa do café da manhã). |
| `duplo-tour.mp4` + `duplo-tour-poster.jpg` | Tour em vídeo pelo Quarto Duplo Deluxe. |

Um terceiro vídeo enviado (com uma pessoa aparecendo) **não foi usado** —
combinado que só entra no site com autorização confirmada da pessoa.

## Fora de `src/assets/` — imagens de sistema

Pasta: `public/`

| Status | Arquivo | Proporção | O que deve aparecer |
|---|---|---|---|
| ✅ | `og.jpg` | 1200×630px (fixo) | Imagem exibida quando o link do site é compartilhado no WhatsApp/Instagram. Agora usa a logo real do hotel sobre o fundo verde escuro. |
| ✅ | `favicon.svg` + `favicon.ico` + `apple-touch-icon.png` | Quadrado | Ícone da aba do navegador (e da tela inicial no iPhone). Agora usa o "S" recortado da logo real, em alta resolução. |

---

## Resumo do que falta fotografar

1. **Suíte Presidencial**: cama king-size, sala de jantar, banheiro com jacuzzi, sauna (4 fotos)
2. **Banheiro privativo do Quarto Triplo Deluxe** (1 foto)
3. Se possível, o **arquivo original em alta resolução da foto aérea do drone** — bônus, não bloqueia nada (o banner da home não depende mais dela)

**Total pendente: 5 fotos essenciais** (a maioria são da Suíte Presidencial). A foto aérea em alta resolução é só um bônus, opcional.
