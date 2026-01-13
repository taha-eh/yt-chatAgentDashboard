import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { ingestFunction } from './functions/ingest/resource';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';

const backend = defineBackend({
  auth,
  data,
  ingestFunction,
});

// Grant the ingest function permissions to write to DynamoDB tables
const dataStack = backend.data.resources.cfnResources;

// Add function URL for the ingestion endpoint
const ingestFnUrl = backend.ingestFunction.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE, // We use HMAC for auth
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: ['POST'],
    allowedHeaders: ['Content-Type', 'X-Signature'],
  },
});

// Grant DynamoDB permissions to ingest function
backend.ingestFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:GetItem',
      'dynamodb:Query',
    ],
    resources: ['*'], // In production, scope this to specific table ARNs
  })
);

// Output the function URL
backend.addOutput({
  custom: {
    ingestEndpoint: ingestFnUrl.url,
  },
});

export default backend;

