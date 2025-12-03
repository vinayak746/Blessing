import {checkout,polar,portal}from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/db";
import { polarClient } from "./polar";
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins:[
    polar({
      client: polarClient,
      createCustomerOnSignUp:true,
      use:[
        checkout({
          products:[
            {
              productId: "2a019c00-f84f-431c-91b3-9f0062c9a17a",
              slug:"pro"
            }
          ],
          successUrl: process.env.POLAR_SUCCESS_URL ,
          authenticatedUsersOnly: true,
        }),
        portal(),
      ]
    })
  ]
});
