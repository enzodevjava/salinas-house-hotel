import { useEffect, useRef, useState, type FormEvent } from "react";
import hotel from "../../content/hotel.json";
import quartos from "../../content/quartos.json";
import faq from "../../content/faq.json";
import will from "../../content/will.json";
import { linkWhatsApp, mensagemReserva, MENSAGENS } from "../../lib/whatsapp";
import { dataLocal } from "../../lib/reserva";
import { ocupacaoQuarto } from "../../lib/quartos";

// Will: assistente do site com respostas prontas (sem IA). As respostas vêm de
// will.json, faq.json, hotel.json e quartos.json; o pedido de reserva sai
// montado pro WhatsApp, como no formulário de /reservar.

type Acao =
  | "inicio"
  | "reservar"
  | "quartos"
  | "horarios"
  | "comoChegar"
  | "recepcao"
  | { hospedes: number }
  | { quarto: string }
  | { verQuarto: string };

interface Opcao {
  rotulo: string;
  acao: Acao;
}

interface Link {
  href: string;
  rotulo: string;
}

interface Mensagem {
  id: number;
  de: "will" | "voce";
  texto: string;
  link?: Link;
}

type Etapa = "livre" | "datas" | "nome";

interface Pedido {
  hospedes: number;
  checkin: string;
  checkout: string;
  quarto: string;
}

const PEDIDO_VAZIO: Pedido = { hospedes: 0, checkin: "", checkout: "", quarto: "" };

const OPCOES_INICIO: Opcao[] = [
  { rotulo: will.opcoes.reservar, acao: "reservar" },
  { rotulo: will.opcoes.quartos, acao: "quartos" },
  { rotulo: will.opcoes.horarios, acao: "horarios" },
  { rotulo: will.opcoes.comoChegar, acao: "comoChegar" },
  { rotulo: will.opcoes.recepcao, acao: "recepcao" },
];

const VOLTAR: Opcao = { rotulo: will.opcoes.inicio, acao: "inicio" };

/** Troca {chave} pelos valores informados. */
function preencher(texto: string, valores: Record<string, string | number>): string {
  return texto.replace(/\{(\w+)\}/g, (_, chave) => String(valores[chave] ?? ""));
}

/** Minúsculas e sem acento, pra comparar o que a pessoa digitou. */
function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const contem = (texto: string, palavras: string[]) =>
  palavras.some((p) => texto.includes(normalizar(p)));

const PALAVRAS_IGNORADAS = new Set(
  "para pra com tem voces hotel qual quais como esta sao uma tambem posso quero gostaria saber"
    .split(" ")
);

const SINONIMOS: Record<string, string> = will.sinonimos;

/** Acha a pergunta do FAQ que mais divide palavras com o texto digitado. */
function buscarFaq(texto: string): string | undefined {
  const palavras = normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length > 2 && !PALAVRAS_IGNORADAS.has(p))
    .map((p) => SINONIMOS[p] ?? p);
  let melhor: { resposta: string; pontos: number } | undefined;
  for (const item of faq) {
    const alvo = normalizar(`${item.pergunta} ${item.resposta}`);
    const pontos = palavras.filter((p) => alvo.includes(p.slice(0, 5))).length;
    if (pontos > 0 && (!melhor || pontos > melhor.pontos)) {
      melhor = { resposta: item.resposta, pontos };
    }
  }
  return melhor?.resposta;
}

/**
 * Ornamento da logo do hotel (anel central, linhas finas, anéis e pontos nas pontas).
 * `compacto` mostra só o anel central com um trecho curto das linhas.
 */
function Ornamento({ compacto = false, className = "" }: { compacto?: boolean; className?: string }) {
  return (
    <svg
      viewBox={compacto ? "40 0 40 16" : "0 0 120 16"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden="true"
      className={`block shrink-0 ${className}`}
    >
      <circle cx="2.5" cy="8" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="8" r="2.6" />
      <path d="M11.1 8H52" />
      <circle cx="60" cy="8" r="6.6" />
      <circle cx="60" cy="8" r="4.2" />
      <path d="M68 8h40.9" />
      <circle cx="111.5" cy="8" r="2.6" />
      <circle cx="117.5" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

const rotuloHospedes =(n: number) => (n === 1 ? "1 pessoa" : `${n} pessoas`);

export default function Will() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    { id: 0, de: "will", texto: will.saudacao },
  ]);
  const [opcoes, setOpcoes] = useState<Opcao[]>(OPCOES_INICIO);
  const [etapa, setEtapa] = useState<Etapa>("livre");
  const [pedido, setPedido] = useState<Pedido>(PEDIDO_VAZIO);
  const [texto, setTexto] = useState("");
  const [erroDatas, setErroDatas] = useState(false);
  const [digitando, setDigitando] = useState(false);

  const proximoId = useRef(1);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const checkinRef = useRef<HTMLInputElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);

  const hoje = dataLocal(new Date());

  const adicionar = (...novas: Omit<Mensagem, "id">[]) =>
    setMensagens((atuais) => [
      ...atuais,
      ...novas.map((m) => ({ ...m, id: proximoId.current++ })),
    ]);

  // Pequena pausa de "digitando" antes de cada resposta (sem pausa pra quem reduz movimento).
  const responder = (texto: string, link?: Link) => {
    const pausa = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 550;
    setDigitando(true);
    window.setTimeout(() => {
      adicionar({ de: "will", texto, link });
      setDigitando(false);
    }, pausa);
  };

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [mensagens, opcoes, etapa, digitando]);

  useEffect(() => {
    if (!aberto) return;
    if (etapa === "datas") checkinRef.current?.focus();
    else campoRef.current?.focus();
  }, [aberto, etapa]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
      }
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  function executar(acao: Acao) {
    setEtapa("livre");
    setErroDatas(false);

    if (typeof acao === "object") {
      if ("hospedes" in acao) return escolherHospedes(acao.hospedes);
      if ("quarto" in acao) return escolherQuarto(acao.quarto);
      return mostrarQuarto(acao.verQuarto);
    }

    switch (acao) {
      case "inicio":
        responder(will.respostas.maisAlgo);
        setOpcoes(OPCOES_INICIO);
        return;
      case "reservar":
        if (hotel.motorReservas) {
          responder(will.reserva.motor, {
            href: hotel.motorReservas,
            rotulo: will.reserva.abrirMotor,
          });
          setOpcoes([VOLTAR]);
          return;
        }
        setPedido(PEDIDO_VAZIO);
        responder(will.reserva.hospedes);
        setOpcoes([
          ...[1, 2, 3, 4].map((n) => ({ rotulo: String(n), acao: { hospedes: n } })),
          { rotulo: "5+", acao: { hospedes: 5 } },
        ]);
        return;
      case "quartos":
        responder(will.respostas.quartos);
        setOpcoes([...quartos.map((q) => ({ rotulo: q.nome, acao: { verQuarto: q.slug } })), VOLTAR]);
        return;
      case "horarios":
        responder(preencher(will.respostas.horarios, { checkin: hotel.checkin, checkout: hotel.checkout }));
        setOpcoes(OPCOES_INICIO);
        return;
      case "comoChegar":
        responder(preencher(will.respostas.comoChegar, {
            endereco: hotel.endereco,
            cidade: hotel.cidade,
            estado: hotel.estado,
          }), {
          href: `https://www.google.com/maps/search/?api=1&query=${hotel.geo.lat},${hotel.geo.lng}`,
          rotulo: will.respostas.abrirMapa,
        });
        setOpcoes(OPCOES_INICIO);
        return;
      case "recepcao":
        responder(will.respostas.recepcao, {
          href: linkWhatsApp(MENSAGENS.flutuante),
          rotulo: will.respostas.abrirWhatsApp,
        });
        setOpcoes(OPCOES_INICIO);
        return;
    }
  }

  function escolherHospedes(n: number) {
    adicionar({ de: "voce", texto: n >= 5 ? "5 ou mais" : String(n) });
    if (n >= 5) {
      responder(will.reserva.grupo, {
        href: linkWhatsApp(MENSAGENS.hero),
        rotulo: will.respostas.abrirWhatsApp,
      });
      setOpcoes([VOLTAR]);
      return;
    }
    setPedido({ ...PEDIDO_VAZIO, hospedes: n });
    responder(will.reserva.datas);
    setOpcoes([]);
    setEtapa("datas");
  }

  function confirmarDatas(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const checkin = String(dados.get("checkin") ?? "");
    const checkout = String(dados.get("checkout") ?? "");
    if (!checkin || !checkout || checkin < hoje || checkout <= checkin) {
      setErroDatas(true);
      return;
    }
    setErroDatas(false);
    setEtapa("livre");
    setPedido((p) => ({ ...p, checkin, checkout }));
    adicionar({
      de: "voce",
      texto: `${checkin.split("-").reverse().join("/")} a ${checkout.split("-").reverse().join("/")}`,
    });

    // Quartos sem capacidade informada (Suíte Presidencial) entram sempre — não inventamos o limite.
    const cabem = quartos.filter((q) => {
      const ocupacao = ocupacaoQuarto(q.specs);
      return !ocupacao || ocupacao.max >= pedido.hospedes;
    });
    responder(preencher(will.reserva.quarto, { hospedes: rotuloHospedes(pedido.hospedes) }));
    setOpcoes([...cabem.map((q) => ({ rotulo: q.nome, acao: { quarto: q.nome } })), VOLTAR]);
  }

  function escolherQuarto(nome: string) {
    adicionar({ de: "voce", texto: nome });
    setPedido((p) => ({ ...p, quarto: nome }));
    responder(will.reserva.nome);
    setOpcoes([]);
    setEtapa("nome");
  }

  function finalizarPedido(nome: string) {
    responder(preencher(will.reserva.resumo, { nome: nome.split(" ")[0] }), {
      href: linkWhatsApp(
        mensagemReserva({
          quarto: pedido.quarto,
          checkin: pedido.checkin,
          checkout: pedido.checkout,
          hospedes: String(pedido.hospedes),
          nome,
        })
      ),
      rotulo: will.reserva.enviar,
    });
    setOpcoes([VOLTAR]);
    setEtapa("livre");
  }

  function mostrarQuarto(slug: string) {
    const quarto = quartos.find((q) => q.slug === slug);
    if (!quarto) return;
    adicionar({ de: "voce", texto: quarto.nome });
    responder(`${quarto.descricao}\n\n${quarto.specs.join(" · ")}`, {
      href: "/acomodacoes",
      rotulo: will.respostas.verFotos,
    });
    setOpcoes([{ rotulo: will.opcoes.reservar, acao: "reservar" }, { rotulo: will.opcoes.quartos, acao: "quartos" }, VOLTAR]);
  }

  function enviarTexto(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const digitado = texto.trim();
    if (!digitado) return;
    setTexto("");

    if (etapa === "nome") {
      adicionar({ de: "voce", texto: digitado });
      finalizarPedido(digitado);
      return;
    }

    adicionar({ de: "voce", texto: digitado });
    const n = normalizar(digitado);
    if (contem(n, will.palavrasReserva)) return executar("reservar");
    if (contem(n, will.palavrasHorarios)) return executar("horarios");
    if (contem(n, will.palavrasComoChegar)) return executar("comoChegar");
    if (contem(n, will.palavrasRecepcao)) return executar("recepcao");

    const resposta = buscarFaq(digitado);
    if (resposta) {
      responder(resposta);
      setOpcoes(OPCOES_INICIO);
      return;
    }
    if (contem(n, will.palavrasQuartos)) return executar("quartos");

    responder(will.respostas.naoEntendi, {
      href: linkWhatsApp(MENSAGENS.duvida(digitado)),
      rotulo: will.respostas.enviarPergunta,
    });
    setOpcoes(OPCOES_INICIO);
  }

  function escolherOpcao(opcao: Opcao) {
    if (typeof opcao.acao === "string") adicionar({ de: "voce", texto: opcao.rotulo });
    executar(opcao.acao);
  }

  // Respostas curtas (nº de hóspedes) viram uma grade; o resto, uma lista com seta.
  const opcoesEmGrade = opcoes.length > 0 && opcoes.every((o) => o.rotulo.length <= 9);

  const fechar = () => {
    setAberto(false);
    botaoRef.current?.focus();
  };

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        onClick={() => (aberto ? fechar() : setAberto(true))}
        aria-expanded={aberto}
        aria-controls="will-painel"
        aria-label={aberto ? `Fechar conversa com o ${will.nome}` : will.chamada}
        className="fixed bottom-3 right-3 z-40 flex h-14 items-center gap-4 border-t-2 border-cobre bg-verdeEsc px-3 text-osso shadow-[0_10px_30px_-10px_rgba(28,26,23,0.55)] transition-colors duration-[250ms] hover:bg-verde sm:bottom-5 sm:right-5 sm:h-auto sm:py-3 sm:pl-4 sm:pr-5"
      >
        <Ornamento compacto className="w-9 text-cobreClaro sm:w-10" />
        <span aria-hidden="true" className="-ml-1 text-xs font-medium uppercase tracking-nav sm:hidden">
          {will.nome}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[10px] uppercase tracking-label text-cobreClaro">
            {will.rotulo}
          </span>
          <span className="block text-xs font-medium uppercase tracking-nav">
            {aberto ? "Fechar" : will.chamada}
          </span>
        </span>
      </button>

      <section
        id="will-painel"
        role="dialog"
        aria-labelledby="will-titulo"
        className={`${aberto ? "flex" : "hidden"} fixed inset-x-3 bottom-[4.75rem] z-40 max-h-[min(38rem,calc(100dvh-6.5rem))] flex-col bg-osso shadow-[0_24px_60px_-20px_rgba(28,26,23,0.55)] ring-1 ring-carvao/10 motion-safe:animate-[will-entrada_320ms_var(--ease-reveal)] sm:inset-x-auto sm:bottom-[5.75rem] sm:right-5 sm:w-[24rem]`}
      >
        <header className="bg-verdeEsc px-5 pb-4 pt-5 text-osso">
          <div className="flex items-start gap-3.5">
            <div className="min-w-0 flex-1">
              <Ornamento className="w-28 text-cobreClaro" />
              <p className="mt-3 text-[10px] uppercase tracking-label text-cobreClaro">{will.rotulo}</p>
              <h2 id="will-titulo" className="mt-1 font-display text-3xl leading-none">
                {will.nome}
              </h2>
            </div>
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar conversa"
              className="-mr-1 p-2 text-osso/70 transition-colors hover:text-cobreClaro"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-3 hidden border-t border-osso/15 pt-3 text-xs text-osso/70 sm:block">{will.subtitulo}</p>
        </header>

        <div role="log" aria-live="polite" className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {mensagens.map((m) =>
            m.de === "will" ? (
              <div key={m.id} className="mr-6 border-l-2 border-cobre bg-areia px-4 py-3 text-sm leading-relaxed text-carvao">
                <p className="whitespace-pre-line">{m.texto}</p>
                {m.link && (
                  <a
                    href={m.link.href}
                    target={m.link.href.startsWith("/") ? undefined : "_blank"}
                    rel={m.link.href.startsWith("/") ? undefined : "noopener noreferrer"}
                    className="mt-3 inline-flex items-center gap-2 bg-verde px-5 py-2.5 text-[11px] font-medium uppercase tracking-nav text-osso transition-colors duration-[250ms] hover:bg-verdeEsc"
                  >
                    {m.link.rotulo}
                    <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
            ) : (
              <div key={m.id} className="ml-10 flex justify-end">
                <p className="bg-verde px-4 py-2.5 text-sm text-osso">{m.texto}</p>
              </div>
            )
          )}

          {digitando && (
            <div className="mr-6 inline-flex items-center gap-1.5 border-l-2 border-cobre bg-areia px-4 py-3.5">
              <span className="sr-only">{will.nome} está digitando</span>
              {[0, 150, 300].map((atraso) => (
                <span
                  key={atraso}
                  aria-hidden="true"
                  style={{ animationDelay: `${atraso}ms` }}
                  className="h-1.5 w-1.5 rounded-full bg-cobre motion-safe:animate-pulse"
                />
              ))}
            </div>
          )}

          {!digitando && etapa === "datas" && (
            <form onSubmit={confirmarDatas} noValidate className="space-y-4 border border-linho p-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] uppercase tracking-nav text-verdeCl">{will.reserva.rotuloCheckin}</span>
                  <input ref={checkinRef} type="date" name="checkin" min={hoje} required className="border-b border-linho bg-transparent py-1.5 text-sm text-carvao outline-none focus:border-verde" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] uppercase tracking-nav text-verdeCl">{will.reserva.rotuloCheckout}</span>
                  <input type="date" name="checkout" min={hoje} required className="border-b border-linho bg-transparent py-1.5 text-sm text-carvao outline-none focus:border-verde" />
                </label>
              </div>
              {erroDatas && (
                <p role="alert" className="text-xs text-cobreTexto">
                  {will.reserva.datasInvalidas}
                </p>
              )}
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 bg-verde px-5 py-3 text-[11px] font-medium uppercase tracking-nav text-osso transition-colors duration-[250ms] hover:bg-verdeEsc">
                {will.reserva.continuar}
                <span aria-hidden="true">→</span>
              </button>
            </form>
          )}

          {!digitando && opcoes.length > 0 &&
            (opcoesEmGrade ? (
              <div className="grid grid-cols-5 border-l border-t border-linho">
                {opcoes.map((o) => (
                  <button
                    key={o.rotulo}
                    type="button"
                    onClick={() => escolherOpcao(o)}
                    className="border-b border-r border-linho py-3 text-sm text-verde transition-colors hover:bg-verde hover:text-osso"
                  >
                    {o.rotulo}
                  </button>
                ))}
              </div>
            ) : (
              <ul className="border-t border-linho">
                {opcoes.map((o) => (
                  <li key={o.rotulo}>
                    <button
                      type="button"
                      onClick={() => escolherOpcao(o)}
                      className="group flex w-full items-center justify-between gap-3 border-b border-linho px-1 py-3 text-left text-sm text-carvao transition-all duration-[250ms] hover:bg-areia hover:px-3"
                    >
                      {o.rotulo}
                      <span aria-hidden="true" className="text-cobreTexto transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ))}
          <div ref={fimRef} />
        </div>

        <form onSubmit={enviarTexto} className="flex items-center gap-3 border-t border-linho bg-osso px-5 py-3">
          <label htmlFor="will-campo" className="sr-only">
            {etapa === "nome" ? will.reserva.nome : will.placeholder}
          </label>
          <input
            ref={campoRef}
            id="will-campo"
            type="text"
            autoComplete={etapa === "nome" ? "name" : "off"}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={etapa === "nome" ? "Seu nome" : will.placeholder}
            className="min-w-0 flex-1 border-b border-linho bg-transparent py-2 text-sm text-carvao outline-none placeholder:text-verdeCl focus:border-verde"
          />
          <button
            type="submit"
            disabled={digitando}
            aria-label="Enviar"
            className="flex h-10 w-10 shrink-0 items-center justify-center bg-verde text-osso transition-colors duration-[250ms] hover:bg-verdeEsc disabled:opacity-60"
          >
            <span aria-hidden="true" className="text-base">→</span>
          </button>
        </form>
        <p className="border-t border-linho bg-areia px-5 py-2 text-[11px] leading-snug text-verdeCl">{will.aviso}</p>
      </section>
    </>
  );
}
