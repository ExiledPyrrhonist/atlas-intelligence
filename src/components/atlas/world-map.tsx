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

export const RISK_LEVELS = ["low", "moderate", "high", "severe"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

const RISK_FILL: Record<string, string> = {
  low: "var(--risk-low)",
  moderate: "var(--risk-moderate)",
  high: "var(--risk-high)",
  severe: "var(--risk-severe)",
};

export function riskFill(risk: string | null | undefined): string {
  return (risk && RISK_FILL[risk]) || "var(--risk-none)";
}

export const RISK_LABEL: Record<string, string> = {
  low: "Low / stable",
  moderate: "Moderate / elevated",
  high: "High",
  severe: "Severe / active war",
};

function normalizeId(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  return String(value).replace(/^0+/, "");
}

function normalizeName(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
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

/** Map display names used by the atlas topology to ISO alpha-3 codes. */
const NAME_ALIASES: Record<string, string> = {
  kosovo: "XKX",
  "n. cyprus": "CYP",
  somaliland: "SOM",
  "w. sahara": "ESH",
  "united states of america": "USA",
  "dem. rep. congo": "COD",
  "central african rep.": "CAF",
  "s. sudan": "SSD",
  "eq. guinea": "GNQ",
  "bosnia and herz.": "BIH",
  "dominican rep.": "DOM",
  "solomon is.": "SLB",
  "falkland is.": "FLK",
  "fr. s. antarctic lands": "ATF",
};

export function WorldMap({
  countries,
  focusIso,
}: {
  countries: Country[];
  focusIso?: Set<string>;
}) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const [size, setSize] = useState({ width: 960, height: 540 });
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [detailLoaded, setDetailLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<{
    key: string;
    name: string;
    risk: string | null;
    population: number | null;
    tracked: boolean;
    x: number;
    y: number;
  } | null>(null);

  const byNumeric = useMemo(() => {
    const map = new Map<string, Country>();
    countries.forEach((c) => map.set(normalizeId(c.iso_numeric), c));
    return map;
  }, [countries]);

  const byIso3 = useMemo(() => {
    const map = new Map<string, Country>();
    countries.forEach((c) => map.set(c.iso_a3.toUpperCase(), c));
    return map;
  }, [countries]);

  const byName = useMemo(() => {
    const map = new Map<string, Country>();
    countries.forEach((c) => map.set(normalizeName(c.name), c));
    return map;
  }, [countries]);

  const resolveCountry = useCallback(
    (f: CountryFeature): Country | undefined => {
      const numeric = normalizeId(f.id);
      const byNum = numeric ? byNumeric.get(numeric) : undefined;
      if (byNum) return byNum;
      const name = normalizeName(f.properties?.name);
      const alias = NAME_ALIASES[name];
      if (alias) {
        const aliased = byIso3.get(alias);
        if (aliased) return aliased;
      }
      return byName.get(name);
    },
    [byNumeric, byIso3, byName],
  );

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
    return features.map((f, i) => {
      const country = resolveCountry(f);
      return {
        key: `${normalizeId(f.id) || "x"}-${f.properties?.name ?? i}`,
        name: country?.name ?? f.properties?.name ?? "",
        d: path(f) ?? "",
        area: path.area(f),
        centroid: path.centroid(f),
        country,
      };
    });
  }, [features, path, resolveCountry]);

  const openCountry = (country: Country | undefined) => {
    if (!country) return;
    setSelected(country.iso_a3);
    navigate({ to: "/countries/$iso", params: { iso: country.iso_a3 } });
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-map-ocean">
      <svg
        ref={svgRef}
        width={size.width}
        height={size.height}
        className="block touch-none"
        role="img"
        aria-label="Interactive world map coloured by political violence risk"
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
          {rendered.map((r) => {
            const clickable = Boolean(r.country);
            const isSelected = Boolean(r.country && selected === r.country.iso_a3);
            const isHovered = hovered?.key === r.key;
            const inFocus = Boolean(r.country && (!focusIso || focusIso.has(r.country.iso_a3)));
            return (
              <path
                key={r.key}
                d={r.d}
                data-iso={r.country?.iso_a3 ?? undefined}
                data-name={r.name}
                fill={riskFill(r.country?.political_violence_risk)}
                fillOpacity={inFocus ? (isHovered ? 1 : 0.9) : 0.35}
                stroke={
                  isSelected
                    ? "var(--primary)"
                    : isHovered
                      ? "var(--foreground)"
                      : "var(--map-stroke)"
                }
                strokeWidth={(isSelected ? 2 : isHovered ? 1.4 : 0.6) / transform.k}
                className={clickable ? "cursor-pointer" : "cursor-default"}
                onPointerDown={(e) => {
                  pointerStart.current = { x: e.clientX, y: e.clientY };
                }}
                onMouseEnter={(e) =>
                  setHovered({
                    key: r.key,
                    name: r.name,
                    risk: r.country?.political_violence_risk ?? null,
                    population: r.country?.population ?? null,
                    tracked: clickable,
                    x: e.clientX,
                    y: e.clientY,
                  })
                }
                onMouseMove={(e) =>
                  setHovered((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h))
                }
                onMouseLeave={() => setHovered(null)}
                onClick={(e) => {
                  const start = pointerStart.current;
                  pointerStart.current = null;
                  if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4) return;
                  openCountry(r.country);
                }}
              />
            );
          })}
        </g>
      </svg>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-[0.9375rem] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading geographic data…
        </div>
      )}

      {hovered && (
        <div
          className="pointer-events-none fixed z-50 -translate-y-full rounded-xl border border-border/60 bg-popover px-2.5 py-1.5 text-sm shadow-lg"
          style={{ left: hovered.x + 12, top: hovered.y - 8 }}
        >
          <div className="font-semibold">{hovered.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: riskFill(hovered.risk) }}
            />
            {hovered.risk ? RISK_LABEL[hovered.risk] : "No risk data"}
          </div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            {hovered.tracked
              ? `${hovered.population ? `Population ${formatCompact(hovered.population)} · ` : ""}Click to open profile`
              : "No database record"}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button
          onClick={() => zoomBy(1.6)}
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-panel text-foreground hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => zoomBy(1 / 1.6)}
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-panel text-foreground hover:bg-accent"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={resetZoom}
          aria-label="Reset view"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-panel text-foreground hover:bg-accent"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-border/60 bg-panel/90 px-3 py-2 text-[13px] text-muted-foreground backdrop-blur">
        <div className="mb-1.5 font-semibold text-foreground">Political violence risk</div>
        {RISK_LEVELS.map((level) => (
          <div key={level} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: riskFill(level) }}
            />
            {RISK_LABEL[level]}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: riskFill(null) }}
          />
          No data
        </div>
        <div className="mt-1.5 text-primary">
          Zoom ×{transform.k.toFixed(1)} · {detailLoaded ? "detailed" : "simplified"} borders
        </div>
      </div>
    </div>
  );
}
