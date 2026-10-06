import { useEffect, useRef, useState, type FormEvent } from "react";
import hotel from "../../content/hotel.json";
import quartos from "../../content/quartos.json";
import will from "../../content/will.json";
import { linkWhatsApp, mensagemReserva, MENSAGENS } from "../../lib/whatsapp";
import { dataLocal } from "../../lib/reserva";
import { ocupacaoQuarto } from "../../lib/quartos";
import { buscarConhecimento, numeroDePessoas, temIntencao } from "../../lib/will";

// Will: assistente do site com respostas prontas (sem IA). As respostas vêm de
// will.json, faq.json, estrutura.json, hotel.json e quartos.json (entendimento em
// lib/will.ts); o pedido de reserva sai
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

const CHAVE_CONVERSA = "salinas-will-conversa";

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const PEDIDO_VAZIO: Pedido ={ hospedes: 0, checkin: "", checkout: "", quarto: "" };

const OPCOES_INICIO: Opcao[] = [
  { rotulo: will.opcoes.reservar, acao: "reservar" },
  { rotulo: will.opcoes.quartos, acao: "quartos" },
  { rotulo: will.opcoes.horarios, acao: "horarios" },
  { rotulo: will.opcoes.comoChegar, acao: "comoChegar" },
  { rotulo: will.opcoes.recepcao, acao: "recepcao" },
];

const VOLTAR: Opcao = { rotulo: will.opcoes.inicio, acao: "inicio" };

const OPCOES_HOSPEDES: Opcao[] = [
  ...[1, 2, 3, 4].map((n) => ({ rotulo: String(n), acao: { hospedes: n } })),
  { rotulo: "5+", acao: { hospedes: 5 } },
];

/** Troca {chave} pelos valores informados. */
function preencher(texto: string, valores: Record<string, string | number>): string {
  return texto.replace(/\{(\w+)\}/g, (_, chave) => String(valores[chave] ?? ""));
}

/**
 * Ornamento da logo do hotel (anel central, linhas finas, anéis e pontos nas pontas).
 * `comprimento` (em unidades do desenho, altura = 16) alonga só as linhas: os anéis
 * mantêm o tamanho, então o ornamento fica mais largo sem ficar mais alto.
 */
function Ornamento({ comprimento = 120, className = "" }: { comprimento?: number; className?: string }) {
  const meio = comprimento / 2;
  const fim = comprimento;
  return (
    <svg
      viewBox={`0 0 ${fim} 16`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden="true"
      className={`block shrink-0 ${className}`}
    >
      <circle cx="2.5" cy="8" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="8" r="2.6" />
      <path d={`M11.1 8H${meio - 8}`} />
      <circle cx={meio} cy="8" r="6.6" />
      <circle cx={meio} cy="8" r="4.2" />
      <path d={`M${meio + 8} 8H${fim - 11.1}`} />
      <circle cx={fim - 8.5} cy="8" r="2.6" />
      <circle cx={fim - 2.5} cy="8" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Assinatura do Will no mesmo desenho da logo do hotel: nome em serifa maiúscula,
 * ornamento no meio e a palavra de baixo bem espaçada ("SALINAS HOUSE / — o — / HOTEL").
 * O padding-left igual ao tracking recentraliza o texto, que ganha espaço sobrando no fim.
 */
function Assinatura({ grande = false }: { grande?: boolean }) {
  return (
    <span aria-hidden="true" className="flex flex-col items-center leading-none">
      <span
        className={`font-display font-light uppercase ${
          grande ? "pl-[0.16em] text-4xl tracking-[0.16em]" : "pl-[0.2em] text-base tracking-[0.2em] sm:text-lg"
        }`}
      >
        {will.nome}
      </span>
      <Ornamento
        comprimento={grande ? 120 : 210}
        className={`text-osso/65 ${grande ? "my-2.5 w-44" : "my-1 w-28 sm:w-32"}`}
      />
      <span
        className={`uppercase text-osso/85 ${
          grande ? "pl-[0.45em] text-[10px] tracking-[0.45em]" : "pl-[0.55em] text-[8px] tracking-[0.55em]"
        }`}
      >
        {grande ? will.rotulo : will.rotuloCurto}
      </span>
    </span>
  );
}

const rotuloHospedes = (n: number) => (n === 1 ? "1 pessoa" : `${n} pessoas`);

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
  const painelRef = useRef<HTMLElement>(null);

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

  // A conversa continua ao trocar de página (vale enquanto a aba estiver aberta).
  const restaurado = useRef(false);
  useEffect(() => {
    try {
      const salvo = JSON.parse(sessionStorage.getItem(CHAVE_CONVERSA) ?? "null");
      if (Array.isArray(salvo?.mensagens) && salvo.mensagens.length > 0) {
        setMensagens(salvo.mensagens);
        setOpcoes(salvo.opcoes ?? OPCOES_INICIO);
        setEtapa(salvo.etapa ?? "livre");
        setPedido(salvo.pedido ?? PEDIDO_VAZIO);
        proximoId.current = Math.max(...salvo.mensagens.map((m: Mensagem) => m.id)) + 1;
      }
    } catch {
      // Sem sessionStorage (aba anônima, bloqueio): começa do zero.
    }
    restaurado.current = true;
  }, []);

  useEffect(() => {
    if (!restaurado.current) return;
    try {
      sessionStorage.setItem(CHAVE_CONVERSA, JSON.stringify({ mensagens, opcoes, etapa, pedido }));
    } catch {
      // Sem sessionStorage: a conversa só não sobrevive à troca de página.
    }
  }, [mensagens, opcoes, etapa, pedido]);

  useEffect(() => {
    if (!aberto) return;
    // No celular o painel ocupa a tela inteira: trava a rolagem da página e o foco do teclado.
    const telaCheia = window.matchMedia("(max-width: 639px)").matches;
    if (telaCheia) document.body.style.overflow = "hidden";

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !telaCheia || !painelRef.current) return;
      const focaveis = painelRef.current.querySelectorAll<HTMLElement>(FOCAVEIS);
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      if (telaCheia) document.body.style.overflow = "";
    };
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
        setOpcoes(OPCOES_HOSPEDES);
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

  /** `eco`: repete a escolha como fala do hóspede (falso quando o número veio digitado). */
  function escolherHospedes(n: number, eco = true) {
    if (eco) adicionar({ de: "voce", texto: n >= 5 ? "5 ou mais" : String(n) });
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
    setEtapa("livre");
    setErroDatas(false);

    // Ordem importa: do assunto mais específico pro mais genérico.
    if (temIntencao("cancelar", digitado)) {
      responder(will.respostas.cancelar, {
        href: linkWhatsApp(MENSAGENS.duvida(digitado)),
        rotulo: will.respostas.abrirWhatsApp,
      });
      setOpcoes(OPCOES_INICIO);
      return;
    }

    // Assuntos que só a equipe sabe (pagamento, senha do Wi-Fi…): encaminha em vez de chutar.
    if (temIntencao("soEquipe", digitado)) {
      responder(will.respostas.soEquipe, {
        href: linkWhatsApp(MENSAGENS.duvida(digitado)),
        rotulo: will.respostas.enviarPergunta,
      });
      setOpcoes(OPCOES_INICIO);
      return;
    }

    const pessoas = numeroDePessoas(digitado);
    if (pessoas && !hotel.motorReservas) return escolherHospedes(pessoas, false);

    if (temIntencao("eventos", digitado)) {
      responder(hotel.eventos.texto, { href: "/eventos", rotulo: will.respostas.verEventos });
      setOpcoes(OPCOES_INICIO);
      return;
    }
    if (temIntencao("comoChegar", digitado)) return executar("comoChegar");
    if (temIntencao("horarios", digitado)) return executar("horarios");

    const resposta = buscarConhecimento(digitado);
    if (resposta) {
      responder(resposta);
      setOpcoes(OPCOES_INICIO);
      return;
    }

    if (temIntencao("preco", digitado) && !hotel.motorReservas) {
      setPedido(PEDIDO_VAZIO);
      responder(will.reserva.preco);
      setOpcoes(OPCOES_HOSPEDES);
      return;
    }
    if (temIntencao("reservar", digitado) || temIntencao("preco", digitado)) return executar("reservar");
    if (temIntencao("quartos", digitado)) return executar("quartos");
    if (temIntencao("recepcao", digitado)) return executar("recepcao");

    if (temIntencao("saudacao", digitado)) {
      responder(will.respostas.saudacao);
      setOpcoes(OPCOES_INICIO);
      return;
    }
    if (temIntencao("agradecimento", digitado)) {
      responder(will.respostas.agradecimento);
      setOpcoes(OPCOES_INICIO);
      return;
    }

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
        className="fixed bottom-3 right-3 z-40 bg-verdeEsc px-4 py-2.5 text-osso shadow-[0_10px_30px_-10px_rgba(28,26,23,0.55)] transition-colors duration-[250ms] hover:bg-verde sm:bottom-5 sm:right-5 sm:px-6 sm:py-2.5"
      >
        {/* Celular: faixa fina de uma linha. Computador: assinatura no desenho da logo. */}
        <span aria-hidden="true" className="flex items-center gap-3 sm:hidden">
          <Ornamento comprimento={56} className="w-11 text-osso/65" />
          <span className="pl-[0.2em] font-display text-base font-light uppercase leading-none tracking-[0.2em]">
            {will.nome}
          </span>
        </span>
        <span className="hidden sm:block">
          <Assinatura />
        </span>
      </button>

      <section
        ref={painelRef}
        id="will-painel"
        role="dialog"
        aria-labelledby="will-titulo"
        className={`${aberto ? "flex" : "hidden"} fixed inset-0 z-50 h-[100dvh] flex-col bg-osso motion-safe:animate-[will-entrada_320ms_var(--ease-reveal)] sm:inset-auto sm:bottom-[6.5rem] sm:right-5 sm:z-40 sm:h-auto sm:max-h-[min(38rem,calc(100dvh-7rem))] sm:w-[24rem] sm:shadow-[0_24px_60px_-20px_rgba(28,26,23,0.55)] sm:ring-1 sm:ring-carvao/10`}
      >
        <header className="relative bg-verdeEsc px-5 pb-4 pt-[max(1.75rem,env(safe-area-inset-top))] text-osso sm:pt-6">
          <h2 id="will-titulo">
            <span className="sr-only">{will.nome}, {will.rotulo.toLowerCase()}</span>
            <Assinatura grande />
          </h2>
          <div>
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar conversa"
              className="absolute right-3 top-3 p-2 text-osso/70 transition-colors hover:text-cobreClaro"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-4 border-t border-osso/15 pt-3 text-center text-xs text-osso/70">{will.subtitulo}</p>
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
        <p className="border-t border-linho bg-areia px-5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 text-[11px] leading-snug text-verdeCl sm:pb-2">{will.aviso}</p>
      </section>
    </>
  );
}
