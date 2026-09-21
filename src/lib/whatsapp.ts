import hotel from "../content/hotel.json";

const NUMERO_PADRAO = hotel.whatsapp[0].numero;

/**
 * Monta um link wa.me com mensagem pré-preenchida.
 * Único ponto do projeto que constrói URLs de WhatsApp — nunca montar à mão nos componentes.
 */
export function linkWhatsApp(mensagem: string, numero: string = NUMERO_PADRAO): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export const MENSAGENS = {
  hero: "Olá! Gostaria de fazer uma reserva no Salinas House Hotel.",
  suitePresidencial: "Olá! Gostaria de informações sobre a Suíte Presidencial.",
  quarto: (nome: string) => `Olá! Gostaria de informações sobre o ${nome}.`,
  restaurante: "Olá! Gostaria de informações sobre o restaurante do hotel.",
  salinas: "Olá! Gostaria de informações sobre hospedagem e passeios em Salinas.",
  eventos: "Olá! Gostaria de informações sobre realizar um evento no hotel.",
  flutuante: "Olá! Vim pelo site e gostaria de mais informações.",
} as const;

interface DadosReserva {
  quarto: string;
  checkin: string;
  checkout: string;
  hospedes: string;
  nome: string;
  telefone: string;
  email?: string;
}

/** Converte uma data ISO (yyyy-mm-dd, formato nativo de <input type="date">) para dd/mm/aaaa. */
export function formatarDataBR(isoDate: string): string {
  const [ano, mes, dia] = isoDate.split("-");
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

/** Monta a mensagem estruturada de pedido de reserva, enviada via WhatsApp. */
export function mensagemReserva(dados: DadosReserva): string {
  const linhas = [
    "Olá! Gostaria de fazer uma reserva no Salinas House Hotel.",
    "",
    `Quarto: ${dados.quarto}`,
    `Check-in: ${formatarDataBR(dados.checkin)}`,
    `Check-out: ${formatarDataBR(dados.checkout)}`,
    `Hóspedes: ${dados.hospedes}`,
    `Nome: ${dados.nome}`,
    `Telefone: ${dados.telefone}`,
  ];
  if (dados.email) linhas.push(`E-mail: ${dados.email}`);
  return linhas.join("\n");
}
