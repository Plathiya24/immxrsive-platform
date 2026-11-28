import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type MouseEvent } from "react";
import { ecosystemEntities } from "../data/ecosystem";
import type { EcosystemEntity } from "../types/ecosystem";

const nodes = {
  "computer-science": ["Algoma", "Computer Science Lab"],
  "digital-twins": ["Algoma", "Digital Twins Lab"],
  "gamejam-studio": ["Startup GameJam", "Spatial Studio team"],
  "gamejam-training": ["Startup GameJam", "XR Training team"],
  "altitude-venture": ["Altitude Accelerator", "Simulation venture"],
  "altitude-visualization": ["Altitude Accelerator", "Visualization venture"],
  "xr-partner": ["XR Accelerator", "Industry partner"],
} satisfies Record<string, [string, string]>;

const desktop = [[120, 123], [120, 317], [430, 123], [430, 317], [740, 76], [740, 220], [740, 364]];
const phone = [[110, 63], [320, 63], [110, 193], [320, 193], [110, 323], [320, 323], [215, 453]];
const edges = ecosystemEntities.flatMap(entity => entity.connectedIds
  .filter(id => entity.id < id)
  .map(id => ({ from: entity.id, to: id })));

type Props = {
  selected: EcosystemEntity;
  onSelect: (entity: EcosystemEntity) => void;
};

function Diagram({ selected, onSelect, compact = false }: Props & { compact?: boolean }) {
  const reduce = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const positions = new Map(ecosystemEntities.map((entity, index) => [entity.id, (compact ? phone : desktop)[index]]));
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 235, damping: 25 };
  const halfWidth = compact ? 91 : 105;

  function follow(event: MouseEvent<Element>, entity: EcosystemEntity) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onSelect(entity);
  }

  return (
    <svg
      className={compact ? "ecosystem-diagram ecosystem-diagram-phone" : "ecosystem-diagram ecosystem-diagram-desktop"}
      viewBox={compact ? "0 0 430 510" : "0 0 860 438"}
      aria-label="Ecosystem connections. Select a lab, team, or venture."
      role="group"
    >
      <g aria-hidden="true">
        {edges.map(({ from, to }) => {
          const [x1, y1] = positions.get(from)!;
          const [x2, y2] = positions.get(to)!;
          const isRelated = from === selected.id || to === selected.id;
          const bend = x1 === x2 ? (x1 < 250 ? x1 + halfWidth + 34 : x1 - halfWidth - 34) : (x1 + x2) / 2;
          const line = `M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}`;
          return (
            <g key={from + "-" + to} fill="none" strokeWidth="1.5">
              <path d={line} className="ecosystem-edge" />
              <motion.path
                d={line}
                className="ecosystem-edge-active"
                data-highlight={isRelated}
                initial={false}
                animate={hydrated ? { opacity: isRelated ? 1 : 0 } : undefined}
                transition={spring}
              />
            </g>
          );
        })}
      </g>
      {ecosystemEntities.map(entity => {
        const [x, y] = positions.get(entity.id)!;
        const [group, name] = nodes[entity.id as keyof typeof nodes];
        const active = entity.id === selected.id;
        const linked = selected.connectedIds.includes(entity.id);
        return (
          <a
            key={entity.id}
            href={entity.href}
            aria-label={entity.name}
            aria-current={active ? "true" : undefined}
            className="ecosystem-node"
            onClick={event => follow(event, entity)}
          >
            <g transform={`translate(${x} ${y})`}>
              <motion.rect
                x={-halfWidth}
                y={-36}
                width={halfWidth * 2}
                height="72"
                rx="14"
                className="ecosystem-node-card"
                data-linked={linked}
                initial={false}
                animate={hydrated ? { scale: active && !reduce ? 1.045 : 1 } : undefined}
                transition={spring}
              />
              <text textAnchor="middle" className="ecosystem-node-group" y="-7">{group}</text>
              <text textAnchor="middle" className="ecosystem-node-label" y="15">{name}</text>
            </g>
          </a>
        );
      })}
    </svg>
  );
}

export function EcosystemMap(props: Props) {
  return (
    <MotionConfig reducedMotion="user">
      <Diagram {...props} />
      <Diagram {...props} compact />
    </MotionConfig>
  );
}
