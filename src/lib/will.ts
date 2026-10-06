import faq from "../content/faq.json";
import estrutura from "../content/estrutura.json";
import will from "../content/will.json";

// Entendimento do texto digitado pro Will (sem IA): normaliza, separa em palavras
// inteiras e procura intenções (will.json → intencoes) e respostas na base de
// conhecimento (faq.json + estrutura.json). Comparar palavras inteiras evita
// falsos positivos como "bom dia" casar com "diária".

export type Intencao = keyof typeof will.intencoes;

/** Minúsculas, sem acento e com grafias comuns unificadas (wi-fi → wifi, check-in → checkin). */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/wi-?fi/g, "wifi")
    .replace(/check-?in/g, "checkin")
    .replace(/check-?out/g, "checkout")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const palavras = (normalizado: string) => normalizado.split(" ").filter(Boolean);

/**
 * Item de will.json → intencoes: "palavra" (exata), "radical*" (começo da palavra)
 * ou "duas palavras" (expressão).
 */
function casa(item: string, normalizado: string, tokens: string[]): boolean {
  if (item.includes(" ")) return ` ${normalizado} `.includes(` ${item} `);
  if (item.endsWith("*")) return tokens.some((t) => t.startsWith(item.slice(0, -1)));
  return tokens.includes(item);
}

export function temIntencao(intencao: Intencao, texto: string): boolean {
  const normalizado = normalizar(texto);
  const tokens = palavras(normalizado);
  return will.intencoes[intencao].some((item) => casa(item, normalizado, tokens));
}

/** "quarto para 6 pessoas" → 6. */
export function numeroDePessoas(texto: string): number | undefined {
  const m = normalizar(texto).match(/\b(\d{1,2}) (pessoas?|hospedes?|adultos?|gente)\b/);
  return m ? Number(m[1]) : undefined;
}

const IGNORADAS = new Set(will.palavrasIgnoradas.split(" "));
const SINONIMOS: Record<string, string> = will.sinonimos;

/** Palavras com peso: as que importam, já trocadas pelo sinônimo. */
function palavrasChave(texto: string): string[] {
  return palavras(normalizar(texto))
    .filter((p) => p.length > 2 && !IGNORADAS.has(p))
    .map((p) => SINONIMOS[p] ?? p);
}

/** Mesma palavra, ou mesmo radical de 5 letras (quarto/quartos, piscina/piscinas). */
const mesmaPalavra = (a: string, b: string) =>
  a === b || (a.length >= 5 && b.length >= 5 && a.slice(0, 5) === b.slice(0, 5));

interface Conhecimento {
  titulo: string[];
  corpo: string[];
  resposta: string;
}

// Pergunta do FAQ ou nome da comodidade valem mais que o texto da resposta.
const BASE: Conhecimento[] = [
  ...faq.map((f) => ({
    titulo: palavrasChave(f.pergunta),
    corpo: palavrasChave(f.resposta),
    resposta: f.resposta,
  })),
  ...estrutura.map((e) => ({
    titulo: palavrasChave(e.nome),
    corpo: palavrasChave(e.descricao),
    resposta: `Sim! ${e.nome}. ${e.descricao}`,
  })),
];

/** Melhor resposta da base pro texto, ou undefined se nada casar com segurança. */
export function buscarConhecimento(texto: string): string | undefined {
  const chave = palavrasChave(texto);
  if (chave.length === 0) return undefined;
  let melhor: { resposta: string; pontos: number } | undefined;
  for (const item of BASE) {
    let pontos = 0;
    for (const p of chave) {
      if (item.titulo.some((t) => mesmaPalavra(p, t))) pontos += 2;
      else if (item.corpo.some((t) => mesmaPalavra(p, t))) pontos += 1;
    }
    // Empate: fica o primeiro (FAQ vem antes da estrutura e responde de forma mais direta).
    if (pontos >= 2 && (!melhor || pontos > melhor.pontos)) melhor = { resposta: item.resposta, pontos };
  }
  return melhor?.resposta;
}
