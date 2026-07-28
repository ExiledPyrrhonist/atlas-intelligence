import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { select } from "d3-selection";
import "d3-transition";
import { zoom as d3Zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { Minus, Plus, Crosshair, Loader2 } from "lucide-react";
import type { Country } from "@/lib/atlas";
import { formatCompact } from "@/lib/atlas";

type CountryFeature = Feature<Geometry, { name?: string }> & { id?: string | number };

const LOW_RES = "/countries-110m.json";
const HIGH_RES = "/countries-50m.json";
const DETAIL_THRESHOLD = 2.6;

function normalizeId(value: string | number | undefined): string {
  if (value === undefined) return "";
  return String(value).replace(/^0+/, "");
}

async function loadWorld(url: string): Promise<CountryFeature[]> {
  const res = await fetch(url);
  const topology = await res.json();
  const collection = feature(
    topology,
    topology.objects.countries,
  ) as unknown as FeatureCollection<Geometry, { name?: string }>;
  return collection.features as CountryFeature[];
}

export function WorldMap({ countries }: { countries: Country[] }) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [size, setSize] = useState({ width: 960, height: 540 });
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [detailLoaded, setDetailLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [hovered, setHovered] = useState<{ id: string; name: string; x: number; y: number } | null>(
    null,
  );

  const trackedById = useMemo(() => {
    const map = new Map<string, Country>();
    countries.forEach((c) => map.set(normalizeId(c.iso_numeric), c));
    return map;
  }, [countries]);

  useEffect(() => {
    let active = true;
    loadWorld(LOW_RES)
      .then((f) => {
        if (active) {
          setFeatures(f);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (detailLoaded || transform.k < DETAIL_THRESHOLD) return;
    setDetailLoaded(true);
    loadWorld(HIGH_RES)
      .then(setFeatures)
      .catch(() => undefined);
  }, [transform.k, detailLoaded]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.max(320, width), height: Math.max(320, height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const projection = useMemo(() => {
    return geoNaturalEarth1().fitExtent(
      [
        [8, 8],
        [size.width - 8, size.height - 8],
      ],
      { type: "Sphere" },
    );
  }, [size]);

  const path = useMemo(() => geoPath(projection), [projection]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const behavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 24])
      .translateExtent([
        [0, 0],
        [size.width, size.height],
      ])
      .on("zoom", (event) => {
        const t = event.transform;
        setTransform({ k: t.k, x: t.x, y: t.y });
      });
    zoomRef.current = behavior;
    select(svg).call(behavior);
    return () => {
      select(svg).on(".zoom", null);
    };
  }, [size.width, size.height]);

  const zoomBy = useCallback((factor: number) => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    select(svg).transition().duration(250).call(zoomRef.current.scaleBy, factor);
  }, []);

  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    select(svg).transition().duration(350).call(zoomRef.current.transform, zoomIdentity);
  }, []);

  const rendered = useMemo(() => {
    return features.map((f) => {
      const id = normalizeId(f.id);
      return {
        id,
        name: f.properties?.name ?? "",
        d: path(f) ?? "",
        area: path.area(f),
        centroid: path.centroid(f),
        country: trackedById.get(id),
      };
    });
  }, [features, path, trackedById]);

  const labels = useMemo(() => {
    const { k, x, y } = transform;
    const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
    const out: { id: string; text: string; sx: number; sy: number; tracked: boolean }[] = [];
    const candidates = [...rendered]
      .filter((r) => r.name && Number.isFinite(r.centroid[0]))
      .sort((a, b) => {
        const bias = (r: (typeof rendered)[number]) => (r.country ? 1.9 : 1);
        return b.area * bias(b) - a.area * bias(a);
      });

    for (const r of candidates) {
      const screenArea = r.area * k * k;
      const minArea = r.country ? 260 : 900;
      if (screenArea < minArea) continue;
      const sx = r.centroid[0] * k + x;
      const sy = r.centroid[1] * k + y;
      if (sx < 40 || sy < 16 || sx > size.width - 40 || sy > size.height - 12) continue;

      const fontSize = Math.min(13, Math.max(9, 7 + Math.log2(screenArea) * 0.55));
      const halfWidth = (r.name.length * fontSize * 0.31) / 1;
      const box = {
        x0: sx - halfWidth,
        y0: sy - fontSize * 0.8,
        x1: sx + halfWidth,
        y1: sy + fontSize * 0.8,
      };
      const collides = placed.some(
        (p) => !(box.x1 < p.x0 || box.x0 > p.x1 || box.y1 < p.y0 || box.y0 > p.y1),
      );
      if (collides) continue;
      placed.push(box);
      out.push({ id: r.id, text: r.name, sx, sy, tracked: Boolean(r.country) });
      if (out.length > 90) break;
    }
    return out;
  }, [rendered, transform, size]);

  const handleClick = (id: string) => {
    const country = trackedById.get(id);
    if (country) navigate({ to: "/countries/$iso", params: { iso: country.iso_a3 } });
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-map-ocean">
      <svg
        ref={svgRef}
        width={size.width}
        height={size.height}
        className="block cursor-grab touch-none active:cursor-grabbing"
        role="img"
        aria-label="Interactive world map of tracked countries"
      >
        <defs>
          <pattern id="atlas-grid" width="42" height="42" patternUnits="userSpaceOnUse">
            <path d="M42 0H0V42" fill="none" stroke="var(--grid)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={size.width} height={size.height} fill="url(#atlas-grid)" />
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          <path
            d={path({ type: "Sphere" }) ?? ""}
            fill="var(--map-ocean)"
            stroke="var(--map-stroke)"
            strokeWidth={1 / transform.k}
          />
          {rendered.map((r) => (
            <path
              key={r.id + r.name}
              d={r.d}
              fill={r.country ? "var(--map-tracked)" : "var(--map-land)"}
              stroke="var(--map-stroke)"
              strokeWidth={0.5 / transform.k}
              className={r.country ? "cursor-pointer transition-[fill]" : "transition-[fill]"}
              style={
                hovered?.id === r.id
                  ? { fill: r.country ? "var(--primary)" : "var(--accent)" }
                  : undefined
              }
              onMouseEnter={(e) =>
                setHovered({
                  id: r.id,
                  name: r.country?.name ?? r.name,
                  x: e.clientX,
                  y: e.clientY,
                })
              }
              onMouseMove={(e) =>
                setHovered((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h))
              }
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleClick(r.id)}
            />
          ))}
        </g>
        <g pointerEvents="none">
          {labels.map((l) => {
            const fontSize = l.tracked ? 11 : 10;
            return (
              <text
                key={l.id + l.text}
                x={l.sx}
                y={l.sy}
                textAnchor="middle"
                fontSize={fontSize}
                fontFamily="var(--font-mono)"
                letterSpacing="0.06em"
                fill={l.tracked ? "var(--foreground)" : "var(--muted-foreground)"}
                stroke="var(--map-ocean)"
                strokeWidth={2.5}
                paintOrder="stroke"
                opacity={l.tracked ? 1 : 0.75}
              >
                {l.text}
              </text>
            );
          })}
        </g>
      </svg>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading geographic data…
        </div>
      )}

      {hovered && (
        <div
          className="pointer-events-none fixed z-50 -translate-y-full rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: hovered.x + 12, top: hovered.y - 8 }}
        >
          <div className="font-medium">{hovered.name}</div>
          {trackedById.get(hovered.id) ? (
            <div className="mt-0.5 font-mono text-[10px] text-primary">
              TRACKED · POP {formatCompact(trackedById.get(hovered.id)!.population)} · CLICK TO OPEN
            </div>
          ) : (
            <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">NOT TRACKED</div>
          )}
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button
          onClick={() => zoomBy(1.6)}
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-panel text-foreground hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => zoomBy(1 / 1.6)}
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-panel text-foreground hover:bg-accent"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={resetZoom}
          aria-label="Reset view"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-panel text-foreground hover:bg-accent"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-md border border-border bg-panel/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-map-tracked" /> tracked country
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-map-land" /> not in database
        </div>
        <div className="mt-1.5 text-primary">
          zoom ×{transform.k.toFixed(1)} · {detailLoaded ? "detailed" : "simplified"} borders
        </div>
      </div>
    </div>
  );
}
