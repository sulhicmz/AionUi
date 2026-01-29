/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Type definitions for AI model parameters and schemas
 * Replaces 'any' types with proper TypeScript interfaces
 */

// Base type for JSON-like structures - fix circular reference
export type JSONArray = JSONValue[];
export type JSONValue = string | number | boolean | null | JSONArray | JSONObject;
export interface JSONObject {
  [key: string]: JSONValue;
}

// Function parameter schemas
export interface FunctionParameterSchema extends JSONObject {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  properties?: Record<string, FunctionParameterSchema>;
  items?: FunctionParameterSchema;
  required?: string[];
  description?: string;
  enum?: (string | number)[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

// OpenAI Tool function parameters
export interface OpenAIFunctionParameters extends JSONObject {
  [key: string]: JSONValue;
}

// Gemini tool function declaration parameters
export interface GeminiFunctionParameters extends JSONObject {
  [key: string]: JSONValue;
}

// Gemini response structure
export interface GeminiCandidate {
  content?: {
    parts: GeminiContentPart[];
  };
  finishReason?: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
  index?: number;
}

export interface GeminiContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  executableCode?: {
    language: string;
    code: string;
  };
}

export interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export interface GeminiResponse {
  candidates?: GeminiCandidate[];
  usageMetadata?: GeminiUsageMetadata;
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  };
}

// OpenAI response choice
export interface OpenAIChoice {
  index: number;
  message: {
    role: string;
    content: string;
    images?: Array<{
      type: 'image_url';
      image_url: { url: string };
    }>;
  };
  finish_reason: string;
}

// Error types for better error handling
export class AIAdapterError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: JSONObject
  ) {
    super(message);
    this.name = 'AIAdapterError';
  }
}

export class ValidationError extends AIAdapterError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'VALIDATION_ERROR', { field });
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AIAdapterError {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message, 'NETWORK_ERROR', { statusCode });
    this.name = 'NetworkError';
  }
}

// Generic result types
export interface AdapterResult<TData = unknown> {
  success: boolean;
  data?: TData;
  error?: {
    code: string;
    message: string;
    details?: JSONObject;
  };
}

// Configuration types
export interface AdapterConfig {
  timeout?: number;
  retries?: number;
  apiKey?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  customParams?: JSONObject;
}

export interface ModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

// Generic type guards
export function isJSONObject(value: unknown): value is JSONObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidFunctionParameters(value: unknown): value is FunctionParameterSchema {
  return isJSONObject(value) && typeof value.type === 'string';
}

export function isValidGeminiResponse(value: unknown): value is GeminiResponse {
  return isJSONObject(value) && (Array.isArray(value.candidates) || typeof value.promptFeedback === 'object');
}
