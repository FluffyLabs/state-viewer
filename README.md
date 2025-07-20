# State View

A React application built with Vite, using FluffyLabs shared UI components.

## Features

- **React 19** - Latest React version with modern features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **@fluffylabs/shared-ui** - Shared UI components library with Header and Sidebar
- **Vitest** - Fast unit testing framework
- **React Testing Library** - Testing utilities for React components
- **ESLint** - Code linting and formatting

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

Build for production:

```bash
npm run build
```

### Linting

Run ESLint:

```bash
npm run lint
```

### Testing

Run tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Preview

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── assets/          # Static assets (SVGs, images)
│   └── tool-name.svg
├── App.tsx          # Main application component
├── main.tsx         # Application entry point
├── index.css        # Global styles
└── vite-env.d.ts    # Vite type declarations
```

## Available Routes

- `/` - Home page with Hello World component

## Technologies Used

- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **@fluffylabs/shared-ui** - Shared components
- **Vitest** - Testing framework
- **React Testing Library** - Component testing
- **ESLint** - Code quality

## Shared UI Components

This project uses the `@fluffylabs/shared-ui` library which provides:

- Header component with FluffyLabs branding
- AppsSidebar component with navigation links
- Dark mode support
- Consistent styling across FluffyLabs applications

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This source code is licensed under the Mozilla Public License, v. 2.0. You can obtain a copy at https://mozilla.org/MPL/2.0/.