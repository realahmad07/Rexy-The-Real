/**
 * Sentinel AI - Solana Blinks (Actions) Service
 * 
 * This service defines the structure for Solana Actions that power "Audit Blinks".
 * Blinks allow users to run audits directly from X (Twitter), Discord, or any Blink-enabled app.
 */

export interface SolanaAction {
  icon: string;
  title: string;
  description: string;
  label: string;
  links: {
    actions: {
      label: string;
      href: string;
      parameters?: {
        name: string;
        label: string;
        required?: boolean;
      }[];
    }[];
  };
}

export const BLINK_CONFIG = {
  icon: 'https://picsum.photos/seed/sentinel-blink/400/400',
  title: 'Sentinel AI Audit',
  description: 'Instantly audit any Solana Smart Contract directly from your feed.',
  label: 'Audit Now',
};

/**
 * Generates the Solana Action JSON for a specific audit request.
 * This would be served by an API endpoint (e.g., /api/actions/audit).
 */
export function generateAuditBlink(contractAddress?: string): SolanaAction {
  return {
    icon: BLINK_CONFIG.icon,
    title: BLINK_CONFIG.title,
    description: contractAddress 
      ? `Audit contract: ${contractAddress}` 
      : BLINK_CONFIG.description,
    label: BLINK_CONFIG.label,
    links: {
      actions: [
        {
          label: 'Run AI Audit (0.05 SOL)',
          href: `/api/actions/audit?address={address}`,
          parameters: [
            {
              name: 'address',
              label: 'Smart Contract Address',
              required: true,
            }
          ]
        }
      ]
    }
  };
}

/**
 * Helper to generate a shareable Blink URL.
 * In a real app, this would point to a dial.to or similar proxy.
 */
export function getShareableBlinkUrl(contractAddress: string): string {
  const baseUrl = 'https://dial.to/?action=solana-action:';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rexy-ai.app';
  const actionUrl = `${origin}/api/actions/audit?address=${contractAddress}`;
  return `${baseUrl}${encodeURIComponent(actionUrl)}`;
}
