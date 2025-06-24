import { NextRequest } from 'next/server';
import { withErrorHandler, createError } from '@/lib/error';
import { requireCollaboratorOrAdmin } from '@/lib/auth-utils';
import { validateR2Config, deleteFileFromR2 } from '@/lib/r2-utils';
import { getToken } from "next-auth/jwt";

// Request body type for delete operation
interface DeleteRequest {
  filename: string;
}

// Response type for the delete operation
interface DeleteResponse {
  success: boolean;
  message: string;
  key?: string;
}

async function DELETE(req: NextRequest) {
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

  // 3. Validate R2 configuration and get delete URL
  const { workerDeleteUrl } = validateR2Config();
  
  // 4. Parse and validate request body
  let requestBody: DeleteRequest;
  try {
    requestBody = await req.json();
  } catch (error) {
    throw createError('VALIDATION_ERROR', {
      message: 'Invalid JSON in request body',
      code: 'INVALID_JSON',
    });
  }
  
  const { filename } = requestBody;
  
  if (!filename) {
    throw createError('VALIDATION_ERROR', {
      message: 'Filename is required',
      code: 'MISSING_FILENAME',
    });
  }
  
  // 5. Delete the file from R2
  const result = await deleteFileFromR2({
    workerApiUrl: workerDeleteUrl,
    workerToken,
    filename,
  });
  
  // 6. Return the result
  const response: DeleteResponse = {
    success: result.success,
    message: result.message,
    key: result.key,
  };
  
  return response;
}

// Wrap the handler with error handling middleware
const DELETEWithErrorHandler = withErrorHandler(DELETE as any);

// Export the handler
export { DELETEWithErrorHandler as DELETE };

// Disable caching for this route
export const dynamic = 'force-dynamic';