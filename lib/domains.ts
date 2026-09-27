const TLDS = ["com", "co", "net", "shop", "store"];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/-/g, " ")
    .trim();
}

function candidateNames(businessName: string): string[] {
  const cleaned = slugify(businessName).replace(/^the\s+/, "");
  const words = cleaned.split(/\s+/).filter(Boolean);

  const bare = words.join("");
  const hyphenated = words.join("-");

  return Array.from(new Set([bare, hyphenated].filter((n) => n.length > 1)));
}

export function candidateDomains(businessName: string): string[] {
  const names = candidateNames(businessName);
  const domains: string[] = [];
  for (const tld of TLDS) {
    for (const name of names) {
      domains.push(`${name}.${tld}`);
    }
  }
  return domains;
}

export type DomainStatus = { domain: string; available: boolean | null };

async function checkOne(domain: string): Promise<DomainStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    // rdap.org's WAF blocks requests with no/generic User-Agent (undici's
    // default gets a 403); a normal browser UA is enough to pass.
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15" },
    });
    clearTimeout(timeout);

    if (res.status === 404) return { domain, available: true };
    if (res.status === 200) return { domain, available: false };
    return { domain, available: null };
  } catch {
    return { domain, available: null };
  }
}

export async function checkDomainAvailability(businessName: string): Promise<DomainStatus[]> {
  const domains = candidateDomains(businessName);
  return Promise.all(domains.map(checkOne));
}
