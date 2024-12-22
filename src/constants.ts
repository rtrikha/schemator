// constants for renaming components and sanitising to the correct tshirt sizing, you can add your own regex and replacement here
export const renameConditions = [
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

// constants for custom prefix and suffix for boolean properties, you can add your own prefix and suffix here
export const booleanCustom = {
    prefix: '',
    suffix: '?'
};

// constants for custom suffix for text properties, you can add your own suffix here
export const textCustomSuffix: ' text' | ' string' = ' text';

// constants for casing style for text properties (default is title)
export const casingStyle: 'title' | 'upper' | 'lower' | 'sentence' | 'camel' = 'title';

// constants for including string defaults in the schema, if its true then it will include the entered string in the schema
export const includeStringDefaults = true;
