import fs from 'fs';
import path from 'path';

export function getMarketingFixes() {
  const syncDir = path.join(process.cwd(), '.marketing-os');
  if (!fs.existsSync(syncDir)) return [];

  try {
    const files = fs.readdirSync(syncDir);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const content = fs.readFileSync(path.join(syncDir, f), 'utf-8');
        return JSON.parse(content);
      });
  } catch (err) {
    console.error('Marketing OS Sync Error:', err);
    return [];
  }
}
