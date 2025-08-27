// Financial Calculator for FUEGO app
// Converted from TypeScript to vanilla JavaScript

class FinancialCalculator {
    constructor(retirementTargetMultiplier = 25) {
        this.retirementTargetMultiplier = retirementTargetMultiplier;
    }

    /**
     * Calculates net salary after taxes
     */
    calculateNetSalary(grossSalary, taxRate) {
        return grossSalary * (1 - taxRate / 100);
    }

    /**
     * Calculates monthly values from annual amounts
     */
    annualToMonthly(annualAmount) {
        return annualAmount / 12;
    }

    /**
     * Calculates annual values from monthly amounts
     */
    monthlyToAnnual(monthlyAmount) {
        return monthlyAmount * 12;
    }

    /**
     * Calculates compound investment growth
     */
    calculateInvestmentGrowth(principal, monthlyContribution, annualReturn, years) {
        const monthlyReturn = annualReturn / 100 / 12;
        const totalMonths = years * 12;
        
        // Future value of principal
        const futurePrincipal = principal * Math.pow(1 + monthlyReturn, totalMonths);
        
        // Future value of annuity (monthly contributions)
        const futureAnnuity = monthlyContribution * 
            ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
        
        return futurePrincipal + futureAnnuity;
    }

    /**
     * Applies decision impact to base values
     */
    applyDecisionImpact(baseSalary, baseTaxRate, baseExpenses, decision, age) {
        // Check if decision is active at this age
        if (age < decision.startAge || (decision.endAge && age > decision.endAge)) {
            return {
                salary: baseSalary,
                taxRate: baseTaxRate,
                expenses: baseExpenses,
                additionalIncome: 0
            };
        }

        const impact = decision.impact;
        
        return {
            salary: baseSalary * (impact.salaryMultiplier || 1),
            taxRate: baseTaxRate + (impact.taxRateChange || 0),
            expenses: baseExpenses + (impact.expensesChange || 0),
            additionalIncome: impact.additionalIncome || 0
        };
    }

    /**
     * Calculates financial independence amount (25x annual expenses rule)
     */
    calculateFINumber(annualExpenses) {
        return annualExpenses * this.retirementTargetMultiplier;
    }

    /**
     * Projects financial journey for a given path
     */
    projectPath(path) {
        const projections = [];
        const currentAge = path.assumptions.currentAge.value;
        const maxAge = 80;
        let totalSavings = 0;
        let investmentValue = path.assumptions.currentSavings.value;

        for (let age = currentAge; age <= maxAge; age++) {
            const year = new Date().getFullYear() + (age - currentAge);
            
            // Start with base assumptions
            let grossSalary = path.assumptions.salary.value;
            let taxRate = path.assumptions.incomeTaxRate.value;
            let monthlyExpenses = path.assumptions.monthlyExpenses.value;
            let additionalIncome = 0;

            // Apply all active decisions
            for (const decision of path.decisions) {
                const impact = this.applyDecisionImpact(grossSalary, taxRate, monthlyExpenses, decision, age);
                grossSalary = impact.salary;
                taxRate = impact.taxRate;
                monthlyExpenses = impact.expenses;
                additionalIncome += impact.additionalIncome;
            }

            const netSalary = this.calculateNetSalary(grossSalary, taxRate);
            const monthlyNetIncome = this.annualToMonthly(netSalary) + additionalIncome;
            const monthlySavings = path.assumptions.monthlySavings.value + additionalIncome;
            const annualSavings = this.monthlyToAnnual(monthlySavings);

            // Update investment value with compound growth
            if (age > currentAge) {
                investmentValue = this.calculateInvestmentGrowth(
                    investmentValue,
                    monthlySavings,
                    path.assumptions.investmentReturn.value,
                    1
                );
            } else {
                investmentValue += annualSavings;
            }

            totalSavings += annualSavings;

            const netWorth = investmentValue;
            const annualExpenses = this.monthlyToAnnual(monthlyExpenses);
            const fiNumber = this.calculateFINumber(annualExpenses);
            const isFinanciallyIndependent = netWorth >= fiNumber;

            const snapshot = {
                age,
                year,
                grossSalary,
                netSalary,
                monthlyExpenses,
                monthlySavings,
                totalSavings,
                investmentValue,
                netWorth,
                isFinanciallyIndependent
            };

            projections.push(snapshot);

            // Set retirement age if first time reaching FI
            if (isFinanciallyIndependent && !path.retirementAge) {
                path.retirementAge = age;
            }
        }

        return projections;
    }

    /**
     * Calculates a score for path optimization (lower is better)
     */
    calculatePathScore(path) {
        const projections = path.projections;
        const retirementSnapshot = projections.find(p => p.isFinanciallyIndependent);
        const currentAge = path.assumptions.currentAge.value;
        
        if (!retirementSnapshot) {
            return 1000; // Penalty for not reaching FI
        }

        // Score based on retirement age (earlier is better) and final wealth
        const ageScore = retirementSnapshot.age - currentAge;
        const wealthBonus = Math.log(retirementSnapshot.netWorth) / 10;
        
        return ageScore - wealthBonus;
    }

    /**
     * Creates default base assumptions
     */
    static createDefaultAssumptions() {
        return {
            currentAge: {
                id: 'currentAge',
                name: 'Current Age',
                value: 25,
                min: 18,
                max: 65,
                step: 1,
                unit: 'years',
                description: 'Your current age'
            },
            salary: {
                id: 'salary',
                name: 'Annual Salary',
                value: 50000,
                min: 20000,
                max: 200000,
                step: 5000,
                unit: '€',
                description: 'Your current gross annual salary'
            },
            incomeTaxRate: {
                id: 'incomeTaxRate',
                name: 'Income Tax Rate',
                value: 30,
                min: 0,
                max: 60,
                step: 1,
                unit: '%',
                description: 'Your effective income tax rate'
            },
            monthlyExpenses: {
                id: 'monthlyExpenses',
                name: 'Monthly Expenses',
                value: 2500,
                min: 500,
                max: 8000,
                step: 100,
                unit: '€',
                description: 'Total monthly living expenses'
            },
            monthlySavings: {
                id: 'monthlySavings',
                name: 'Monthly Savings',
                value: 1000,
                min: 0,
                max: 5000,
                step: 50,
                unit: '€',
                description: 'Amount you save each month'
            },
            currentSavings: {
                id: 'currentSavings',
                name: 'Current Savings',
                value: 10000,
                min: 0,
                max: 500000,
                step: 1000,
                unit: '€',
                description: 'Your existing savings and investments'
            },
            inflationRate: {
                id: 'inflationRate',
                name: 'Inflation Rate',
                value: 2.5,
                min: 0,
                max: 10,
                step: 0.5,
                unit: '%',
                description: 'Expected annual inflation rate'
            },
            investmentReturn: {
                id: 'investmentReturn',
                name: 'Investment Return',
                value: 7,
                min: 0,
                max: 15,
                step: 0.5,
                unit: '%',
                description: 'Expected annual investment return'
            }
        };
    }
}

// Utility functions for formatting
const Formatters = {
    currency: (value) => {
        if (value >= 1000000) {
            return `€${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `€${(value / 1000).toFixed(0)}k`;
        }
        return `€${value.toLocaleString()}`;
    },

    percentage: (value) => {
        return `${value}%`;
    },

    number: (value) => {
        return value.toLocaleString();
    },

    formatSliderValue: (value, unit, formatValue) => {
        if (formatValue) {
            return formatValue(value);
        }
        
        if (unit === '€' && value >= 1000) {
            return `€${(value / 1000).toFixed(0)}k`;
        }
        
        return `${value.toLocaleString()} ${unit}`;
    }
};

// Decision types enum
const DecisionType = {
    SALARY_CHANGE: 'salary_change',
    LOCATION_CHANGE: 'location_change',
    CAREER_PIVOT: 'career_pivot',
    WORK_SCHEDULE: 'work_schedule',
    INVESTMENT_STRATEGY: 'investment_strategy',
    PROPERTY_DECISION: 'property_decision',
    SIDE_INCOME: 'side_income'
};

// Make classes and utilities available globally
if (typeof window !== 'undefined') {
    window.FinancialCalculator = FinancialCalculator;
    window.Formatters = Formatters;
    window.DecisionType = DecisionType;
}
