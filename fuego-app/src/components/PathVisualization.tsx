import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import { FinancialSnapshot } from '../types';

interface PathVisualizationProps {
  projections: FinancialSnapshot[];
  targetAmount: number;
  className?: string;
}

export const PathVisualization: React.FC<PathVisualizationProps> = ({
  projections,
  targetAmount,
  className = ''
}) => {
  // Format data for charts
  const chartData = projections.map(snapshot => ({
    age: snapshot.age,
    year: snapshot.year,
    netWorth: Math.round(snapshot.netWorth),
    annualSavings: Math.round(snapshot.monthlySavings * 12),
    expenses: Math.round(snapshot.monthlyExpenses * 12),
    netSalary: Math.round(snapshot.netSalary),
    isRetired: snapshot.isFinanciallyIndependent
  }));

  const retirementAge = projections.find(p => p.isFinanciallyIndependent)?.age;
  const maxNetWorth = Math.max(...projections.map(p => p.netWorth));

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}k`;
    }
    return `€${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`Age: ${label} (${data.year})`}</p>
          <p className="text-blue-600">{`Net Worth: ${formatCurrency(data.netWorth)}`}</p>
          <p className="text-green-600">{`Annual Savings: ${formatCurrency(data.annualSavings)}`}</p>
          <p className="text-red-600">{`Annual Expenses: ${formatCurrency(data.expenses)}`}</p>
          {data.isRetired && <p className="text-purple-600 font-bold">🎉 Financially Independent!</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 border-black p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <span className="bg-green-100 text-green-600 p-2 rounded-lg mr-3">📈</span>
          Your Financial Journey
        </h2>
        
        {retirementAge && (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
              🎯 Financial Independence at age {retirementAge}
            </span>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              Final Net Worth: {formatCurrency(maxNetWorth)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Net Worth Growth Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Net Worth Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="age" 
                stroke="#6B7280"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                stroke="#6B7280"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Target amount reference line */}
              <ReferenceLine 
                y={targetAmount} 
                stroke="#EF4444" 
                strokeDasharray="5 5"
                label={{ value: "FI Target", position: "insideTopRight", fill: "#EF4444" }}
              />
              
              {/* Retirement age reference line */}
              {retirementAge && (
                <ReferenceLine 
                  x={retirementAge} 
                  stroke="#8B5CF6" 
                  strokeDasharray="5 5"
                  label={{ value: "Retirement", position: "top", fill: "#8B5CF6" }}
                />
              )}
              
              <Area 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#3B82F6" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNetWorth)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Income vs Expenses Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Annual Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="age" 
                stroke="#6B7280"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                stroke="#6B7280"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Line 
                type="monotone" 
                dataKey="netSalary" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Net Salary"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Annual Expenses"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="annualSavings" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Annual Savings"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center border-2 border-black">
          <div className="text-2xl font-bold text-blue-600">
            {retirementAge || 'Never'}
          </div>
          <div className="text-sm text-blue-700">Retirement Age</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg text-center border-2 border-black">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(maxNetWorth)}
          </div>
          <div className="text-sm text-green-700">Final Net Worth</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg text-center border-2 border-black">
          <div className="text-2xl font-bold text-purple-600">
            {retirementAge ? retirementAge - projections[0]?.age || 25 : 'N/A'}
          </div>
          <div className="text-sm text-purple-700">Years to FI</div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg text-center border-2 border-black">
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(chartData[chartData.length - 1]?.annualSavings || 0)}
          </div>
          <div className="text-sm text-orange-700">Final Annual Savings</div>
        </div>
      </div>
    </div>
  );
};

export default PathVisualization;
