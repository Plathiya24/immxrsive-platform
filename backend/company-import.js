const dns = require('node:dns/promises');
const { BlockList } = require('node:net');
const http = require('node:http');
const https = require('node:https');

const blocked = new BlockList();
for (const [prefix, bits] of Object.entries({
  '0.0.0.0': 8, '10.0.0.0': 8, '100.64.0.0': 10, '127.0.0.0': 8,
  '169.254.0.0': 16, '172.16.0.0': 12, '192.0.0.0': 24, '192.0.2.0': 24,
  '192.168.0.0': 16, '198.18.0.0': 15, '198.51.100.0': 24, '203.0.113.0': 24,
  '224.0.0.0': 3
})) blocked.addSubnet(prefix, bits);

function website(value) {
  if (typeof value !== 'string' || value.length > 1500) throw new Error('Enter a public website URL.');
  const url = new URL(value.trim());
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password ||
      url.port || !url.hostname.includes('.')) throw new Error('Enter a public website URL.');
  url.hash = '';
  return url;
}

async function fetchWebsite(url, signal = AbortSignal.timeout(9000), redirects = 0) {
  signal.throwIfAborted();
  const { address } = await dns.lookup(url.hostname, { family: 4 });
  signal.throwIfAborted();
  if (blocked.check(address)) throw new Error('Use a publicly accessible company website.');
  const client = url.protocol === 'https:' ? https : http;
  const response = await new Promise((resolve, reject) => {
    const request = client.get(url, {
      family: 4, agent: false, signal,
      headers: { Accept: 'text/html', 'User-Agent': 'ImmXrsive company import' },
      lookup: (_hostname, options, callback) => options.all
        ? callback(null, [{ address, family: 4 }])
        : callback(null, address, 4)
    }, resolve);
    request.on('error', reject);
  });
  if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location && redirects < 3) {
    response.destroy();
    return fetchWebsite(website(new URL(response.headers.location, url).href), signal, redirects + 1);
  }
  if (response.statusCode !== 200 || !/^text\/html\b/i.test(response.headers['content-type'] || '')) {
    response.destroy();
    throw new Error('Could not read an HTML website.');
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of response) {
    size += chunk.length;
    if (size > 512 * 1024) throw new Error('Website exceeded the import size limit.');
    chunks.push(chunk);
  }
  return { html: Buffer.concat(chunks).toString('utf8'), finalUrl: url.href };
}

function text(value = '') {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value.replace(/<[^>]*>/g, ' ').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (raw, name) => {
    if (!name.startsWith('#')) return Object.hasOwn(entities, name) ? entities[name] : raw;
    const number = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : raw;
  }).replace(/\s+/g, ' ').trim();
}

function companyCandidate(html, finalUrl) {
  const page = html.replace(/<!--[\s\S]*?-->|<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const metadata = new Map();
  for (const tag of page.matchAll(/<meta\s+[^>]*>/gi)) {
    const attrs = Object.fromEntries(Array.from(tag[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g),
      ([, key, double, single, bare]) => [key.toLowerCase(), text(double ?? single ?? bare)]));
    if (attrs.content) metadata.set((attrs.name || attrs.property || '').toLowerCase(), attrs.content);
  }
  const paragraphs = Array.from(page.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi), match => text(match[1]));
  const name = metadata.get('og:site_name') || metadata.get('og:title') ||
    text(page.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]) || text(page.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  if (!name) throw new Error('Company name missing.');
  const services = paragraphs.find(value => /^(services|sector|keywords):/i.test(value)) || '';
  const keywords = (metadata.get('keywords') || services.replace(/^[^:]+:\s*/, '').replace(/\.$/, ''))
    .split(',').map(value => value.trim().replace(/^(extended reality|xr)$/i, 'XR')).filter(Boolean);
  if (keywords.some(value => /\btraining\b/i.test(value)) && !keywords.includes('training')) keywords.push('training');
  const description = metadata.get('description') || metadata.get('og:description') ||
    paragraphs.find(value => value.length >= 45 && !/^(location|services|sector|keywords):/i.test(value)) || '';
  const location = metadata.get('geo.placename') || (paragraphs.find(value => /^location:/i.test(value)) || '').replace(/^location:\s*/i, '').replace(/,\s*Canada$/i, '');
  return {
    name: name.slice(0, 200), description: description.slice(0, 3000), website: finalUrl,
    domain: new URL(finalUrl).hostname, sector: keywords.join(', ').slice(0, 250), location: location.slice(0, 250)
  };
}

module.exports = { website, fetchWebsite, companyCandidate };
