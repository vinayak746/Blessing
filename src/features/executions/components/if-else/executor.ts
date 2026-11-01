import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import { BRANCH_KEY, type NodeExecutor } from "@/features/executions/types";
import { ifElseChannel } from "@/inngest/channels/if-else";
import {
  combine,
  evaluateCondition,
  operatorNeedsValue,
  type Combinator,
  type Condition,
} from "./evaluate";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type IfElseData = {
  variableName?: string;
  combinator?: Combinator;
  ignoreCase?: boolean;
  conditions?: Condition[];
};

export const ifElseExecutor: NodeExecutor<IfElseData> = async ({
  data,
  nodeId,
  context,
  publish,
}) => {
  await publish(ifElseChannel().status({ nodeId, status: "loading" }));

  const conditions = data.conditions ?? [];

  if (conditions.length === 0) {
    await publish(ifElseChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("IF / Else node: add at least one condition");
  }

  // noEscape: we are comparing values, not rendering HTML, so "Tom & Jerry"
  // must stay "Tom & Jerry" rather than become "Tom &amp; Jerry".
  const resolve = (template: string | undefined, label: string): string => {
    try {
      return Handlebars.compile(template ?? "", { noEscape: true })(
        context,
      ).trim();
    } catch (error) {
      throw new NonRetriableError(
        `IF / Else node: could not read ${label}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  let result: boolean;
  try {
    const outcomes = conditions.map((condition, index) =>
      evaluateCondition(
        resolve(condition.left, `condition ${index + 1} value`),
        condition.operator,
        operatorNeedsValue(condition.operator)
          ? resolve(condition.right, `condition ${index + 1} comparison`)
          : "",
        data.ignoreCase === true,
      ),
    );
    result = combine(outcomes, data.combinator ?? "and");
  } catch (error) {
    await publish(ifElseChannel().status({ nodeId, status: "error" }));
    throw error;
  }

  const branch = result ? "true" : "false";

  await publish(ifElseChannel().status({ nodeId, status: "success" }));

  return {
    ...context,
    // Optional: lets later nodes read {{myCheck.result}} / {{myCheck.branch}}.
    ...(data.variableName ? { [data.variableName]: { result, branch } } : {}),
    [BRANCH_KEY]: [branch],
  };
};
