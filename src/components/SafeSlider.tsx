import React, { useState, useEffect } from 'react';

interface SafeSliderProps {
  key?: any;
  mapName: string;
  currentValue: number;
  strategy: string;
  onChange: (value: number) => void;
}

export default function SafeSlider({ mapName, currentValue, strategy, onChange }: SafeSliderProps) {
  const [value, setValue] = useState(currentValue);
  const [riskScore, setRiskScore] = useState(0);
  const [hardLimit, setHardLimit] = useState(currentValue * 1.2);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkSafety = async () => {
      try {
        const response = await fetch('/api/safe-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mapName,
            currentValue,
            requestedValue: value,
            strategy
          })
        });
        const data = await response.json();
        setRiskScore(data.riskScore);
        setHardLimit(data.hardLimit);
        setMessage(data.message);
      } catch (error) {
        console.error('Failed to check safety limit', error);
      }
    };

    const debounceTimer = setTimeout(checkSafety, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, currentValue, mapName, strategy]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    onChange(newValue);
  };

  // Determine color based on risk score
  let sliderColor = 'bg-green-500';
  if (riskScore > 50 && riskScore <= 80) sliderColor = 'bg-yellow-500';
  if (riskScore > 80) sliderColor = 'bg-red-500';

  return (
    <div className="mb-6 p-4 bg-zinc-800 rounded-xl border border-zinc-700">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-zinc-300">{mapName}</label>
        <span className="text-xs font-mono text-zinc-400">
          Current: {currentValue.toFixed(2)} | Target: {value.toFixed(2)}
        </span>
      </div>
      
      <div className="relative pt-1">
        <input
          type="range"
          min={currentValue * 0.8} // Allow 20% reduction
          max={currentValue * 1.5} // Allow up to 50% increase in UI, backend will limit
          step={currentValue * 0.01}
          value={value}
          onChange={handleSliderChange}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${sliderColor}`}
          style={{
            background: `linear-gradient(to right, 
              ${riskScore < 50 ? '#22c55e' : riskScore < 80 ? '#eab308' : '#ef4444'} ${((value - currentValue * 0.8) / (currentValue * 1.5 - currentValue * 0.8)) * 100}%, 
              #3f3f46 ${((value - currentValue * 0.8) / (currentValue * 1.5 - currentValue * 0.8)) * 100}%)`
          }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs">
        <span className="text-zinc-500">Min</span>
        <span className={`font-medium ${riskScore > 80 ? 'text-red-400' : 'text-zinc-400'}`}>
          Risk: {riskScore.toFixed(0)}%
        </span>
        <span className="text-zinc-500">Max (Limit: {hardLimit.toFixed(2)})</span>
      </div>
      
      {message && (
        <p className={`mt-2 text-xs ${riskScore >= 100 ? 'text-red-400 font-bold' : 'text-zinc-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
