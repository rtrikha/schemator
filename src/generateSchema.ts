export function generateSchemaJSON(node: ComponentNode | ComponentSetNode): string {
    console.log("Generating schema...");

    const propertyDefinitionsArray: Array<{
        key: string;
        type: ComponentPropertyType;
        defaultValue?: string | number | boolean | null;
        variantOptions?: string[] | null;
    }> = [];

    let instanceNodesArray: Array<{
        id: string;
        name: string;
        parentName?: string;
        isExposedInstance: boolean;
        componentProperties?: Array<{
            key: string;
            type: ComponentPropertyType;
            defaultValue?: string | number | boolean | null;
        }>;
        nestedInstances?: Array<{
            name: string;
            componentProperties?: Array<{
                key: string;
                type: ComponentPropertyType;
                defaultValue?: string | number | boolean | null;
            }>;
        }>;
    }> = [];

    const seenInstanceIds = new Set<string>();

    if ('componentPropertyDefinitions' in node) {
        for (const [key, definition] of Object.entries(node.componentPropertyDefinitions)) {
            const cleanedKey = key.replace(/[\d#]+/g, '');
            const defaultValue = definition.defaultValue !== undefined ? definition.defaultValue : null;

            const property = {
                key: cleanedKey,
                type: definition.type,
                defaultValue,
                ...(definition.variantOptions ? { variantOptions: definition.variantOptions } : {}),
            };

            propertyDefinitionsArray.push(property);
        }
        console.log("Component Schema:", propertyDefinitionsArray);
    }

    function extractNestedInstances(parentNode: InstanceNode): Array<{
        id: string;
        name: string;
        componentProperties?: Array<{
            key: string;
            type: ComponentPropertyType;
            defaultValue?: string | number | boolean | null;
        }>;
    }> {
        const nestedInstances: Array<{
            id: string;
            name: string;
            componentProperties?: Array<{
                key: string;
                type: ComponentPropertyType;
                defaultValue?: string | number | boolean | null;
            }>;
        }> = [];

        if ('children' in parentNode && parentNode.children) {
            parentNode.children.forEach((child) => {
                if (child.type === 'INSTANCE' && !seenInstanceIds.has(child.id)) {
                    seenInstanceIds.add(child.id);

                    const componentProperties = [];
                    if ('componentProperties' in child) {
                        for (const [key, property] of Object.entries(child.componentProperties)) {
                            const cleanedKey = key.replace(/[\d#]+/g, '');
                            const value = property.value !== undefined ? property.value : null;

                            componentProperties.push({
                                key: cleanedKey,
                                type: property.type,
                                defaultValue: value,
                            });
                        }
                    }

                    if (componentProperties.length > 0) {
                        nestedInstances.push({
                            id: child.id,
                            name: child.name,
                            componentProperties,
                        });

                        const deeperNestedInstances = extractNestedInstances(child);
                        nestedInstances.push(...deeperNestedInstances);
                    }
                }
            });
        }

        return nestedInstances;
    }

    function traverseNodeTree(currentNode: BaseNode) {
        if (currentNode.type === 'INSTANCE' && !seenInstanceIds.has(currentNode.id)) {
            seenInstanceIds.add(currentNode.id);

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

            if (componentProperties.length > 0) {
                const nestedInstances = extractNestedInstances(currentNode);

                instanceNodesArray.push({
                    id: currentNode.id,
                    name: currentNode.name,
                    parentName: currentNode.parent?.name || undefined,
                    isExposedInstance: currentNode.exposedInstances?.length > 0 || false,
                    componentProperties,
                    nestedInstances: nestedInstances.length > 0 ? nestedInstances : undefined,
                });
            }
        }

        if ('children' in currentNode && currentNode.children) {
            currentNode.children.forEach(traverseNodeTree);
        }
    }

    traverseNodeTree(node);

    const seenNames = new Set<string>();
    instanceNodesArray = instanceNodesArray.filter((instanceNode) => {
        if (seenNames.has(instanceNode.name)) {
            return false;
        }
        seenNames.add(instanceNode.name);
        return true;
    });

    console.log("Uses", instanceNodesArray);

    return JSON.stringify({
        componentProperties: propertyDefinitionsArray,
        instanceNodes: instanceNodesArray,
    });
}