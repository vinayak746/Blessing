import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { polarClient } from "@/lib/polar";
import superjson from "superjson";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

type CreateTRPCContextOptions = {
  headers?: Headers;
};

export const createTRPCContext = async (opts?: CreateTRPCContextOptions) => {
  let session: Session | null = null;

  try {
    session = await auth.api.getSession({
      headers: opts?.headers ?? await headers(),
    });
  } catch {
    session = null;
  }

  return {
    session,
  };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = ctx.session;

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }
  return next({ ctx: { ...ctx, auth: session } });
});
export const premiumProcedure = protectedProcedure.use(
  async({ ctx, next })=>{
    const customer = await polarClient.customers.getStateExternal({
      externalId:ctx.auth.user.id,
    });
    if (
      !customer?.activeSubscriptions ||
      customer.activeSubscriptions.length === 0
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Active Subscription Required",
      });
    }
    return next({ ctx: { ...ctx, customer } }); 
    
  },
);