'use client';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  loading?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    trend: 'text-emerald-600',
  },
  orange: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    trend: 'text-amber-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    trend: 'text-red-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    trend: 'text-purple-600',
  },
};

export default function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  loading = false,
}: KPICardProps) {
  const colors = colorClasses[color];

  if (loading) {
    return (
      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="w-24 h-4 skeleton rounded"></div>
            <div className="w-16 h-8 skeleton rounded"></div>
            <div className="w-32 h-3 skeleton rounded"></div>
          </div>
          <div className="w-10 h-10 skeleton rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-surface-900">{value}</p>
          {(subtitle || trend) && (
            <div className="mt-1 flex items-center gap-2">
              {trend && (
                <span
                  className={`inline-flex items-center text-xs font-medium ${
                    trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {trend.isPositive ? (
                    <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {trend.value}%
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-surface-500">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${colors.bg}`}>
          <div className={colors.icon}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

