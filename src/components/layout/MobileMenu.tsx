import { useEffect, useRef, useState } from "react";
import hotel from "../../content/hotel.json";
import { linkWhatsApp, MENSAGENS } from "../../lib/whatsapp";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function MobileMenu() {
  const [aberto, setAberto] = useState(false);
  const botaoAbrirRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const primeiroLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!aberto) return;

    const overlay = overlayRef.current;
    document.body.style.overflow = "hidden";
    primeiroLinkRef.current?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setAberto(false);
        return;
      }

      if (e.key !== "Tab" || !overlay) return;

      const focaveis = overlay.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
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
      document.body.style.overflow = "";
      document.removeEventListener("keydown", aoTeclar);
      botaoAbrirRef.current?.focus();
    };
  }, [aberto]);

  return (
    <>
      <button
        ref={botaoAbrirRef}
        type="button"
        onClick={() => setAberto(true)}
        aria-expanded={aberto}
        aria-controls="menu-mobile-overlay"
        aria-label="Abrir menu"
        className="lg:hidden inline-flex h-10 w-10 items-center justify-center"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`transition-transform duration-300 ease-out ${
            aberto ? "rotate-90" : "rotate-0"
          }`}
        >
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      <div
        ref={overlayRef}
        id="menu-mobile-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        {...(!aberto ? { inert: true } : {})}
        className={`fixed inset-0 z-50 flex flex-col bg-verdeEsc text-osso transition-transform duration-300 ease-reveal ${
          aberto ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
          <div className="flex items-center justify-between container-page pt-6">
            <span className="font-display text-lg">Salinas House Hotel</span>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar menu"
              className="inline-flex h-10 w-10 items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-2 container-page">
            {hotel.navegacao.map((item, i) => (
              <a
                key={item.href}
                ref={i === 0 ? primeiroLinkRef : undefined}
                href={item.href}
                onClick={() => setAberto(false)}
                className="font-display text-[2rem] capitalize py-2 text-osso hover:text-cobreClaro transition-colors"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/reservar"
              onClick={() => setAberto(false)}
              className="mt-4 inline-flex w-fit items-center justify-center gap-2 bg-osso px-8 py-3.5 text-xs font-medium uppercase tracking-nav text-verdeEsc transition-colors hover:bg-cobreClaro"
            >
              Reservar
            </a>
          </nav>

          <div className="container-page pb-8 flex flex-col gap-4 border-t border-osso/15 pt-6">
            <div className="flex flex-col gap-1">
              {hotel.whatsapp.map((w, i) => (
                <a
                  key={w.numero}
                  href={linkWhatsApp(MENSAGENS.hero, w.numero)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm uppercase tracking-nav text-osso/80 hover:text-cobreClaro transition-colors"
                >
                  {w.rotulo} {hotel.whatsapp.length > 1 ? i + 1 : ""} — {w.numero}
                </a>
              ))}
            </div>
            <a
              href={hotel.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm uppercase tracking-nav text-osso/80 hover:text-cobreClaro transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
    </>
  );
}
