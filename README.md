# Blessing --- Visual Workflow Automation

Blessing is a node-based workflow automation platform for connecting
triggers, integrations, and AI-powered processing in visual workflows.
Available functionality depends on the node implementations and
configuration in the repository.

## Features

-   Visual, node-based workflow editor.
-   Registered triggers: Manual Trigger, Google Form Trigger, and Stripe
    Trigger.
-   HTTP Request node for calling external HTTP APIs.
-   AI nodes: OpenAI, Anthropic, and Gemini.
-   Integration nodes: Discord, Slack, and WhatsApp.
-   Gmail Reader node for reading email.
-   If/Else conditional node.
-   Self-Healing node.
-   Credential management.
-   Inngest-based execution infrastructure.
-   Better Auth with email/password, Google OAuth, and GitHub OAuth.
-   Polar checkout and customer-portal integration.

**Scope note:** The node component and executor registries do not
include a general-purpose database-write node, a dedicated email-sending
node, or a generic webhook trigger. Do not treat those as implemented
workflow nodes unless the codebase is updated and verified.

## Technology stack

The dependencies in `package.json` include Next.js 15, React 19,
TypeScript, Tailwind CSS, Radix UI, `@xyflow/react`, Jotai, TanStack
Query, React Hook Form, tRPC, Prisma, PostgreSQL, Better Auth, Polar,
Inngest, the Vercel AI SDK and provider packages for
OpenAI/Anthropic/Google, Sentry, and Biome.

A dependency being installed does not by itself prove that every feature
of that library is implemented.

## Registered node types

  Node type               High-level purpose
  ----------------------- ----------------------------------------------------------
  `INITIAL`               Initial node; currently uses the manual-trigger executor
  `MANUAL_TRIGGER`        Start a workflow manually
  `GOOGLE_FORM_TRIGGER`   Google Forms trigger
  `STRIPE_TRIGGER`        Stripe trigger
  `HTTP_REQUEST`          Make an HTTP request
  `OPENAI`                OpenAI processing
  `ANTHROPIC`             Anthropic processing
  `GEMINI`                Gemini processing
  `DISCORD`               Discord integration
  `SLACK`                 Slack integration
  `WHATSAPP`              WhatsApp integration
  `GMAIL_READER`          Read email through the configured Gmail credential
  `IF_ELSE`               Conditional branching
  `SELF_HEALING`          Self-healing workflow node

Keep the component registry, executor registry, and Prisma `NodeType`
enum consistent when adding or removing node types. Consult each node's
implementation for required fields, inputs, outputs, limits, and error
behavior.

## Illustrative workflow examples

These combinations use registered node types but are not guarantees that
every connection works without configuration. Set up credentials, map
data correctly, and test each workflow.

1.  Google Form Trigger → OpenAI, Anthropic, or Gemini → Slack or
    Discord.
2.  Stripe Trigger → AI processing if needed → Discord or Slack.
3.  Manual Trigger → HTTP Request → a supported downstream node.
4.  A trigger → If/Else → separate branches using supported nodes.

These examples do not imply the existence of a database-write node,
email-sending node, generic webhook trigger, or generic "trigger another
workflow" action.

## Prerequisites

-   Node.js and npm compatible with the installed Next.js 15 project
-   PostgreSQL
-   Git
-   OAuth credentials for the social sign-in providers you plan to
    enable
-   External provider accounts and credentials for the workflows you
    want to test

Inngest and ngrok are used by the local multi-process development setup.
ngrok is only needed when you require a public tunnel to your local app.

## Getting started

### 1. Clone and install

``` bash
git clone https://github.com/vinayak746/Blessing.git
cd Blessing
npm install
```

### 2. Configure environment variables

Create a local `.env` file in the project root. Never commit it or share
its contents. The source code references these variables:

  -----------------------------------------------------------------------
  Variable                            Purpose
  ----------------------------------- -----------------------------------
  `DATABASE_URL`                      PostgreSQL connection URL used by
                                      Prisma

  `ENCRYPTION_KEY`                    Key used by `Cryptr` to encrypt and
                                      decrypt saved credential values

  `GOOGLE_CLIENT_ID`                  Google OAuth client ID

  `GOOGLE_CLIENT_SECRET`              Google OAuth client secret

  `GITHUB_CLIENT_ID`                  GitHub OAuth client ID

  `GITHUB_CLIENT_SECRET`              GitHub OAuth client secret

  `POLAR_SUCCESS_URL`                 Return URL used by Polar checkout

  `QSTASH_TOKEN`                      QStash token used by the
                                      mail-sending service

  `MAILER_URL`                        Base URL for the external mailer
                                      service

  `NEWSLETTER_BASE_URL`               Newsletter service base URL; the
                                      code has a fallback if absent

  `NEXT_PUBLIC_APP_URL`               Public application URL where used

  `NGROK_URL`                         URL used by the `ngrok:dev` script
  -----------------------------------------------------------------------

Some variables are feature-specific rather than necessary for every
local run. The mail-sending service explicitly throws when
`QSTASH_TOKEN` or `MAILER_URL` is missing when that module is
initialized. Check the relevant code path before treating every variable
as mandatory.

Configure the Google and GitHub OAuth applications with callback URLs
that match this application's Better Auth configuration and the URL you
use to run it.

**Protect `ENCRYPTION_KEY` and keep it stable.** Losing or changing it
can make existing encrypted credentials impossible to decrypt. Back it
up securely outside the repository.

For workflow provider API keys such as OpenAI, Anthropic, and Gemini,
use Blessing's credential manager where supported rather than assuming
they belong in `.env`.

### 3. Apply database migrations

Ensure PostgreSQL is running and `DATABASE_URL` points to your database,
then run:

``` bash
npx prisma migrate dev
```

The repository contains Prisma migrations. A seed configuration or seed
implementation was not confirmed during the README audit, so this guide
does not recommend `npx prisma db seed`.

### 4. Start the web app

``` bash
npm run dev
```

Open <http://localhost:3000>.

### 5. Start all local development processes (optional)

`npm run dev:all` uses `mprocs.yaml` to start Next.js, the Inngest CLI
development server, and ngrok:

``` bash
npm run dev:all
```

Configure `NGROK_URL` and ngrok access first. If you only need the web
app, use `npm run dev`.

## Available scripts

  -----------------------------------------------------------------------
  Command                             Description
  ----------------------------------- -----------------------------------
  `npm run dev`                       Start Next.js with Turbopack

  `npm run build`                     Generate Prisma Client and build
                                      the app

  `npm run start`                     Start the production Next.js server

  `npm run lint`                      Run Biome checks

  `npm run format`                    Format files with Biome

  `npm run inngest:dev`               Start the Inngest CLI development
                                      server

  `npm run ngrok:dev`                 Start ngrok using `NGROK_URL`

  `npm run dev:all`                   Start Next.js, Inngest, and ngrok
                                      through `mprocs`
  -----------------------------------------------------------------------

## How to use Blessing

1.  Sign in or create an account.
2.  Create a workflow in the editor.
3.  Add a trigger that matches the start method you need.
4.  Add supported processing and integration nodes.
5.  Configure each node and provide required credentials through the
    credential manager.
6.  Connect nodes and configure the data passed between them.
7.  Save and test the workflow.
8.  Inspect execution status and available execution details when
    troubleshooting.

Document exact activation, deployment, retry, and execution-history
behavior from the relevant implementation rather than assuming it is
identical for every trigger.

## Credentials and security

The Prisma `Credential` model stores a credential's type, name,
encrypted value, and owning user. The credential router encrypts values
before writing them to the database. The single-credential response
masks the value, and the list query selects non-sensitive fields.

The encryption helper initializes `Cryptr` with `ENCRYPTION_KEY`.
Protect this key as a production secret. Access to both the database and
encryption key may allow someone to recover stored credential values.
This summary is not a complete security audit.

Never commit `.env` files, API keys, OAuth secrets, encryption keys, or
database dumps.

## Troubleshooting

### Database connection or migration errors

-   Confirm PostgreSQL is running.
-   Check that `DATABASE_URL` points to the intended database.
-   Run `npx prisma migrate dev` and inspect the full error output.

### OAuth sign-in errors

-   Verify the provider's client ID and secret.
-   Check that the configured OAuth callback URL matches the application
    URL and Better Auth setup.

### Credential decryption errors

-   Confirm `ENCRYPTION_KEY` is set.
-   Ensure the same key used to encrypt existing credentials is
    available.
-   Do not change the key without a migration plan for existing values.

### Inngest or ngrok errors

-   Run `npm run inngest:dev` or `npm run ngrok:dev` individually to
    isolate the issue.
-   Check the relevant CLI configuration and `NGROK_URL`.

### An integration node fails

-   Check the node's required credential and configuration fields.
-   Verify provider permissions, API limits, and expected input/output
    formats.
-   Review execution logs.

## Project structure

Important areas include:

-   `src/config/` --- application configuration, including the node
    component registry
-   `src/features/auth/` --- authentication UI
-   `src/features/credentials/` --- credential management
-   `src/features/executions/` --- node implementations and executors
-   `src/features/triggers/` --- trigger implementations
-   `src/lib/` --- shared utilities, database client, authentication,
    and encryption
-   `prisma/schema.prisma` --- Prisma data model
-   `prisma/migrations/` --- database migrations
-   `mprocs.yaml` --- local multi-process development configuration

Consult the repository for the complete current directory layout.

## Deployment notes

Before deploying:

-   Configure a production PostgreSQL database and apply migrations
    using your deployment process.
-   Set environment variables required by the features you enable.
-   Store secrets in the hosting provider's secret manager.
-   Configure production OAuth callback URLs.
-   Protect and securely back up `ENCRYPTION_KEY`.
-   Configure Inngest and external services required by the triggers and
    integrations you use.
-   Verify the production build and test representative workflows.

The project includes Vercel-related dependencies, but deployment
behavior depends on the hosting configuration. A Git push triggers
deployment only if an appropriate deployment integration is configured.

## Roadmap

Keep the roadmap aligned with the issue tracker or an explicitly
maintained plan. Clearly label planned capabilities and do not describe
them as available today. Keep planned items separate from the
implemented node catalogue.

## Contributing

1.  Explain the issue or improvement.
2.  Keep the component registry, executor registry, and Prisma
    `NodeType` enum consistent when changing node types.
3.  Update node documentation and workflow examples.
4.  Add or update tests where appropriate.
5.  Run the project's lint, build, and relevant test checks.

Do not include credentials, tokens, database dumps, or other secrets in
issues or pull requests.

## License

The previous README identified the project as MIT. Confirm that the
repository contains the corresponding `LICENSE` file before relying on
that statement for redistribution.

## Support and links

-   Repository: <https://github.com/vinayak746/Blessing>

Use the repository's issue tracker for bug reports and feature requests
if it is enabled.
