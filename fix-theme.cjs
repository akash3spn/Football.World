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
  
  // Replace text-white with text-zinc-900 dark:text-white
  content = content.replace(/(?<![:-])text-white(?![\w/-])/g, 'text-zinc-900 dark:text-white');
  
  // Replace bg-white/5 or 10 or 20 etc.
  content = content.replace(/(?<![:-])bg-white\/(5|10|20|70)(?![\w])/g, (m, p1) => {
    return 'bg-black/' + p1 + ' dark:bg-white/' + p1;
  });
  
  // Replace border-white/
  content = content.replace(/(?<![:-])border-white\/(5|10|20)(?![\w])/g, (m, p1) => {
    return 'border-black/' + p1 + ' dark:border-white/' + p1;
  });
  
  // Replace text-zinc-400
  content = content.replace(/(?<![:-])text-zinc-400(?![\w])/g, 'text-zinc-600 dark:text-zinc-400');
  
  // Replace text-zinc-300
  content = content.replace(/(?<![:-])text-zinc-300(?![\w])/g, 'text-zinc-700 dark:text-zinc-300');
  
  // Replace bg-[#07090D]
  content = content.replace(/(?<![:-])bg-\[#07090D\](?![\w])/g, 'bg-zinc-50 dark:bg-[#07090D]');
  
  // Replace bg-zinc-900
  content = content.replace(/(?<![:-])bg-zinc-900(?![\w])/g, 'bg-white dark:bg-zinc-900');
  
  // Replace bg-zinc-800
  content = content.replace(/(?<![:-])bg-zinc-800(?![\w])/g, 'bg-zinc-100 dark:bg-zinc-800');
  
  // Replace text-zinc-500
  content = content.replace(/(?<![:-])text-zinc-500(?![\w])/g, 'text-zinc-500 dark:text-zinc-400');

  // bg-black/5 is not great if it's already there, but wait, there might be 'bg-black' hardcoded.
  // Replace bg-black
  content = content.replace(/(?<![:-])bg-black(?![\w/-])/g, 'bg-white dark:bg-black');
  
  if (content !== orig) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
