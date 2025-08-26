import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  description?: string;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  description,
  onChange,
  formatValue
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const formatDisplayValue = (val: number): string => {
    if (formatValue) {
      return formatValue(val);
    }
    
    if (unit === '€' && val >= 1000) {
      return `€${(val / 1000).toFixed(0)}k`;
    }
    
    return `${val.toLocaleString()} ${unit}`;
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-6 p-4 bg-white rounded-lg border-2 border-black shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-semibold text-gray-700">
          {label}
        </label>
        <span className="text-lg font-bold text-blue-600">
          {formatDisplayValue(value)}
        </span>
      </div>
      
      <div className="relative mb-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #000000 0%, #000000 ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`
          }}
        />
        <div 
          className="absolute top-0 w-4 h-4 bg-black rounded-full shadow-md transform -translate-y-1 -translate-x-2 pointer-events-none"
          style={{ left: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{formatDisplayValue(min)}</span>
        <span>{formatDisplayValue(max)}</span>
      </div>
      
      {description && (
        <p className="text-xs text-gray-600 mt-2">{description}</p>
      )}
    </div>
  );
};

export default Slider;
