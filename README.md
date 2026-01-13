# Agent Conversations Dashboard

A multi-tenant dashboard for monitoring AI agent conversations, built with AWS Amplify Gen 2, Next.js, and Tailwind CSS.

## Features

- **Real-time conversation monitoring**: View all conversations across sessions
- **KPI Dashboard**: Track total conversations, messages, latency, and escalation rates
- **Conversation detail view**: Chronological transcript with tool call tracking
- **Multi-tenant**: Each organization sees only their own data
- **Secure ingestion**: HMAC-signed webhook for n8n integration
- **Export functionality**: Download conversations as JSON or CSV

## Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────────────────┐
│                 │     │                AWS Amplify Gen 2                  │
│    n8n          │     │  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│    Workflow     │────▶│  │  Ingest    │  │  AppSync   │  │  Cognito   │  │
│                 │     │  │  Lambda    │  │  GraphQL   │  │  Auth      │  │
└─────────────────┘     │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  │
                        │        │               │               │         │
                        │        ▼               ▼               │         │
                        │  ┌─────────────────────────────────────┴───────┐ │
                        │  │                DynamoDB Tables               │ │
                        │  │  Conversation │ Message │ ToolCall │ Profile │ │
                        │  └─────────────────────────────────────────────┘ │
                        └──────────────────────────────────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────────┐
                        │              Next.js Dashboard                    │
                        │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
                        │  │  Login   │ │ Overview │ │ Conversations    │  │
                        │  │  Page    │ │ KPIs     │ │ List & Detail    │  │
                        │  └──────────┘ └──────────┘ └──────────────────┘  │
                        └──────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 18+ and npm
- AWS Account with Amplify access
- n8n workflow (see integration section)

## Quick Start

### 1. Install Dependencies

```bash
cd amplify-dashboard
npm install
```

### 2. Configure Amplify

Initialize and deploy the Amplify backend:

```bash
# For development (creates a sandbox environment)
npx ampx sandbox

# For production deployment
npx ampx pipeline-deploy --branch main
```

After deployment, Amplify will generate `amplify_outputs.json` with your configuration.

### 3. Set Environment Variables

Create a secret for the ingestion endpoint:

```bash
# Set the HMAC secret for n8n integration
npx ampx sandbox secret set INGEST_SECRET
# Enter a secure 32+ character secret when prompted
```

### 4. Create Initial User Profile

After creating your first Cognito user, you need to create a UserProfile record to associate them with an organization:

```javascript
// Run this in the Amplify console or via a setup script
const profile = await client.models.UserProfile.create({
  userId: 'cognito-user-sub-id',  // From Cognito
  orgId: 'your-org-id',           // Generate a UUID for your org
  email: 'admin@yourcompany.com',
  role: 'admin',
  createdAt: new Date().toISOString(),
});
```

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## n8n Integration

### Step 1: Set n8n Environment Variables

In your n8n instance, add these environment variables:

| Variable | Description |
|----------|-------------|
| `DASHBOARD_INGEST_URL` | Your Amplify Lambda function URL (from `amplify_outputs.json` → `custom.ingestEndpoint`) |
| `DASHBOARD_INGEST_SECRET` | The same HMAC secret you set in Amplify |
| `DASHBOARD_ORG_ID` | Your organization ID (from the Settings page) |

### Step 2: Update Your Workflow

Import the updated workflow from `n8n-workflow-updated.json` or manually add these nodes:

#### A. Add "Capture Start Time" Code Node

Place this **after** the Webhook node:

```javascript
// Captures when the request was received
const startTime = new Date().toISOString();

return {
  json: {
    ...$input.first().json,
    _startTime: startTime
  }
};
```

#### B. Add "Send to Dashboard" HTTP Request Node

Place this **after** the AI Agent node (in parallel with Respond to Webhook):

**Method:** POST

**URL:** `{{ $env.DASHBOARD_INGEST_URL }}`

**Headers:**
```
Content-Type: application/json
X-Signature: {{ $jmespath($json, '@') | $hmac('sha256', $env.DASHBOARD_INGEST_SECRET) }}
```

**Body (JSON):**
```json
{
  "orgId": "{{ $env.DASHBOARD_ORG_ID }}",
  "sessionId": "{{ $('Webhook').item.json.body.sessionId }}",
  "conversationId": "{{ $('Webhook').item.json.body.sessionId }}",
  "messageId": "{{ $uuid }}",
  "receivedAt": "{{ $('Capture Start Time').item.json._startTime }}",
  "respondedAt": "{{ $now.toISO() }}",
  "userText": "{{ $('Webhook').item.json.body.chatInput }}",
  "assistantText": "{{ $('AI Agent').item.json.output }}",
  "status": "ok",
  "latencyMs": {{ Math.round(new Date().getTime() - new Date($('Capture Start Time').item.json._startTime).getTime()) }},
  "toolCalls": [],
  "escalated": false
}
```

### Step 3: Test the Integration

1. Send a test message to your n8n webhook
2. Check the dashboard - the conversation should appear within seconds
3. Verify the HMAC signature is working (check Lambda logs if issues)

## Ingestion Payload Reference

Full payload structure accepted by the ingestion endpoint:

```typescript
{
  // Required
  "orgId": string,           // Your organization ID
  "sessionId": string,       // Unique session identifier
  "messageId": string,       // Unique message identifier (UUID)
  "userText": string,        // User's message
  "assistantText": string,   // Agent's response
  
  // Optional
  "conversationId": string,  // Defaults to sessionId
  "receivedAt": string,      // ISO timestamp of when request was received
  "respondedAt": string,     // ISO timestamp of when response was sent
  "status": "ok" | "error",  // Defaults to "ok"
  "latencyMs": number,       // Response time in milliseconds
  "escalated": boolean,      // Whether the conversation was escalated
  "tokensIn": number,        // Input token count
  "tokensOut": number,       // Output token count
  "toolCalls": [             // Array of tool calls made
    {
      "toolName": string,
      "durationMs": number,
      "status": "ok" | "error",
      "metadata": object
    }
  ]
}
```

## Deployment to Production

### Deploy via Amplify Hosting

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. Connect to Amplify Hosting:
   ```bash
   npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
   ```

3. Or use the AWS Console:
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect your repository
   - Amplify will auto-detect the Next.js framework

### Environment Variables in Production

Set these in the Amplify Console → Environment Variables:

| Variable | Value |
|----------|-------|
| `INGEST_SECRET` | Your HMAC secret (32+ characters) |

## Project Structure

```
amplify-dashboard/
├── amplify/
│   ├── auth/resource.ts          # Cognito configuration
│   ├── data/resource.ts          # DynamoDB models & auth rules
│   ├── functions/ingest/
│   │   ├── resource.ts           # Lambda configuration
│   │   └── handler.ts            # Ingestion logic with HMAC
│   └── backend.ts                # Backend entry point
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Redirect handler
│   │   ├── login/page.tsx        # Auth UI
│   │   ├── dashboard/page.tsx    # KPI overview
│   │   ├── conversations/
│   │   │   ├── page.tsx          # List view
│   │   │   └── [id]/page.tsx     # Detail view
│   │   └── settings/page.tsx     # User management
│   ├── components/
│   │   ├── AuthProvider.tsx
│   │   ├── Sidebar.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── KPICard.tsx
│   │   ├── ConversationTable.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ExportButton.tsx
│   └── lib/
│       ├── amplify-config.ts
│       └── queries.ts            # Data fetching utilities
├── amplify_outputs.json          # Generated by Amplify
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Security Considerations

1. **HMAC Verification**: All ingestion requests must include a valid `X-Signature` header
2. **Multi-tenant Isolation**: All queries filter by `orgId` server-side
3. **Cognito Authentication**: Dashboard access requires authentication
4. **Role-based Access**: Admins can manage users, viewers can only read

## Troubleshooting

### "Invalid signature" error from ingestion endpoint

- Verify the `INGEST_SECRET` matches in both Amplify and n8n
- Ensure you're computing HMAC over the raw JSON body string
- Check that Content-Type is `application/json`

### No data appearing in dashboard

1. Check Lambda CloudWatch logs for errors
2. Verify the `orgId` in the payload matches your UserProfile
3. Ensure the ingestion endpoint URL is correct

### Authentication issues

- Clear browser storage and try logging in again
- Verify Cognito user pool is correctly configured
- Check that `amplify_outputs.json` is up to date

## License

MIT

