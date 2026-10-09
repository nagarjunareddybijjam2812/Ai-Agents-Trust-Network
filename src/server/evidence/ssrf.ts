/**
 * SSRF and URL Safety Validator.
 * Protects against internal IP leakage, cloud metadata endpoints, and non-standard schemes.
 */

import { URL } from 'node:url';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254',
  'instance-data',
]);

export function isSafeUrl(rawUrl: string): { safe: boolean; reason?: string; normalizedUrl?: string } {
  try {
    const parsed = new URL(rawUrl);

    // Only allow HTTP and HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: `Disallowed protocol scheme: ${parsed.protocol}` };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check blocked hostnames
    if (BLOCKED_HOSTNAMES.has(hostname)) {
      return { safe: false, reason: `Blocked private or cloud metadata hostname: ${hostname}` };
    }

    // Check private IPv4 ranges
    // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const b1 = parseInt(ipv4Match[1], 10);
      const b2 = parseInt(ipv4Match[2], 10);

      if (b1 === 10) return { safe: false, reason: 'Private network range 10.0.0.0/8' };
      if (b1 === 127) return { safe: false, reason: 'Loopback range 127.0.0.0/8' };
      if (b1 === 169 && b2 === 254) return { safe: false, reason: 'Link-local/metadata 169.254.0.0/16' };
      if (b1 === 172 && b2 >= 16 && b2 <= 31) return { safe: false, reason: 'Private range 172.16.0.0/12' };
      if (b1 === 192 && b2 === 168) return { safe: false, reason: 'Private range 192.168.0.0/16' };
      if (b1 === 0) return { safe: false, reason: 'Zero address block' };
    }

    return { safe: true, normalizedUrl: parsed.toString() };
  } catch (err: any) {
    return { safe: false, reason: `Invalid URL format: ${err?.message || 'parse error'}` };
  }
}
