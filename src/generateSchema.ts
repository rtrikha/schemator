import { includeStringDefaults } from './constants';

interface ComponentProperty {
    dataType: string;
    variantOptions?: string[];
    defaultValue?: string | number | boolean | null;
}

export function generateSchemaJSON(node: ComponentNode | ComponentSetNode): object {
    const nodeName = node.name;
    const nodeId = node.id;
    const nodeType = node.type === 'COMPONENT' ? 'component' : 'componentSet';

    const variantProps = new Map<string, ComponentProperty>();
    const otherProps = new Map<string, ComponentProperty>();

    if ('componentPropertyDefinitions' in node) {
        Object.entries(node.componentPropertyDefinitions).forEach(([key, def]) => {
            const propName = toCamelCase(key.split('#')[0].trim());

            const componentProperty: ComponentProperty = {
                dataType: mapDataType(def.type),
            };

            if (def.type === 'BOOLEAN') {
                if (def.defaultValue !== null) {
                    componentProperty.defaultValue = def.defaultValue;
                }
            } else if (def.type === 'TEXT') {
                if (includeStringDefaults) {
                    componentProperty.defaultValue = def.defaultValue || null;
                }
            } else {
                componentProperty.defaultValue = def.defaultValue || null;
            }

            if (componentProperty.dataType === 'instanceSwap') {
                delete componentProperty.defaultValue;
            }

            if (def.variantOptions) {
                componentProperty.variantOptions = def.variantOptions;
            }

            if (def.type === 'VARIANT') {
                variantProps.set(propName, componentProperty);
            } else {
                otherProps.set(propName, componentProperty);
            }
        });
    }

    const props = Object.fromEntries(new Map([...variantProps, ...otherProps]));

    const schema = {
        [toCamelCase(nodeName)]: {
            name: nodeName,
            nodeType: nodeType,
            nodeId: nodeId,
            [`${toCamelCase(nodeName)}Props`]: props,
        },
    };

    console.log('Generated Schema:', JSON.stringify(schema, null, 2));
    return schema;
}

function mapDataType(type: string): string {
    switch (type) {
        case 'BOOLEAN':
            return 'boolean';
        case 'TEXT':
            return 'string';
        case 'VARIANT':
            return 'variant';
        case 'INSTANCE_SWAP':
            return 'instanceSwap';
        default:
            return 'unknown';
    }
}

function toCamelCase(str: string): string {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) =>
            index === 0 ? match.toLowerCase() : match.toUpperCase()
        )
        .replace(/\s+/g, '');
}
