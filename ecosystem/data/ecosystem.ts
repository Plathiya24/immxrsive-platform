import type { EcosystemEntity } from "../types/ecosystem";

// Illustrative relationships and statuses for the ecosystem preview.
const records: Omit<EcosystemEntity, "href">[] = [
  {
    id: "computer-science",
    name: "Algoma Computer Science Lab",
    pillar: "research",
    status: "live",
    tags: ["Algoma University", "Applied computing", "Student research"],
    connectedIds: ["digital-twins", "gamejam-studio"],
  },
  {
    id: "digital-twins",
    name: "Algoma Digital Twins Lab",
    pillar: "xr-lab",
    status: "open",
    tags: ["Simulation", "Digital twins", "XR"],
    connectedIds: ["computer-science", "gamejam-training", "altitude-venture", "altitude-visualization"],
  },
  {
    id: "gamejam-studio",
    name: "Startup GameJam · Spatial Studio team",
    pillar: "talent",
    status: "cohort-active",
    tags: ["GameJam", "Spatial design", "Prototyping"],
    connectedIds: ["computer-science", "altitude-venture"],
  },
  {
    id: "gamejam-training",
    name: "Startup GameJam · XR Training team",
    pillar: "talent",
    status: "cohort-active",
    tags: ["GameJam", "XR training", "Immersive learning"],
    connectedIds: ["digital-twins", "altitude-visualization", "xr-partner"],
  },
  {
    id: "altitude-venture",
    name: "Altitude Accelerator · Simulation venture",
    pillar: "incubator",
    status: "cohort-active",
    tags: ["Startup", "Simulation", "Venture development"],
    connectedIds: ["digital-twins", "gamejam-studio", "xr-partner"],
  },
  {
    id: "altitude-visualization",
    name: "Altitude Accelerator · Visualization venture",
    pillar: "incubator",
    status: "cohort-active",
    tags: ["Startup", "Visualization", "Industrial design"],
    connectedIds: ["digital-twins", "gamejam-training"],
  },
  {
    id: "xr-partner",
    name: "XR Accelerator · Industry partner",
    pillar: "industry",
    status: "open",
    tags: ["Industry", "Pilots", "XR mentoring"],
    connectedIds: ["gamejam-training", "altitude-venture"],
  },
];

export const ecosystemEntities: EcosystemEntity[] = records.map(record => ({
  ...record,
  href: "/ecosystem#" + record.id,
}));

export const entityById = new Map(ecosystemEntities.map(entity => [entity.id, entity]));
