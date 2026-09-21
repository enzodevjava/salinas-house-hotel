import { useRef, useState } from "react";

export interface ImagemGaleria {
  src: string;
  avifSrcSet: string;
  webpSrcSet: string;
  width: number;
  height: number;
  alt: string;
}

interface GaleriaProps {
  imagens: ImagemGaleria[];
  nomeQuarto: string;
  prioridade?: boolean;
}

const SIZES = "(min-width: 1024px) 58vw, 100vw";

export default function Galeria({ imagens, nomeQuarto, prioridade = false }: GaleriaProps) {
  const [indice, setIndice] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const total = imagens.length;
  const anterior = () => setIndice((i) => (i - 1 + total) % total);
  const proxima = () => setIndice((i) => (i + 1) % total);

  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      anterior();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      proxima();
    }
  };

  const aoTocarInicio = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const aoTocarFim = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta > 0) anterior();
      else proxima();
    }
    touchStartX.current = null;
  };

  if (total === 0) return null;

  return (
    <div
      role="group"
      aria-roledescription="carrossel"
      aria-label={`Galeria de fotos — ${nomeQuarto}`}
      tabIndex={0}
      onKeyDown={aoTeclar}
      className="outline-none"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden bg-linho"
        onTouchStart={aoTocarInicio}
        onTouchEnd={aoTocarFim}
      >
        {imagens.map((img, i) => (
          <picture key={img.src} className={i === indice ? "block" : "hidden"}>
            <source type="image/avif" srcSet={img.avifSrcSet} sizes={SIZES} />
            <source type="image/webp" srcSet={img.webpSrcSet} sizes={SIZES} />
            <img
              src={img.src}
              width={img.width}
              height={img.height}
              alt={img.alt}
              loading={prioridade && i === 0 ? "eager" : "lazy"}
              fetchPriority={prioridade && i === 0 ? "high" : "auto"}
              decoding="async"
              className="h-full w-full object-cover"
            />
          </picture>
        ))}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-osso/90 text-verde transition-colors hover:bg-osso"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={proxima}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-osso/90 text-verde transition-colors hover:bg-osso"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div
          aria-live="polite"
          className="mt-3 text-[11px] uppercase tracking-nav text-cobreTexto"
        >
          {String(indice + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      )}
    </div>
  );
}
