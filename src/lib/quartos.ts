/**
 * Lê a ocupação a partir das specs do quarto (ex.: "Até 2 hóspedes", "Até 1–2 hóspedes").
 * Retorna undefined quando a spec não informa — a regra é não inventar esse número.
 */
export function ocupacaoQuarto(specs: string[]): { min: number; max: number } | undefined {
  for (const spec of specs) {
    const match = spec.match(/Até\s+(\d+)(?:[–-](\d+))?\s+h[oó]spedes/i);
    if (match) {
      const min = Number(match[1]);
      const max = match[2] ? Number(match[2]) : min;
      return { min, max };
    }
  }
  return undefined;
}
