const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../assets/icons/figma');
const OUTPUT_FILE = path.join(__dirname, '../src/theme/icons.ts');

function fileNameToCamelCase(fileName) {
  return fileName
    .replace(/\.svg$/, '')
    .replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function generateIcons() {
  if (!fs.existsSync(ICONS_DIR)) {
    console.error(`[generate-icons] Directory not found: ${ICONS_DIR}`);
    return;
  }

  const files = fs
    .readdirSync(ICONS_DIR)
    .filter((file) => file.endsWith('.svg') && file !== 'figma-icon-section.svg')
    .sort();

  const iconEntries = files.map((file) => ({
    file,
    variableName: fileNameToCamelCase(file),
  }));

  const importStatements = iconEntries
    .map(
      ({ file, variableName }) =>
        `import ${variableName} from '../../assets/icons/figma/${file}';`
    )
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
