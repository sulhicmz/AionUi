/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AuthToken, Account } from './types';
import { logger } from '@common/monitoring';

export class AuthService {
  private accounts: Map<string, Account> = new Map();
  private activeAccountId: string | null = null;

  authenticate(provider: string, options?: any): AuthToken {
    switch (provider) {
      case 'google':
        return this.authenticateWithGoogle(options);
      case 'github':
        return this.authenticateWithGitHub(options);
      default:
        throw new Error(`Unsupported authentication provider: ${provider}`);
    }
  }

  private authenticateWithGoogle(options?: any): AuthToken {
    // In a real implementation, this would handle OAuth flow
    // For now, return a mock token
    const token: AuthToken = {
      accessToken: 'mock_google_access_token',
      refreshToken: 'mock_google_refresh_token',
      expiresAt: Date.now() + 3600000, // 1 hour
      provider: 'google',
    };

    // Create or update account
    const account: Account = {
      id: 'google_account_1',
      email: 'user@gmail.com',
      provider: 'google',
      tokens: token,
      isActive: true,
    };

    this.accounts.set(account.id, account);
    this.activeAccountId = account.id;

    return token;
  }

  private authenticateWithGitHub(options?: any): AuthToken {
    // In a real implementation, this would handle OAuth flow
    const token: AuthToken = {
      accessToken: 'mock_github_access_token',
      expiresAt: Date.now() + 3600000, // 1 hour
      provider: 'github',
    };

    const account: Account = {
      id: 'github_account_1',
      email: 'user@github.com',
      provider: 'github',
      tokens: token,
      isActive: true,
    };

    this.accounts.set(account.id, account);
    this.activeAccountId = account.id;

    return token;
  }

  refreshToken(token: AuthToken): AuthToken {
    if (!token.refreshToken) {
      throw new Error('No refresh token available');
    }

    // In a real implementation, this would refresh the token
    const newToken: AuthToken = {
      ...token,
      accessToken: `refreshed_${token.accessToken}`,
      expiresAt: Date.now() + 3600000,
    };

    // Update the account with the new token
    for (const account of this.accounts.values()) {
      if (account.tokens.accessToken === token.accessToken) {
        account.tokens = newToken;
        break;
      }
    }

    return newToken;
  }

  getAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  getActiveAccount(): Account | null {
    if (!this.activeAccountId) {
      return null;
    }
    return this.accounts.get(this.activeAccountId) || null;
  }

  setActiveAccount(accountId: string): void {
    if (this.accounts.has(accountId)) {
      // Deactivate all accounts
      for (const account of this.accounts.values()) {
        account.isActive = false;
      }

      // Activate the selected account
      const account = this.accounts.get(accountId);
      if (account) {
        account.isActive = true;
        this.activeAccountId = accountId;
      }
    } else {
      throw new Error(`Account ${accountId} not found`);
    }
  }

  removeAccount(accountId: string): void {
    const account = this.accounts.get(accountId);
    if (account) {
      // In a real implementation, this would revoke the token
      this.accounts.delete(accountId);

      if (this.activeAccountId === accountId) {
        this.activeAccountId = null;
      }
    }
  }

  isTokenValid(token: AuthToken): boolean {
    return Date.now() < token.expiresAt;
  }

  getValidToken(provider?: string): AuthToken | null {
    const accounts = this.getAccounts();

    // Filter by provider if specified
    const filteredAccounts = provider ? accounts.filter((acc) => acc.provider === provider) : accounts;

    // Find active account with valid token
    for (const account of filteredAccounts) {
      if (account.isActive && this.isTokenValid(account.tokens)) {
        return account.tokens;
      }
    }

    // Try to refresh if token is expired
    for (const account of filteredAccounts) {
      if (account.isActive) {
        try {
          return this.refreshToken(account.tokens);
        } catch (error) {
          logger.error("Error message");
        }
      }
    }

    return null;
  }

  authenticateWithAntigravity(clientId: string, clientSecret: string): AuthToken {
    // Mock implementation for Antigravity authentication
    const token: AuthToken = {
      accessToken: 'antigravity_access_token',
      refreshToken: 'antigravity_refresh_token',
      expiresAt: Date.now() + 3600000,
      provider: 'antigravity',
    };

    const account: Account = {
      id: 'antigravity_account_1',
      email: 'user@antigravity.com',
      provider: 'antigravity',
      tokens: token,
      isActive: true,
    };

    this.accounts.set(account.id, account);
    this.activeAccountId = account.id;

    return token;
  }

  clearAllAccounts(): void {
    this.accounts.clear();
    this.activeAccountId = null;
  }
}
