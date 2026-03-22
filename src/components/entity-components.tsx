import {
  AlertTriangleIcon,
  Loader2Icon,
  MoreVerticalIcon,
  PackageOpenIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { Input } from "./ui/input";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useState } from "react";

type EntityStatItem = {
  id?: string;
  label: string;
  value: React.ReactNode;
  helper?: string;
};

type EntityHeaderProps = {
  title: string;
  description?: string;
  newButtonLabel?: string;
  newButtonClassName?: string;
  disabled?: boolean;
  isCreating?: boolean;
} & (
  | { onNew: () => void; newButtonHref?: never }
  | { newButtonHref: string; onNew?: never }
  | { newButtonHref?: never; onNew?: never }
);

export const EntityHeader = ({
  title,
  description,
  onNew,
  newButtonHref,
  newButtonLabel,
  newButtonClassName,
  disabled,
  isCreating,
}: EntityHeaderProps) => {
  return (
    <div className="flex flex-row items-start justify-between gap-4 md:items-center md:gap-x-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl md:text-[1.7rem] leading-tight font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {onNew && !newButtonHref && (
        <Button
          disabled={isCreating || disabled}
          size="sm"
          className={cn(
            "transition-all active:scale-[0.98]",
            newButtonClassName,
          )}
          onClick={onNew}
        >
          <PlusIcon className="size-4" />
          {newButtonLabel}
        </Button>
      )}
      {newButtonHref && !onNew && (
        <Button
          size="sm"
          className={cn(
            "transition-all active:scale-[0.98]",
            newButtonClassName,
          )}
          asChild
        >
          <Link href={newButtonHref} prefetch>
            <PlusIcon className="size-4" />
            {newButtonLabel}
          </Link>
        </Button>
      )}
    </div>
  );
};
type EntityContainerProps = {
  children: React.ReactNode;
  header: React.ReactNode;
  search?: React.ReactNode;
  pagination?: React.ReactNode;
};
export const EntityContainer = ({
  children,
  header,
  search,
  pagination,
}: EntityContainerProps) => {
  return (
    <div className="p-5 md:px-8 md:py-7 h-full">
      <div className="mx-auto max-w-7xl w-full flex flex-col gap-y-7 h-full">
        {header}
        <div className="rounded-xl border border-border bg-card/70 dark:bg-card/80 p-5 md:p-6 flex flex-col gap-y-5 h-full shadow-sm dark:shadow-md">
          {search}
          {children}
        </div>
        <div className="mt-auto">{pagination}</div>
      </div>
    </div>
  );
};

interface EntitySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const EntitySearch = ({
  value,
  onChange,
  placeholder = "Search",
}: EntitySearchProps) => {
  return (
    <div className="relative ml-auto w-full md:w-auto">
      <SearchIcon
        className="size-3.5 absolute left-3 top-1/2 
            -translate-y-1/2 text-muted-foreground"
      />
      <Input
        className="w-full md:w-[240px] bg-background/95 shadow-none border-border text-foreground/85 dark:text-foreground pl-8 focus-visible:ring-2 focus-visible:ring-primary/45"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export const EntityStats = ({ items }: { items: EntityStatItem[] }) => {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {items.map((item, index) => (
        <div
          key={item.id ?? `${item.label}-${index}`}
          className="rounded-lg border bg-background/80 px-3 py-2"
        >
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 text-base md:text-lg font-semibold leading-none">
            {item.value}
          </p>
          {item.helper && (
            <p className="mt-1 text-[11px] text-muted-foreground">{item.helper}</p>
          )}
        </div>
      ))}
    </div>
  );
};

interface EntityPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}
export const EntityPagination = ({
  page,
  totalPages,
  onPageChange,
  disabled,
}: EntityPaginationProps) => {
  return (
    <div className="flex items-center justify-center gap-x-2 w-full">
      <div className="flex-1 text-sm text-muted-foreground">
        Page {page} of {totalPages || 1}
      </div>
      <div className="flex items-center justify-end space-x-2 py-4 ">
        <Button
          disabled={page === 1 || disabled}
          variant="outline"
          size="sm"
          className="min-w-20 border-border/80 bg-background/90 hover:bg-accent/70 hover:border-primary/45 hover:text-foreground active:scale-[0.98] transition-all"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <Button
          disabled={page === totalPages || totalPages === 0 || disabled}
          variant="outline"
          size="sm"
          className="min-w-20 border-border/80 bg-background/90 hover:bg-accent/70 hover:border-primary/45 hover:text-foreground hover:translate-y-0 active:scale-[0.98] transition-all"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

interface StateViewProps {
  message?: string;
}

export const LoadingView = ({ message }: StateViewProps) => {
  return (
    <div className="flex justify-center items-center h-full  flex-1 flex-col gap-y-4" aria-live="polite">
      <Loader2Icon className=" size-6 animate-spin text-primary" />
      {!!message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
};

export const ErrorView = ({ message }: StateViewProps) => {
  return (
    <div className="flex justify-center items-center h-full  flex-1 flex-col gap-y-4" role="alert">
      <AlertTriangleIcon className=" size-6 text-red-500" />
      {!!message && <p className="text-sm text-foreground">{message}</p>}
    </div>
  );
};

interface EmptyViewProps extends StateViewProps {
  onNew?: () => void;
}

export const EmptyView = ({ message, onNew }: EmptyViewProps) => {
  return (
    <Empty className="border border-dashed bg-secondary/40 rounded-xl p-2">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackageOpenIcon />
        </EmptyMedia>
      </EmptyHeader>
      <EmptyTitle>No items</EmptyTitle>
      {!!message && <EmptyDescription>{message}</EmptyDescription>}
      {!!onNew && (
        <EmptyContent>
          <Button onClick={onNew}>Add item</Button>
        </EmptyContent>
      )}
    </Empty>
  );
};

interface EntityListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey?: (item: T, index: number) => string | number;
  emptyView?: React.ReactNode;
  className?: string;
}

export const EntityList = <T,>({
  items,
  renderItem,
  getKey,
  emptyView,
  className,
}: EntityListProps<T>) => {
  if (items.length === 0 && emptyView) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="max-w-sm mx-auto">{emptyView}</div>
      </div>
    );
  }
  return (
    <div className={cn("flex flex-col gap-y-4", className)}>
      {items.map((items, index) => (
        <div key={getKey ? getKey(items, index) : index}>
          {renderItem(items, index)}
        </div>
      ))}
    </div>
  );
};

interface EnitityItemProps {
  href: string;
  title: string;
  subtitle?: React.ReactNode;
  image?: React.ReactNode;
  actions?: React.ReactNode;
  onRemove?: () => void | Promise<void>;
  isRemoving?: boolean;
  className?: string;
  deleteConfirmMessage?: string;
}

export const EntityItem = ({
  href,
  title,
  subtitle,
  image,
  actions,
  onRemove,
  isRemoving,
  className,
  deleteConfirmMessage,
}: EnitityItemProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRemoving) {
      return;
    }
    // Show confirmation dialog
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (onRemove) {
      await onRemove();
    }
    setShowDeleteConfirm(false);
  };
  return (
    <>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="border-border/80 bg-card/95 backdrop-blur-sm sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="size-4 text-destructive" />
              <span>Delete item?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {deleteConfirmMessage || `This will permanently delete "${title}". This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-border/80 bg-background/80 hover:bg-accent/70">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
            >
              {isRemoving ? (
                <>
                  <Loader2Icon className="size-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Link
        href={href}
        prefetch
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Card
          className={cn(
            "p-4 border-border/80 bg-card dark:bg-card/90 shadow-none cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-primary/80 hover:bg-accent/55 dark:hover:border-primary/45 dark:hover:bg-accent/35",
            isRemoving && "opacity-50 cursor-not-allowed",
            className,
          )}
        >
          <CardContent className="flex flex-row items-center justify-between p-0">
            <div className="flex items-center gap-3">
              {image}
              <div className="min-w-0">
                <CardTitle className="text-sm md:text-base font-medium truncate">
                  {title}
                </CardTitle>
                {!!subtitle && (
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground/95 dark:text-muted-foreground">
                    {subtitle}
                  </CardDescription>
                )}
              </div>
            </div>
            {(actions || onRemove) && (
              <div className="flex gap-x-4 items-center">
                {actions}
                {onRemove && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`More options for ${title}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVerticalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem onClick={handleRemove}>
                        <TrashIcon className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </>
  );
};
