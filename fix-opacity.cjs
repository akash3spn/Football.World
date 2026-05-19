const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;

  // Replace text-white/XX with text-black/XX dark:text-white/XX
  content = content.replace(/(?<![:-])text-white\/(20|40|50|90)(?![\w])/g, (m, p1) => {
    return 'text-black/' + p1 + ' dark:text-white/' + p1;
  });

  // Replace hover:text-white with hover:text-black dark:hover:text-white
  content = content.replace(/(?<![:-])hover:text-white(?![\w])/g, 'hover:text-black dark:hover:text-white');

  if (content !== orig) {
    fs.writeFileSync(file, content);
    console.log('Updated opacity text in ' + file);
  }
});
