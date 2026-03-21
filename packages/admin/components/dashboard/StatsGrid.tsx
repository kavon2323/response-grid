'use client';

interface Stat {
  label: string;
  value: number | string;
  color: 'red' | 'green' | 'blue' | 'gray';
}

interface StatsGridProps {
  stats: Stat[];
}

const colorClasses = {
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    value: 'text-red-600',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    value: 'text-green-600',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    value: 'text-blue-600',
  },
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    value: 'text-gray-600',
  },
};

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const colors = colorClasses[stat.color];
        return (
          <div
            key={stat.label}
            className={`${colors.bg} rounded-lg p-6 border border-${stat.color}-100`}
          >
            <p className={`text-sm font-medium ${colors.text}`}>{stat.label}</p>
            <p className={`text-3xl font-bold ${colors.value} mt-2`}>
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
