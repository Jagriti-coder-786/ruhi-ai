/**
 * 🌸 RUHI AI - Safe Observability & Development Diagnostics Engine
 * 
 * Records diagnostics for model selection, tool execution, latency,
 * retries, fallbacks, and validation outcomes.
 * 
 * CRITICAL PRIVACY & SECURITY RULE:
 * Never logs API keys, auth tokens, passwords, secrets, or raw PII.
 */

export type DiagnosticEventType =
  | 'model_routed'
  | 'tool_executed'
  | 'response_validated'
  | 'provider_fallback'
  | 'provider_error'
  | 'persistence_event'
  | 'user_correction_detected';

export interface DiagnosticEvent {
  timestamp: string;
  type: DiagnosticEventType;
  metadata: Record<string, string | number | boolean | undefined>;
}

class SafeDiagnosticsEngine {
  private events: DiagnosticEvent[] = [];
  private maxBufferSize = 200;

  /**
   * Sanitizes any metadata object to remove sensitive keys or tokens
   */
  private sanitizeMetadata(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const sensitiveKeys = /password|secret|key|token|auth|bearer|credential|cookie/i;

    for (const [k, v] of Object.entries(data)) {
      if (sensitiveKeys.test(k)) {
        sanitized[k] = '[REDACTED]';
      } else if (typeof v === 'string') {
        // Scrub if it looks like an API key or JWT token
        if (v.length > 30 && (/^[a-zA-Z0-9_\-\.]{30,}$/.test(v) || /ey[a-zA-Z0-9_-]+\.ey/.test(v))) {
          sanitized[k] = '[REDACTED_TOKEN]';
        } else {
          sanitized[k] = v;
        }
      } else {
        sanitized[k] = v;
      }
    }

    return sanitized;
  }

  /**
   * Record a safe diagnostic event
   */
  record(type: DiagnosticEventType, metadata: Record<string, any> = {}) {
    const event: DiagnosticEvent = {
      timestamp: new Date().toISOString(),
      type,
      metadata: this.sanitizeMetadata(metadata),
    };

    this.events.push(event);
    if (this.events.length > this.maxBufferSize) {
      this.events.shift();
    }
  }

  /**
   * Retrieve recent diagnostic events for evaluation and debugging
   */
  getRecentEvents(limit: number = 50): DiagnosticEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Clear in-memory event buffer (useful for test isolation)
   */
  clear() {
    this.events = [];
  }
}

export const safeDiagnostics = new SafeDiagnosticsEngine();
