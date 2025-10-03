import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68dfd7f63f19c316710ad94c", 
  requiresAuth: true // Ensure authentication is required for all operations
});
