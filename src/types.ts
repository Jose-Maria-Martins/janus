export type Company = {
  nif: string;
  name: string;
  sector: string;
  cae: string;
  employees: number;
  annualPayroll: number;
  city: string;
  revenueBand: string;
};

export type Insurer = { id: string; name: string; initials: string; color: string; logo: string };

export type PolicyType =
  | 'work_accident'
  | 'vehicles'
  | 'multirisk'
  | 'liability'
  | 'health'
  | 'cyber'
  | 'business_interruption'
  | 'vehicles_own_damage'
  | 'tools_equipment';

export type Vehicle = { plate: string; model: string; year: number };

export type Policy = {
  id: string;
  type: PolicyType;
  insurerId: string;
  policyNumber: string;
  annualPremium: number;
  paymentFrequency: 'annual' | 'quarterly' | 'monthly';
  startDate: string;
  renewalDate: string;
  covered: { name: string; limit?: string; deductible?: string }[];
  notCovered: string[];
  questions: { q: string; a: string; clause: string }[];
  vehicles?: Vehicle[];
};

export type Quote = { id: string; policyType: PolicyType; insurerId: string; annualPremium: number; highlights: string[] };
export type Gap = { type: PolicyType; title: string; message: string; protectsAgainst: string };
export type Payment = { id: string; policyId: string; date: string; amount: number; status: 'paid' | 'upcoming' };
export type Claim = {
  id: string;
  policyId: string;
  title: string;
  date: string;
  status: 'in_progress' | 'paid';
  amount?: number;
  steps: { label: string; date?: string; done: boolean }[];
};
export type TeamMember = { name: string; role: string; access: 'Admin' | 'View only' };
/** `live` answers are worked out from the current policies; `a` is the text as of the mock data. */
export type AssistantAnswer = { q: string; a: string; source: string; live?: 'renewal' | 'total' };
export type Activity = {
  date: string;
  type: 'reminder' | 'claim' | 'payment' | 'certificate' | 'change' | 'import';
  text: string;
  amount?: number;
  policyId?: string;
  claimId?: string;
};

/** A certificate made in the app, for a client, bank or tender. */
export type Certificate = { id: string; policyId: string; recipient: string; date: string };

export type MockData = {
  anchorDate: string;
  company: Company;
  insurers: Insurer[];
  policies: Policy[];
  importSample: Policy;
  gaps: Gap[];
  quotes: Quote[];
  payments: Payment[];
  claims: Claim[];
  team: TeamMember[];
  assistant: AssistantAnswer[];
  activity: Activity[];
};
