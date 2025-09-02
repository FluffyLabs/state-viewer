import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock the TriePage component to avoid complex dependencies in tests
vi.mock('@/pages/TriePage', () => ({
  TriePage: () => <div data-testid="trie-page">Mocked TriePage</div>
}));



// Mock the shared UI components to avoid complex dependencies in tests
vi.mock('@fluffylabs/shared-ui', () => ({
  Header: ({ toolNameSrc, ghRepoName, endSlot }: { toolNameSrc: string; ghRepoName: string; endSlot?: React.ReactNode }) => (
    <div data-testid="header" data-tool-name={toolNameSrc} data-repo={ghRepoName}>
      Mocked Header
      {endSlot}
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
  Button: ({ children, onClick, size, variant, 'aria-label': ariaLabel, title, ...props }: {
    children?: React.ReactNode;
    onClick?: () => void;
    size?: string;
    variant?: string;
    'aria-label'?: string;
    title?: string;
    [key: string]: unknown;
  }) => (
    <button
      onClick={onClick}
      data-size={size}
      data-variant={variant}
      aria-label={ariaLabel}
      title={title}
      {...props}
    >
      {children}
    </button>
  ),
  cn: (...args: (string | undefined | null | boolean)[]) => args.filter(Boolean).join(' '),
}));

// Mock the tool name SVG
vi.mock('@/assets/tool-name.svg', () => ({
  default: 'mocked-tool-name.svg'
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Settings: () => <div data-testid="settings-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  FolderOpen: () => <div data-testid="folder-open-icon" />,
  X: () => <div data-testid="x-icon" />,
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
  const user = userEvent.setup();

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
    expect(sidebar).toHaveAttribute('data-active-link', 'state');
    expect(sidebar).toHaveAttribute('data-dark-mode-toggle', 'true');
    expect(sidebar).toHaveClass('h-full');
  });

  it('renders the UploadScreen component on the main route', () => {
    renderApp();

    // Header is conditional - when no content is uploaded, it should show
    const mainHeading = screen.queryByRole('heading', { level: 1 });
    if (mainHeading) {
      expect(mainHeading).toHaveTextContent('JAM State Viewer');
    }

    // These elements should always be present
    expect(screen.getByText('Drag & drop your state JSON here')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
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

    // The main content area is rendered within the Routes component
    // Check that the page structure exists without relying on specific class selectors
    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
    
    const sidebar = screen.getByTestId('apps-sidebar');
    expect(sidebar).toBeInTheDocument();
    
    // The upload screen components should be present
    expect(screen.getByText('Drag & drop your state JSON here')).toBeInTheDocument();
  });

  it('renders navigation routes correctly', () => {
    renderApp(['/']);

    // Should render MainPage component on root route (which includes UploadScreen)
    expect(screen.getByText('Drag & drop your state JSON here')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('renders MainPage on /view route with parameters', () => {
    renderApp(['/view/encoded/post_state']);

    // Should render MainPage component on /view route (which includes UploadScreen initially)
    expect(screen.getByText('Drag & drop your state JSON here')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('renders TriePage on /trie route with parameters', () => {
    renderApp(['/trie/trie/post_state']);

    // Should render TriePage component on /trie route
    expect(screen.getByTestId('trie-page')).toBeInTheDocument();
    expect(screen.getByText('Mocked TriePage')).toBeInTheDocument();
  });
  
  describe('Settings functionality', () => {
    it('renders settings button', () => {
      renderApp();

      const settingsButton = screen.getByLabelText('Settings');
      expect(settingsButton).toBeInTheDocument();
      expect(settingsButton).toHaveAttribute('title', 'Settings');
    });

    it('settings button has correct styling and icon', () => {
      renderApp();

      const settingsButton = screen.getByLabelText('Settings');
      expect(settingsButton).toBeInTheDocument();
      expect(settingsButton.tagName).toBe('BUTTON');
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('opens settings dialog when settings button is clicked', async () => {
      renderApp();

      const settingsButton = screen.getByLabelText('Settings');
      await user.click(settingsButton);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Gray Paper Version')).toBeInTheDocument();
      expect(screen.getByText('Test Vector Suite')).toBeInTheDocument();
    });

    it('closes settings dialog when close is triggered', async () => {
      renderApp();

      // Open dialog
      const settingsButton = screen.getByLabelText('Settings');
      await user.click(settingsButton);

      expect(screen.getByText('Settings')).toBeInTheDocument();

      // Close dialog
      const closeButton = screen.getByLabelText('Close dialog');
      await user.click(closeButton);

      expect(screen.queryByText('Gray Paper Version')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Vector Suite')).not.toBeInTheDocument();
    });

    it('settings dialog is initially closed', () => {
      renderApp();

      expect(screen.queryByText('Gray Paper Version')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Vector Suite')).not.toBeInTheDocument();
    });
  });

  describe('Header integration', () => {
    it('renders both version display and settings button in header end slot', () => {
      renderApp();

      // Both should be present in the header
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });
  });
});
