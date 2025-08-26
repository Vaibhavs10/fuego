import React from 'react';
import { BaseAssumptions } from '../types';
import Slider from './Slider';

interface AssumptionsPanelProps {
  assumptions: BaseAssumptions;
  onChange: (assumptions: BaseAssumptions) => void;
}

export const AssumptionsPanel: React.FC<AssumptionsPanelProps> = ({
  assumptions,
  onChange
}) => {
  const handleAssumptionChange = (key: keyof BaseAssumptions, newValue: number) => {
    const updatedAssumptions = {
      ...assumptions,
      [key]: {
        ...assumptions[key],
        value: newValue
      }
    };
    onChange(updatedAssumptions);
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}k`;
    }
    return `€${value.toLocaleString()}`;
  };

  const formatPercentage = (value: number): string => {
    return `${value}%`;
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl border-2 border-black">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">⚙️</span>
        Your Assumptions
      </h2>
      
      <div className="space-y-4">
        <Slider
          label={assumptions.currentAge.name}
          value={assumptions.currentAge.value}
          min={assumptions.currentAge.min}
          max={assumptions.currentAge.max}
          step={assumptions.currentAge.step}
          unit={assumptions.currentAge.unit}
          description={assumptions.currentAge.description}
          onChange={(value) => handleAssumptionChange('currentAge', value)}
        />

        <Slider
          label={assumptions.currentSavings.name}
          value={assumptions.currentSavings.value}
          min={assumptions.currentSavings.min}
          max={assumptions.currentSavings.max}
          step={assumptions.currentSavings.step}
          unit={assumptions.currentSavings.unit}
          description={assumptions.currentSavings.description}
          onChange={(value) => handleAssumptionChange('currentSavings', value)}
          formatValue={formatCurrency}
        />

        <Slider
          label={assumptions.salary.name}
          value={assumptions.salary.value}
          min={assumptions.salary.min}
          max={assumptions.salary.max}
          step={assumptions.salary.step}
          unit={assumptions.salary.unit}
          description={assumptions.salary.description}
          onChange={(value) => handleAssumptionChange('salary', value)}
          formatValue={formatCurrency}
        />

        <Slider
          label={assumptions.incomeTaxRate.name}
          value={assumptions.incomeTaxRate.value}
          min={assumptions.incomeTaxRate.min}
          max={assumptions.incomeTaxRate.max}
          step={assumptions.incomeTaxRate.step}
          unit={assumptions.incomeTaxRate.unit}
          description={assumptions.incomeTaxRate.description}
          onChange={(value) => handleAssumptionChange('incomeTaxRate', value)}
          formatValue={formatPercentage}
        />

        <Slider
          label={assumptions.monthlyExpenses.name}
          value={assumptions.monthlyExpenses.value}
          min={assumptions.monthlyExpenses.min}
          max={assumptions.monthlyExpenses.max}
          step={assumptions.monthlyExpenses.step}
          unit={assumptions.monthlyExpenses.unit}
          description={assumptions.monthlyExpenses.description}
          onChange={(value) => handleAssumptionChange('monthlyExpenses', value)}
          formatValue={formatCurrency}
        />

        <Slider
          label={assumptions.monthlySavings.name}
          value={assumptions.monthlySavings.value}
          min={assumptions.monthlySavings.min}
          max={assumptions.monthlySavings.max}
          step={assumptions.monthlySavings.step}
          unit={assumptions.monthlySavings.unit}
          description={assumptions.monthlySavings.description}
          onChange={(value) => handleAssumptionChange('monthlySavings', value)}
          formatValue={formatCurrency}
        />

        <Slider
          label={assumptions.investmentReturn.name}
          value={assumptions.investmentReturn.value}
          min={assumptions.investmentReturn.min}
          max={assumptions.investmentReturn.max}
          step={assumptions.investmentReturn.step}
          unit={assumptions.investmentReturn.unit}
          description={assumptions.investmentReturn.description}
          onChange={(value) => handleAssumptionChange('investmentReturn', value)}
          formatValue={formatPercentage}
        />

        <Slider
          label={assumptions.inflationRate.name}
          value={assumptions.inflationRate.value}
          min={assumptions.inflationRate.min}
          max={assumptions.inflationRate.max}
          step={assumptions.inflationRate.step}
          unit={assumptions.inflationRate.unit}
          description={assumptions.inflationRate.description}
          onChange={(value) => handleAssumptionChange('inflationRate', value)}
          formatValue={formatPercentage}
        />
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-black">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 Quick Summary</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>Monthly net income: <strong>€{Math.round(assumptions.salary.value * (1 - assumptions.incomeTaxRate.value / 100) / 12).toLocaleString()}</strong></div>
          <div>Monthly savings potential: <strong>€{Math.max(0, Math.round(assumptions.salary.value * (1 - assumptions.incomeTaxRate.value / 100) / 12) - assumptions.monthlyExpenses.value).toLocaleString()}</strong></div>
          <div>FI target: <strong>€{(assumptions.monthlyExpenses.value * 12 * 25 / 1000).toFixed(0)}k</strong></div>
        </div>
      </div>
    </div>
  );
};

export default AssumptionsPanel;
