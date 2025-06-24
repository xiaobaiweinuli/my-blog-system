import { NextRequest } from 'next/server';
import { withErrorHandler, createError } from '@/lib/error';
import { requireCollaboratorOrAdmin } from '@/lib/auth-utils';
import { validateR2Config, uploadFileToR2 } from '@/lib/r2-utils';
import { getToken } from "next-auth/jwt";

// Response type for the upload
interface UploadResponse {
  key: string;
  size: number;
  uploaded: string;
  url: string;
}

async function POST(req: NextRequest) {
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

  // 3. Validate R2 configuration and get upload URL
  const { workerUploadUrl } = validateR2Config();
  
  // 4. Get the content type and filename from the request
  const contentType = req.headers.get('content-type');
  if (!contentType || !contentType.includes('multipart/form-data')) {
    throw createError('VALIDATION_ERROR', {
      message: 'Content-Type must be multipart/form-data',
      code: 'INVALID_CONTENT_TYPE',
    });
  }

  // 5. Parse the form data
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  
  if (!file) {
    throw createError('VALIDATION_ERROR', {
      message: 'No file was uploaded',
      code: 'MISSING_FILE',
    });
  }

  // 6. Get the file stream and metadata
  const fileStream = file.stream ? file.stream() : null;
  const filename = file.name || 'unnamed';
  const fileType = file.type || 'application/octet-stream';

  // 7. Upload the file to R2
  const uploadResult = await uploadFileToR2({
    workerApiUrl: workerUploadUrl,
    workerToken,
    fileStream,
    filename,
    contentType: fileType,
    timeout: 120000, // 2 minutes for larger files
  });

  // 8. Return the upload result
  const response: UploadResponse = {
    key: uploadResult.key,
    size: uploadResult.size,
    uploaded: uploadResult.uploaded,
    url: `${process.env.NEXT_PUBLIC_MEDIA_BASE_URL || ''}/${uploadResult.key}`,
  };
  
  return response;
}

// Wrap the handler with error handling middleware
const POSTWithErrorHandler = withErrorHandler(POST as any);

// Export the handler
export { POSTWithErrorHandler as POST };

// Disable caching for this route
export const dynamic = 'force-dynamic';