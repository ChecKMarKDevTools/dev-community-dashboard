import { cn } from "@/lib/utils";

type ScoreBarProps = Readonly<{
  label: string;
  sublabel: string;
  description: string;
  value: number;
  max: number;
  colorClass: string;
  className?: string;
}>;

export function ScoreBar({
  label,
  sublabel,
  description,
  value,
  max,
  colorClass,
  className,
}: ScoreBarProps) {
  const widthPercent = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="text-brand-700 flex justify-between text-sm font-medium">
        <span>{label}</span>
        <span>{sublabel}</span>
      </div>
      <div className="bg-brand-100 h-2 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-all", colorClass)}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <p className="text-brand-500 text-xs leading-snug">{description}</p>
    </div>
  );
}
