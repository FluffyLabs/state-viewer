import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import App from './App';

// Mock the shared UI components to avoid complex dependencies in tests
vi.mock('@fluffylabs/shared-ui', () => ({
  Header: ({ toolNameSrc, ghRepoName }: { toolNameSrc: string; ghRepoName: string }) => (
    <div data-testid="header" data-tool-name={toolNameSrc} data-repo={ghRepoName}>
      Mocked Header
    </div>
  ),
  AppsSidebar: ({ activeLink, className, enableDarkModeToggle }: { 
    activeLink: string; 
    className: string; 
    enableDarkModeToggle: boolean 
  }) => (
    <div 
      data-testid="apps-sidebar" 
      data-active-link={activeLink} 
      className={className}
      data-dark-mode-toggle={enableDarkModeToggle}
    >
      Mocked AppsSidebar
    </div>
  ),
  cn: (...args: (string | undefined | null | boolean)[]) => args.filter(Boolean).join(' '),
}));

// Mock the tool name SVG
vi.mock('@/assets/tool-name.svg', () => ({
  default: 'mocked-tool-name.svg'
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('App', () => {
  const renderApp = (initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    );
  };

  it('renders without crashing', () => {
    const { container } = renderApp();
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the main layout structure correctly', () => {
    renderApp();
    
    // Check for main container with correct height - it's the root container
    const mainContainer = screen.getByTestId('header').parentElement?.parentElement;
    expect(mainContainer).toHaveClass('flex', 'flex-col', 'overflow-hidden', 'h-[100dvh]');
  });

  it('renders the Header component with correct props', () => {
    renderApp();
    
    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('data-tool-name', 'mocked-tool-name.svg');
    expect(header).toHaveAttribute('data-repo', 'state-view');
  });

  it('renders the AppsSidebar component with correct props', () => {
    renderApp();
    
    const sidebar = screen.getByTestId('apps-sidebar');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveAttribute('data-active-link', 'trie');
    expect(sidebar).toHaveAttribute('data-dark-mode-toggle', 'true');
    expect(sidebar).toHaveClass('h-full');
  });

  it('renders the UploadScreen component on the main route', () => {
    renderApp();
    
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();
    expect(mainHeading).toHaveTextContent('State View JSON Analyzer');
    
    const description = screen.getByText('Upload a JSON file to analyze its structure and content, or create one manually.');
    expect(description).toBeInTheDocument();
  });

  it('has correct header height', () => {
    renderApp();
    
    const headerContainer = screen.getByTestId('header').parentElement;
    expect(headerContainer).toHaveClass('h-[87px]');
  });

  it('has responsive sidebar that hides on mobile', () => {
    renderApp();
    
    const sidebarContainer = screen.getByTestId('apps-sidebar').parentElement;
    expect(sidebarContainer).toHaveClass('max-sm:hidden');
  });

  it('has correct main content area styling', () => {
    renderApp();
    
    const contentArea = screen.getByText('State View JSON Analyzer').closest('div')?.parentElement?.parentElement?.parentElement;
    expect(contentArea).toHaveClass('w-full', 'bg-background', 'h-[calc(100dvh-87px)]');
    
    const innerContent = screen.getByText('State View JSON Analyzer').closest('div')?.parentElement?.parentElement;
    expect(innerContent).toHaveClass('p-4', 'h-full', 'overflow-y-auto');
  });

  it('renders navigation routes correctly', () => {
    renderApp(['/']);
    
    // Should render UploadScreen component on root route
    expect(screen.getByText('Drag & drop your JSON file here')).toBeInTheDocument();
    expect(screen.getByText('Manual JSON Editor')).toBeInTheDocument();
  });
});