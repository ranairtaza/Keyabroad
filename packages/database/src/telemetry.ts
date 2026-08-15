import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export type SystemErrorSource = 'web' | 'admin' | 'api' | 'job';

export interface SystemError {
  errorSource: SystemErrorSource;
  errorMessage: string;
  errorStack?: string;
  context?: Record<string, any>;
}

export type JobStatus = 'success' | 'failure' | 'running';

export interface JobRun {
  jobName: string;
  status: JobStatus;
  durationMs?: number;
  context?: Record<string, any>;
  error?: string;
}

export interface AITelemetry {
  messageId: string;
  tokensUsed: number;
  latencyMs: number;
  status?: string;
}

/**
 * Strips known PII and sensitive keys from context objects.
 */
function redactContext(context?: Record<string, any>): Record<string, any> | undefined {
  if (!context) return undefined;
  
  const redacted = { ...context };
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'authorization', 'cookie', 'prompt'];
  
  for (const key of Object.keys(redacted)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactContext(redacted[key]);
    }
  }
  return redacted;
}

export async function logSystemError(error: SystemError): Promise<void> {
  try {
    const redactedContext = redactContext(error.context);
    await getSupabaseAdmin()
      .from('system_errors')
      .insert({
        error_source: error.errorSource,
        error_message: error.errorMessage,
        error_stack: error.errorStack,
        context: redactedContext,
      });
  } catch (e) {
    console.error("Telemetry failure: logSystemError", e);
  }
}

export async function logJobRun(job: JobRun): Promise<void> {
  try {
    const redactedContext = redactContext(job.context);
    await getSupabaseAdmin()
      .from('job_runs')
      .insert({
        job_name: job.jobName,
        status: job.status,
        duration_ms: job.durationMs,
        context: redactedContext,
        error: job.error,
      });
  } catch (e) {
    console.error("Telemetry failure: logJobRun", e);
  }
}

export async function updateAITelemetry(telemetry: AITelemetry): Promise<void> {
  try {
    await getSupabaseAdmin()
      .from('ai_messages')
      .update({
        tokens_used: telemetry.tokensUsed,
        latency_ms: telemetry.latencyMs,
        status: telemetry.status || 'success',
      })
      .eq('id', telemetry.messageId);
  } catch (e) {
    console.error("Telemetry failure: updateAITelemetry", e);
  }
}

/**
 * Admin utility to fetch storage metrics via the secure RPC
 */
export async function getStorageMetrics() {
  try {
    const { data, error } = await getSupabaseAdmin().rpc('get_storage_metrics');
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("Failed to fetch storage metrics", e);
    return null;
  }
}
