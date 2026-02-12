// Gmail setup wizard.
// OAuth-based: the setup flow is handled by the platform OAuth bridge.
// This module provides onSetupStart / onSetupSubmit for the host runtime.

export function onSetupStart(): SetupStartResult {
  const credential = oauth.getCredential();

  if (credential && credential.isValid) {
    // Already connected — offer keep / reconnect
    const s = globalThis.getGmailSkillState();
    return {
      step: {
        id: 'already-connected',
        title: 'Gmail Connected',
        description: `Connected as ${s.config.userEmail || credential.accountLabel || 'unknown'}. You can keep the current connection or reconnect.`,
        fields: [
          {
            name: 'action',
            type: 'select',
            label: 'Action',
            options: [
              { label: 'Keep current connection', value: 'keep' },
              { label: 'Reconnect', value: 'reconnect' },
            ],
          },
        ],
      },
    };
  }

  // Fresh install — start OAuth flow
  return {
    step: {
      id: 'oauth',
      title: 'Connect Gmail',
      description:
        'Sign in with your Google account to connect Gmail. We will request read, send, and label management permissions.',
      fields: [],
    },
  };
}

export function onSetupSubmit(args: {
  stepId: string;
  values: Record<string, unknown>;
}): SetupSubmitResult {
  if (args.stepId === 'already-connected') {
    const action = args.values.action as string;
    if (action === 'keep') {
      return { status: 'complete' };
    }
    // Reconnect — revoke and restart
    oauth.revoke();
    return {
      status: 'next',
      nextStep: {
        id: 'oauth',
        title: 'Connect Gmail',
        description: 'Sign in with your Google account to reconnect Gmail.',
        fields: [],
      },
    };
  }

  if (args.stepId === 'oauth') {
    // OAuth step — the platform handles the flow; this is called once done
    return { status: 'complete' };
  }

  return { status: 'error', errors: [{ field: '', message: 'Unknown setup step' }] };
}

export function onSetupCancel(): void {
  // Nothing to clean up for OAuth-only flow
}
