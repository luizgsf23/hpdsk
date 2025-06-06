
import React from 'react';

export interface BarChartItem {
  label: string;
  value: number;
  colorClass: string; // Tailwind CSS class e.g. "bg-purple-500"
  icon?: React.ReactNode;
}

interface SimpleBarChartProps {
  title: string;
  items: BarChartItem[];
  valueSuffix?: string;
}

const SimpleBarChartInner: React.FC<SimpleBarChartProps> = ({ title, items, valueSuffix = "" }) => {
  if (!items || items.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-purple-400 mb-4">{title}</h3>
        <p className="text-gray-300">Nenhum dado disponível.</p>
      </div>
    );
  }

  const maxValue = Math.max(...items.map(item => item.value), 0);

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold text-purple-400 mb-6">{title}</h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center group" aria-label={`${item.label}: ${item.value}${valueSuffix}`}>
            {item.icon && <div className="mr-3 flex-shrink-0 w-5 h-5 text-gray-300">{item.icon}</div>}
            <div className="w-1/3 truncate text-sm text-gray-300 group-hover:text-purple-300 transition-colors" title={item.label}>
              {item.label}
            </div>
            <div className="w-2/3 flex items-center">
              <div className="flex-grow bg-gray-700 rounded-full h-5 overflow-hidden mr-2">
                <div
                  className={`${item.colorClass} h-full rounded-full transition-all duration-500 ease-out`}
                  style={{ width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '0%' }}
                  role="progressbar"
                  aria-valuenow={item.value}
                  aria-valuemin={0}
                  aria-valuemax={maxValue}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-100 w-10 text-right">{item.value}{valueSuffix}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SimpleBarChart = React.memo(SimpleBarChartInner);
export default SimpleBarChart;