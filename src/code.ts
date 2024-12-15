import { generateSchemaJSON } from './generateSchema';

const renameConditions = [
  { regex: /\b2xs\b/i, replacement: 'Extra Extra Small' },
  { regex: /\bxs\b/i, replacement: 'Extra Small' },
  { regex: /\bsm\b/i, replacement: 'Small' },
  { regex: /\bs\b/i, replacement: 'Small' },
  { regex: /\bmd\b/i, replacement: 'Medium' },
  { regex: /\bm\b/i, replacement: 'Medium' },
  { regex: /\blg\b/i, replacement: 'Large' },
  { regex: /\bl\b/i, replacement: 'Large' },
  { regex: /\bxl\b/i, replacement: 'Extra Large' },
];

const booleanCustomSuffix = '?';
const textCustomSuffix = ' Text';
const casingStyle: 'title' | 'upper' | 'lower' | 'sentence' | 'camel' = 'title';

// Function to get and validate the current selection
function getValidSelection(): { node: ComponentNode | ComponentSetNode; name: string } | null {
  console.log('Rescanning current selection...');
  const selection = figma.currentPage.selection;

  if (
    selection.length === 1 &&
    (selection[0].type === 'COMPONENT' || selection[0].type === 'COMPONENT_SET')
  ) {
    const node = selection[0] as ComponentNode | ComponentSetNode;
    console.log('Valid selection found:', node.name);
    return { node, name: node.name };
  }

  console.warn('Invalid or no selection. Please select a valid component or component set.');
  figma.notify('Please select a valid component or component set.');
  return null;
}

// Function to process and rename nodes
function processAndRenameComponents(node: ComponentNode | ComponentSetNode): { updatedCount: number; suffixAddedCount: number } {
  console.log('Starting node processing...');
  let updatedCount = 0;
  let suffixAddedCount = 0;

  // Rename component properties
  if ('componentPropertyDefinitions' in node) {
    Object.entries(node.componentPropertyDefinitions).forEach(([key, def]) => {
      const cleanedKey = key.split('#')[0].trim();
      const sanitizedKey = cleanedKey.replace(/[^a-zA-Z0-9\s]/g, '');

      let suffixedKey = cleanedKey;
      let suffixAdded = false;

      // Add suffix only if not already present
      if (def.type === 'BOOLEAN' && !cleanedKey.endsWith(booleanCustomSuffix)) {
        suffixedKey = sanitizedKey + booleanCustomSuffix;
        suffixAdded = true;
      } else if (def.type === 'TEXT' && !cleanedKey.toLowerCase().endsWith(textCustomSuffix.toLowerCase())) {
        suffixedKey = sanitizedKey + textCustomSuffix;
        suffixAdded = true;
      }

      const formattedKey = toCasedString(suffixedKey);

      // Rename only if there is a change
      if (formattedKey !== cleanedKey) {
        node.editComponentProperty(key, { name: formattedKey });
        updatedCount++;
      }

      if (suffixAdded) {
        suffixAddedCount++;
      }
    });
  }

  // Rename child nodes if the node is a ComponentSet
  if (node.type === 'COMPONENT_SET') {
    node.children.forEach((child) => {
      updatedCount += renameNode(child);
    });
  } else {
    updatedCount += renameNode(node);
  }

  console.log('Processing complete:', { updatedCount, suffixAddedCount });
  return { updatedCount, suffixAddedCount };
}

// Helper: Renames a single node
function renameNode(node: BaseNode): number {
  let changes = 0;

  renameConditions.forEach(({ regex, replacement }) => {
    if (regex.test(node.name)) {
      node.name = node.name.replace(regex, replacement);
      changes++;
    }
  });

  const parts = node.name.split(/(=|,)/g).map((part) => part.trim());
  const renamedParts = parts.map((part) =>
    part === '=' || part === ',' ? part : toCasedString(part)
  );
  const newName = renamedParts.join(' ');

  if (newName !== node.name) {
    node.name = newName;
    changes++;
  }

  return changes;
}

// Helper: Converts string to the desired casing style
function toCasedString(str: string): string {
  if (casingStyle === 'upper') return str.toUpperCase();
  if (casingStyle === 'lower') return str.toLowerCase();
  if (casingStyle === 'sentence') return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  if (casingStyle === 'camel') {
    return str
      .toLowerCase()
      .split(' ')
      .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
      .join('');
  }
  return str
    .toLowerCase()
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Main plugin logic
figma.on('run', () => {
  const validSelection = getValidSelection();
  if (!validSelection) {
    figma.closePlugin();
    return;
  }

  const { node } = validSelection;

  figma.showUI(__html__, { width: 300, height: 200 });
  figma.ui.postMessage({ type: 'selected-component-name', name: node.name });
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'run-cleanup') {
    console.log('Running cleanup...');
    const validSelection = getValidSelection();

    if (!validSelection) {
      figma.notify('No valid selection found.');
      return;
    }

    const { node } = validSelection;
    const { updatedCount, suffixAddedCount } = processAndRenameComponents(node);

    const resultMessage = [
      updatedCount > 0 ? `${updatedCount} node(s) renamed successfully` : '',
      suffixAddedCount > 0 ? `${suffixAddedCount} suffix(es) added successfully` : '',
    ]
      .filter(Boolean)
      .join(', ') || 'No changes made.';
    figma.notify(resultMessage);

    const schemaJSON = generateSchemaJSON(node);
    figma.ui.postMessage({ type: 'schema-json', json: schemaJSON });
  } else if (msg.type === 'download-json') {
    console.log('Processing download request...');
    const validSelection = getValidSelection();

    if (!validSelection) {
      figma.notify('No valid selection found.');
      return;
    }

    const { node, name } = validSelection;
    const schemaJSON = generateSchemaJSON(node);

    // Send both the JSON and name in a single message
    figma.ui.postMessage({
      type: 'download-ready',
      json: schemaJSON,
      name: name
    });
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};