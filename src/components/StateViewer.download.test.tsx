import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StateViewer from './StateViewer';

// Mocks
vi.mock('@/contexts/FileContext', () => ({
  useFileContext: () => ({
    showPvmLogs: true, 
  }),
}));

vi.mock('@/utils', () => ({
  getChainSpecType: vi.fn(() => 'tiny'),
  calculateStateDiff: () => ({}),
}));

vi.mock('./RawStateViewer', () => ({ default: () => <div>RawStateViewer</div> }));
vi.mock('./InspectStateViewer', () => ({ default: () => <div>InspectStateViewer</div> }));

describe('StateViewer Download', () => {
  const mockState = {};
  const mockPreState = {};
  const mockChangeView = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    global.URL.createObjectURL = vi.fn();
    global.URL.revokeObjectURL = vi.fn();
  });

  it('downloads log with correct filename derived from imported file', () => {
    const executionLog = ['log line'];
    const fileName = 'test-block.json';

    render(
      <StateViewer
        state={mockState}
        preState={mockPreState}
        tab="encoded"
        stateType="exec_diff"
        executionLog={executionLog}
        fileName={fileName}
        changeView={mockChangeView}
      />
    );

    // Open execution log dialog
    fireEvent.click(screen.getByText('Execution log'));

    // Find download button
    const downloadBtn = screen.getByText('Ecalli trace');
    
    // Spy on anchor click
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    // Spy on appendChild to check the element properties
    const appendSpy = vi.spyOn(document.body, 'appendChild');

    fireEvent.click(downloadBtn);

    // Verify download attribute
    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe('test-block.trace');
    
    expect(anchorClickSpy).toHaveBeenCalled();
  });

  it('downloads log with default filename when fileName is missing', () => {
    const executionLog = ['log line'];

    render(
      <StateViewer
        state={mockState}
        preState={mockPreState}
        tab="encoded"
        stateType="exec_diff"
        executionLog={executionLog}
        // fileName missing
        changeView={mockChangeView}
      />
    );

    fireEvent.click(screen.getByText('Execution log'));
    const downloadBtn = screen.getByText('Ecalli trace');
    
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    fireEvent.click(downloadBtn);

    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe('execution-log.trace');
  });
});
