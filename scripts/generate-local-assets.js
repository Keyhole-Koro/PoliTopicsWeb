const fs = require('fs');
const path = require('path');

const articlesPath = path.join(__dirname, '../terraform/seed/articles.json');
const outputBase = path.join(__dirname, '../.local-assets');
const bucketName = 'politopics-articles-local';

if (!fs.existsSync(articlesPath)) {
  console.error('articles.json not found at', articlesPath);
  process.exit(1);
}

try {
  const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
  const bucketDir = path.join(outputBase, bucketName);
  
  // Ensure bucket dir
  fs.mkdirSync(path.join(bucketDir, 'articles'), { recursive: true });

  function buildArticleAsset(article) {
      return {
        key_points: article.key_points ?? [],
        summary: article.summary,
        soft_language_summary: article.soft_language_summary,
        middle_summary: article.middle_summary,
        dialogs: article.dialogs,
      };
  }

  let count = 0;
  for (const article of articles) {
    const payload = JSON.stringify(buildArticleAsset(article), null, 2);
    const key = `articles/${article.id}.json`;
    const filePath = path.join(bucketDir, key);
    fs.writeFileSync(filePath, payload);
    count++;
  }

  console.log(`Generated ${count} assets in ${bucketDir}`);
} catch (error) {
  console.error('Failed to generate assets:', error);
  process.exit(1);
}
