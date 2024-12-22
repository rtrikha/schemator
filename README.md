<p align="center">
<img width="60%" margin="0 auto" alt="schematorLogo" src="https://github.com/user-attachments/assets/b5499402-d955-4fef-8da1-755ccddf29e8">
</p>

<h3>What is Schemator?</h3>
<p>Schemator is a lightweight yet powerful Figma plugin designed to enhance and standardize the schema of your components. By providing a flexible and structured schema, Schemator empowers you to streamline your design-to-code workflows and unlock new possibilities for automation.</p><br>



<h3>What all can Schemator do?</h3>
<ul>
<li><b>Consistent Naming</b> - Establish a universal schema for component properties, promoting seamless collaboration and code integration across teams and projects.</li>
<li><b>Predictable Structure</b> - Adopt a familiar and logical naming convention, ensuring that components are intuitive to use and easy to extend.</li>
<li><b>Sanitized Definitions</b> - Enable customization by adding suffixes and prefixes to property definitions, giving developers the flexibility to tailor components to their specific workflows.</li>
</ul>

> Note: The plugin only works with <code>component</code> and <code>componentSet</code> and not with instances. 
<br>

<h3>Supported funcationalities</h3>
You can find all the supported constants in <code>constants.ts</code>

<h4>Cleanup</h4>

```ts
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
```
> Currently there is regex added for renaming tshirt sizing to be formatted, feel free to add your own regex too.

<h4>Sanitization</h4>

```ts
export const booleanCustom = {
    prefix: '',
    suffix: '?'
};
export const textCustomSuffix: ' text' | ' string' = ' text';
export const casingStyle: 'title' | 'upper' | 'lower' | 'sentence' | 'camel' = 'title';
export const includeStringDefaults = true;
```
> Give custom prefix and suffix for <code>boolean</code> and <code>text</code> type properties, you can also mark <code>includeStringDefault=false</code> if you dont wish to expoert the <code>string</code> prop type entered value from Figma.
<br>

<h3>Example component and schema</h3>
<p>Below is a sample shown of the component prop definition in Figma and the generated JSON from it.</p>
<img width="400" margin="0 auto" alt="sampleImage" src="https://github.com/user-attachments/assets/2499a9fe-ac2c-470e-aff9-73cfb61945ec"/>

```json
{
  "selectChips": {
    "name": "Select Chips",
    "nodeType": "componentSet",
    "nodeId": "155:337",
    "selectChipsProps": {
      "size": {
        "dataType": "variant",
        "defaultValue": "medium",
        "variantOptions": ["medium", "small"]
      },
      "chipCount": {
        "dataType": "variant",
        "defaultValue": "1",
        "variantOptions": ["6", "5", "4", "3", "2", "1"]
      },
      "helperText?": {
        "dataType": "boolean",
        "defaultValue": true
      },
      "helperText": {
        "dataType": "string"
      },
      "errorText": {
        "dataType": "string"
      },
      "errorText?": {
        "dataType": "boolean",
        "defaultValue": false
      }
    }
  }
}
```
<br>
<h3>Contribution</h3>
Feel free to submit a pull request if you'd like to contribute 🤝🏼






