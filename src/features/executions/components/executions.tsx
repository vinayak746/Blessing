"use client";

import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import {
  EmptyView,
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  ErrorView,
} from "@/components/entity-components";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useSuspenseExecutions,
} from "../hooks/use-executions";
import { useExecutionsParams } from "../hooks/use-executions-params";
import type {  Execution } from "@prisma/client";
import { ExecutionStatus } from "@prisma/client";
import { CheckCircle2Icon, XCircleIcon, Loader2Icon, ClockIcon, ArrowUpRightIcon } from "lucide-react";
import { ExecutionPageSkeleton } from "@/components/skeletons";

const statusFilters = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "running", label: "Running" },
] as const;

const rangeFilters = [
  { value: "all", label: "All time" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
] as const;

const formatRelativeShort = (date: Date) => {
  const now = new Date();
  const days = differenceInDays(now, date);
  if (days >= 1) return `${days}d ago`;
  const hours = differenceInHours(now, date);
  if (hours >= 1) return `${hours}h ago`;
  const minutes = differenceInMinutes(now, date);
  if (minutes >= 1) return `${minutes}m ago`;
  return "Just now";
};

const ExecutionsFilters = () => {
  const [params, setParams] = useExecutionsParams();

  return (
    <div className="rounded-xl border border-border/75 bg-background/55 dark:bg-background/30 p-2.5 space-y-2">
      {/* Mobile: dropdown selects */}
      <div className="flex md:hidden items-center gap-2">
        <div className="flex-1">
          <span className="text-[11px] text-muted-foreground mb-0.5 block">Status</span>
          <Select
            value={params.status ?? "all"}
            onValueChange={(value) =>
              setParams({
                ...params,
                status:
                  value === "success" || value === "failed" || value === "running"
                    ? value
                    : "all",
                page: 1,
              })
            }
          >
            <SelectTrigger className="h-9 w-full text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <span className="text-[11px] text-muted-foreground mb-0.5 block">Time</span>
          <Select
            value={params.range ?? "all"}
            onValueChange={(value) => setParams({ ...params, range: value as typeof rangeFilters[number]["value"], page: 1 })}
          >
            <SelectTrigger className="h-9 w-full text-xs">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              {rangeFilters.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop: pill buttons */}
      <div className="hidden md:flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <div className="flex items-center gap-1 flex-wrap rounded-lg bg-muted/50 p-1">
            {statusFilters.map((filter) => {
              const isActive = (params.status ?? "all") === filter.value;
              return (
                <Button
                  key={filter.value}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 rounded-md px-2.5 text-xs border transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                    isActive
                      ? "border-primary/70 bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-background/85 dark:hover:bg-accent/55 hover:text-foreground"
                  }`}
                  onClick={() => setParams({ ...params, status: filter.value, page: 1 })}
                >
                  {filter.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Time</span>
          <div className="flex items-center gap-1 flex-wrap rounded-lg bg-muted/50 p-1">
            {rangeFilters.map((filter) => {
              const isActive = (params.range ?? "all") === filter.value;
              return (
                <Button
                  key={filter.value}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 rounded-md px-2.5 text-xs border transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                    isActive
                      ? "border-primary/70 bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-background/85 dark:hover:bg-accent/55 hover:text-foreground"
                  }`}
                  onClick={() => setParams({ ...params, range: filter.value, page: 1 })}
                >
                  {filter.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExecutionsList = () => {
  const executions = useSuspenseExecutions();
  return (
    <EntityList
      items={executions.data.items}
      getKey={(execution) => execution.id}
      renderItem={(execution) => <ExecutionItem data={execution} />}
      emptyView={<ExecutionsEmpty />}
      className="gap-y-3"
    />
  );
};

export const ExecutionsHeader = () => {
    
  return (
      <EntityHeader
        title="Executions"
        description="View your workflow execution history"
       
      />
  );
};

export const ExecutionsPagination = () => {
  const executions = useSuspenseExecutions();
  const [params, setParams] = useExecutionsParams();

  return (
    <EntityPagination
      disabled={executions.isFetching}
      totalPages={executions.data.totalPages}
      page={executions.data.page}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const ExecutionsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="h-[calc(100vh-(var(--spacing)*14))]">
      <EntityContainer
        header={<ExecutionsHeader />}
        search={<ExecutionsFilters />}
        pagination={<ExecutionsPagination />}
      >
        {children}
      </EntityContainer>
    </div>
  );
};

export const ExecutionsLoading = () => {
  return <ExecutionPageSkeleton />;
};

export const ExecutionsError = () => {
  return <ErrorView message="Error loading Executions" />;
};

export const ExecutionsEmpty = () => {
  const [params] = useExecutionsParams();
  const hasActiveFilters = (params.status && params.status !== "all") || (params.range && params.range !== "all");
  
  return (
      <EmptyView
        message={hasActiveFilters
          ? "No executions match these filters. Try widening the status or time range."
          : "You haven't created any executions yet. Get Started by running your first workflow."}
      />
  );
};

const statusStyles: Record<
  ExecutionStatus,
  {
    icon: ComponentType<{ className?: string }>;
    iconClass: string;
    textClass: string;
    dotClass: string;
  }
> = {
  [ExecutionStatus.SUCCESS]: {
    icon: CheckCircle2Icon,
    iconClass: "size-4 text-green-600 dark:text-green-400",
    textClass: "text-green-700 dark:text-green-400",
    dotClass: "bg-green-500",
  },
  [ExecutionStatus.FAILED]: {
    icon: XCircleIcon,
    iconClass: "size-4 text-red-600 dark:text-red-400",
    textClass: "text-red-700 dark:text-red-400",
    dotClass: "bg-red-500",
  },
  [ExecutionStatus.RUNNING]: {
    icon: Loader2Icon,
    iconClass: "size-4 text-blue-600 dark:text-blue-400 animate-spin",
    textClass: "text-blue-700 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
};

const defaultStatusStyle = {
  icon: ClockIcon,
  iconClass: "size-4 text-muted-foreground",
  textClass: "text-muted-foreground",
  dotClass: "bg-muted-foreground",
};

const getStatusStyle = (status: ExecutionStatus) => {
  return statusStyles[status] ?? defaultStatusStyle;
};

const formatStatus = (status: ExecutionStatus) => {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
export const ExecutionItem = ({ data }: { data: Omit<Execution, "errorStack"> & {
  workflow: {
    id: string;
    name: string;
  }
}
 }) => {
  const router = useRouter();
  const statusStyle = getStatusStyle(data.status);
  const StatusIcon = statusStyle.icon;
  const duration = data.completedAt
    ? Math.round(
      (new Date(data.completedAt).getTime() - new Date(data.startedAt).getTime()) /1000,
    )
    : null;

    const subtitle = (
      <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span className={`inline-flex items-center gap-1 font-medium ${statusStyle.textClass}`}>
          <span className={`size-1.5 rounded-full ${statusStyle.dotClass}`} aria-hidden="true" />
          {formatStatus(data.status)}
        </span>
        <span className="text-muted-foreground">&bull;</span>
        <span className="text-muted-foreground text-xs sm:text-sm">
          {formatRelativeShort(data.startedAt)}
        </span>
        {duration !== null && (
          <>
            <span className="hidden sm:inline text-muted-foreground">&bull;</span>
            <span className="hidden sm:inline text-muted-foreground text-xs sm:text-sm">Took {duration}s</span>
          </>
        )}
      </span>
    )
  return (
    <EntityItem
      href={`/executions/${data.id}`}
      title={data.workflow.name}
      subtitle={subtitle}
      image={
        <div className="size-8 rounded-full border border-border/50 bg-background/75 dark:bg-background/25 flex items-center justify-center">
          <StatusIcon className={statusStyle.iconClass} />
        </div>
      }
      actions={
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2.5 text-xs border-border/70 bg-background/75 dark:bg-card hover:bg-accent/70 dark:hover:bg-accent/80 hover:-translate-y-0.5 active:translate-y-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/workflows/${data.workflow.id}`);
          }}
        >
          <ArrowUpRightIcon className="size-3.5" />
          <span className="hidden sm:inline">Open workflow</span>
          <span className="sm:hidden">Open</span>
        </Button>
      }
    />
  );
};
