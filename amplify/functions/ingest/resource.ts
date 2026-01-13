import { defineFunction, secret } from '@aws-amplify/backend';

export const ingestFunction = defineFunction({
  name: 'ingest',
  entry: './handler.ts',
  environment: {
    INGEST_SECRET: secret('INGEST_SECRET'),
  },
  timeoutSeconds: 30,
  memoryMB: 256,
});

