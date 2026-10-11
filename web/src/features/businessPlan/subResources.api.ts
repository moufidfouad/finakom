import {
  BusinessPlanInvestment,
  InvestmentInput,
  BusinessPlanFunding,
  FundingInput,
  BusinessPlanSupplier,
  BusinessPlanSupplierInput,
  BusinessPlanPLLine,
  PLLineInput,
  BusinessPlanCashflowLine,
  CashflowLineInput,
  BusinessPlanBalanceLine,
  BalanceLineInput,
} from "@/types";
import { createBusinessPlanSubResourceHooks } from "./createSubResourceHooks";

export const investmentsApi = createBusinessPlanSubResourceHooks<
  BusinessPlanInvestment,
  InvestmentInput
>("investments", "bp-investments");
export const fundingsApi = createBusinessPlanSubResourceHooks<
  BusinessPlanFunding,
  FundingInput
>("fundings", "bp-fundings");
export const suppliersApi = createBusinessPlanSubResourceHooks<
  BusinessPlanSupplier,
  BusinessPlanSupplierInput
>("suppliers", "bp-suppliers");
export const plLinesApi = createBusinessPlanSubResourceHooks<
  BusinessPlanPLLine,
  PLLineInput
>("pl-lines", "bp-pl-lines");
export const cashflowApi = createBusinessPlanSubResourceHooks<
  BusinessPlanCashflowLine,
  CashflowLineInput
>("cashflow-lines", "bp-cashflow-lines");
export const balanceApi = createBusinessPlanSubResourceHooks<
  BusinessPlanBalanceLine,
  BalanceLineInput
>("balance-lines", "bp-balance-lines");
