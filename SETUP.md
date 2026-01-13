# Local Development Setup

## Quick Start

### 1. Configure AWS Credentials

The Amplify backend requires AWS credentials. Set them up using one of these methods:

**Option A: AWS CLI (Recommended)**
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter default output format (json)
```

**Option B: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

**Option C: Amplify Profile**
```bash
npx ampx configure profile.ampx sandbox
```

### 2. Start the Backend (Amplify Sandbox)

```bash
cd amplify-dashboard
npx ampx sandbox
```

This will:
- Deploy your backend resources to AWS
- Generate `amplify_outputs.json` with your configuration
- Stream logs and watch for changes

**Note:** The first deployment may take 5-10 minutes.

### 3. Set the Ingestion Secret

In a new terminal, set the HMAC secret for the ingestion endpoint:

```bash
npx ampx sandbox secret set INGEST_SECRET
# Enter a secure 32+ character secret when prompted
```

### 4. Start the Frontend

In a new terminal:

```bash
cd amplify-dashboard
npm run dev
```

The dashboard will be available at http://localhost:3000

## First-Time Setup

### Create Your First User Profile

After deploying the backend and creating a Cognito user:

1. Sign up/login at http://localhost:3000/login
2. Note your Cognito User ID (from the browser console or Cognito console)
3. Create a UserProfile record:

```javascript
// Run this in the browser console or via a setup script
import { generateClient } from 'aws-amplify/data';
import outputs from './amplify_outputs.json';
import { Amplify } from 'aws-amplify';

Amplify.configure(outputs);

const client = generateClient();

await client.models.UserProfile.create({
  userId: 'your-cognito-user-sub-id',
  orgId: 'your-org-id', // Generate a UUID: crypto.randomUUID()
  email: 'your-email@example.com',
  role: 'admin',
  createdAt: new Date().toISOString(),
});
```

## Troubleshooting

### "Failed to load default AWS credentials"

Make sure AWS credentials are configured (see step 1 above).

### "Cannot find module 'amplify_outputs.json'"

Run `npx ampx sandbox` first to generate the config file.

### Frontend loads but shows authentication errors

1. Check that `amplify_outputs.json` exists and is valid
2. Verify Cognito user pool was created successfully
3. Check browser console for specific error messages

### Ingestion endpoint returns 401

1. Verify `INGEST_SECRET` is set in the sandbox
2. Ensure n8n is using the same secret
3. Check Lambda logs: `npx ampx sandbox --stream-function-logs --logs-filter ingest`

## Development Workflow

1. **Backend changes**: The sandbox watches for changes automatically
2. **Frontend changes**: Next.js hot-reloads automatically
3. **View logs**: `npx ampx sandbox --stream-function-logs`

## Stopping the Services

- **Frontend**: Press `Ctrl+C` in the terminal running `npm run dev`
- **Backend**: Press `Ctrl+C` in the terminal running `npx ampx sandbox`
- **Delete sandbox**: `npx ampx sandbox delete` (removes all deployed resources)

