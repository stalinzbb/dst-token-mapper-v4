# Technical Architecture

## High-Level Architecture

- Plugin Controller: Manages core logic and API interactions
- Scanner: Traverses Figma document structure
- Matcher: Identifies potential variable replacements
- Resolver: Handles library conflicts
- UI: Presents results and captures user input

## Data Flow

### Initialization

- Load connected libraries
- Check for selection/active page
- Count nodes for performance check


### Scanning Flow

- Check node count (abort if excessive)
- Traverse node hierarchy
- Extract detached styles by category


### Matching Flow

For each detached style:

- Find matching variables in libraries
- Record library source for each match
- Flag conflicts between libraries
- Rank suggestions by exactness


### Application Flow

- User selects suggested matches
- Plugin applies variables to nodes
- Confirmation of successful changes


## Technical Details

### Libraries Required

- Figma Plugin API: Core interaction with Figma
- React: UI components
- tinycolor2: Color normalization
- lodash: Utility functions

### Key Functions

#### Scanner Module

- countNodes(): Performance threshold check
- traverseNodesInScope(): Recursive node traversal
- extractDetachedStyles(): Find direct style values

#### Library Module

- getConnectedLibraries(): Find available libraries
- extractVariables(): Get variables by category
- detectConflicts(): Find duplicate values across libraries

#### Matcher Module

- normalizeHexColor(): Format standardization
- findExactMatches(): Match colors to variables
- prepareMatches(): Format for presentation

#### UI Module

- renderResults(): Display findings
- handleConflicts(): Show library conflicts
- applyChanges(): Process user selections

### Error Handling

- Node Limit: "Too many nodes (X found, 1000 max). Please select a smaller section."
- Library Conflicts: "Same value found in multiple libraries: [Library A] and [Library B]"
- No Libraries: "No connected libraries found. Please connect a library with variables."