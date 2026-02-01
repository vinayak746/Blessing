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