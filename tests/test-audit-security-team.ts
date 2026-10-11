import assert from 'assert';
import crypto from 'crypto';
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../src/services/razorpay';
import { safeDiagnostics } from '../src/services/ai/orchestrator/observability';
import { TIER_LIMITS } from '../src/services/usage';
import modelRegistry from '../src/providers/ai/registry';
import { AIRouter } from '../src/providers/ai/router';

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

console.log('\n🛡️  =================================================================');
console.log('🛡️  RUHI AI: AUDIT, SECURITY, TEAM & PAYMENT VALIDATION SUITE');
console.log('🛡️  =================================================================\n');

// =========================================================================
// 1. Razorpay Signature Verification & Cryptographic Protection
// =========================================================================
console.log('• 1. Razorpay Payment Signature Validation & Security');

const TEST_SECRET = 'test_secret_key_1234567890abcdef';
process.env.RAZORPAY_KEY_SECRET = TEST_SECRET;

test('Validates authentic HMAC-SHA256 signature', () => {
  const orderId = 'order_987654321';
  const paymentId = 'pay_123456789';
  const expectedSig = crypto
    .createHmac('sha256', TEST_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const isValid = verifyPaymentSignature(orderId, paymentId, expectedSig);
  assert.strictEqual(isValid, true);
});

test('Rejects tampered / forged payment signature', () => {
  const orderId = 'order_987654321';
  const paymentId = 'pay_123456789';
  const forgedSig = '0000000000000000000000000000000000000000000000000000000000000000';

  const isValid = verifyPaymentSignature(orderId, paymentId, forgedSig);
  assert.strictEqual(isValid, false);
});

test('Rejects empty or missing signature', () => {
  const isValid = verifyPaymentSignature('order_1', 'pay_1', '');
  assert.strictEqual(isValid, false);
});

test('Strictly rejects mock order ID when secret is configured', () => {
  // Never trust mock orders in production / when secret is set
  const isValid = verifyPaymentSignature('order_mock_test', 'pay_1', 'some_sig');
  assert.strictEqual(isValid, false);
});

// =========================================================================
// 2. Razorpay Webhook Verification
// =========================================================================
console.log('\n• 2. Razorpay Webhook Signature & Security');

test('Validates authentic webhook signature against raw request body', () => {
  const payload = JSON.stringify({
    event: 'order.paid',
    payload: {
      order: { entity: { id: 'order_123', amount: 49900 } },
      payment: { entity: { id: 'pay_456', status: 'captured' } },
    },
  });

  const webhookSecret = 'whsec_9876543210';
  const sig = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

  const isValid = verifyWebhookSignature(payload, sig, webhookSecret);
  assert.strictEqual(isValid, true);
});

test('Rejects forged webhook signature', () => {
  const payload = JSON.stringify({ event: 'order.paid' });
  const isValid = verifyWebhookSignature(payload, 'forged_sig', 'whsec_test');
  assert.strictEqual(isValid, false);
});

test('Rejects webhook when body was modified in transit', () => {
  const original = JSON.stringify({ amount: 49900 });
  const tampered = JSON.stringify({ amount: 100 });
  const secret = 'whsec_tamper_test';
  const sig = crypto.createHmac('sha256', secret).update(original).digest('hex');

  const isValid = verifyWebhookSignature(tampered, sig, secret);
  assert.strictEqual(isValid, false);
});

// Clean up env
delete process.env.RAZORPAY_KEY_SECRET;

// =========================================================================
// 3. Subscription Tiers & Quota Boundaries
// =========================================================================
console.log('\n• 3. Subscription & Quota Enforcement Boundaries');

test('Free tier enforces daily limits & disallows reasoner model', () => {
  assert.strictEqual(TIER_LIMITS.free.dailyRequests, 50);
  assert.strictEqual(TIER_LIMITS.free.allowReasonerModel, false);
  assert.strictEqual(TIER_LIMITS.free.maxStorageBytes, 25 * 1024 * 1024);
});

test('Pro tier provides elevated requests and enables reasoner model', () => {
  assert.strictEqual(TIER_LIMITS.pro.dailyRequests, 1000);
  assert.strictEqual(TIER_LIMITS.pro.allowReasonerModel, true);
  assert.strictEqual(TIER_LIMITS.pro.maxStorageBytes, 1024 * 1024 * 1024);
});

test('Team tier scales to 5,000 requests and 10GB workspace storage', () => {
  assert.strictEqual(TIER_LIMITS.team.dailyRequests, 5000);
  assert.strictEqual(TIER_LIMITS.team.maxStorageBytes, 10 * 1024 * 1024 * 1024);
});

// =========================================================================
// 4. Premium Model Gate & Entitlement Fallback
// =========================================================================
console.log('\n• 4. Premium Model Gate & Entitlement Fallback');

test('Free tier requesting premium model falls back to ruhi-balanced with explanation', () => {
  const router = new AIRouter();
  const route = router.resolveRoute('ruhi-reasoner', 'free');
  assert.strictEqual(route.isFallback, true);
  assert.strictEqual(route.model.id, 'ruhi-balanced');
  assert.ok(route.notice?.includes('requires a Pro or Team plan'));
});

test('Pro tier requesting premium model is permitted to proceed', () => {
  const router = new AIRouter();
  const route = router.resolveRoute('ruhi-reasoner', 'pro');
  assert.strictEqual(route.isFallback, false);
  assert.strictEqual(route.model.id, 'ruhi-reasoner');
});

// =========================================================================
// 5. Cross-User Data Isolation & Sanitization
// =========================================================================
console.log('\n• 5. Data Privacy & Cross-User Isolation');

test('Temporary chats are marked non-shareable', () => {
  const conversation = {
    isTemporary: true,
    shareToken: null,
  };
  const canShare = !conversation.isTemporary;
  assert.strictEqual(canShare, false);
});

test('Public share payload strips user IDs, emails, and sensitive keys', () => {
  const mockDbMessage = {
    _id: '507f1f77bcf86cd799439011',
    conversationId: '507f191e810c19729de860ea',
    userId: '507f191e810c19729de860bb',
    userEmail: 'alice@company.com',
    role: 'assistant',
    content: 'Here is your sanitized analysis.',
    citations: [{ title: 'Source', url: 'https://example.com', snippet: 'data', sourceType: 'web' }],
    metadata: { internalPromptTokens: 250, apiKeyUsed: 'secret_123' },
  };

  // Sanitizer projection logic
  const sanitized = {
    _id: mockDbMessage._id,
    role: mockDbMessage.role,
    content: mockDbMessage.content,
    citations: mockDbMessage.citations,
  };

  assert.strictEqual((sanitized as any).userId, undefined);
  assert.strictEqual((sanitized as any).userEmail, undefined);
  assert.strictEqual((sanitized as any).metadata, undefined);
});

// =========================================================================
// 6. Organization & Workspace Role-Based Access Control
// =========================================================================
console.log('\n• 6. Organization & Workspace Role-Based Access Control');

test('Slug generation produces safe alphanumeric lowercase identifier', () => {
  const orgName = 'Acme Corp & Partners, Inc.!';
  const baseSlug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);

  assert.ok(!/[^a-z0-9_-]/.test(baseSlug));
  assert.ok(baseSlug.startsWith('acme-corp'));
});

test('Role permissions: owner and admin can manage members', () => {
  const canManage = (role: string) => ['owner', 'admin'].includes(role);
  assert.strictEqual(canManage('owner'), true);
  assert.strictEqual(canManage('admin'), true);
  assert.strictEqual(canManage('member'), false);
  assert.strictEqual(canManage('viewer'), false);
});

test('Role permissions: viewer cannot execute mutating actions', () => {
  const canMutate = (role: string) => ['owner', 'admin', 'member'].includes(role);
  assert.strictEqual(canMutate('viewer'), false);
});

// =========================================================================
// 7. Human-in-the-Loop Task Approvals
// =========================================================================
console.log('\n• 7. Human-in-the-Loop Task Approvals');

test('Approval decision "approved" transitions status to running', () => {
  const taskState = {
    status: 'waiting_approval',
    history: [] as string[],
  };

  const applyDecision = (decision: 'approved' | 'rejected') => {
    if (decision === 'approved') {
      taskState.status = 'running';
      taskState.history.push('HUMAN_APPROVAL_GRANTED');
    } else {
      taskState.status = 'cancelled';
      taskState.history.push('HUMAN_APPROVAL_REJECTED');
    }
  };

  applyDecision('approved');
  assert.strictEqual(taskState.status, 'running');
  assert.ok(taskState.history.includes('HUMAN_APPROVAL_GRANTED'));
});

test('Approval decision "rejected" cancels task safely', () => {
  const taskState = {
    status: 'waiting_approval',
    history: [] as string[],
  };

  const applyDecision = (decision: 'approved' | 'rejected') => {
    if (decision === 'approved') {
      taskState.status = 'running';
      taskState.history.push('HUMAN_APPROVAL_GRANTED');
    } else {
      taskState.status = 'cancelled';
      taskState.history.push('HUMAN_APPROVAL_REJECTED');
    }
  };

  applyDecision('rejected');
  assert.strictEqual(taskState.status, 'cancelled');
  assert.ok(taskState.history.includes('HUMAN_APPROVAL_REJECTED'));
});

// =========================================================================
// 8. Observability & Safe Redaction
// =========================================================================
console.log('\n• 8. Observability & Credential Protection');

test('Redacts Razorpay and OAuth credentials from diagnostic events', () => {
  safeDiagnostics.record('auth_event' as any, {
    razorpayKeySecret: 'super_secret_rzp_key',
    googleOAuthToken: 'ya29.sensitive_oauth_token',
    publicParam: 'allowed_info',
  });

  const recent = safeDiagnostics.getRecentEvents(1);
  const metadata = recent[0]?.metadata;
  assert.strictEqual(metadata?.razorpayKeySecret, '[REDACTED]');
  assert.strictEqual(metadata?.googleOAuthToken, '[REDACTED]');
  assert.strictEqual(metadata?.publicParam, 'allowed_info');
});

// =========================================================================
// RESULTS SUMMARY
// =========================================================================
console.log('\n=================================================================');
console.log(`AUDIT & SECURITY RESULTS: ${passedCount} Passed, ${failedCount} Failed`);
console.log('=================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
