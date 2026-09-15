/* global __dirname */
const fs = require('fs');
const path = require('path');

const ICONS_BASE_DIR = path.join(__dirname, '../assets/icons');
const OUTPUT_FILE = path.join(__dirname, '../src/theme/icons.ts');

function fileNameToCamelCase(fileName) {
  return fileName
    .replace(/\.svg$/, '')
    .replace(/^([A-Z])/, (_, char) => char.toLowerCase())
    .replace(/[-_]+([a-zA-Z0-9])/g, (_, char) => char.toUpperCase());
}

function dirToCamelCase(dirPath) {
  return dirPath
    .split(path.sep)
    .filter(Boolean)
    .map((part, idx) => {
      const clean = part.replace(/[-_]+([a-zA-Z0-9])/g, (_, char) => char.toUpperCase());
      if (idx === 0) {
        return clean.replace(/^([A-Z])/, (_, char) => char.toLowerCase());
      }
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    })
    .join('');
}

function scanDirectory(dir, fileList = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (item.isFile() && item.name.endsWith('.svg') && item.name !== 'figma-icon-section.svg') {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function generateIcons() {
  if (!fs.existsSync(ICONS_BASE_DIR)) {
    console.error(`[generate-icons] Directory not found: ${ICONS_BASE_DIR}`);
    return;
  }

  const allSvgFiles = scanDirectory(ICONS_BASE_DIR).sort();
  const usedNames = new Set();
  const iconEntries = [];

  for (const fullPath of allSvgFiles) {
    const relativeFromIconsDir = path.relative(ICONS_BASE_DIR, fullPath);
    const dirName = path.dirname(relativeFromIconsDir);
    const baseName = path.basename(fullPath);

    let variableName = fileNameToCamelCase(baseName);

    // If file is inside a subdirectory other than 'figma', prefix with camelCase folder path
    if (dirName !== '.' && dirName !== 'figma') {
      const prefix = dirToCamelCase(dirName);
      const pascalName = variableName.charAt(0).toUpperCase() + variableName.slice(1);
      variableName = `${prefix}${pascalName}`;
    }

    // Handle any potential name collisions
    let finalName = variableName;
    let counter = 2;
    while (usedNames.has(finalName)) {
      finalName = `${variableName}${counter}`;
      counter++;
    }
    usedNames.add(finalName);

    // Calculate relative path from src/theme/icons.ts to the SVG file
    const relImportPath = path
      .relative(path.dirname(OUTPUT_FILE), fullPath)
      .replace(/\\/g, '/');

    iconEntries.push({
      filePath: relImportPath.startsWith('.') ? relImportPath : `./${relImportPath}`,
      variableName: finalName,
    });
  }

  const importStatements = iconEntries
    .map(({ filePath, variableName }) => `import ${variableName} from '${filePath}';`)
    .join('\n');

  const exportEntries = iconEntries
    .map(({ variableName }) => `  ${variableName},`)
    .join('\n');

  const content = `// AUTO-GENERATED FILE BY scripts/generate-icons.js - DO NOT EDIT MANUALLY
${importStatements}

export const appIcons = {
${exportEntries}
} as const;

export type AppIconName = keyof typeof appIcons;
`;

  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  console.log(
    `[generate-icons] Successfully generated icons.ts with ${iconEntries.length} icons!`
  );
}

generateIcons();
