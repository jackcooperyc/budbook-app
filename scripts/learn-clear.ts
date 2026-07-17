import { clearLearnArticles } from '@lib/repositories/learn';

async function main() {
  await clearLearnArticles();
  console.log('Cleared Learn articles.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
