import { cn } from "@/lib/utils"

type OrderChipProps = {
  orders: number[]
  label: string
  onClick: (orders: number[]) => void
  className?: string
  title?: string
}

export function OrderChip({ orders, label, onClick, className, title }: OrderChipProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(orders)}
      className={cn(
        "mx-1 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-200",
        className,
      )}
      title={title}
    >
      {label}
    </button>
  )
}
