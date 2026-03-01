import { useId } from "react";
import { cn } from "@/lib/utils";

type SignalBarProps = Readonly<{
  /** Percentage of comments with strong signal (composite > 0.6). */
  strong: number;
  /** Percentage of comments with moderate signal (composite 0.3-0.6). */
  moderate: number;
  /** Percentage of comments with faint signal (composite < 0.3). */
  faint: number;
  className?: string;
}>;

const BAR_HEIGHT = 24;
const WIDTH = 400;
const PADDING = { left: 12, right: 12 };
const LABEL_Y_OFFSET = 18;

export function SignalBar({
  strong,
  moderate,
  faint,
  className,
}: SignalBarProps) {
  const titleId = useId();
  const total = strong + moderate + faint;
  const barWidth = WIDTH - PADDING.left - PADDING.right;
  const height = BAR_HEIGHT + LABEL_Y_OFFSET + 8;

  if (total === 0) {
    return (
      <div
        className={cn("text-text-muted text-center text-sm italic", className)}
      >
        Not enough data yet
      </div>
    );
  }

  const strongW = (strong / total) * barWidth;
  const moderateW = (moderate / total) * barWidth;
  const faintW = (faint / total) * barWidth;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      className={cn("w-full", className)}
      aria-labelledby={titleId}
    >
      <title id={titleId}>
        {`Comment depth: ${Math.round(strong)}% substantive, ${Math.round(moderate)}% mixed, ${Math.round(faint)}% surface-level`}
      </title>

      {/* Strong signal segment */}
      {strongW > 0 && (
        <rect
          x={PADDING.left}
          y={0}
          width={strongW}
          height={BAR_HEIGHT}
          rx={strongW === barWidth ? 6 : 0}
          className="fill-state-positive"
          opacity={0.85}
        />
      )}
      {/* Round left corners */}
      {strongW > 0 && (
        <rect
          x={PADDING.left}
          y={0}
          width={Math.min(strongW, 6)}
          height={BAR_HEIGHT}
          rx={6}
          className="fill-state-positive"
          opacity={0.85}
        />
      )}

      {/* Moderate signal segment */}
      {moderateW > 0 && (
        <rect
          x={PADDING.left + strongW}
          y={0}
          width={moderateW}
          height={BAR_HEIGHT}
          className="fill-chart-axis"
          opacity={0.4}
        />
      )}

      {/* Faint signal segment */}
      {faintW > 0 && (
        <rect
          x={PADDING.left + strongW + moderateW}
          y={0}
          width={faintW}
          height={BAR_HEIGHT}
          className="fill-state-warning"
          opacity={0.7}
        />
      )}
      {/* Round right corners */}
      {faintW > 0 && (
        <rect
          x={PADDING.left + strongW + moderateW + faintW - Math.min(faintW, 6)}
          y={0}
          width={Math.min(faintW, 6)}
          height={BAR_HEIGHT}
          rx={6}
          className="fill-state-warning"
          opacity={0.7}
        />
      )}

      {/* Labels */}
      {strong > 5 && (
        <text
          x={PADDING.left + strongW / 2}
          y={BAR_HEIGHT + LABEL_Y_OFFSET}
          textAnchor="middle"
          className="fill-state-positive text-[10px] font-medium"
        >
          {Math.round(strong)}% substantive
        </text>
      )}
      {moderate > 10 && (
        <text
          x={PADDING.left + strongW + moderateW / 2}
          y={BAR_HEIGHT + LABEL_Y_OFFSET}
          textAnchor="middle"
          className="fill-chart-axis text-[10px]"
        >
          {Math.round(moderate)}% mixed
        </text>
      )}
      {faint > 5 && (
        <text
          x={PADDING.left + strongW + moderateW + faintW / 2}
          y={BAR_HEIGHT + LABEL_Y_OFFSET}
          textAnchor="middle"
          className="fill-state-warning text-[10px] font-medium"
        >
          {Math.round(faint)}% surface-level
        </text>
      )}
    </svg>
  );
}
