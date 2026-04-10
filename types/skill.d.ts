/** Accepts both sync and async — skills should prefer sync. */
type MaybeAsync<T> = T | Promise<T>;

/**
 * Credentials bag passed to `start()` by the Rust host. The host reads
 * `oauth_credential.json` and `auth_credential.json` from the skill's data
 * directory and forwards them here, so start() always sees the canonical view.
 *
 * `validate: true` is set during the auth handshake (`auth/complete` RPC) so
 * start() knows it should hit the upstream API to verify the credentials and
 * return field-level errors. Routine restarts (skill spawn, oauth/complete)
 * leave it falsy to skip the network round-trip.
 */
interface SkillStartArgs {
  oauth?: Record<string, unknown> | null;
  auth?: Record<string, unknown> | null;
  validate?: boolean;
}

/**
 * Result returned by `start()`. `complete` means the skill is now active (or
 * intentionally idle waiting for credentials). `error` is only used when the
 * host asked start() to validate credentials and they failed — the errors
 * array is surfaced inline in the auth UI so the user can fix the input.
 */
type SkillStartResult =
  | { status: 'complete'; message?: string }
  | { status: 'error'; errors: Array<{ field: string; message: string }> };

interface Skill {
  info: {
    id: string;
    name: string;
    version: string;
    description: string;
    auto_start: boolean;
    setup: { required: boolean; label: string };
  };
  tools: ToolDefinition[];
  init: () => MaybeAsync<void>;
  /**
   * The single activation entry point. Called by the host on instance spawn
   * and re-called after `oauth/complete` and `auth/complete` so the skill
   * always sees the freshest credentials. start() owns cron registration,
   * connection state publishing, and (when `validate: true`) credential
   * validation against the upstream API.
   */
  start: (args?: SkillStartArgs) => MaybeAsync<SkillStartResult | void>;
  stop: () => MaybeAsync<void>;
  onCronTrigger?: (scheduleId: string) => MaybeAsync<void>;
  onSetupStart?: () => MaybeAsync<SetupStartResult>;
  onSetupSubmit?: (args: {
    stepId: string;
    values: Record<string, unknown>;
  }) => MaybeAsync<SetupSubmitResult>;
  onSetupCancel?: () => MaybeAsync<void>;
  /** Called when advanced auth credentials are revoked. */
  onAuthRevoked?: (args: { mode?: string }) => MaybeAsync<void>;
  onDisconnect?: () => MaybeAsync<void>;
  publishState?: () => MaybeAsync<void>;
  onOAuthRevoked?: (args: OAuthRevokedArgs) => MaybeAsync<void>;
  onListOptions?: () => MaybeAsync<{ options: SkillOption[] }>;
  onSetOption?: (args: { name: string; value: unknown }) => MaybeAsync<void>;
  onSessionStart?: (args: { sessionId: string }) => MaybeAsync<void>;
  onSessionEnd?: (args: { sessionId: string }) => MaybeAsync<void>;
  onTick?: () => MaybeAsync<void>;
  onSync?: () => MaybeAsync<void>;
  onPing?: () => MaybeAsync<PingResult>;
  /** Called when the frontend sends load params (e.g. wallet address for wallet skill). */
  onLoad?: (params: Record<string, unknown>) => MaybeAsync<void>;
  onRpc?: (args: { method: string; params: unknown }) => unknown;
  onServerEvent?: (event: string, data: unknown) => MaybeAsync<void>;
  /**
   * Called when an unhandled error occurs during async operations.
   */
  onError?: (args: SkillErrorArgs) => MaybeAsync<void>;
}
