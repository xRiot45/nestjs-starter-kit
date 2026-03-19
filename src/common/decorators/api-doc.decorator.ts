/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiHeader,
    ApiHeaderOptions,
    ApiOperation,
    ApiParam,
    ApiParamOptions,
    ApiProduces,
    ApiQuery,
    ApiQueryOptions,
    ApiResponse,
    ApiResponseOptions,
} from '@nestjs/swagger';

export interface ApiDocErrorResponse {
    status: HttpStatus;
    description: string;
}

export interface ApiDocOptions {
    // Basic Info
    summary: string;
    description?: string;
    deprecated?: boolean;

    // Authentication & Security
    auth?: boolean;

    // Request Configuration
    body?: Type<unknown>; // DTO Class for Body
    params?: ApiParamOptions[]; // Path Parameters (example: /:id)
    queries?: ApiQueryOptions[]; // Query Parameters (example: ?limit=10)
    headers?: ApiHeaderOptions[]; // Custom Headers

    // Content Type Configuration
    consumes?: 'application/json' | 'multipart/form-data' | 'application/x-www-form-urlencoded' | string;
    produces?: 'application/json' | 'text/csv' | 'application/pdf' | string;

    // Success Response Configuration
    response?: Type<unknown> | Function | [Function] | string; // Return DTO
    isArray?: boolean; // Set true if the return is Array[]
    status?: HttpStatus; // Default 200 (OK) or 201 (Created)

    // Error Handling
    // Optional: If you want to override the default error message or add another error status (e.g. 404)
    customResponses?: ApiResponseOptions[];
}

export function ApiDocGenericResponse(options: ApiDocOptions): MethodDecorator {
    const {
        summary,
        description,
        deprecated = false,
        auth = false,
        body,
        params,
        queries,
        headers,
        consumes,
        produces,
        response,
        isArray = false,
        status = HttpStatus.OK,
        customResponses = [],
    } = options;

    const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [];

    // 1. Operation Metadata
    decorators.push(ApiOperation({ summary, description, deprecated }));

    // 2. Authentication Logic
    if (auth) {
        decorators.push(ApiBearerAuth());
        decorators.push(
            ApiResponse({
                status: HttpStatus.UNAUTHORIZED,
                description: 'Unauthorized: Access token is missing or invalid.',
            }),
            ApiResponse({
                status: HttpStatus.FORBIDDEN,
                description: 'Forbidden: You do not have permission to access this resource.',
            }),
        );
    }

    // 3. Request Parameters (Path, Query, Headers)
    if (params?.length) {
        params.forEach(param => decorators.push(ApiParam(param)));
    }
    if (queries?.length) {
        queries.forEach(query => decorators.push(ApiQuery(query)));
    }
    if (headers?.length) {
        headers.forEach(header => decorators.push(ApiHeader(header)));
    }

    // 4. Content Type (Consumes & Produces)
    if (consumes) {
        decorators.push(ApiConsumes(consumes));
    }
    if (produces) {
        decorators.push(ApiProduces(produces));
    }

    // 5. Request Body
    if (body) {
        decorators.push(ApiBody({ type: body }));
    }

    // 6. Success Response
    if (response) {
        decorators.push(
            ApiResponse({
                status: status,
                description: 'Operation successful',
                type: response as Type<unknown>,
                isArray: isArray,
            }),
        );
    } else {
        decorators.push(
            ApiResponse({
                status: status,
                description: 'Operation successful',
            }),
        );
    }

    // 7. Standard Error Responses (Default)
    const defaultErrors = [
        { status: HttpStatus.BAD_REQUEST, description: 'Validation failed or malformed request.' },
        { status: HttpStatus.TOO_MANY_REQUESTS, description: 'Rate limit exceeded.' },
        { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error.' },
    ];

    defaultErrors.forEach(err => {
        const isOverridden = customResponses.some(res => res.status === err.status);
        if (!isOverridden) {
            decorators.push(ApiResponse(err));
        }
    });

    // 8. Custom / Extra Responses
    if (customResponses.length > 0) {
        customResponses.forEach(res => decorators.push(ApiResponse(res)));
    }

    return applyDecorators(...decorators);
}
