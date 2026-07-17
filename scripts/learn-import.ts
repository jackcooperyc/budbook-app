import { readFile } from 'fs/promises';
import path from 'path';
import { importLearnArticles } from '@lib/repositories/learn';
import { validateLearnImport } from '@lib/learn/validate';
import { SEED_LEARN_ARTICLES } from '@lib/learn/seedArticles';

async function main() {
  const fileArg = process.argv[2];

  let articles = SEED_LEARN_ARTICLES;

  if (fileArg) {
    const filePath = path.resolve(process.cwd(), fileArg);
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    const validation = validateLearnImport(parsed);

    if (!validation.ok || !validation.data) {
      console.error('Learn import validation failed:');
      for (const err of validation.errors) {
        console.error(`  ${err.path}: ${err.message}`);
      }
      process.exit(1);
    }
    articles = validation.data.articles;
  }

  const result = await importLearnArticles(articles);
  console.log(`Imported ${result.articlesImported} Learn article(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
