import { clsx } from 'clsx'
import { getDeactivationLabel } from '@utils/helpers'

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

export interface PatientStatusBadgeProps {
  isActive: boolean
  overallStatus?: string | null
  statusReason?: string | null
  className?: string
}

export function PatientStatusBadge({ isActive, overallStatus, statusReason, className }: PatientStatusBadgeProps) {
  if (isActive) {
    return (
      <div className={clsx("flex items-center gap-1.5", className)}>
        <div className={clsx(
          "w-2 h-2 rounded-full",
          overallStatus === 'Stabil' ? "bg-teal-500" : 
          overallStatus === 'Butuh Tindakan' ? "bg-error animate-pulse" : "bg-amber-400"
        )}></div>
        <span className={clsx(
          "text-xs font-bold uppercase tracking-wider",
          overallStatus === 'Stabil' ? "text-teal-700" : 
          overallStatus === 'Butuh Tindakan' ? "text-error" : "text-amber-700"
        )}>
          {overallStatus || 'Tidak Diketahui'}
        </span>
      </div>
    )
  }

  return (
    <div className={clsx("flex items-center gap-1.5", className)}>
      <div className={clsx(
        "w-2 h-2 rounded-full",
        statusReason === 'deceased' ? "bg-rose-500" : 
        statusReason === 'discharged' ? "bg-emerald-500" : "bg-stone-400"
      )}></div>
      <span className={clsx(
        "text-xs font-bold uppercase tracking-wider",
        statusReason === 'deceased' ? "text-rose-700" : 
        statusReason === 'discharged' ? "text-emerald-700" : "text-stone-600"
      )}>
        Nonaktif — {getDeactivationLabel(statusReason || '')}
      </span>
    </div>
  )
}
