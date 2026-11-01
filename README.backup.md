# Blessing - Workflow Automation Platform

> **A visual, no-code workflow builder powered by AI** | Create powerful automation workflows without writing a single line of code

## What is Blessing?

**Blessing** is an intelligent workflow automation platform that allows anyone to create, visualize, and execute complex automation workflows using a drag-and-drop editor. Think of it like Zapier or Make.com - but with a beautiful visual interface and AI integration built in.

### In Simple Terms:

Imagine you could connect different apps and services together like building with LEGO blocks:
- **Google Form** → When someone fills out your form
- **AI Processing** → Automatically analyze and process the response with Claude, ChatGPT, or Gemini
- **Send to Discord/Slack** → Post the result to your team's communication channel
- **Save to Database** → Store everything for future reference

BLESSING lets you do exactly that - visually, without coding!

---

## Key Features

### 🎨 **Visual Workflow Editor**
Drag and drop nodes to create workflows. See your automation flow in real-time.

### 🤖 **AI Integration**
Built-in support for:
- **OpenAI** (GPT models)
- **Anthropic Claude** (Advanced reasoning)
- **Google Gemini** (Multimodal AI)

### 🔌 **Multiple Triggers & Actions**
Connect workflows to various services:
- **Triggers**: Google Forms, Stripe payments, Manual triggers, HTTP requests
- **Actions**: Discord, Slack, HTTP requests, AI processing
- **Easy credential management** for secure API key storage

### 💾 **Secure Credential Management**
Encrypted storage of API keys and secrets. Your credentials stay safe.

### ⚡ **Real-time Execution**
Watched powered by **Inngest** - a reliable task queue system for running workflows

### 📊 **Execution History & Monitoring**
Track every workflow run, see success/failure status, debug errors

### 👤 **User Authentication**
Secure login with **Better Auth** and OAuth support (Google, GitHub)

---

## Tech Stack

### Frontend
- **Next.js 15** - React framework with app router
- **React 19** - Modern React features
- **Radix UI** - Accessible, unstyled UI components
- **TailwindCSS** - Utility-first CSS
- **React Flow** - Interactive node-based graph editing
- **React Hook Form** - Form state management
- **Jotai** - Simple state management
- **TanStack React Query** - Data fetching and caching

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **tRPC** - Type-safe RPC framework
- **PostgreSQL** - Relational database
- **Prisma ORM** - Database access and migrations

### Infrastructure & Services
- **Inngest** - Workflow task queue and scheduling
- **Better Auth** - Authentication & authorization
- **Vercel** - Deployment platform
- **Sentry** - Error tracking

### AI/LLM Integrations
- **Vercel AI SDK** - Unified AI provider interface
- OpenAI, Anthropic, Google AI SDKs

---

## Project Structure

```
src/
├── app/                      # Next.js app router pages
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Main dashboard
│   ├── api/                 # API routes
│   └── ...
├── components/              # Reusable React components
├── features/                # Feature modules (organized by domain)
│   ├── auth/               # Authentication logic & components
│   ├── workflows/          # Workflow CRUD operations
│   ├── editor/             # Visual workflow editor
│   │   ├── components/     # Editor UI components
│   │   └── store/          # Editor state management
│   ├── triggers/           # Trigger types & components
│   ├── executions/         # Execution history & monitoring
│   ├── credentials/        # API key management
│   └── subscriptions/      # Stripe webhook handling
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── trpc/                   # tRPC router setup
│   ├── routers/           # API route handlers
│   ├── client.tsx         # Client-side tRPC setup
│   └── init.ts            # tRPC initialization
├── inngest/               # Inngest workflow definitions
└── config/                # Configuration files

prisma/
└── schema.prisma          # Database schema
```

---

## Database Schema (Core Models)

### User
Stores user information and authentication details.
```prisma
user {
  id, name, email, emailVerified, image
  sessions, accounts, workflows, credentials
}
```

### Workflow
Represents an automation workflow.
```prisma
workflow {
  id, name, createdAt, updatedAt
  nodes, connections, executions
  userId (owner)
}
```

### Node
A single action/trigger in the workflow (e.g., "Send to Discord", "Call OpenAI").
```prisma
node {
  id, type (INITIAL, GOOGLE_FORM_TRIGGER, ANTHROPIC, DISCORD, etc.)
  position (x, y coordinates)
  data (JSON config), credentialId
  workflowId, inputConnections, outputConnections
}
```

### Connection
Links nodes together to form the workflow logic.
```prisma
connection {
  fromNodeId, toNodeId
  fromOutput, toInput (output socket names)
  workflowId
}
```

### Execution
Records of workflow runs.
```prisma
execution {
  status (RUNNING, SUCCESS, FAILED)
  error, errorStack, output (JSON)
  startedAt, completedAt
  inngestEventId (references Inngest task)
}
```

### Credential
Encrypted API keys for third-party services.
```prisma
credential {
  name, value (encrypted), type (OPENAI, ANTHROPIC, GEMINI)
  userId
}
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vinayak746/Blessing.git
   cd Blessing
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/blessing"

   # Authentication
   BETTER_AUTH_URL="http://localhost:3000"
   BETTER_AUTH_SECRET="your-secret-key"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # AI Providers (add keys for services you want to use)
   OPENAI_API_KEY="your-openai-key"
   ANTHROPIC_API_KEY="your-anthropic-key"
   GOOGLE_AI_API_KEY="your-google-ai-key"

   # Inngest (workflow task queue)
   INNGEST_EVENT_KEY="your-inngest-event-key"
   INNGEST_SIGNING_KEY="your-inngest-signing-key"

   # Stripe (for payments/webhooks)
   STRIPE_SECRET_KEY="your-stripe-secret"
   STRIPE_WEBHOOK_SECRET="your-webhook-secret"
   ```

4. **Set up the database**
   ```bash
   # Create database tables
   npx prisma migrate dev

   # (Optional) Seed with test data
   npx prisma db seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How It Works

### 1. **Create a Workflow**
   - Go to dashboard
   - Click "New Workflow"
   - Name your workflow

### 2. **Design in Visual Editor**
   - Open the workflow editor
   - Drag nodes (triggers, actions, AI processing) onto the canvas
   - Connect nodes by dragging from output sockets to input sockets
   - Configure each node with specific settings

### 3. **Add Credentials**
   - For nodes that need API keys (OpenAI, Discord, etc.)
   - Create credentials in your account settings
   - Assign credentials to nodes

### 4. **Save & Deploy**
   - Save the workflow
   - Activate the trigger
   - Workflow is now live!

### 5. **Monitor Execution**
   - View execution history
   - Check success/failure status
   - Debug using error logs

---

## Available Scripts

```bash
# Development with turbopack (faster builds)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting with Biome
npm run lint

# Format code
npm run format

# Run Inngest locally
npm run inngest:dev

# Run all services with mprocs (dev, ngrok, inngest)
npm run dev:all
```

---

## Example Workflows You Can Build

### 📝 **Automated Content Processing**
```
Google Form (trigger) 
  → Claude AI (analyze & generate summary)
  → Save to Database
  → Post to Slack (notify team)
```

### 💳 **Payment Notification System**
```
Stripe Payment (trigger)
  → OpenAI (generate thank you message)
  → Send Email
  → Discord notification
```

### 📊 **Data Processing Pipeline**
```
HTTP Webhook (trigger)
  → Gemini AI (process data)
  → Save to PostgreSQL
  → Trigger another workflow
```

---

## Key Concepts for Beginners

### **Nodes**
Building blocks of your workflow. Each node does one thing:
- **Trigger Node**: Starts the workflow (Google Form submission, payment, etc.)
- **Action Node**: Performs an action (send message, call API, etc.)
- **AI Node**: Processes data with AI (Claude, ChatGPT, Gemini)

### **Connections**
Lines that connect nodes together. Data flows through connections.

### **Execution**
One complete run of your workflow. Each time a trigger happens, one execution occurs.

### **Credentials**
Safely store API keys. Never hardcode secrets in nodes!

---

## Deployment

The project is configured for deployment on **Vercel**:

```bash
# Deploy automatically
git push origin main

# Or deploy manually
vercel deploy
```

**Important**: Set environment variables on Vercel dashboard before deploying.

---

## Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit (`git commit -m 'Add amazing feature'`)
5. Push (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## Troubleshooting

### Database Connection Error
```
Check your DATABASE_URL in .env.local
Ensure PostgreSQL is running
```

### API Keys Not Working
```
Verify API keys in your Credentials page
Ensure they have proper permissions
Check Execution history for detailed error messages
```

### Workflows Not Triggering
```
Ensure Inngest is running (npm run inngest:dev)
Check that trigger credentials are configured
Verify webhook URLs are correct
```

---

## License

This project is open source and available under the MIT License.

---

## Support

For questions or issues:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation

---

## Roadmap

- [ ] More trigger types (email, webhooks, schedules)
- [ ] Additional AI providers
- [ ] Workflow templates library
- [ ] Advanced error handling & retries
- [ ] Workflow versioning
- [ ] Team collaboration features
- [ ] Mobile app

---

## Author

**Vinayak Arora** - [@vinayak746](https://github.com/vinayak746)

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io)
- [React Flow](https://reactflow.dev)
- [Inngest](https://www.inngest.com)
- [Vercel AI SDK](https://sdk.vercel.ai)
