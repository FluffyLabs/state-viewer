import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Popover } from './Popover';

describe('Popover', () => {
  const mockTrigger = <button>Trigger</button>;
  const mockContent = <div>Popover content</div>;

  it('should render trigger element', () => {
    render(<Popover trigger={mockTrigger} content={mockContent} />);
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
  });

  it('should not show content initially', () => {
    render(<Popover trigger={mockTrigger} content={mockContent} />);
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('should show content on hover by default', async () => {
    render(<Popover trigger={mockTrigger} content={mockContent} />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.mouseEnter(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });
  });

  it('should hide content on mouse leave when trigger is hover', async () => {
    render(<Popover trigger={mockTrigger} content={mockContent} />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    
    // Show popover
    fireEvent.mouseEnter(trigger);
    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });
    
    // Hide popover
    fireEvent.mouseLeave(trigger);
    await waitFor(() => {
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    });
  });

  it('should show content on click when triggerOn is click', async () => {
    render(<Popover trigger={mockTrigger} content={mockContent} triggerOn="click" />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });
  });

  it('should toggle content on multiple clicks when triggerOn is click', async () => {
    render(<Popover trigger={mockTrigger} content={mockContent} triggerOn="click" />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    
    // First click - show
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });
    
    // Second click - hide
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    });
  });

  it('should not respond to hover when triggerOn is click', async () => {
    render(<Popover trigger={mockTrigger} content={mockContent} triggerOn="click" />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.mouseEnter(trigger);
    
    // Wait a bit to ensure no content appears
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('should close popover when clicking outside', async () => {
    render(
      <div>
        <Popover trigger={mockTrigger} content={mockContent} triggerOn="click" />
        <button>Outside button</button>
      </div>
    );
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const outsideButton = screen.getByRole('button', { name: 'Outside button' });
    
    // Show popover
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });
    
    // Click outside
    fireEvent.mouseDown(outsideButton);
    await waitFor(() => {
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    });
  });

  it('should apply top position classes by default', async () => {
    render(<Popover trigger={mockTrigger} content={mockContent} />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.mouseEnter(trigger);
    
    await waitFor(() => {
      const popover = screen.getByRole('tooltip');
      expect(popover).toHaveClass('bottom-full', 'left-1/2', 'transform', '-translate-x-1/2', 'mb-2');
    });
  });

  it('should apply bottom position classes when position is bottom', async () => {
    render(<Popover trigger={mockTrigger} content={mockContent} position="bottom" />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.mouseEnter(trigger);
    
    await waitFor(() => {
      const popover = screen.getByRole('tooltip');
      expect(popover).toHaveClass('top-full', 'left-1/2', 'transform', '-translate-x-1/2', 'mt-2');
    });
  });

  it('should apply left position classes when position is left', async () => {
    render(<Popover trigger={mockTrigger} content={mockContent} position="left" />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.mouseEnter(trigger);
    
    await waitFor(() => {
      const popover = screen.getByRole('tooltip');
      expect(popover).toHaveClass('right-full', 'top-1/2', 'transform', '-translate-y-1/2', 'mr-2');
    });
  });

  it('should apply right position classes when position is right', async () => {
    render(<Popover trigger={mockTrigger} content={mockContent} position="right" />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.mouseEnter(trigger);
    
    await waitFor(() => {
      const popover = screen.getByRole('tooltip');
      expect(popover).toHaveClass('left-full', 'top-1/2', 'transform', '-translate-y-1/2', 'ml-2');
    });
  });

  it('should apply custom className', async () => {
    const customClass = 'custom-popover-class';
    render(<Popover trigger={mockTrigger} content={mockContent} className={customClass} />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.mouseEnter(trigger);
    
    await waitFor(() => {
      const popover = screen.getByRole('tooltip');
      expect(popover).toHaveClass(customClass);
    });
  });

  it('should have proper aria attributes', async () => {
    render(<Popover trigger={mockTrigger} content={mockContent} />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.mouseEnter(trigger);
    
    await waitFor(() => {
      const popover = screen.getByRole('tooltip');
      expect(popover).toHaveAttribute('role', 'tooltip');
      expect(popover).toHaveAttribute('aria-hidden', 'false');
    });
  });

  it('should render complex content correctly', async () => {
    const complexContent = (
      <div>
        <h3>Title</h3>
        <p>Description</p>
        <button>Action</button>
      </div>
    );
    
    render(<Popover trigger={mockTrigger} content={complexContent} />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.mouseEnter(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  it('should have cursor-pointer class on trigger wrapper', () => {
    render(<Popover trigger={mockTrigger} content={mockContent} />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const triggerWrapper = trigger.parentElement;
    
    expect(triggerWrapper).toHaveClass('cursor-pointer');
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(
      <Popover trigger={mockTrigger} content={mockContent} triggerOn="click" />
    );
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });

  it('should render with relative positioning wrapper', () => {
    render(<Popover trigger={mockTrigger} content={mockContent} />);
    
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const wrapper = trigger.closest('.relative');
    
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('relative', 'inline-block');
  });
});