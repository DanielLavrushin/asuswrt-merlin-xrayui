import fs from 'node:fs';
import path from 'node:path';

export function GetXrayConfig(fileName: string): any {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tests', 'fakes', fileName), 'utf8'));
}
