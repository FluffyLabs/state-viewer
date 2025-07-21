import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import UploadScreen from './UploadScreen';

const mockOnJsonUploaded = vi.fn();

describe('UploadScreen', () => {
  beforeEach(() => {
    mockOnJsonUploaded.mockClear();
  });

  it('renders upload screen with correct elements', () => {
    render(<UploadScreen onJsonUploaded={mockOnJsonUploaded} />);
    
    expect(screen.getByText('State View')).toBeInTheDocument();
    expect(screen.getByText('Upload File')).toBeInTheDocument();
    expect(screen.getByText('Paste JSON')).toBeInTheDocument();
    expect(screen.getByText('Browse Files')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste your JSON content here...')).toBeInTheDocument();
  });

  it('handles JSON paste correctly for state transition test format', async () => {
    const stateTransitionJson = JSON.stringify({
      pre_state: { accounts: {} },
      post_state: { accounts: {} },
      block: { number: 1 }
    });

    render(<UploadScreen onJsonUploaded={mockOnJsonUploaded} />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON content here...');
    const processButton = screen.getByText('Process JSON');

    fireEvent.change(textarea, { target: { value: stateTransitionJson } });
    fireEvent.click(processButton);

    await waitFor(() => {
      expect(mockOnJsonUploaded).toHaveBeenCalledWith(stateTransitionJson, 'state-transition-test');
    });
  });

  it('handles JSON paste correctly for JIP-4 chain spec format', async () => {
    const chainSpecJson = JSON.stringify({
      name: 'Test Chain',
      genesis: { timestamp: 0 },
      params: { blockTime: 6000 }
    });

    render(<UploadScreen onJsonUploaded={mockOnJsonUploaded} />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON content here...');
    const processButton = screen.getByText('Process JSON');

    fireEvent.change(textarea, { target: { value: chainSpecJson } });
    fireEvent.click(processButton);

    await waitFor(() => {
      expect(mockOnJsonUploaded).toHaveBeenCalledWith(chainSpecJson, 'jip4-chain-spec');
    });
  });

  it('shows error for unsupported JSON format', async () => {
    const unsupportedJson = JSON.stringify({ some: 'data', that: 'is not supported' });

    render(<UploadScreen onJsonUploaded={mockOnJsonUploaded} />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON content here...');
    const processButton = screen.getByText('Process JSON');

    fireEvent.change(textarea, { target: { value: unsupportedJson } });
    fireEvent.click(processButton);

    await waitFor(() => {
      expect(screen.getByText(/Unsupported JSON format/)).toBeInTheDocument();
    });
    
    expect(mockOnJsonUploaded).not.toHaveBeenCalled();
  });

  it('shows error for invalid JSON', async () => {
    const invalidJson = '{ invalid json }';

    render(<UploadScreen onJsonUploaded={mockOnJsonUploaded} />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON content here...');
    const processButton = screen.getByText('Process JSON');

    fireEvent.change(textarea, { target: { value: invalidJson } });
    fireEvent.click(processButton);

    await waitFor(() => {
      expect(screen.getByText(/Unsupported JSON format/)).toBeInTheDocument();
    });
    
    expect(mockOnJsonUploaded).not.toHaveBeenCalled();
  });



  it('disables process button when textarea is empty', () => {
    render(<UploadScreen onJsonUploaded={mockOnJsonUploaded} />);
    
    const processButton = screen.getByText('Process JSON');
    expect(processButton).toBeDisabled();
  });

  it('enables process button when textarea has content', () => {
    render(<UploadScreen onJsonUploaded={mockOnJsonUploaded} />);
    
    const textarea = screen.getByPlaceholderText('Paste your JSON content here...');
    const processButton = screen.getByText('Process JSON');

    expect(processButton).toBeDisabled();

    fireEvent.change(textarea, { target: { value: 'some content' } });
    expect(processButton).toBeEnabled();
  });
});