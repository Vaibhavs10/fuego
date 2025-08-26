// Core data models for FUEGO retirement planning app

export interface Assumption {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
}

export interface BaseAssumptions {
  currentAge: Assumption;
  salary: Assumption;
  incomeTaxRate: Assumption;
  monthlyExpenses: Assumption;
  monthlySavings: Assumption;
  currentSavings: Assumption;
  inflationRate: Assumption;
  investmentReturn: Assumption;
}

export enum DecisionType {
  SALARY_CHANGE = 'salary_change',
  LOCATION_CHANGE = 'location_change',
  CAREER_PIVOT = 'career_pivot',
  WORK_SCHEDULE = 'work_schedule',
  INVESTMENT_STRATEGY = 'investment_strategy',
  PROPERTY_DECISION = 'property_decision',
  SIDE_INCOME = 'side_income'
}

export interface Decision {
  id: string;
  type: DecisionType;
  name: string;
  description: string;
  startAge: number;
  endAge?: number; // Optional for permanent decisions
  impact: {
    salaryMultiplier?: number;
    taxRateChange?: number;
    expensesChange?: number;
    additionalIncome?: number;
    oneTimePayment?: number;
  };
}

export interface FinancialSnapshot {
  age: number;
  year: number;
  grossSalary: number;
  netSalary: number;
  monthlyExpenses: number;
  monthlySavings: number;
  totalSavings: number;
  investmentValue: number;
  netWorth: number;
  isFinanciallyIndependent: boolean;
}

export interface Path {
  id: string;
  name: string;
  description: string;
  decisions: Decision[];
  assumptions: BaseAssumptions;
  projections: FinancialSnapshot[];
  retirementAge?: number;
  targetAmount: number;
  score: number; // Optimization score
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  baseAssumptions: Partial<BaseAssumptions>;
  suggestedDecisions: Decision[];
  tags: string[];
}

export interface ComparisonResult {
  paths: Path[];
  metrics: {
    retirementAge: number[];
    totalWealth: number[];
    yearlySavings: number[];
    riskScore: number[];
  };
}

export interface OptimizationGoal {
  type: 'retire_by_age' | 'achieve_amount' | 'maximize_wealth';
  targetAge?: number;
  targetAmount?: number;
  constraints: {
    minSalary?: number;
    maxRiskLevel?: number;
    locationPreferences?: string[];
  };
}
