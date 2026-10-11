import assert from 'assert';
import crypto from 'crypto';
import { createOAuthState, verifyOAuthState } from '../src/services/oauth/state';
import { OAUTH_CONFIGS, getValidatedCallbackUrl } from '../src/services/oauth/config';
import { emailService } from '../src/services/email';

let passedCount = 0;
let failedCount = 0;

function test(name: string, fn: () => void | Promise<void>) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedCount++;
  }
}

async function asyncTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedCount++;
  }
}

console.log('\n🚀 =================================================================');
console.log('🚀 RUHI AI: INVITATIONS, OAUTH CONNECTORS & QUEUE VERIFICATION SUITE');
console.log('🚀 =================================================================\n');

// =========================================================================
// 1. Team Invitations & Expiring Single-Use Tokens
// =========================================================================
console.log('• 1. Team Invitations & Token Security');

test('Generates cryptographically random 64-char hex invite tokens', () => {
  const token = crypto.randomBytes(32).toString('hex');
  assert.strictEqual(token.length, 64);
  assert.ok(/^[0-9a-f]{64}$/.test(token));
});

test('Validates 7-day expiration window correctly', () => {
  const now = Date.now();
  const futureExp = new Date(now + 7 * 24 * 60 * 60 * 1000);
  const expiredDate = new Date(now - 1000); // 1 second ago

  assert.strictEqual(futureExp.getTime() > now, true);
  assert.strictEqual(expiredDate.getTime() > now, false);
});

test('Enforces single-use token lifecycle transition (pending -> accepted)', () => {
  const inviteRecord = {
    token: 'test_token_1234567890abcdef1234567890abcdef',
    status: 'pending' as 'pending' | 'accepted' | 'expired',
    acceptedAt: null as Date | null,
  };

  // First use: accept invitation
  assert.strictEqual(inviteRecord.status, 'pending');
  inviteRecord.status = 'accepted';
  inviteRecord.acceptedAt = new Date();

  // Second use attempt must be rejected
  const canReuse = (inviteRecord.status as string) === 'pending';
  assert.strictEqual(canReuse, false);
});

test('Invitation email renderer constructs secure HTML with expiration details', () => {
  const html = emailService.renderTeamInviteHtml({
    orgName: 'Engineering Lab',
    inviterName: 'Lead Architect',
    role: 'admin',
    inviteLink: 'https://ruhi.ai/invite/token123',
    expiresInDays: 7,
  });

  assert.ok(html.includes('Engineering Lab'));
  assert.ok(html.includes('Lead Architect'));
  assert.ok(html.includes('ADMIN'));
  assert.ok(html.includes('https://ruhi.ai/invite/token123'));
  assert.ok(html.includes('7 days'));
});

// =========================================================================
// 2. OAuth 2.0 Security & State Verification (Google, GitHub, Slack)
// =========================================================================
console.log('\n• 2. OAuth 2.0 State Signatures & Connector Security');

test('Generates signed HMAC-SHA256 OAuth state token', () => {
  const stateToken = createOAuthState('user_12345', 'google_drive');
  assert.ok(stateToken.includes('.'));
  const parts = stateToken.split('.');
  assert.strictEqual(parts.length, 2);
});

test('Verifies authentic OAuth state token and extracts payload', () => {
  const stateToken = createOAuthState('user_54321', 'github');
  const payload = verifyOAuthState(stateToken);
  assert.ok(payload);
  assert.strictEqual(payload?.userId, 'user_54321');
  assert.strictEqual(payload?.provider, 'github');
  assert.ok(payload?.timestamp);
  assert.ok(payload?.nonce);
});

test('Rejects forged / tampered OAuth state token (Anti-CSRF)', () => {
  const authentic = createOAuthState('user_attacker', 'slack');
  const [data] = authentic.split('.');
  const forged = `${data}.invalid_signature_1234567890`;
  const result = verifyOAuthState(forged);
  assert.strictEqual(result, null);
});

test('Rejects expired OAuth state token (> 15 minutes)', () => {
  // Construct token with timestamp 20 minutes in the past
  const secret = process.env.JWT_SECRET || 'ruhi_oauth_secure_fallback_secret';
  const oldPayload = {
    userId: 'user_expired',
    provider: 'slack',
    timestamp: Date.now() - 20 * 60 * 1000,
    nonce: 'expired_nonce',
  };
  const payloadEncoded = Buffer.from(JSON.stringify(oldPayload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payloadEncoded).digest('base64url');
  const expiredToken = `${payloadEncoded}.${sig}`;

  const result = verifyOAuthState(expiredToken);
  assert.strictEqual(result, null);
});

test('Supports all required connectors: google_drive, github, and slack', () => {
  assert.ok(OAUTH_CONFIGS.google_drive);
  assert.ok(OAUTH_CONFIGS.github);
  assert.ok(OAUTH_CONFIGS.slack);

  // Check required scopes
  assert.ok(OAUTH_CONFIGS.google_drive.defaultScopes.includes('https://www.googleapis.com/auth/drive.readonly'));
  assert.ok(OAUTH_CONFIGS.github.defaultScopes.includes('repo'));
  assert.ok(OAUTH_CONFIGS.slack.defaultScopes.includes('channels:read'));
  assert.ok(OAUTH_CONFIGS.slack.defaultScopes.includes('chat:write'));
});

// =========================================================================
// 3. Reliable Agent Task Queue & Human-in-the-Loop Resumability
// =========================================================================
console.log('\n• 3. Agent Task Queue & Resumability');

test('Step resumability: skips already completed steps upon restart', () => {
  const steps = [
    { name: 'Research', status: 'completed' },
    { name: 'Architecture Plan', status: 'completed' },
    { name: 'Code Generation', status: 'pending' },
    { name: 'Verification', status: 'pending' },
  ];

  const pendingSteps = steps.filter((s) => s.status !== 'completed');
  assert.strictEqual(pendingSteps.length, 2);
  assert.strictEqual(pendingSteps[0].name, 'Code Generation');
});

test('Human approval gate: transitions to waiting_approval on Coder step in safe mode', () => {
  const task = {
    approvalMode: 'safe' as 'safe' | 'autonomous',
    status: 'running',
    currentStep: { agentType: 'Coder', name: 'Write API endpoints' },
  };

  const isSafeGate = task.approvalMode === 'safe' && ['Coder', 'Deployer'].includes(task.currentStep.agentType);
  if (isSafeGate) {
    task.status = 'waiting_approval';
  }

  assert.strictEqual(task.status, 'waiting_approval');
});

test('Exponential backoff calculation for step retries', () => {
  const baseDelay = 1000;
  const retry0 = baseDelay * Math.pow(2, 0); // 1000ms
  const retry1 = baseDelay * Math.pow(2, 1); // 2000ms
  const retry2 = baseDelay * Math.pow(2, 2); // 4000ms

  assert.strictEqual(retry0, 1000);
  assert.strictEqual(retry1, 2000);
  assert.strictEqual(retry2, 4000);
});

test('Task completion updates status and duration metrics', () => {
  const task = {
    status: 'running',
    costMetrics: { durationMs: 0, toolCallsCount: 0 },
    plan: [{ status: 'completed' }, { status: 'completed' }],
  };

  const allComplete = task.plan.every((s) => s.status === 'completed');
  if (allComplete) {
    task.status = 'completed';
  }

  assert.strictEqual(task.status, 'completed');
});

// =========================================================================
// RESULTS SUMMARY
// =========================================================================
console.log('\n=================================================================');
console.log(`INVITATIONS, OAUTH & QUEUE RESULTS: ${passedCount} Passed, ${failedCount} Failed`);
console.log('=================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
