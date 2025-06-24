import { NextRequest } from 'next/server';
import { withErrorHandler, createError } from '@/lib/error';
import { requireCollaboratorOrAdmin } from '@/lib/auth-utils';
import { fetchR2FileList, validateR2Config } from '@/lib/r2-utils';
import { getToken } from "next-auth/jwt";

// Response type for the file list
interface MediaListResponse {
  files: Awaited<ReturnType<typeof fetchR2FileList>>;
}

/**
 * GET /api/admin/media/list
 * Get a list of files from the R2 bucket
 * Only accessible by admin or collaborator roles
 */
async function GET(req: NextRequest) {
  // 1. Authenticate and authorize
  const session = await requireCollaboratorOrAdmin();
  
  // 2. Get worker session token from JWT
  const token = await getToken({ req });
  const workerToken = token?.worker_session_token;
  if (!workerToken) {
    throw createError('AUTHENTICATION_REQUIRED', {
      message: 'Missing worker session token',
      details: { reason: 'MISSING_WORKER_TOKEN' },
    });
  }
  
  // 3. Validate R2 configuration
  const { workerListUrl } = validateR2Config();
  
  // 4. Fetch files from R2 with retry logic
  const files = await fetchR2FileList({
    workerApiUrl: workerListUrl,
    workerToken,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000, // 30 seconds
  });
  
  // 5. Return the file list
  const response: MediaListResponse = { files };
  return response;
}

// Wrap the handler with error handling middleware
const GETWithErrorHandler = withErrorHandler(GET as any);

// Export the handler
export { GETWithErrorHandler as GET };

// Disable caching for this route
export const dynamic = 'force-dynamic';