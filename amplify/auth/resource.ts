import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Agent Dashboard - Verify your email',
      verificationEmailBody: (createCode) =>
        `Your verification code is: ${createCode()}`,
    },
  },
  userAttributes: {
    preferredUsername: {
      required: false,
      mutable: true,
    },
  },
  groups: ['admins', 'viewers'],
  accountRecovery: 'EMAIL_ONLY',
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
  },
});

