const renameConditions = [
  { regex: /\b2xs\b/i, replacement: "Extra Extra Small" },
  { regex: /\bxs\b/i, replacement: "Extra Small" },
  { regex: /\bsm\b/i, replacement: "Small" },
  { regex: /\bs\b/i, replacement: "Small" },
  { regex: /\bmd\b/i, replacement: "Medium" },
  { regex: /\bm\b/i, replacement: "Medium" },
  { regex: /\blg\b/i, replacement: "Large" },
  { regex: /\bl\b/i, replacement: "Large" },
  { regex: /\bxl\b/i, replacement: "Extra Large" }
];

const booleanCustomSuffix = '?';
const textCustomSuffix = 'Text';
const casingStyle: 'title' | 'upper' | 'lower' | 'sentence' | 'camel' = 'title';

const updatedCount = { count: 0 }; // for final output logging, dont update this


figma.on('run', () => {
  const selection = figma.currentPage.selection;

  if (selection.length !== 1) {
    figma.closePlugin('Please select a single component set.');
    return;
  }

  const selectedNode = selection[0];

  // Ensure the selected node is a component set
  if (selectedNode.type === 'COMPONENT') {
    figma.closePlugin('Please select the parent component set, not a single component');
    return;
  } else if (selectedNode.type !== 'COMPONENT_SET') {
    figma.closePlugin('Please select a valid component set.');
    return;
  }


  function toCasedString(str: string): string {
    if (casingStyle === 'upper') return str.toUpperCase();
    if (casingStyle === 'lower') return str.toLowerCase();
    if (casingStyle === 'sentence') return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    if (casingStyle === 'camel') {
      return str.toLowerCase().split(' ').map((word, index) => {
        if (index === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      }).join('');
    }
    const spacedString = str.replace(/([a-z])([A-Z])/g, '$1 $2');
    return spacedString.toLowerCase().split(' ').map(word => word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word).join(' ');
  }

  function processComponentProperties(node: ComponentSetNode) {
    if ('componentPropertyDefinitions' in node) {
      Object.entries(node.componentPropertyDefinitions).forEach(([key, def]) => {
        const cleanedKey = key.split('#')[0].trim();
        const sanitizedKey = cleanedKey.replace(/[^a-zA-Z0-9]/g, '');
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

    const parts = child.name.split(/(=|,)/g).map(part => part.trim());
    const renamedParts = parts.map(part => part === '=' || part === ',' ? part : toCasedString(part));
    const newName = renamedParts.join(' ');

    if (newName !== child.name) {
      child.name = newName;
      updatedCount.count++;
      console.log(`Renamed child layer to: ${child.name}`);
    }
  }

  if (selectedNode.type === 'COMPONENT_SET') {
    processComponentProperties(selectedNode);
    if ('children' in selectedNode) {
      selectedNode.children.forEach(child => {
        renameChildNodes(child, updatedCount);
      });
    }
  }

  if (updatedCount.count === 0) {
    figma.closePlugin('No properties to update.');
  } else {
    figma.closePlugin(`${updatedCount.count} component property(s) updated successfully.`);
  }
});