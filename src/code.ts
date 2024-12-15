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

// Helper to validate the selection
function isValidSelection(selection: readonly SceneNode[]): boolean {
  return (
    selection.length > 0 &&
    selection.every((node) => node.type === 'COMPONENT' || node.type === 'COMPONENT_SET')
  );
}

figma.on('run', () => {
  const selection = figma.currentPage.selection;

  if (!isValidSelection(selection)) {
    figma.notify('Please select a valid component or component set to run the plugin.');
    figma.closePlugin(); // Exit the plugin immediately
    return;
  }

  figma.showUI(__html__, { width: 300, height: 200 });

  const selectedNode = selection[0];

  // Type guard to ensure selectedNode is a ComponentNode or ComponentSetNode
  if (selectedNode.type !== 'COMPONENT' && selectedNode.type !== 'COMPONENT_SET') {
    figma.notify('Selected node is not a valid component or component set.');
    return; // Exit if the selected node is invalid
  }

  const schemaJSON = generateSchemaJSON(selectedNode as ComponentNode | ComponentSetNode);
  console.log('Generated JSON on load:', schemaJSON); // Debugging log
  figma.ui.postMessage({ type: 'schema-json', json: schemaJSON });
  figma.ui.postMessage({ type: 'selected-component-name', name: selectedNode.name });
});

figma.ui.onmessage = (msg) => {
  const selection = figma.currentPage.selection;

  if (!isValidSelection(selection)) {
    figma.notify('Please select a valid component or component set to proceed.');
    figma.closePlugin(); // Exit if the selection is invalid
    return;
  }

  const selectedNode = selection[0];

  if (msg.type === 'run-cleanup') {
    // Type guard to ensure selectedNode is a ComponentNode or ComponentSetNode
    if (selectedNode.type !== 'COMPONENT' && selectedNode.type !== 'COMPONENT_SET') {
      figma.notify('Selected node is not a valid component or component set.');
      return; // Exit if the selected node is invalid
    }

    const resultMessage = processAndRenameComponents(selectedNode as ComponentNode | ComponentSetNode);
    console.log('Cleanup result:', resultMessage); // Debugging log
    const schemaJSON = generateSchemaJSON(selectedNode as ComponentNode | ComponentSetNode);
    console.log('Generated JSON:', schemaJSON); // Debugging log
    figma.ui.postMessage({ type: 'schema-json', json: schemaJSON });
    figma.ui.postMessage({ type: 'selected-component-name', name: selectedNode.name });
    figma.notify(resultMessage); // Notify the user with the result message
  } else if (msg.type === 'download-json') {
    // Type guard to ensure selectedNode is a ComponentNode or ComponentSetNode
    if (selectedNode.type !== 'COMPONENT' && selectedNode.type !== 'COMPONENT_SET') {
      figma.notify('Selected node is not a valid component or component set.');
      return; // Exit if the selected node is invalid
    }

    const schemaJSON = generateSchemaJSON(selectedNode as ComponentNode | ComponentSetNode);
    console.log('Generated JSON:', schemaJSON); // Debugging log
    figma.ui.postMessage({ type: 'schema-json', json: schemaJSON });
    figma.ui.postMessage({ type: 'selected-component-name', name: selectedNode.name });
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};

function processAndRenameComponents(node: ComponentNode | ComponentSetNode): string {
  let updatedCount = 0; // Counter for renaming changes
  let suffixAddedCount = 0; // Counter for suffix additions

  // Rename component properties
  if ('componentPropertyDefinitions' in node) {
    Object.entries(node.componentPropertyDefinitions).forEach(([key, def]) => {
      const cleanedKey = key.split('#')[0].trim();
      const sanitizedKey = cleanedKey.replace(/[^a-zA-Z0-9\s]/g, '');

      let suffixedKey = cleanedKey; // Holds the suffixed key
      let formattedKey = sanitizedKey; // Holds the renamed node value
      let suffixAdded = false; // Flag to track if a suffix was added

      // Add suffix only if it is not already present
      if (def.type === 'BOOLEAN') {
        if (!cleanedKey.toLowerCase().endsWith(booleanCustomSuffix.toLowerCase())) {
          suffixedKey = sanitizedKey + booleanCustomSuffix;
          suffixAdded = true;
        }
      } else if (def.type === 'TEXT') {
        if (!cleanedKey.toLowerCase().endsWith(textCustomSuffix.toLowerCase())) {
          suffixedKey = sanitizedKey + textCustomSuffix;
          suffixAdded = true;
        }
      }

      // Avoid additional modifications if the suffixed key hasn't changed
      if (sanitizedKey.toLowerCase().includes('text')) {
        suffixedKey = sanitizedKey; // Keep suffixedKey unchanged
      }

      formattedKey = toCasedString(suffixedKey);

      // Check if the formatted key is different from the cleaned key
      if (formattedKey !== cleanedKey) {
        node.editComponentProperty(key, { name: formattedKey });
        updatedCount++;
      }

      // Increment suffixAddedCount only if a suffix was actually added
      if (suffixAdded) {
        suffixAddedCount++;
      }
    });
  }

  // Rename child nodes if the node is a ComponentSet
  if (node.type === 'COMPONENT_SET') {
    node.children.forEach((child) => {
      updatedCount += renameNode(child); // Count renaming changes for child nodes
    });
  } else {
    updatedCount += renameNode(node); // Count renaming changes for single node
  }

  return [
    updatedCount > 0 ? `${updatedCount} node(s) renamed successfully` : '',
    suffixAddedCount > 0 ? `${suffixAddedCount} suffix(es) added successfully` : '',
  ]
    .filter(Boolean)
    .join(', ') || 'No changes made.';
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