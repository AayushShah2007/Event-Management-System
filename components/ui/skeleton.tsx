import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted bg-gradient-to-r from-muted via-muted-foreground/10 to-muted",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };