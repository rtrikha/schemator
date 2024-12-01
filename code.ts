figma.on('run', () => {
  const selection = figma.currentPage.selection;

  if (selection.length !== 1) {
    figma.closePlugin('Please select a single frame, group, or component.');
    return;
  }

  const selectedNode = selection[0];
  let updatedCount = 0; // Counter for updated component names

  // Function to convert a string to title case
  function toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => {
        // Capitalize the first letter of each word
        if (word.length > 0) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
      })
      .join(' ');
  }

  // Function to check if a string is in title case
  function isTitleCase(str: string): boolean {
    const words = str.split(' ');
    return words.every(word => {
      return word.length === 0 || word.charAt(0) === word.charAt(0).toUpperCase();
    });
  }

  // Function to process component properties
  function processComponentProperties(node: ComponentNode | ComponentSetNode) {
    if ('componentPropertyDefinitions' in node) {
      Object.entries(node.componentPropertyDefinitions).forEach(([key, def]) => {
        const cleanedKey = key.split('#')[0].trim(); // Clean and trim the property name
        let newKey = cleanedKey; // Initialize newKey with cleanedKey

        // Handle BOOLEAN properties
        if (def.type === 'BOOLEAN') {
          if (!cleanedKey.endsWith('?')) {
            newKey = cleanedKey + '?'; // Add '?' suffix if missing
          }
        }

        // Handle TEXT properties
        if (def.type === 'TEXT') {
          if (!cleanedKey.toLowerCase().endsWith(' text')) {
            newKey = cleanedKey + ' Text'; // Add ' Text' suffix if missing
          }
        }

        // Check if the new property name is different from the current key
        if (newKey !== cleanedKey || !isTitleCase(newKey)) {
          const titleCasedName = toTitleCase(newKey); // Convert to title case
          // Only update the name, do not change defaultValue for variant properties
          node.editComponentProperty(key, {
            name: titleCasedName,
            // Do not include defaultValue for variant properties
          });
          updatedCount++; // Increment the updated count
          console.log(`Updated property: ${key} to ${titleCasedName}. Total updated: ${updatedCount}`); // Log the update
        }
      });
    }
  }

  // Function to traverse nodes in a frame
  function traverseNodes(node: BaseNode) {
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      processComponentProperties(node);
    } else if ('children' in node) {
      node.children.forEach(traverseNodes); // Recursively traverse children
    }
  }

  // Start processing the selected node
  if (selectedNode.type === 'FRAME' || selectedNode.type === 'GROUP') {
    traverseNodes(selectedNode); // Traverse through all nodes in the frame
  } else if (selectedNode.type === 'COMPONENT' || selectedNode.type === 'COMPONENT_SET') {
    processComponentProperties(selectedNode); // Process directly if it's a component
  } else {
    figma.closePlugin('Please select a valid frame, group, or component.');
    return;
  }

  // Close the plugin and display the number of updated component names
  if (updatedCount === 0) {
    figma.closePlugin('No properties to update.');
  } else {
    figma.closePlugin(`${updatedCount} component property(s) updated successfully.`);
  }
});