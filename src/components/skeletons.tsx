import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Skeleton for individual entity items (workflows, credentials, executions)
 */
export const EntityItemSkeleton = () => {
  return (
    <Card className="p-4 shadow-none">
      <CardContent className="flex flex-row items-center justify-between p-0">
        <div className="flex items-center gap-3">
          {/* Icon skeleton */}
          <Skeleton className="size-8 rounded" />
          <div className="space-y-2">
            {/* Title skeleton */}
            <Skeleton className="h-4 w-[180px]" />
            {/* Subtitle skeleton */}
            <Skeleton className="h-3 w-[250px]" />
          </div>
        </div>
        {/* Action button skeleton */}
        <Skeleton className="size-8 rounded" />
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton for a list of entity items
 */
export const EntityListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <div className="flex flex-col gap-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <EntityItemSkeleton key={index} />
      ))}
    </div>
  );
};

const BaseEntityRowSkeleton = ({
  iconClassName,
  titleWidth = "w-[170px] md:w-[220px]",
  subtitleWidth = "w-[180px]",
  rightAction,
}: {
  iconClassName?: string;
  titleWidth?: string;
  subtitleWidth?: string;
  rightAction?: React.ReactNode;
}) => {
  return (
    <Card className="p-4 border-border/80 bg-card dark:bg-card/90 shadow-none">
      <CardContent className="flex flex-row items-center justify-between p-0">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className={iconClassName ?? "size-8 rounded"} />
          <div className="space-y-2 min-w-0">
            <Skeleton className={`h-4 ${titleWidth}`} />
            <Skeleton className={`h-3 ${subtitleWidth}`} />
          </div>
        </div>
        {rightAction}
      </CardContent>
    </Card>
  );
};

export const WorkflowItemSkeleton = () => {
  return (
    <BaseEntityRowSkeleton
      iconClassName="size-8 rounded-md"
      titleWidth="w-[165px] md:w-[240px]"
      subtitleWidth="w-[220px]"
      rightAction={<Skeleton className="size-8 rounded-md" />}
    />
  );
};

export const WorkflowListSkeleton = ({ count = 5 }: { count?: number }) => {
  const titleWidths = [
    "w-[165px] md:w-[240px]",
    "w-[140px] md:w-[200px]",
    "w-[180px] md:w-[260px]",
    "w-[155px] md:w-[210px]",
  ];
  const subtitleWidths = ["w-[220px]", "w-[180px]", "w-[240px]", "w-[200px]"];

  return (
    <div className="flex flex-col gap-y-4">
      {Array.from({ length: count }).map((_, index) => {
        const compactOnMobile = index > 3;
        return (
          <div key={index} className={compactOnMobile ? "hidden sm:block" : "block"}>
            <BaseEntityRowSkeleton
              iconClassName="size-8 rounded-md"
              titleWidth={titleWidths[index % titleWidths.length]}
              subtitleWidth={subtitleWidths[index % subtitleWidths.length]}
              rightAction={<Skeleton className="size-8 rounded-md" />}
            />
          </div>
        );
      })}
    </div>
  );
};

export const CredentialItemSkeleton = () => {
  return (
    <BaseEntityRowSkeleton
      iconClassName="size-8 rounded-full"
      subtitleWidth="w-[200px]"
      rightAction={<Skeleton className="size-8 rounded-md" />}
    />
  );
};

export const CredentialListSkeleton = ({ count = 5 }: { count?: number }) => {
  const titleWidths = [
    "w-[150px] md:w-[220px]",
    "w-[180px] md:w-[250px]",
    "w-[135px] md:w-[190px]",
    "w-[165px] md:w-[230px]",
  ];
  const subtitleWidths = ["w-[200px]", "w-[170px]", "w-[210px]", "w-[185px]"];

  return (
    <div className="flex flex-col gap-y-4">
      {Array.from({ length: count }).map((_, index) => {
        const compactOnMobile = index > 3;
        return (
          <div key={index} className={compactOnMobile ? "hidden sm:block" : "block"}>
            <BaseEntityRowSkeleton
              iconClassName="size-8 rounded-full"
              titleWidth={titleWidths[index % titleWidths.length]}
              subtitleWidth={subtitleWidths[index % subtitleWidths.length]}
              rightAction={<Skeleton className="size-8 rounded-md" />}
            />
          </div>
        );
      })}
    </div>
  );
};

export const ExecutionItemSkeleton = () => {
  return (
    <BaseEntityRowSkeleton
      iconClassName="size-8 rounded-full"
      subtitleWidth="w-[130px]"
      rightAction={<Skeleton className="h-8 w-[74px] sm:w-[120px] rounded-md" />}
    />
  );
};

export const ExecutionListSkeleton = ({ count = 5 }: { count?: number }) => {
  const titleWidths = [
    "w-[175px] md:w-[250px]",
    "w-[145px] md:w-[210px]",
    "w-[165px] md:w-[235px]",
    "w-[155px] md:w-[220px]",
  ];
  const subtitleWidths = ["w-[130px]", "w-[110px]", "w-[145px]", "w-[120px]"];

  return (
    <div className="flex flex-col gap-y-3">
      {Array.from({ length: count }).map((_, index) => {
        const compactOnMobile = index > 4;
        return (
          <div key={index} className={compactOnMobile ? "hidden sm:block" : "block"}>
            <BaseEntityRowSkeleton
              iconClassName="size-8 rounded-full"
              titleWidth={titleWidths[index % titleWidths.length]}
              subtitleWidth={subtitleWidths[index % subtitleWidths.length]}
              rightAction={<Skeleton className="h-8 w-[74px] sm:w-[120px] rounded-md" />}
            />
          </div>
        );
      })}
    </div>
  );
};

const PaginationSkeleton = () => {
  return (
    <div className="flex items-center justify-center gap-x-2 w-full mt-auto">
      <Skeleton className="h-5 w-24 mr-auto" />
      <div className="flex items-center gap-2 py-4">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
};

export const WorkflowPageSkeleton = () => {
  return (
    <div className="p-5 md:px-8 md:py-7 h-full">
      <div className="mx-auto max-w-7xl w-full flex flex-col gap-y-7 h-full">
        <div className="flex items-start justify-between gap-4 md:items-center md:gap-x-5">
          <div className="space-y-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>

        <div className="rounded-xl border border-border bg-card/70 dark:bg-card/80 p-5 md:p-6 flex flex-col gap-y-5 h-full shadow-sm dark:shadow-md">
          <div className="relative ml-auto w-full md:w-auto">
            <Skeleton className="h-10 w-full md:w-[240px]" />
          </div>
          <WorkflowListSkeleton count={5} />
        </div>

        <PaginationSkeleton />
      </div>
    </div>
  );
};

export const CredentialPageSkeleton = () => {
  return (
    <div className="p-5 md:px-8 md:py-7 h-full">
      <div className="mx-auto max-w-7xl w-full flex flex-col gap-y-7 h-full">
        <div className="flex items-start justify-between gap-4 md:items-center md:gap-x-5">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-34 rounded-md" />
        </div>

        <div className="rounded-xl border border-border bg-card/70 dark:bg-card/80 p-5 md:p-6 flex flex-col gap-y-5 h-full shadow-sm dark:shadow-md">
          <div className="relative ml-auto w-full md:w-auto">
            <Skeleton className="h-10 w-full md:w-[240px]" />
          </div>
          <CredentialListSkeleton count={5} />
        </div>

        <PaginationSkeleton />
      </div>
    </div>
  );
};

export const ExecutionPageSkeleton = () => {
  return (
    <div className="p-5 md:px-8 md:py-7 h-full">
      <div className="mx-auto max-w-7xl w-full flex flex-col gap-y-7 h-full">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="rounded-xl border border-border bg-card/70 dark:bg-card/80 p-5 md:p-6 flex flex-col gap-y-5 h-full shadow-sm dark:shadow-md">
          <div className="rounded-xl border border-border/75 bg-background/55 dark:bg-background/30 p-2.5 space-y-2">
            <div className="flex items-center gap-2 md:hidden">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
            </div>
            <div className="hidden md:flex items-center justify-between gap-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>

          <ExecutionListSkeleton count={5} />
        </div>

        <PaginationSkeleton />
      </div>
    </div>
  );
};

/**
 * Skeleton for the workflow editor canvas
 */
export const EditorSkeleton = () => {
  return (
    <div className="size-full flex flex-col">
      {/* Editor header skeleton */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
        <Skeleton className="h-8 w-[80px]" />
      </div>
      
      {/* Canvas skeleton */}
      <div className="flex-1 relative bg-muted/30">
        {/* Fake nodes */}
        <div className="absolute top-1/3 left-1/4">
          <Skeleton className="h-12 w-32 rounded-lg" />
        </div>
        <div className="absolute top-1/3 left-1/2">
          <Skeleton className="h-12 w-32 rounded-lg" />
        </div>
        <div className="absolute top-1/2 left-[60%]">
          <Skeleton className="h-12 w-32 rounded-lg" />
        </div>
        
        {/* Minimap skeleton */}
        <div className="absolute bottom-4 right-4">
          <Skeleton className="h-[120px] w-[200px] rounded" />
        </div>
        
        {/* Controls skeleton */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for credential/execution detail view
 */
export const DetailViewSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      
      {/* Form fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      
      {/* Buttons */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[80px]" />
      </div>
    </div>
  );
};

/**
 * Skeleton for execution detail view
 */
export const ExecutionDetailSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Status card */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-[120px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </Card>
      
      {/* Details */}
      <Card className="p-6 space-y-4">
        <Skeleton className="h-5 w-[100px]" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-[80px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-[80px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-[80px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-[80px]" />
            <Skeleton className="h-4 w-[120px]" />
          </div>
        </div>
      </Card>
      
      {/* Output */}
      <Card className="p-6 space-y-4">
        <Skeleton className="h-5 w-[80px]" />
        <Skeleton className="h-[200px] w-full" />
      </Card>
    </div>
  );
};