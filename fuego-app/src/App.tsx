import React, { useState, useEffect, useMemo } from 'react';
import { BaseAssumptions, Path, FinancialSnapshot } from './types';
import { FinancialCalculator } from './utils/calculations';
import AssumptionsPanel from './components/AssumptionsPanel';
import PathVisualization from './components/PathVisualization';
import './App.css';

function App() {
  const [assumptions, setAssumptions] = useState<BaseAssumptions>(
    FinancialCalculator.createDefaultAssumptions()
  );
  
  const calculator = useMemo(() => new FinancialCalculator(), []);
  
  // Create a basic path with current assumptions
  const currentPath: Path = useMemo(() => ({
    id: 'current',
    name: 'Current Path',
    description: 'Your financial journey with current assumptions',
    decisions: [],
    assumptions,
    projections: [],
    targetAmount: assumptions.monthlyExpenses.value * 12 * 25,
    score: 0
  }), [assumptions]);

  // Calculate projections whenever assumptions change
  const projections: FinancialSnapshot[] = useMemo(() => {
    return calculator.projectPath(currentPath);
  }, [calculator, currentPath]);

  // Update path with new projections
  useEffect(() => {
    currentPath.projections = projections;
    currentPath.score = calculator.calculatePathScore(currentPath);
  }, [projections, currentPath, calculator]);

  const retirementAge = projections.find(p => p.isFinanciallyIndependent)?.age;
  const finalNetWorth = projections[projections.length - 1]?.netWorth || 0;

  return (
    <div className="App">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                <span className="text-2xl">🔥</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">FUEGO</h1>
                <p className="text-gray-600">Financial Independence Path Calculator</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {retirementAge || 'Never'}
                </div>
                <div className="text-gray-500">Retirement Age</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  €{(finalNetWorth / 1000000).toFixed(1)}M
                </div>
                <div className="text-gray-500">Final Net Worth</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Assumptions */}
          <div className="lg:col-span-1">
            <AssumptionsPanel
              assumptions={assumptions}
              onChange={setAssumptions}
            />
            
            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border-2 border-black p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Key Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Net Income:</span>
                  <span className="font-semibold">
                    €{Math.round(assumptions.salary.value * (1 - assumptions.incomeTaxRate.value / 100) / 12).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Savings:</span>
                  <span className="font-semibold text-green-600">
                    €{assumptions.monthlySavings.value.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Savings Rate:</span>
                  <span className="font-semibold text-blue-600">
                    {Math.round((assumptions.monthlySavings.value / Math.max(1, Math.round(assumptions.salary.value * (1 - assumptions.incomeTaxRate.value / 100) / 12))) * 100)}%
                  </span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between">
                  <span className="text-gray-600">FI Number:</span>
                  <span className="font-semibold text-purple-600">
                    €{((assumptions.monthlyExpenses.value * 12 * 25) / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Years to FI:</span>
                  <span className="font-semibold text-orange-600">
                    {retirementAge ? retirementAge - assumptions.currentAge.value : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Visualization */}
          <div className="lg:col-span-2">
            <PathVisualization
              projections={projections}
              targetAmount={assumptions.monthlyExpenses.value * 12 * 25}
            />

            {/* Action Items */}
            <div className="mt-8 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-black">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="bg-yellow-100 text-yellow-600 p-2 rounded-lg mr-3">💡</span>
                Optimization Suggestions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Salary optimization */}
                {assumptions.salary.value < 80000 && (
                  <div className="bg-white p-4 rounded-lg border-2 border-black">
                    <h4 className="font-semibold text-gray-800 mb-2">📈 Increase Income</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      A €10k salary increase could reduce your retirement age by {Math.max(0, Math.round((retirementAge || 65) - (calculator.projectPath({
                        ...currentPath,
                        assumptions: {
                          ...assumptions,
                          salary: { ...assumptions.salary, value: assumptions.salary.value + 10000 }
                        }
                      }).find(p => p.isFinanciallyIndependent)?.age ?? 65)))} years.
                    </p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Career Growth</span>
                  </div>
                )}

                {/* Expense optimization */}
                {assumptions.monthlyExpenses.value > 2000 && (
                  <div className="bg-white p-4 rounded-lg border-2 border-black">
                    <h4 className="font-semibold text-gray-800 mb-2">💰 Reduce Expenses</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Reducing expenses by €500/month could save {Math.max(0, Math.round((retirementAge || 65) - (calculator.projectPath({
                        ...currentPath,
                        assumptions: {
                          ...assumptions,
                          monthlyExpenses: { ...assumptions.monthlyExpenses, value: assumptions.monthlyExpenses.value - 500 }
                        }
                      }).find(p => p.isFinanciallyIndependent)?.age ?? 65)))} years.
                    </p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Lifestyle</span>
                  </div>
                )}

                {/* Investment optimization */}
                {assumptions.investmentReturn.value < 8 && (
                  <div className="bg-white p-4 rounded-lg border-2 border-black">
                    <h4 className="font-semibold text-gray-800 mb-2">📊 Investment Strategy</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Improving returns to 8% could save {Math.max(0, Math.round((retirementAge || 65) - (calculator.projectPath({
                        ...currentPath,
                        assumptions: {
                          ...assumptions,
                          investmentReturn: { ...assumptions.investmentReturn, value: 8 }
                        }
                      }).find(p => p.isFinanciallyIndependent)?.age ?? 65)))} years.
                    </p>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Investing</span>
                  </div>
                )}

                {/* Tax optimization */}
                {assumptions.incomeTaxRate.value > 25 && (
                  <div className="bg-white p-4 rounded-lg border-2 border-black">
                    <h4 className="font-semibold text-gray-800 mb-2">🌍 Tax Optimization</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Moving to a location with 25% tax rate could save {Math.max(0, Math.round((retirementAge || 65) - (calculator.projectPath({
                        ...currentPath,
                        assumptions: {
                          ...assumptions,
                          incomeTaxRate: { ...assumptions.incomeTaxRate, value: 25 }
                        }
                      }).find(p => p.isFinanciallyIndependent)?.age ?? 65)))} years.
                    </p>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Location</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-black mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              <strong>FUEGO</strong> - Your path to financial independence
            </p>
            <p className="text-sm">
              Built with React, TypeScript, and Recharts. 
              Calculations based on the 4% rule and compound interest principles.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;