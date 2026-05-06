import { clsx } from 'clsx';

export type StatusType = 'Stabil' | 'Observasi' | 'Butuh Tindakan' | 'Eskalasi' | 'Selesai';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStyles = () => {
    switch (status) {
      case 'Butuh Tindakan':
      case 'Eskalasi':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'Observasi':
        return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'Selesai':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'Stabil':
      default:
        return 'bg-teal-50 text-teal-600 border-teal-100';
    }
  };

  return (
    <span className={clsx(
      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
      getStyles(),
      className
    )}>
      {status}
    </span>
  );
}
