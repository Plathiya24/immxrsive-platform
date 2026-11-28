"use client";

import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { ecosystemEntities } from "../data/ecosystem";
import { pillars, statuses, type EcosystemEntity, type EcosystemPillar } from "../types/ecosystem";

export type PaletteScope = { pillar: EcosystemPillar } | { relatedTo: EcosystemEntity };

type Props = {
  initialScope?: PaletteScope;
  onClose: () => void;
  onNavigate: (entity: EcosystemEntity) => void;
};

export function CommandPalette({ initialScope, onClose, onNavigate }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [scope, setScope] = useState(initialScope);
  const scopeLabel = scope && ("pillar" in scope
    ? pillars[scope.pillar]
    : "Related to " + scope.relatedTo.name);

  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const groups = (Object.keys(pillars) as EcosystemPillar[]).map(pillar => ({
    pillar,
    entities: ecosystemEntities.filter(entity => {
      if (entity.pillar !== pillar) return false;
      if (scope && ("pillar" in scope
        ? entity.pillar !== scope.pillar
        : !scope.relatedTo.connectedIds.includes(entity.id))) return false;
      const searchable = [entity.name, pillars[pillar], statuses[entity.status], ...entity.tags].join(" ").toLowerCase();
      return terms.every(term => searchable.includes(term));
    }),
  })).filter(group => group.entities.length);
  const results = groups.flatMap(group => group.entities);
  const optionId = (id: string) => listId + "-" + id;
  const selectedId = results[active] ? optionId(results[active].id) : undefined;

  useLayoutEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    modal.showModal();
    input.current?.focus();
    return () => modal.close();
  }, []);

  useEffect(() => {
    if (selectedId) document.getElementById(selectedId)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || !results.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActive(index => (index + direction + results.length) % results.length);
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      onNavigate(results[active]);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <dialog
        ref={dialog}
        className="ecosystem-palette"
        aria-labelledby={titleId}
        onCancel={event => { event.preventDefault(); onClose(); }}
        onKeyDown={event => {
          if (event.key === "Escape" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            onClose();
          }
        }}
        onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      >
        <motion.section
          className="ecosystem-palette-panel"
          initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
        >
          <div className="ecosystem-palette-top">
            <h2 id={titleId}>Search the ecosystem</h2>
            <button type="button" className="ecosystem-palette-close secondary" onClick={onClose} aria-label="Close search">
              <kbd aria-hidden="true">Esc</kbd>
              <span aria-hidden="true">×</span>
            </button>
          </div>
          {scopeLabel && (
            <button
              type="button"
              className="ecosystem-palette-scope secondary"
              aria-label={scopeLabel + ". Clear filter"}
              onClick={() => { setScope(undefined); setActive(0); input.current?.focus(); }}
            >
              {scopeLabel} <span aria-hidden="true">×</span>
            </button>
          )}
          <div className="ecosystem-palette-field">
            <span className="ecosystem-search-icon" aria-hidden="true" />
            <input
              ref={input}
              type="search"
              role="combobox"
              autoComplete="off"
              spellCheck={false}
              aria-label="Search ecosystem records"
              aria-controls={listId}
              aria-expanded="true"
              aria-autocomplete="list"
              aria-activedescendant={selectedId}
              placeholder="Find a lab, demo, or venture"
              value={query}
              onChange={event => { setQuery(event.target.value); setActive(0); }}
              onKeyDown={handleKey}
            />
          </div>
          <p className="ecosystem-palette-count" role="status">
            {results.length ? `${results.length} ${results.length === 1 ? "result" : "results"}` : "No matching records. Try a name or topic."}
          </p>
          <div id={listId} role="listbox" aria-label="Matching ecosystem records" className="ecosystem-palette-results">
            {groups.map(({ pillar, entities }) => (
              <div key={pillar} role="group" aria-label={pillars[pillar]}>
                <h3 aria-hidden="true">{pillars[pillar]}</h3>
                {entities.map(entity => (
                  <div
                    key={entity.id}
                    id={optionId(entity.id)}
                    role="option"
                    aria-selected={entity.id === results[active]?.id}
                    className="ecosystem-palette-option"
                    onPointerMove={event => {
                      if (event.pointerType !== "touch" && matchMedia("(hover: hover) and (pointer: fine)").matches) {
                        setActive(results.indexOf(entity));
                      }
                    }}
                    onClick={() => onNavigate(entity)}
                  >
                    <span>{entity.name}</span>
                    <small>{statuses[entity.status]}</small>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.section>
      </dialog>
    </MotionConfig>
  );
}
