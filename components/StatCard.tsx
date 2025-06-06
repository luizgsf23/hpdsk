
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
  iconColorClass?: string;
}

const StatCardInner: React.FC<StatCardProps> = ({ title, value, icon, className, iconColorClass = "text-purple-400" }) => {
  return (
    <div className={`bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 ${className}`}>
      <div className={`p-3 rounded-full bg-gray-700 ${iconColorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-semibold text-white">{value}</p>
      </div>
    </div>
  );
};

const StatCard = React.memo(StatCardInner);
export default StatCard;