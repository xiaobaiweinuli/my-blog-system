import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Extend the Error interface to include our custom properties
declare global {
  interface Error {
    details?: unknown;
    validationErrors?: unknown;
    [key: string]: unknown;
  }
}

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  /**
   * HTTP status code for the error
   */
  public readonly statusCode: number;
  
  /**
   * Application-specific error code
   */
  public readonly code: string;
  
  /**
   * Whether the error is operational (expected) or a programming error
   */
  public readonly isOperational: boolean;

  /**
   * Creates a new AppError instance
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param code - Application-specific error code
   * @param isOperational - Whether the error is operational (default: true)
   */
  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true
  ) {
    super(message);
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    // Ensure the error stack is captured properly
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Creates a plain object representation of the error
   * @returns Plain object with error details
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      ...(this.stack && { stack: this.stack }),
      ...(this as any).details && { details: (this as any).details },
    };
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if a value is an Error object
 */
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Error codes and their corresponding HTTP status codes and messages
 */
// Define error code types
type ErrorCodeValue = {
  code: string;
  message: string;
  status: number;
};

type ErrorCodes = {
  [key: string]: ErrorCodeValue;
};

export const ERROR_CODES: ErrorCodes = {
  AUTHENTICATION_REQUIRED: {
    code: 'AUTHENTICATION_REQUIRED',
    message: 'Authentication required',
    status: 401,
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid credentials',
    status: 401,
  },
  INVALID_OR_EXPIRED_TOKEN: {
    code: 'INVALID_OR_EXPIRED_TOKEN',
    message: 'Invalid or expired token',
    status: 401,
  },
  INSUFFICIENT_PERMISSIONS: {
    code: 'INSUFFICIENT_PERMISSIONS',
    message: 'Insufficient permissions',
    status: 403,
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Validation error',
    status: 400,
  },
  INVALID_INPUT: {
    code: 'INVALID_INPUT',
    message: 'Invalid input',
    status: 400,
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    status: 404,
  },
  ALREADY_EXISTS: {
    code: 'ALREADY_EXISTS',
    message: 'Resource already exists',
    status: 409,
  },
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    status: 500,
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service unavailable',
    status: 503,
  },
  TOO_MANY_REQUESTS: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests',
    status: 429,
  },
  TIMEOUT_ERROR: {
    code: 'TIMEOUT_ERROR',
    message: 'Request timed out',
    status: 504,
  },
  API_ERROR: {
    code: 'API_ERROR',
    message: 'API request failed',
    status: 500,
  },
} as const;

// Define the error code type based on the ERROR_CODES object
export type ErrorCode = keyof typeof ERROR_CODES;

/**
 * Creates a new AppError with the specified error code and details
 */
interface ErrorDetails {
  [key: string]: unknown;
}

type ErrorOptions = {
  details?: string | ErrorDetails;
  isOperational?: boolean;
} & ErrorDetails;

/**
 * Creates a new AppError with the specified error code and options
 * @param code - Error code from ERROR_CODES
 * @param options - Error options or error message string
 * @param additionalOptions - Additional error options (legacy support)
 */
export function createError(
  code: ErrorCode,
  options?: string | ErrorOptions,
  additionalOptions?: ErrorOptions
): AppError {
  const errorInfo = ERROR_CODES[code];
  let message = errorInfo.message;
  let isOperational = true;
  let details: string | ErrorDetails | undefined;
  const metadata: ErrorDetails = {};

  // Handle different parameter patterns
  if (typeof options === 'string') {
    // First parameter is a string message
    message = `${errorInfo.message}: ${options}`;
    
    // Check for additional options in the third parameter
    if (additionalOptions) {
      isOperational = additionalOptions.isOperational ?? true;
      if (additionalOptions.details) {
        details = additionalOptions.details;
      }
      // Add any additional metadata
      Object.entries(additionalOptions).forEach(([key, value]) => {
        if (key !== 'isOperational' && key !== 'details') {
          metadata[key] = value;
        }
      });
    }
  } else if (typeof options === 'object' && options !== null) {
    // First parameter is an options object
    isOperational = options.isOperational ?? true;
    
    if (options.details) {
      details = options.details;
      message = `${errorInfo.message}: ${typeof details === 'string' 
        ? details 
        : JSON.stringify(details)}`;
    }
    
    // Add any additional metadata
    Object.entries(options).forEach(([key, value]) => {
      if (key !== 'isOperational' && key !== 'details') {
        metadata[key] = value;
      }
    });
  }
  
  // Create the error with basic properties
  const error = new AppError(
    message,
    errorInfo.status,
    errorInfo.code,
    isOperational
  );
  
  // Add details as a property if it exists
  if (details !== undefined) {
    (error as any).details = details;
  }
  
  // Add any metadata to the error object
  if (Object.keys(metadata).length > 0) {
    Object.assign(error, metadata);
  }
  
  return error;
}

/**
 * Middleware function to wrap API route handlers with error handling
 * @param handler - The API route handler function
 * @returns A wrapped handler with error handling
 */
export function withErrorHandler<T = any>(
  handler: (req: NextRequest | Request, ...args: any[]) => Promise<T>
) {
  return async (req: NextRequest | Request, ...args: any[]): Promise<NextResponse> => {
    try {
      const result = await handler(req, ...args);
      return result instanceof NextResponse 
        ? result 
        : NextResponse.json({ data: result });
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle AppError instances
      if (isAppError(error)) {
        const response: any = {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
        
        // Add details if they exist
        if ((error as any).details) {
          response.error.details = (error as any).details;
        }
        
        // Add validation errors if they exist
        if ((error as any).validationErrors) {
          response.error.validationErrors = (error as any).validationErrors;
        }
        
        return NextResponse.json(response, { status: error.statusCode });
      }
      
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation error',
              validationErrors: error.format(),
            },
          },
          { status: 400 }
        );
      }
      
      // Handle other errors
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error('Unhandled error:', errorMessage, errorStack);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { 
              details: errorMessage,
              ...(errorStack && { stack: errorStack }),
            }),
          },
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Handles errors in client components
 */
/**
 * Handles errors in client components
 */
export function handleClientError(error: unknown): { message: string; code?: string | number } {
  console.error('Client Error:', error);
  
  if (isAppError(error)) {
    return { 
      message: error.message, 
      code: error.code 
    };
  }
  
  if (isError(error)) {
    return { 
      message: error.message || 'An unexpected error occurred',
      code: 'CLIENT_ERROR'
    };
  }
  
  return { 
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR'
  };
}
