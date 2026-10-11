export interface RawBalanceLine {
  accountNumber: string;
  label?: string | null;
  debitN: number;
  creditN: number;
  debitN1: number;
  creditN1: number;
}

export interface EnrichedBalanceLine extends RawBalanceLine {
  classe: string;
  soldeNetN: number;
  soldeNetN1: number;
}

export interface PosteDefinition {
  ref: string;
  label: string;
  prefixes: string[];
  sign?: 1 | -1;
}

export type Appreciation = string;

export interface RatioResult {
  label: string;
  n: number | null;
  n1: number | null;
  norme: string;
  appreciation: Appreciation;
}
