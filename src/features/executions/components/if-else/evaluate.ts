/**
 * Condition logic for the IF / Else node. Pure and dependency-free so it can
 * be unit-tested on its own; the executor resolves {{templates}} first and
 * hands plain strings to these functions.
 */

export const OPERATOR_VALUES = [
  "equals",
  "notEquals",
  "contains",
  "notContains",
  "startsWith",
  "endsWith",
  "greaterThan",
  "greaterOrEqual",
  "lessThan",
  "lessOrEqual",
  "isEmpty",
  "isNotEmpty",
] as const;

export type Operator = (typeof OPERATOR_VALUES)[number];

export const OPERATOR_LABELS: Record<Operator, string> = {
  equals: "is equal to",
  notEquals: "is not equal to",
  contains: "contains",
  notContains: "does not contain",
  startsWith: "starts with",
  endsWith: "ends with",
  greaterThan: "is greater than",
  greaterOrEqual: "is greater than or equal to",
  lessThan: "is less than",
  lessOrEqual: "is less than or equal to",
  isEmpty: "is empty",
  isNotEmpty: "is not empty",
};

export type Combinator = "and" | "or";

export type Condition = {
  left: string;
  operator: Operator;
  right?: string;
};

/** `is empty` / `is not empty` take no comparison value. */
export const operatorNeedsValue = (operator: Operator): boolean =>
  operator !== "isEmpty" && operator !== "isNotEmpty";

const toNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export const evaluateCondition = (
  left: string,
  operator: Operator,
  right: string,
  ignoreCase: boolean,
): boolean => {
  const norm = (value: string) => (ignoreCase ? value.toLowerCase() : value);
  const l = norm(left);
  const r = norm(right);

  switch (operator) {
    case "isEmpty":
      return left.trim() === "";
    case "isNotEmpty":
      return left.trim() !== "";
    case "contains":
      return l.includes(r);
    case "notContains":
      return !l.includes(r);
    case "startsWith":
      return l.startsWith(r);
    case "endsWith":
      return l.endsWith(r);
    case "equals":
    case "notEquals": {
      // "5" and "5.0" are equal as numbers; everything else compares as text.
      const ln = toNumber(left);
      const rn = toNumber(right);
      const same = ln !== null && rn !== null ? ln === rn : l === r;
      return operator === "equals" ? same : !same;
    }
    default: {
      // Numeric comparisons: if either side isn't a number, the condition is
      // false rather than guessing (so "abc" > 5 never sends you down True).
      const ln = toNumber(left);
      const rn = toNumber(right);
      if (ln === null || rn === null) return false;
      if (operator === "greaterThan") return ln > rn;
      if (operator === "greaterOrEqual") return ln >= rn;
      if (operator === "lessThan") return ln < rn;
      return ln <= rn; // lessOrEqual
    }
  }
};

export const combine = (results: boolean[], combinator: Combinator): boolean =>
  combinator === "or" ? results.some(Boolean) : results.every(Boolean);
