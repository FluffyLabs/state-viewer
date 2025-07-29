# State View

A web application for inspecting JAM state data. Upload serialized state dumps in JSON format to view and analyze their contents.

## What it does

State View allows you to:

- Upload JSON files containing blockchain state data
- View state data in a structured, readable format
- Switch between different views (pre-state, post-state, diff) for test vectors
- Edit JSON content manually with syntax highlighting
- Inspect state merkleization and structure

## Supported formats

- STF (State Transition Function) test vectors
- STF genesis states
- JIP-4 Chain Spec files
- Typeberry configuration files

## Development

### Requirements

- Node.js (latest LTS version)
- npm

### Setup

```bash
npm install
```

### Running locally

```bash
npm run dev
```

The application runs at `http://localhost:5173`

### Testing

```bash
npm run test          # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Building

```bash
npm run build
```

### Code quality

```bash
npm run lint
```

## Project structure

```
src/
├── components/      # React components
├── utils/           # Utility functions for state parsing
├── types/           # TypeScript type definitions
├── constants/       # Application constants
└── assets/          # Static assets
```

## License

Mozilla Public License, v. 2.0
