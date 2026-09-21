import { useEffect, useRef, useState } from "react";
import Galeria, { type ImagemGaleria } from "./Galeria";

export interface QuartoComImagens {
  slug: string;
  nome: string;
  destaque: boolean;
  descricao: string;
  specs: string[];
  imagens: ImagemGaleria[];
}

interface AbasQuartosProps {
  quartos: QuartoComImagens[];
}

export default function AbasQuartos({ quartos }: AbasQuartosProps) {
  const padrao = quartos.find((q) => q.destaque)?.slug ?? quartos[0].slug;
  const [abaAtiva, setAbaAtiva] = useState(padrao);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const tablistRef = useRef<HTMLDivElement>(null);
  const [temOverflow, setTemOverflow] = useState(false);

  const ativar = (slug: string, mover: boolean) => {
    setAbaAtiva(slug);
    if (mover) tabRefs.current[slug]?.focus();
  };

  useEffect(() => {
    const el = tablistRef.current;
    if (!el) return;

    const verificarOverflow = () => {
      setTemOverflow(el.scrollWidth > el.clientWidth + 1);
    };

    verificarOverflow();
    const observer = new ResizeObserver(verificarOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const aoMudarHash = () => {
      const slug = window.location.hash.replace("#", "");
      const alvo = quartos.find((q) => q.slug === slug);
      if (alvo) {
        setAbaAtiva(alvo.slug);
        requestAnimationFrame(() => {
          document
            .getElementById(alvo.slug)
            ?.scrollIntoView({ block: "start" });
        });
      }
    };

    aoMudarHash();
    window.addEventListener("hashchange", aoMudarHash);
    return () => window.removeEventListener("hashchange", aoMudarHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aoTeclarTab = (e: React.KeyboardEvent, indiceAtual: number) => {
    const total = quartos.length;
    let proximoIndice: number | null = null;

    if (e.key === "ArrowRight") proximoIndice = (indiceAtual + 1) % total;
    else if (e.key === "ArrowLeft")
      proximoIndice = (indiceAtual - 1 + total) % total;
    else if (e.key === "Home") proximoIndice = 0;
    else if (e.key === "End") proximoIndice = total - 1;

    if (proximoIndice !== null) {
      e.preventDefault();
      ativar(quartos[proximoIndice].slug, true);
    }
  };

  return (
    <div>
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="Tipos de acomodação"
        className="overflow-x-auto scroll-sem-barra border-b border-linho"
        style={
          temOverflow
            ? {
                maskImage:
                  "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
              }
            : undefined
        }
      >
        <div className="flex w-max gap-8 sm:w-full sm:justify-between">
          {quartos.map((quarto, i) => {
            const ativa = quarto.slug === abaAtiva;
            return (
              <button
                key={quarto.slug}
                ref={(el) => {
                  tabRefs.current[quarto.slug] = el;
                }}
                role="tab"
                id={`tab-${quarto.slug}`}
                aria-selected={ativa}
                aria-controls={quarto.slug}
                tabIndex={ativa ? 0 : -1}
                onClick={() => ativar(quarto.slug, false)}
                onKeyDown={(e) => aoTeclarTab(e, i)}
                className={`shrink-0 whitespace-nowrap border-b-2 py-4 text-[11px] font-medium uppercase tracking-nav transition-colors ${
                  ativa
                    ? "border-cobre text-verde"
                    : "border-transparent text-verdeCl hover:text-verde"
                }`}
              >
                {quarto.nome}
              </button>
            );
          })}
        </div>
      </div>

      {quartos.map((quarto) => {
        const ativa = quarto.slug === abaAtiva;

        return (
          <div
            key={quarto.slug}
            id={quarto.slug}
            role="tabpanel"
            aria-labelledby={`tab-${quarto.slug}`}
            hidden={!ativa}
            className="grid grid-cols-1 gap-10 py-10 lg:grid-cols-12 lg:gap-12"
          >
            <div className="lg:col-span-7">
              <Galeria
                imagens={quarto.imagens}
                nomeQuarto={quarto.nome}
                prioridade={quarto.destaque}
              />
            </div>

            <div className="lg:col-span-5">
              <h3 className="text-carvao">{quarto.nome}</h3>
              <p className="mt-4 text-verdeCl">{quarto.descricao}</p>

              <ul className="mt-6">
                {quarto.specs.map((spec) => (
                  <li
                    key={spec}
                    className="border-b border-linho py-3 text-sm text-verdeCl"
                  >
                    {spec}
                  </li>
                ))}
              </ul>

              <a
                href={`/reservar?quarto=${encodeURIComponent(quarto.nome)}`}
                className="mt-8 inline-flex items-center justify-center gap-2 bg-verde px-9 py-4 text-xs font-medium uppercase tracking-nav text-osso transition-colors duration-[250ms] hover:bg-verdeEsc"
              >
                {quarto.destaque ? "Reserve a suíte" : "Reserve seu quarto"}
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
