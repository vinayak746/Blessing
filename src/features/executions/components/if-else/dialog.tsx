"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, InfoIcon, PlusIcon, Trash2Icon } from "lucide-react";
import {
  OPERATOR_LABELS,
  OPERATOR_VALUES,
  operatorNeedsValue,
} from "./evaluate";
import {
  findOption,
  type UpstreamValues,
  type ValueGroup,
} from "./value-options";

/** Select value meaning "let me type it myself" (never stored). */
const CUSTOM = "__custom__";

const conditionSchema = z
  .object({
    /** "pick": chosen from the list. "custom": typed by the user. */
    source: z.enum(["pick", "custom"]),
    left: z.string().min(1, "Choose what you want to check"),
    /** Plain-language name of the picked value, kept so the node can show it. */
    leftLabel: z.string().optional(),
    operator: z.enum(OPERATOR_VALUES),
    right: z.string().optional(),
  })
  .refine(
    (condition) =>
      !operatorNeedsValue(condition.operator) ||
      (condition.right ?? "").trim().length > 0,
    { message: "Enter the value to compare with", path: ["right"] },
  );

const formSchema = z.object({
  variableName: z
    .string()
    .refine(
      (value) => value === "" || /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value),
      {
        message:
          "Start with a letter and use only letters, numbers and underscores (no spaces)",
      },
    )
    .optional(),
  combinator: z.enum(["and", "or"]),
  ignoreCase: z.boolean(),
  conditions: z.array(conditionSchema).min(1, "Add at least one check"),
});

export type IfElseFormValues = z.infer<typeof formSchema>;
type ConditionValues = IfElseFormValues["conditions"][number];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: IfElseFormValues) => void;
  defaultValues?: Partial<
    Omit<IfElseFormValues, "conditions"> & {
      // Older saved nodes don't have `source` / `leftLabel`.
      conditions: Partial<ConditionValues>[];
    }
  >;
  /** What earlier steps can be checked, plain-language. */
  upstream?: UpstreamValues;
}

const NO_UPSTREAM: UpstreamValues = { groups: [], unnamed: [] };

const newCondition = (groups: ValueGroup[]): ConditionValues => ({
  source: groups.length > 0 ? "pick" : "custom",
  left: "",
  leftLabel: undefined,
  operator: "equals",
  right: "",
});

/** Fills in `source` for conditions saved before the picker existed. */
const normalizeCondition = (
  condition: Partial<ConditionValues>,
  groups: ValueGroup[],
): ConditionValues => {
  const left = condition.left ?? "";
  const known = left ? findOption(groups, left) : undefined;
  return {
    source: condition.source ?? (left && !known ? "custom" : "pick"),
    left,
    leftLabel: condition.leftLabel ?? known?.label,
    operator: condition.operator ?? "equals",
    right: condition.right ?? "",
  };
};

const describeCondition = (condition: ConditionValues): string => {
  const what = condition.leftLabel || condition.left || "…";
  const how = OPERATOR_LABELS[condition.operator];
  return operatorNeedsValue(condition.operator)
    ? `${what} ${how} “${condition.right ?? ""}”`
    : `${what} ${how}`;
};

export const IfElseDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
  upstream = NO_UPSTREAM,
}: Props) => {
  const { groups, unnamed } = upstream;
  const [moreOpen, setMoreOpen] = useState(false);

  // `defaultValues` is a new object on every render of the parent node, so
  // depend on its content, not its identity.
  const initialValues = useMemo<IfElseFormValues>(() => {
    const saved = defaultValues.conditions ?? [];
    let conditions: ConditionValues[];

    if (saved.length > 0) {
      conditions = saved.map((c) => normalizeCondition(c, groups));
    } else {
      // Brand-new node: start with the most recent step's first result so
      // there's something sensible to build on instead of a blank form.
      const first = groups[0]?.options[0];
      conditions = [
        first
          ? {
              ...newCondition(groups),
              left: first.value,
              leftLabel: first.label,
            }
          : newCondition(groups),
      ];
    }

    return {
      variableName: defaultValues.variableName ?? "",
      combinator: defaultValues.combinator ?? "and",
      // Friendlier default for people: "Yes" matches "yes" and "YES".
      ignoreCase: defaultValues.ignoreCase ?? true,
      conditions,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultValues), groups]);

  const form = useForm<IfElseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "conditions",
  });

  useEffect(() => {
    if (open) {
      form.reset(initialValues);
      setMoreOpen(false);
    }
    // Re-seed only when the dialog is (re)opened, never while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const conditions = form.watch("conditions");
  const combinator = form.watch("combinator");
  const watchVariableName = form.watch("variableName") || "myCheck";

  const handlePick = (index: number, selected: string) => {
    const path = `conditions.${index}` as const;
    if (selected === CUSTOM) {
      form.setValue(`${path}.source`, "custom");
      form.setValue(`${path}.leftLabel`, undefined);
      // Don't keep a picked template around as if the user had typed it.
      if (findOption(groups, form.getValues(`${path}.left`))) {
        form.setValue(`${path}.left`, "");
      }
      return;
    }
    const option = findOption(groups, selected);
    form.setValue(`${path}.source`, "pick");
    form.setValue(`${path}.left`, selected, { shouldValidate: true });
    form.setValue(`${path}.leftLabel`, option?.label);
  };

  const handleSubmit = (values: IfElseFormValues) => {
    onSubmit({
      ...values,
      conditions: values.conditions.map((c) => ({
        ...c,
        left: c.left.trim(),
        right: (c.right ?? "").trim(),
        leftLabel: c.source === "pick" ? c.leftLabel : undefined,
      })),
    });
    onOpenChange(false);
  };

  const complete = (conditions ?? []).filter(
    (c) =>
      c.left?.trim() &&
      (!operatorNeedsValue(c.operator) || (c.right ?? "").trim()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>If / Else: make a decision</DialogTitle>
          <DialogDescription>
            Check something from an earlier step. If it&apos;s true, the
            workflow follows the <strong>Yes</strong> path; if not, the{" "}
            <strong>No</strong> path.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="mt-2 space-y-5"
          >
            {groups.length === 0 ? (
              <div className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
                <InfoIcon className="mt-0.5 size-4 shrink-0" />
                <p>
                  Connect this step <strong>after</strong> another step (like
                  Gmail, an HTTP request or an AI step) to choose from its
                  results. For now you can type a value yourself.
                </p>
              </div>
            ) : null}

            <div className="space-y-3">
              {fields.map((field, index) => {
                const condition = conditions?.[index];
                const operator = condition?.operator ?? "equals";
                const needsValue = operatorNeedsValue(operator);
                const isCustom = condition?.source === "custom";
                const picked = condition?.left
                  ? findOption(groups, condition.left)
                  : undefined;

                return (
                  <div
                    key={field.id}
                    className="space-y-3 rounded-xl border p-3 sm:p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {index === 0
                          ? "Check"
                          : combinator === "or"
                            ? "Or check"
                            : "And check"}
                      </span>
                      {fields.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                          onClick={() => remove(index)}
                        >
                          <Trash2Icon className="size-3.5" />
                          Remove
                        </Button>
                      ) : null}
                    </div>

                    {/* 1. What to check */}
                    <FormField
                      control={form.control}
                      name={`conditions.${index}.left`}
                      render={({ field: leftField }) => (
                        <FormItem>
                          <FormLabel>What do you want to check?</FormLabel>
                          <Select
                            value={
                              isCustom ? CUSTOM : leftField.value || undefined
                            }
                            onValueChange={(value) => handlePick(index, value)}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose a result from an earlier step" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {groups.map((group) => (
                                <SelectGroup key={group.nodeId}>
                                  <SelectLabel>{group.title}</SelectLabel>
                                  {group.options.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ))}
                              <SelectGroup>
                                {groups.length > 0 ? (
                                  <SelectLabel>Other</SelectLabel>
                                ) : null}
                                <SelectItem value={CUSTOM}>
                                  Something else (type it yourself)
                                </SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          {isCustom ? (
                            <>
                              <FormControl>
                                <Input
                                  placeholder="Type a value, or a variable like {{name.field}}"
                                  {...leftField}
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Tip: wrap a result from an earlier step in
                                double curly brackets, e.g.{" "}
                                <code className="rounded bg-muted px-1">
                                  {"{{gemini.text}}"}
                                </code>
                                .
                              </FormDescription>
                            </>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 2 + 3. How, and compared with what */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`conditions.${index}.operator`}
                        render={({ field: opField }) => (
                          <FormItem>
                            <FormLabel>Is it…</FormLabel>
                            <Select
                              onValueChange={opField.onChange}
                              value={opField.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {OPERATOR_VALUES.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {OPERATOR_LABELS[value]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {needsValue ? (
                        <FormField
                          control={form.control}
                          name={`conditions.${index}.right`}
                          render={({ field: rightField }) => (
                            <FormItem>
                              <FormLabel>Compared with</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={
                                    picked?.example
                                      ? `e.g. ${picked.example}`
                                      : "Type a value"
                                  }
                                  {...rightField}
                                  value={rightField.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => append(newCondition(groups))}
                >
                  <PlusIcon className="size-3.5" />
                  Add another check
                </Button>

                {fields.length > 1 ? (
                  <FormField
                    control={form.control}
                    name="combinator"
                    render={({ field }) => (
                      <FormItem className="flex flex-wrap items-center gap-2 space-y-0">
                        <FormLabel className="text-xs text-muted-foreground">
                          Go the Yes way when
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-8 w-56">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="and">
                              all the checks are met
                            </SelectItem>
                            <SelectItem value="or">
                              any one check is met
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                ) : null}
              </div>

              {form.formState.errors.conditions?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.conditions.message}
                </p>
              ) : null}

              {unnamed.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Not listed because they have no variable name yet:{" "}
                  {unnamed.join(", ")}. Open them and give each a variable name
                  to use their results here.
                </p>
              ) : null}
            </div>

            {/* What this will do, in a sentence */}
            <div className="space-y-2 rounded-xl bg-muted p-3 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What this will do
              </p>
              {complete.length > 0 ? (
                <p className="text-sm leading-relaxed">
                  Follow the{" "}
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
                    Yes
                  </span>{" "}
                  path when{" "}
                  {complete.map((c, i) => (
                    <span key={i}>
                      {i > 0 ? (
                        <strong>
                          {combinator === "or" ? " or " : " and "}
                        </strong>
                      ) : null}
                      <strong>{describeCondition(c)}</strong>
                    </span>
                  ))}
                  . Otherwise follow the{" "}
                  <span className="rounded bg-rose-500/15 px-1.5 py-0.5 font-semibold text-rose-700 dark:text-rose-400">
                    No
                  </span>{" "}
                  path.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Fill in the check above and it will be summarised here.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                On the canvas, drag a line from the <strong>Yes</strong> dot to
                the step that should run when it&apos;s met, and from the{" "}
                <strong>No</strong> dot to the step for when it isn&apos;t.
              </p>
            </div>

            {/* Advanced, tucked away */}
            <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
                >
                  <ChevronDownIcon
                    className={`size-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                  />
                  More options
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-4">
                <FormField
                  control={form.control}
                  name="ignoreCase"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">
                          Ignore capital letters
                        </FormLabel>
                        <FormDescription className="text-xs">
                          &quot;Yes&quot;, &quot;yes&quot; and &quot;YES&quot;
                          all count as the same.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="variableName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Save the answer for later steps (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="myCheck"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Later steps can then use{" "}
                        <code className="rounded bg-muted px-1">
                          {`{{${watchVariableName}.result}}`}
                        </code>{" "}
                        (true or false).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
