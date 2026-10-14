// Static sample data for the landing page's product visuals. Totals are derived
// from these rows so every figure on the page stays internally consistent.

export type Owner = { name: string; initials: string; tone: Tone };
export type Tone = 'clay' | 'iris' | 'sand' | 'slate' | 'plum';

export const owners = {
  priya: { name: 'Priya Shah', initials: 'PS', tone: 'clay' },
  marcus: { name: 'Marcus Reed', initials: 'MR', tone: 'slate' },
  jordan: { name: 'Jordan Lee', initials: 'JL', tone: 'iris' },
} satisfies Record<string, Owner>;

export type Company = { name: string; tone: Tone };
export const companies = {
  northwind: { name: 'Northwind Traders', tone: 'slate' },
  lumen: { name: 'Lumen Labs', tone: 'iris' },
  brightpath: { name: 'Brightpath Schools', tone: 'sand' },
  halcyon: { name: 'Halcyon Health', tone: 'plum' },
  kestrel: { name: 'Kestrel Analytics', tone: 'clay' },
  atlas: { name: 'Atlas Freight', tone: 'sand' },
} satisfies Record<string, Company>;

export type Deal = {
  name: string;
  company: Company;
  value: number;
  close: string;
  owner: Owner;
  overdue?: boolean;
};

export type Stage = { id: string; name: string; probability: number; deals: Deal[] };

export const pipeline: Stage[] = [
  {
    id: 'lead',
    name: 'Lead',
    probability: 0.1,
    deals: [
      { name: 'Fleet telematics pilot', company: companies.atlas, value: 18_000, close: 'Dec 4', owner: owners.marcus },
      { name: 'Clinic rollout', company: companies.halcyon, value: 26_000, close: 'Dec 12', owner: owners.priya },
      { name: 'Warehouse add-on', company: companies.kestrel, value: 12_500, close: 'Dec 18', owner: owners.jordan },
    ],
  },
  {
    id: 'qualified',
    name: 'Qualified',
    probability: 0.25,
    deals: [
      { name: 'Annual platform renewal', company: companies.northwind, value: 42_000, close: 'Nov 21', owner: owners.priya },
      { name: 'Design team seats', company: companies.lumen, value: 16_800, close: 'Nov 30', owner: owners.marcus },
      { name: 'Regional expansion', company: companies.brightpath, value: 31_500, close: 'Dec 9', owner: owners.jordan },
    ],
  },
  {
    id: 'proposal',
    name: 'Proposal',
    probability: 0.5,
    deals: [
      { name: 'Enterprise workspace', company: companies.halcyon, value: 64_000, close: 'Nov 6', owner: owners.priya },
      { name: 'Support retainer', company: companies.kestrel, value: 22_000, close: 'Nov 13', owner: owners.marcus },
    ],
  },
  {
    id: 'negotiation',
    name: 'Negotiation',
    probability: 0.75,
    deals: [
      { name: 'Multi-year agreement', company: companies.northwind, value: 96_000, close: 'Oct 10', owner: owners.jordan, overdue: true },
      { name: 'Onboarding package', company: companies.brightpath, value: 14_500, close: 'Oct 29', owner: owners.priya },
    ],
  },
  {
    id: 'won',
    name: 'Won',
    probability: 1,
    deals: [
      { name: 'Logistics suite', company: companies.atlas, value: 48_000, close: 'Oct 9', owner: owners.marcus },
      { name: 'Analytics seats', company: companies.lumen, value: 24_000, close: 'Oct 2', owner: owners.priya },
    ],
  },
];

const sum = (deals: Deal[]) => deals.reduce((total, deal) => total + deal.value, 0);
export const stageTotal = (stage: Stage) => sum(stage.deals);
export const stageWeighted = (stage: Stage) => Math.round(sum(stage.deals) * stage.probability);

const openStages = pipeline.filter(stage => stage.id !== 'won');
export const openPipeline = openStages.reduce((total, stage) => total + stageTotal(stage), 0);
export const weightedForecast = openStages.reduce((total, stage) => total + stageWeighted(stage), 0);
export const wonThisMonth = stageTotal(pipeline[pipeline.length - 1]);

export const usd = (value: number, compact = false) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: compact && value >= 1000 ? 1 : 0,
    ...(compact ? { notation: 'compact' as const } : {}),
  }).format(value);

// Won revenue by month (USD), oldest first, ending in October 2026.
export const wonByMonth = [
  { month: 'Nov', value: 31_200 },
  { month: 'Dec', value: 38_400 },
  { month: 'Jan', value: 29_800 },
  { month: 'Feb', value: 44_100 },
  { month: 'Mar', value: 41_600 },
  { month: 'Apr', value: 52_300 },
  { month: 'May', value: 48_900 },
  { month: 'Jun', value: 57_200 },
  { month: 'Jul', value: 61_800 },
  { month: 'Aug', value: 58_400 },
  { month: 'Sep', value: 66_700 },
  { month: 'Oct', value: 72_000 },
];
export const wonLast12 = wonByMonth.reduce((total, row) => total + row.value, 0);
