/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, Form, Switch, Button, Select, Table, Modal, Message, Tabs, Space, Tag } from '@arco-design/web-react';
import { Plus, SettingOne, User, Tool } from '@icon-park/react';
import { useOpenCode } from '@/renderer/context/opencode/OpenCodeContext';
import type { Agent, Account, Plugin } from '@/common/opencode';
import { logger } from '@common/monitoring';

const { TabPane } = Tabs;
const { Option } = Select;

const OpenCodeSettings: React.FC = () => {
  const { agents, activeAgent, setActiveAgent, accounts, setActiveAccount, authenticate, plugins, isLoading, error, isAntigravityEnabled, toggleAntigravity } = useOpenCode();

  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('google');
  const [antigravityCredentials, setAntigravityCredentials] = useState({
    clientId: '',
    clientSecret: '',
  });

  useEffect(() => {
    if (error) {
      Message.error(error);
    }
  }, [error]);

  const handleAuthenticate = async (): Promise<void> => {
    try {
      await authenticate(selectedProvider);
      Message.success('Authentication successful');
      setAuthModalVisible(false);
    } catch (err) {
      Message.error('Authentication failed');
    }
  };

  const handleAntigravityToggle = async (enabled: boolean): Promise<void> => {
    try {
      await toggleAntigravity(enabled);
      Message.success(`Antigravity ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      Message.error('Failed to toggle Antigravity');
    }
  };

  const agentColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name: string, record: Agent) => (
        <Space>
          {name}
          {activeAgent?.id === record.id && <Tag color='blue'>Active</Tag>}
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Capabilities',
      dataIndex: 'capabilities',
      render: (capabilities: string[]) => (
        <Space wrap>
          {capabilities.map((cap) => (
            <Tag key={cap} size='small'>
              {cap}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      render: (_: unknown, record: Agent) => (
        <Button type='primary' size='small' onClick={() => setActiveAgent(record)} disabled={activeAgent?.id === record.id}>
          Set Active
        </Button>
      ),
    },
  ];

  const accountColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Provider',
      dataIndex: 'provider',
      render: (provider: string) => <Tag>{provider}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Actions',
      render: (_: unknown, record: Account) => (
        <Button type='primary' size='small' onClick={() => setActiveAccount(record.id)} disabled={record.isActive}>
          Set Active
        </Button>
      ),
    },
  ];

  const pluginColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Version',
      dataIndex: 'version',
    },
    {
      title: 'Description',
      dataIndex: 'description',
    },
    {
      title: 'Author',
      dataIndex: 'author',
    },
  ];

  if (isLoading) {
    return <Card loading={true} />;
  }

  return (
    <div className='open-code-settings'>
      <Card title='OpenCode Integration Settings'>
        <Tabs defaultActiveTab='general'>
          <TabPane key='general' title='General'>
            <Form layout='vertical'>
              <Form.Item label='Enable Antigravity Authentication'>
                <Switch checked={isAntigravityEnabled} onChange={handleAntigravityToggle} />
              </Form.Item>

              {isAntigravityEnabled && (
                <Form.Item label='Antigravity Credentials'>
                  <Space direction='vertical' style={{ width: '100%' }}>
                    <Form.Item label='Client ID'>
                      <input
                        type='password'
                        placeholder='Enter Antigravity Client ID'
                        value={antigravityCredentials.clientId}
                        onChange={(e) =>
                          setAntigravityCredentials((prev) => ({
                            ...prev,
                            clientId: e.target.value,
                          }))
                        }
                      />
                    </Form.Item>
                    <Form.Item label='Client Secret'>
                      <input
                        type='password'
                        placeholder='Enter Antigravity Client Secret'
                        value={antigravityCredentials.clientSecret}
                        onChange={(e) =>
                          setAntigravityCredentials((prev) => ({
                            ...prev,
                            clientSecret: e.target.value,
                          }))
                        }
                      />
                    </Form.Item>
                  </Space>
                </Form.Item>
              )}
            </Form>
          </TabPane>

          <TabPane key='agents' title='Agents'>
            <Space style={{ marginBottom: 16 }}>
              <Button type='primary' icon={<Plus />}>
                Add Agent
              </Button>
              <Button icon={<SettingOne />}>Configure Agents</Button>
            </Space>

            <Table columns={agentColumns} data={agents} pagination={false} rowKey='id' />
          </TabPane>

          <TabPane key='authentication' title='Authentication'>
            <Space style={{ marginBottom: 16 }}>
              <Button type='primary' icon={<User />} onClick={() => setAuthModalVisible(true)}>
                Add Account
              </Button>
            </Space>

            <Table columns={accountColumns} data={accounts} pagination={false} rowKey='id' />
          </TabPane>

          <TabPane key='plugins' title='Plugins'>
            <Space style={{ marginBottom: 16 }}>
              <Button type='primary' icon={<Plus />}>
                Install Plugin
              </Button>
              <Button icon={<Tool />}>Manage Plugins</Button>
            </Space>

            <Table columns={pluginColumns} data={plugins} pagination={false} rowKey='name' />
          </TabPane>
        </Tabs>
      </Card>

      <Modal title='Add Authentication Account' visible={authModalVisible} onOk={handleAuthenticate} onCancel={() => setAuthModalVisible(false)}>
        <Form layout='vertical'>
          <Form.Item label='Provider'>
            <Select value={selectedProvider} onChange={setSelectedProvider} style={{ width: '100%' }}>
              <Option value='google'>Google</Option>
              <Option value='github'>GitHub</Option>
              {isAntigravityEnabled && <Option value='antigravity'>Antigravity</Option>}
            </Select>
          </Form.Item>

          {selectedProvider === 'antigravity' && (
            <>
              <Form.Item label='Client ID'>
                <input type='password' placeholder='Enter Client ID' style={{ width: '100%', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </Form.Item>
              <Form.Item label='Client Secret'>
                <input type='password' placeholder='Enter Client Secret' style={{ width: '100%', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default OpenCodeSettings;
