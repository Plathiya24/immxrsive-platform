import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { pillars, type EcosystemEntity, type EcosystemPillar } from "../types/ecosystem";

const descriptions: Record<EcosystemPillar, string> = {
  talent: "Student teams and XR demos",
  "xr-lab": "Immersive prototyping and simulation",
  research: "Applied computing and digital twins",
  incubator: "Accelerator cohorts and ventures",
  industry: "Industry partners and pilot opportunities",
};

const icons: Record<EcosystemPillar, string> = {
  talent: "M2 8l10-5 10 5-10 5-10-5zm4 2v6c4 3 8 3 12 0v-6m4-2v8",
  "xr-lab": "M12 2l9 5v10l-9 5-9-5V7l9-5zM3 7l9 5 9-5m-9 5v10",
  research: "M8 3h8m-6 0v7l-6 9a1 1 0 001 2h14a1 1 0 001-2l-6-9V3M7 15h10",
  incubator: "M3 19l5-5 4 2 7-9m-5 0h5v5M4 21h16",
  industry: "M7 7l3-3h4l3 3m-14 5l4-5 4 2 3-2h3l4 5-7 7a2 2 0 01-3 0l-8-7zM7 15l2-2m1 5l2-2",
};

const pillarIds = Object.keys(pillars) as EcosystemPillar[];
const desktopColumns: Record<EcosystemPillar, number> = {
  talent: 0, research: 0, "xr-lab": 1, incubator: 2, industry: 2,
};

type Edge = { from: EcosystemPillar; to: EcosystemPillar };
type Card = { left: number; right: number; top: number; bottom: number; x: number; y: number };

function getEdges(entities: EcosystemEntity[]) {
  const byId = new Map(entities.map(entity => [entity.id, entity]));
  const edges = new Map<string, Edge>();
  for (const entity of entities) {
    for (const id of entity.connectedIds) {
      const related = byId.get(id);
      if (!related || related.pillar === entity.pillar) continue;
      const [from, to] = [entity.pillar, related.pillar].sort();
      edges.set(from + ":" + to, { from, to });
    }
  }
  return Array.from(edges.values());
}

function desktopPath(edge: Edge, from: Card, to: Card, width: number) {
  const delta = desktopColumns[edge.to] - desktopColumns[edge.from];
  if (delta === 0) {
    const [upper, lower] = from.y < to.y ? [from, to] : [to, from];
    const mid = (upper.bottom + lower.top) / 2;
    return `M ${upper.x} ${upper.bottom} C ${upper.x} ${mid}, ${lower.x} ${mid}, ${lower.x} ${lower.top}`;
  }
  const [left, right] = delta > 0 ? [from, to] : [to, from];
  if (Math.abs(delta) === 2) {
    if (Math.abs(left.y - right.y) < 12) {
      return `M ${left.x} ${left.top} C ${left.x} 4, ${right.x} 4, ${right.x} ${right.top}`;
    }
    const [upper, lower] = left.y < right.y ? [left, right] : [right, left];
    const rail = left.y < right.y ? width - 10 : 10;
    const edgeX = left.y < right.y ? lower.right : lower.left;
    return `M ${upper.x} ${upper.top} C ${upper.x} 8, ${upper.x} 8, ${upper.x + (rail - upper.x) * .25} 8
      L ${rail} 8 Q ${rail} 8, ${rail} 24 L ${rail} ${lower.y - 10} Q ${rail} ${lower.y}, ${edgeX} ${lower.y}`;
  }
  const alignedY = desktopColumns[edge.from] === 1 ? to.y : from.y;
  const y1 = Math.max(left.top + 16, Math.min(left.bottom - 16, alignedY));
  const y2 = Math.max(right.top + 16, Math.min(right.bottom - 16, alignedY));
  const mid = (left.right + right.left) / 2;
  return `M ${left.right} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${right.left} ${y2}`;
}

type Props = {
  entities: EcosystemEntity[];
  onExplore: (pillar: EcosystemPillar) => void;
  onHighlight: (pillar: EcosystemPillar | undefined) => void;
};

export function EcosystemConnectionMap({ entities, onExplore, onHighlight }: Props) {
  const title = useId();
  const instructions = useId();
  const reduceMotion = useReducedMotion();
  const plot = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<EcosystemPillar, HTMLButtonElement>());
  const [selection, setSelection] = useState<EcosystemPillar>();
  const [hovered, setHovered] = useState<EcosystemPillar>();
  const [paths, setPaths] = useState<{ edge: Edge; d: string }[]>([]);
  const edges = useMemo(() => getEdges(entities), [entities]);
  const active = hovered ?? selection;
  useEffect(() => { onHighlight(active); }, [active, onHighlight]);
  const neighbors = new Set<EcosystemPillar>();
  for (const edge of edges) {
    if (edge.from === active) neighbors.add(edge.to);
    if (edge.to === active) neighbors.add(edge.from);
  }
  const selectedConnections = selection && edges.flatMap(edge => {
    if (edge.from === selection) return [pillars[edge.to]];
    if (edge.to === selection) return [pillars[edge.from]];
    return [];
  });

  useEffect(() => {
    const container = plot.current;
    if (!container) return;
    const desktop = matchMedia("(min-width: 768px)");
    function measure() {
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      const layout = new Map(Array.from(cards.current, ([id, element]) => {
        const rect = element.getBoundingClientRect();
        const left = rect.left - bounds.left;
        const top = rect.top - bounds.top;
        return [id, { left, top, right: left + rect.width, bottom: top + rect.height,
          x: left + rect.width / 2, y: top + rect.height / 2 }];
      }));
      setPaths(edges.flatMap((edge, index) => {
        const from = layout.get(edge.from);
        const to = layout.get(edge.to);
        if (!from || !to) return [];
        const lane = 10 + (index % 7) * 2;
        return [{
          edge,
          d: desktop.matches ? desktopPath(edge, from, to, bounds.width)
            : `M ${from.left} ${from.y} H ${lane} V ${to.y} H ${to.left}`,
        }];
      }));
    }
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(container);
    cards.current.forEach(card => resize.observe(card));
    desktop.addEventListener("change", measure);
    return () => {
      resize.disconnect();
      desktop.removeEventListener("change", measure);
    };
  }, [edges]);

  return (
    <section className="map-board" aria-labelledby={title} aria-describedby={instructions}>
      <div className="connection-map-heading">
        <h2 id={title}>Ecosystem connections</h2>
        <p id={instructions}>Select a pillar to trace its connections. Open a highlighted pillar to browse its records.</p>
      </div>
      <p className="sr-only" role="status">
        {selection && selectedConnections?.length
          ? pillars[selection] + " connects to " + selectedConnections.join(", ") + "."
          : ""}
      </p>
      <div ref={plot} className="connection-map relative isolate grid">
        <svg className="connection-map-lines" aria-hidden="true" focusable="false">
          {paths.map(({ edge, d }) => {
            const highlighted = edge.from === active || edge.to === active;
            return (
              <g key={edge.from + ":" + edge.to}>
                <path className="connection-map-line" d={d} />
                {reduceMotion ? (
                  <path className="connection-map-line-highlight" d={d} opacity={highlighted ? 1 : 0} />
                ) : (
                  <motion.path
                    className="connection-map-line-highlight"
                    d={d}
                    initial={false}
                    animate={{ opacity: highlighted ? 1 : 0, pathLength: highlighted ? 1 : 0 }}
                    transition={{ opacity: { duration: .16 }, pathLength: { type: "spring", stiffness: 155, damping: 25 } }}
                  />
                )}
              </g>
            );
          })}
        </svg>
        {pillarIds.map(pillar => {
          const related = neighbors.has(pillar);
          const count = entities.filter(entity => entity.pillar === pillar).length;
          const state = active === pillar ? "active" : related ? "related" : active ? "muted" : undefined;
          return (
            <button
              key={pillar}
              ref={element => { if (element) cards.current.set(pillar, element); else cards.current.delete(pillar); }}
              type="button"
              className="connection-map-node relative flex min-w-0 flex-col items-start text-left"
              data-pillar={pillar}
              data-state={state}
              aria-pressed={selection === pillar}
              aria-haspopup="dialog"
              onPointerEnter={event => {
                if (event.pointerType !== "touch" && matchMedia("(hover: hover) and (pointer: fine)").matches) {
                  setHovered(pillar);
                }
              }}
              onPointerLeave={() => setHovered(undefined)}
              onPointerCancel={() => setHovered(undefined)}
              onClick={() => {
                if (active === pillar || related) {
                  setHovered(undefined);
                  onExplore(pillar);
                } else {
                  setSelection(pillar);
                }
              }}
              onKeyDown={event => {
                if (event.key === "Escape") {
                  setSelection(undefined);
                  setHovered(undefined);
                }
              }}
            >
              <span className="connection-map-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d={icons[pillar]} /></svg>
              </span>
              <span className="connection-map-name">{pillars[pillar]}</span>
              <span className="connection-map-description">{descriptions[pillar]}</span>
              <span className="connection-map-count">{count} {count === 1 ? "record" : "records"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
