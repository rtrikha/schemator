export function generateSchemaJSON(node: ComponentNode | ComponentSetNode): string {
    console.log("Generating schema...");

    const propertyDefinitionsArray: Array<{
        key: string;
        type: ComponentPropertyType;
        defaultValue?: string | number | boolean | null;
    }> = [];

    let instanceNodesArray: Array<{
        name: string;
        exposedInstanceType?: string;
    }> = [];

    if ('componentPropertyDefinitions' in node) {
        for (const [key, definition] of Object.entries(node.componentPropertyDefinitions)) {
            const cleanedKey = key.replace(/[\d#]+/g, '');
            const defaultValue = definition.defaultValue !== undefined ? definition.defaultValue : null;

            const property = {
                key: cleanedKey,
                type: definition.type,
                defaultValue,
            };

            propertyDefinitionsArray.push(property);
        }
        console.log("Component Property Definitions:", propertyDefinitionsArray);
    } else {
        console.log("No component property definitions found.");
    }

    function traverseNodeTree(currentNode: BaseNode) {
        if (currentNode.type === 'INSTANCE') {
            const isExposedInstance = currentNode.exposedInstances?.length > 0 || false;
            const exposedInstanceType = isExposedInstance
                ? currentNode.exposedInstances?.[0]?.type
                : undefined;

            const componentProperties = [];
            if ('componentProperties' in currentNode) {
                for (const [key, property] of Object.entries(currentNode.componentProperties)) {
                    const cleanedKey = key.replace(/[\d#]+/g, '');
                    const value = property.value !== undefined ? property.value : null;

                    componentProperties.push({
                        key: cleanedKey,
                        type: property.type,
                        defaultValue: value,
                    });
                }
            }

            instanceNodesArray.push({
                name: currentNode.name,
                exposedInstanceType,
            });
        }

        if ('children' in currentNode && currentNode.children) {
            currentNode.children.forEach(traverseNodeTree);
        }
    }

    traverseNodeTree(node);

    // instanceNodesArray = instanceNodesArray.filter(
    //     (instanceNode) => instanceNode.exposedInstanceType?.toLowerCase() !== "instance"
    // );

    const seenNames = new Set();
    instanceNodesArray = instanceNodesArray.filter((instanceNode) => {
        if (seenNames.has(instanceNode.name)) {
            return false;
        }
        seenNames.add(instanceNode.name);
        return true;
    });

    console.log("Component Extends", instanceNodesArray);

    return JSON.stringify({
        componentProperties: propertyDefinitionsArray,
        instanceNodes: instanceNodesArray,
    });
}