import { clearRdaCache } from '@lib/repositories/rda';

async function main() {
  await clearRdaCache();
  console.log('Cleared RDA stores and menus.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
