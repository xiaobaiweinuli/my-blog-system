import { NextRequest } from 'next/server';
import { withErrorHandler, createError } from '@/lib/error';
import { requireCollaboratorOrAdmin } from '@/lib/auth-utils';
import { validateR2Config, checkFileInR2 } from '@/lib/r2-utils';
import { getToken } from "next-auth/jwt";

// Response type for the check operation
interface CheckResponse {
  exists: boolean;
  key?: string;
  size?: number;
  lastModified?: string;
  contentType?: string;
  url?: string;
}

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

  // 3. Get filename from query parameters
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');
  
  if (!filename) {
    throw createError('VALIDATION_ERROR', {
      message: 'Filename query parameter is required',
      code: 'MISSING_FILENAME',
    });
  }

  // 4. Validate R2 configuration and get check URL
  const { workerCheckUrl } = validateR2Config();
  
  // 5. Check file existence in R2
  const checkResult = await checkFileInR2({
    workerApiUrl: workerCheckUrl,
    workerToken,
    filename,
  });
  
  // 6. Prepare the response
  const response: CheckResponse = {
    exists: checkResult.exists,
    key: checkResult.key,
    size: checkResult.size,
    lastModified: checkResult.lastModified,
    contentType: checkResult.httpMetadata?.contentType,
  };
  
  // Add the full URL if the file exists
  if (checkResult.exists && checkResult.key) {
    response.url = `${process.env.NEXT_PUBLIC_MEDIA_BASE_URL || ''}/${checkResult.key}`;
  }
  
  return response;
}

// Wrap the handler with error handling middleware
const GETWithErrorHandler = withErrorHandler(GET as any);

// Export the handler
export { GETWithErrorHandler as GET };

// Disable caching for this route
export const dynamic = 'force-dynamic';
