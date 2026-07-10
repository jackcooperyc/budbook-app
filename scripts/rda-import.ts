import { readFile } from 'fs/promises';
import path from 'path';
import { importRdaCache } from '@lib/repositories/rda';
import { validateRdaImport } from '@lib/rda/validate';

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: npm run rda:import -- path/to/shops.json');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  const validation = validateRdaImport(parsed);

  if (!validation.ok || !validation.data) {
    console.error('RDA import validation failed:');
    for (const err of validation.errors) {
      console.error(`  ${err.path}: ${err.message}`);
    }
    process.exit(1);
  }

  const result = await importRdaCache(validation.data);
  console.log(
    `Imported ${result.storesImported} store(s) and ${result.menuItemsImported} menu item(s).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
