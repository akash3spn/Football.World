const fs = require('fs');

const replaceInFile = (file, from, to) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(from, to);
  fs.writeFileSync(file, content);
};

replaceInFile('src/pages/Fixtures.tsx', /bg-primary-dark\/50/g, 'bg-black/5 dark:bg-primary-dark/50');
replaceInFile('src/pages/Search.tsx', /bg-primary-dark(?![/])/g, 'bg-[#f7f7f9] dark:bg-primary-dark');
replaceInFile('src/components/layout/Navbar.tsx', /bg-primary-dark\/95/g, 'bg-white/95 dark:bg-primary-dark/95');
replaceInFile('src/components/SmartSearch.tsx', /bg-primary-dark\/95/g, 'bg-white/95 dark:bg-primary-dark/95');
