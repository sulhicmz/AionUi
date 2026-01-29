/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, Typography } from '@arco-design/web-react';
import { useOpenCode } from '@/renderer/context/opencode/OpenCodeContext';
import { logger } from '@common/monitoring';

const { Text } = Typography;

const OpenCodeModalContent: React.FC = () => {
  const { agents, activeAgent, accounts, activeAccount, plugins, isAntigravityEnabled } = useOpenCode();

  return (
    <div className='open-code-modal-content'>
      <Card title='OpenCode Integration Status' style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <Text type='secondary'>Active Agent</Text>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{activeAgent?.name || 'None'}</div>
          </div>
          <div>
            <Text type='secondary'>Available Agents</Text>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{agents.length}</div>
          </div>
          <div>
            <Text type='secondary'>Active Account</Text>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{activeAccount?.email || 'None'}</div>
          </div>
          <div>
            <Text type='secondary'>Total Accounts</Text>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{accounts.length}</div>
          </div>
          <div>
            <Text type='secondary'>Loaded Plugins</Text>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{plugins.length}</div>
          </div>
          <div>
            <Text type='secondary'>Antigravity</Text>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{isAntigravityEnabled ? 'Enabled' : 'Disabled'}</div>
          </div>
        </div>
      </Card>

      {activeAgent && (
        <Card title={`Active Agent: ${activeAgent.name}`} style={{ marginBottom: 16 }}>
          <div>
            <Text type='secondary'>Type: </Text>
            <Text>{activeAgent.type}</Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text type='secondary'>Capabilities: </Text>
            <div style={{ marginTop: 4 }}>
              {activeAgent.capabilities.map((cap) => (
                <span
                  key={cap}
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: 4,
                    marginRight: 4,
                    marginBottom: 4,
                  }}
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {agents.length > 0 && (
        <Card title='Available Agents'>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
            {agents.map((agent) => (
              <div
                key={agent.id}
                style={{
                  padding: 12,
                  border: '1px solid #e0e0e0',
                  borderRadius: 6,
                  backgroundColor: agent.id === activeAgent?.id ? '#f5f5f5' : 'white',
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                  {agent.name}
                  {agent.id === activeAgent?.id && (
                    <span
                      style={{
                        marginLeft: 8,
                        padding: '2px 6px',
                        backgroundColor: '#165dff',
                        color: 'white',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Type: {agent.type}</div>
                <div style={{ fontSize: 12 }}>
                  {agent.capabilities.slice(0, 2).join(', ')}
                  {agent.capabilities.length > 2 && '...'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default OpenCodeModalContent;
