import { cn } from "../../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({
  className,
  variant = "rectangular",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-zinc-200/10 dark:bg-zinc-800/20",
        variant === "text" && "h-4 w-full rounded-md",
        variant === "circular" && "h-12 w-12 rounded-full",
        variant === "rectangular" && "rounded-2xl",
        className
      )}
      {...props}
    />
  );
}
