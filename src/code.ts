import { generateSchemaJSON } from './generateSchema';
import {
  renameConditions,
  booleanCustom,
  textCustomSuffix,
  casingStyle
} from './constants';

function getValidSelection(): { node: ComponentNode | ComponentSetNode; name: string } | null {
  1
  const selection = figma.currentPage.selection;

  if (
    selection.length === 1 &&
    (selection[0].type === 'COMPONENT' || selection[0].type === 'COMPONENT_SET')
  ) {
    const node = selection[0] as ComponentNode | ComponentSetNode;
    return { node, name: node.name };
  }

  figma.notify('Please select a valid component or component set.');
  return null;
}

function processAndRenameComponents(node: ComponentNode | ComponentSetNode): { updatedCount: number; suffixAddedCount: number } {
  console.log('Starting node processing...');
  let updatedCount = 0;
  let suffixAddedCount = 0;

  if ('componentPropertyDefinitions' in node) {
    Object.entries(node.componentPropertyDefinitions).forEach(([key, def]) => {
      const cleanedKey = key.split('#')[0].trim();
      const sanitizedKey = cleanedKey.replace(/[^a-zA-Z0-9\s]/g, '');

      let modifiedKey = cleanedKey;
      let modified = false;

      if (def.type === 'BOOLEAN') {
        const hasPrefix = cleanedKey.toLowerCase().startsWith(booleanCustom.prefix.toLowerCase());
        const hasSuffix = cleanedKey.endsWith(booleanCustom.suffix);

        if (!hasPrefix || !hasSuffix) {
          modifiedKey = sanitizedKey;
          if (!hasPrefix) {
            modifiedKey = `${booleanCustom.prefix} ${modifiedKey}`;
          }
          if (!hasSuffix) {
            modifiedKey = `${modifiedKey}${booleanCustom.suffix}`;
          }
          modified = true;
        }
      } else if (def.type === 'TEXT' && !cleanedKey.toLowerCase().endsWith(textCustomSuffix.toLowerCase())) {
        modifiedKey = sanitizedKey + textCustomSuffix;
        modified = true;
      }

      const formattedKey = toCasedString(modifiedKey);

      if (formattedKey !== cleanedKey) {
        node.editComponentProperty(key, { name: formattedKey });
        updatedCount++;
      }

      if (modified) {
        suffixAddedCount++;
      }
    });
  }

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

figma.on('run', () => {
  const validSelection = getValidSelection();
  if (!validSelection) {
    figma.closePlugin();
    return;
  }

  const { node } = validSelection;

  figma.showUI(__html__, {
    width: 360,
    height: 420,
    themeColors: true
  });
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

    figma.ui.postMessage({
      type: 'download-ready',
      json: schemaJSON,
      name: name
    });
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};