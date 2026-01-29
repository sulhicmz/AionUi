/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Message content types for the chat system
 * Replaces any types with proper TypeScript interfaces
 */

import type { JSONObject, JSONValue } from './ai-schemas';
import { logger } from '@common/monitoring';

// Base message types
export type TMessageType = 'text' | 'tips' | 'tool_call' | 'tool_group' | 'agent_status' | 'acp_permission' | 'acp_tool_call' | 'codex_permission' | 'codex_tool_call';

// Text message content
export interface TextMessageContent {
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: string;
}

// Tips message content
export interface TipsMessageContent {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp?: string;
}

// Tool call content
export interface ToolCallContent {
  tool_name: string;
  arguments: JSONObject;
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: JSONValue;
  error?: string;
}

// Tool group confirmation content
export interface ToolGroupConfirmationContent {
  tool_group_id: string;
  tools: Array<{
    name: string;
    arguments: JSONObject;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  response?: string;
}

// Agent status content
export interface AgentStatusContent {
  status: 'online' | 'offline' | 'busy' | 'error';
  message?: string;
  last_seen?: string;
}

// ACP permission request content
export interface AcpPermissionContent {
  request_id: string;
  tool_name: string;
  arguments: JSONObject;
  permissions: string[];
  status: 'pending' | 'granted' | 'denied';
  response?: string;
}

// ACP tool call content
export interface AcpToolCallContent {
  tool_name: string;
  arguments: JSONObject;
  call_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: JSONValue;
  error?: string;
  start_time?: string;
  end_time?: string;
}

// Codex permission request content
export interface CodexPermissionContent {
  request_id: string;
  tool_name: string;
  arguments: JSONObject;
  permissions: Array<{
    type: string;
    path?: string;
    command?: string;
  }>;
  status: 'pending' | 'granted' | 'denied';
  response?: string;
}

// Codex tool call content
export interface CodexToolCallContent {
  tool_name: string;
  arguments: JSONObject;
  call_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: JSONValue;
  error?: string;
  progress?: {
    current?: number;
    total?: number;
    message?: string;
  };
}

// Message content mapping by type
export interface MessageContentMap {
  text: TextMessageContent;
  tips: TipsMessageContent;
  tool_call: ToolCallContent;
  tool_group: ToolGroupConfirmationContent;
  agent_status: AgentStatusContent;
  acp_permission: AcpPermissionContent;
  acp_tool_call: AcpToolCallContent;
  codex_permission: CodexPermissionContent;
  codex_tool_call: CodexToolCallContent;
}

// Generic message interface
export interface IMessage<T extends TMessageType, Content extends MessageContentMap[T]> {
  id: string;
  msg_id?: string;
  conversation_id: string;
  type: T;
  content: Content;
  created_at?: string;
  updated_at?: string;
  metadata?: JSONObject;
  position?: 'left' | 'right' | 'center' | 'pop';
  createdAt?: number;
}

// Update event data for different message types
export interface MessageUpdateEventData {
  message_id: string;
  data: Partial<MessageContentMap[TMessageType]>;
  timestamp: string;
}

// Tool call specific update types
export interface ToolCallUpdateData {
  tool_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: JSONValue;
  error?: string;
  progress?: {
    current?: number;
    total?: number;
    message?: string;
  };
}

// Type guards
export function isTextMessageContent(content: unknown): content is TextMessageContent {
  return typeof content === 'object' && content !== null && 'content' in content && 'role' in content;
}

export function isToolCallContent(content: unknown): content is ToolCallContent {
  return typeof content === 'object' && content !== null && 'tool_name' in content && 'arguments' in content && 'id' in content;
}

export function isMessageUpdateData(data: unknown): data is MessageUpdateEventData {
  return typeof data === 'object' && data !== null && 'message_id' in data && 'data' in data && 'timestamp' in data;
}

// Factory functions
export function createTextMessage(conversation_id: string, content: string, role: 'user' | 'assistant' | 'system'): IMessage<'text', TextMessageContent> {
  return {
    id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    conversation_id,
    type: 'text',
    content: {
      content,
      role,
      timestamp: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  };
}

export function createToolCallMessage(conversation_id: string, tool_name: string, args: JSONObject): IMessage<'tool_call', ToolCallContent> {
  return {
    id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    conversation_id,
    type: 'tool_call',
    content: {
      tool_name,
      arguments: args,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
    },
    created_at: new Date().toISOString(),
  };
}
