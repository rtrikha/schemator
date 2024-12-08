export function generateSchema(node: ComponentNode | ComponentSetNode): string {
    console.log("works");

    const propertyDefinitionsArray: Array<{ key: string; type: ComponentPropertyType }> = [];

    if ('componentPropertyDefinitions' in node) {
        for (const [key, definition] of Object.entries(node.componentPropertyDefinitions)) {
            const cleanedKey = toCamelCase(key.split('?')[0].trim());
            propertyDefinitionsArray.push({ key: cleanedKey, type: definition.type });
        }
        console.log("Cleaned Component Property Definitions Array:", propertyDefinitionsArray);
    } else {
        console.log("No component property definitions found.");
        return '';
    }

    const interfaceName = `${toPascalCase(node.name)}Props`;
    const interfaceCode = generateInterfaceTemplate(interfaceName, propertyDefinitionsArray);

    console.log("Generated Interface Code:\n", interfaceCode);

    return interfaceCode;
}


function mapTypeToDefinition(type: ComponentPropertyType): string {
    switch (type) {
        case 'BOOLEAN':
            return 'boolean';
        case 'TEXT':
            return 'string';
        default:
            return 'any';
    }
}

function toCamelCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

function toPascalCase(str: string): string {
    return str
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

function generateInterfaceTemplate(
    interfaceName: string,
    properties: Array<{ key: string; type: ComponentPropertyType }>
): string {
    const lines: string[] = [];
    lines.push(`export interface ${interfaceName} {`);

    properties.forEach(({ key, type }) => {
        lines.push(`  ${key}?: ${mapTypeToDefinition(type)};`);
    });

    lines.push('}');

    return lines.join('\n');
}