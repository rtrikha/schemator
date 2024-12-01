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
      console.log(`Found component: ${node.name}`); // Log the layer name of the component
      // Log the names of all children inside this component
      if ('children' in node && node.children.length > 0) {
        const children = node.children; // Get the children array
        // Process children in reverse order
        for (let i = children.length - 1; i >= 0; i--) {
          const child = children[i];
          console.log(`  Child layer: ${child.name}`); // Log the name of each child
          renameChildNodes(child); // Rename each child node
        }
      }
      processComponentProperties(node);
    } else if ('children' in node) {
      node.children.forEach(traverseNodes); // Recursively traverse children
    }
  }

  // Function to rename child nodes to title case while ignoring '=' and ','
  function renameChildNodes(child: BaseNode) {
    // Check for "sm" or "s" and rename to "Small"
    if (/\bsm\b/.test(child.name) || /\bs\b/.test(child.name)) {
      child.name = child.name.replace(/\bsm\b/g, "Small").replace(/\bs\b/g, "Small");
    }

    // Check for "md" or "m" and rename to "Medium"
    if (/\bmd\b/.test(child.name) || /\bm\b/.test(child.name)) {
      child.name = child.name.replace(/\bmd\b/g, "Medium").replace(/\bm\b/g, "Medium");
    }

    // Check for "lg" or "l" and rename to "Large"
    if (/\blg\b/.test(child.name) || /\bl\b/.test(child.name)) {
      child.name = child.name.replace(/\blg\b/g, "Large").replace(/\bl\b/g, "Large");
    }

    // Split the name by spaces, but keep '=' and ',' intact
    const parts = child.name.split(/(=|,)/g).map(part => part.trim());

    // Convert each part to title case, ignoring '=' and ','
    const renamedParts = parts.map(part => {
      if (part === '=' || part === ',') {
        return part; // Keep '=' and ',' unchanged
      }
      return toTitleCase(part); // Convert to title case
    });

    // Join the parts back together
    child.name = renamedParts.join(' ');

    console.log(`  Final renamed child layer to: ${child.name}`); // Log the final renaming action
  }

  // Start processing the selected node
  if (selectedNode.type === 'FRAME' || selectedNode.type === 'GROUP') {
    traverseNodes(selectedNode); // Traverse through all nodes in the frame
  } else if (selectedNode.type === 'COMPONENT' || selectedNode.type === 'COMPONENT_SET') {
    // Log the names of all children inside the selected component
    if ('children' in selectedNode) {
      // Process children in reverse order
      for (let i = selectedNode.children.length - 1; i >= 0; i--) {
        const child = selectedNode.children[i];
        renameChildNodes(child);
      }
    }
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