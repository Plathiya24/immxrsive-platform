export const pillars = {
  talent: "Student Talent",
  "xr-lab": "XR Labs",
  research: "Research & Digital Twins",
  incubator: "Entrepreneurship Incubator",
  industry: "Industry Collaboration",
} as const;

export type EcosystemPillar = keyof typeof pillars;

export type EcosystemEntity = {
  id: string;
  name: string;
  pillar: EcosystemPillar;
  status: "live" | "open" | "cohort-active";
  tags: string[];
  href: string;
  connectedIds: string[];
  summary?: string;
  resource?: { href: string; label: string };
};

export const statuses: Record<EcosystemEntity["status"], string> = {
  live: "Live",
  open: "Open",
  "cohort-active": "Cohort active",
};
