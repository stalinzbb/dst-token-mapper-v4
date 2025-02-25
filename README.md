# Detached Style Token Mapper

A Figma plugin to scan pages/selections for detached styles and suggest matching variable alternatives from connected libraries.

## Features

- **Scan Entire Page or Selection**: Choose to scan the entire current page or just your selected elements.
- **Detached Style Detection**: Automatically finds elements with detached styles (colors, typography, spacing, corner radius).
- **Variable Matching**: Suggests matching variables from your connected libraries.
- **Library Conflict Resolution**: Identifies and helps resolve conflicts when the same value exists in multiple libraries.
- **Bulk Application**: Apply multiple fixes at once with a single click.

## Limitations

- **Node Count Limit**: Maximum of 1000 nodes can be scanned at once to maintain performance.
- **Color Matching**: Currently limited to exact hex value matching.
- **Library Requirements**: Requires connected libraries with variables to function properly.

## How to Use

1. **Install the Plugin**: Install from the Figma Plugin Store.
2. **Connect Libraries**: Ensure you have libraries with variables connected to your Figma file.
3. **Run the Plugin**: Open the plugin from the Plugins menu.
4. **Choose Scope**: Select whether to scan the entire page or just your selection.
5. **Review Results**: Review the detected detached styles and suggested variable matches.
6. **Select Fixes**: Choose which suggestions to apply.
7. **Apply Changes**: Click "Apply Fixes" to apply the selected changes.

## Development

### Project Structure

- `code.ts`: Main plugin entry point
- `ui.html`: UI container
- `src/`: Source code
  - `types/`: Type definitions
  - `utils/`: Utility functions
  - `modules/`: Core functionality modules
    - `scanner/`: Node traversal and style detection
    - `library/`: Library and variable handling
    - `matcher/`: Style to variable matching
    - `resolver/`: Applying fixes
    - `ui/`: React UI components

### Building and Testing

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the plugin: `npm run build`
4. Import the plugin into Figma to test

## License

This project is licensed under the MIT License - see the LICENSE file for details.

Below are the steps to get your plugin running. You can also find instructions at:

  https://www.figma.com/plugin-docs/plugin-quickstart-guide/

This plugin template uses Typescript and NPM, two standard tools in creating JavaScript applications.

First, download Node.js which comes with NPM. This will allow you to install TypeScript and other
libraries. You can find the download link here:

  https://nodejs.org/en/download/

Next, install TypeScript using the command:

  npm install -g typescript

Finally, in the directory of your plugin, get the latest type definitions for the plugin API by running:

  npm install --save-dev @figma/plugin-typings

If you are familiar with JavaScript, TypeScript will look very familiar. In fact, valid JavaScript code
is already valid Typescript code.

TypeScript adds type annotations to variables. This allows code editors such as Visual Studio Code
to provide information about the Figma API while you are writing code, as well as help catch bugs
you previously didn't notice.

For more information, visit https://www.typescriptlang.org/

Using TypeScript requires a compiler to convert TypeScript (code.ts) into JavaScript (code.js)
for the browser to run.

We recommend writing TypeScript code using Visual Studio code:

1. Download Visual Studio Code if you haven't already: https://code.visualstudio.com/.
2. Open this directory in Visual Studio Code.
3. Compile TypeScript to JavaScript: Run the "Terminal > Run Build Task..." menu item,
    then select "npm: watch". You will have to do this again every time
    you reopen Visual Studio Code.

That's it! Visual Studio Code will regenerate the JavaScript file every time you save.
