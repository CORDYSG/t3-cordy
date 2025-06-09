import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md", className)}
      style={{ backgroundColor: "rgba(0,0,0,0.2)", ...(props.style ?? {}) }}
      {...props}
    />
  );
}

export { Skeleton };
