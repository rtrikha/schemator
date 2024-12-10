import { generateSchemaJSON } from './generateSchema';
const renameConditions = [
  { regex: /\b2xs\b/i, replacement: "Extra Extra Small" },
  { regex: /\bxs\b/i, replacement: "Extra Small" },
  { regex: /\bsm\b/i, replacement: "Small" },
  { regex: /\bs\b/i, replacement: "Small" },
  { regex: /\bmd\b/i, replacement: "Medium" },
  { regex: /\bm\b/i, replacement: "Medium" },
  { regex: /\blg\b/i, replacement: "Large" },
  { regex: /\bl\b/i, replacement: "Large" },
  { regex: /\bxl\b/i, replacement: "Extra Large" },
];

const booleanCustomSuffix = '?';
const textCustomSuffix = ' Text';
const casingStyle: 'title' | 'upper' | 'lower' | 'sentence' | 'camel' = 'title';

const updatedCount = { count: 0 };

function getChildNodes(node: ComponentSetNode): BaseNode[] {
  return [...node.children];
}

figma.on('run', async () => {
  const selection = figma.currentPage.selection;

  // await figma.loadAllPagesAsync();

  // const allNodes = figma.root.findAll();
  // allNodes.forEach(node => {
  //   if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
  //     console.log(`Found ${node.type}: ${node.name}`);
  //   }
  // });

  // if (selection.length !== 1) {
  //   figma.closePlugin('Please select a single component or component set.');
  //   return;
  // }

  const selectedNode = selection[0];

  if (selectedNode.type === 'COMPONENT_SET') {
    processComponentProperties(selectedNode);
    const childNodes = getChildNodes(selectedNode);
    childNodes.forEach((child) => {
      renameChildNodes(child, updatedCount);
    });
  } else if (selectedNode.type === 'COMPONENT') {
    processComponentProperties(selectedNode);
    renameChildNodes(selectedNode, updatedCount);
  } else {
    figma.closePlugin('Please select a valid component or component set.');
    return;
  }

  console.log("Calling generateSchema after all processing");
  generateSchemaJSON(selectedNode);

  if (updatedCount.count === 0) {
    figma.closePlugin('No properties to update.');
  } else {
    figma.closePlugin(`${updatedCount.count} component property(s) updated successfully.`);
  }
});

function toCasedString(str: string): string {
  if (casingStyle === 'upper') return str.toUpperCase();
  if (casingStyle === 'lower') return str.toLowerCase();
  if (casingStyle === 'sentence') return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  if (casingStyle === 'camel') {
    return str
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        if (index === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('');
  }

  return str
    .toLowerCase()
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function processComponentProperties(node: ComponentNode | ComponentSetNode) {
  if ('componentPropertyDefinitions' in node) {
    Object.entries(node.componentPropertyDefinitions).forEach(([key, def]) => {
      const cleanedKey = key.split('#')[0].trim();

      const sanitizedKey = cleanedKey.replace(/[^a-zA-Z0-9\s]/g, '');

      let newKey = sanitizedKey;

      if (def.type === 'BOOLEAN' && !sanitizedKey.endsWith(booleanCustomSuffix)) {
        newKey = sanitizedKey + booleanCustomSuffix;
      }

      if (def.type === 'TEXT' && !sanitizedKey.toLowerCase().endsWith(textCustomSuffix.toLowerCase())) {
        newKey = sanitizedKey + textCustomSuffix;
      }

      const formattedKey = toCasedString(newKey);

      if (formattedKey !== cleanedKey) {
        node.editComponentProperty(key, { name: formattedKey });
        updatedCount.count++;
        console.log(`Updated property: ${key} to ${formattedKey}. Total updated: ${updatedCount.count}`);
      }
    });
  }
}

function renameChildNodes(child: BaseNode, updatedCount: { count: number }) {
  for (const { regex, replacement } of renameConditions) {
    if (regex.test(child.name)) {
      child.name = child.name.replace(regex, replacement);
      updatedCount.count++;
    }
  }
  const parts = child.name.split(/(=|,)/g).map((part) => part.trim());
  const renamedParts = parts.map((part) =>
    part === '=' || part === ',' ? part : toCasedString(part)
  );
  const newName = renamedParts.join(' ');

  if (newName !== child.name) {
    child.name = newName;
    updatedCount.count++;
  }
}