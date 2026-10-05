import hotel from "../content/hotel.json";

// Enquanto `motorReservas` (hotel.json) for null, a reserva é feita pelo
// formulário de /reservar, que envia o pedido pelo WhatsApp. Quando o PMS for
// contratado, basta colocar a URL do motor de reservas dele nesse campo.
export function linkReservar(quarto?: string): string {
  if (hotel.motorReservas) return hotel.motorReservas;
  return quarto ? `/reservar?quarto=${encodeURIComponent(quarto)}` : "/reservar";
}

/** Data no fuso do navegador, no formato yyyy-mm-dd de <input type="date">. */
export function dataLocal(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}
