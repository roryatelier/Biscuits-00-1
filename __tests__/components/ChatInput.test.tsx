// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ChatInput from '@/components/ChatInput/ChatInput';
import type { Tool } from '@/components/ToolSelectionPanel/tools';

const mockTool: Tool = {
  id: 'competitor-benchmarking',
  name: 'Competitor benchmarking',
  description: 'Benchmark product concepts against competitors',
};

describe('ChatInput', () => {
  const onSend = vi.fn();
  const onClearTool = vi.fn();
  const onSlashTyped = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic input', () => {
    it('renders with default placeholder', () => {
      render(<ChatInput />);
      expect(screen.getByPlaceholderText('Ask anything')).toBeInTheDocument();
    });

    it('shows suggestion chips when empty', () => {
      render(<ChatInput />);
      expect(screen.getByText('Identify a product opportunity')).toBeInTheDocument();
      expect(screen.getByText('Research an ingredient')).toBeInTheDocument();
    });

    it('hides suggestion chips when user types', () => {
      render(<ChatInput />);
      const textarea = screen.getByPlaceholderText('Ask anything');
      fireEvent.change(textarea, { target: { value: 'hello' } });
      expect(screen.queryByText('Identify a product opportunity')).not.toBeInTheDocument();
    });

    it('clicking a suggestion chip fills the input', () => {
      render(<ChatInput />);
      fireEvent.click(screen.getByText('Create a formulation'));
      const textarea = screen.getByPlaceholderText('Ask anything') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Create a formulation');
    });
  });

  describe('send button', () => {
    it('is a real button element', () => {
      render(<ChatInput />);
      const sendBtn = screen.getByRole('button', { name: 'Send message' });
      expect(sendBtn.tagName).toBe('BUTTON');
    });

    it('is disabled when input is empty and no tool selected', () => {
      render(<ChatInput onSend={onSend} />);
      const sendBtn = screen.getByRole('button', { name: 'Send message' });
      expect(sendBtn).toBeDisabled();
    });

    it('is enabled when input has text', () => {
      render(<ChatInput onSend={onSend} />);
      const textarea = screen.getByPlaceholderText('Ask anything');
      fireEvent.change(textarea, { target: { value: 'hello' } });
      const sendBtn = screen.getByRole('button', { name: 'Send message' });
      expect(sendBtn).not.toBeDisabled();
    });

    it('is enabled when a tool is selected even without text', () => {
      render(<ChatInput onSend={onSend} selectedTool={mockTool} />);
      const sendBtn = screen.getByRole('button', { name: 'Send message' });
      expect(sendBtn).not.toBeDisabled();
    });

    it('calls onSend with message and tool when clicked', () => {
      render(<ChatInput onSend={onSend} selectedTool={mockTool} />);
      const textarea = screen.getByPlaceholderText(/Benchmark vs top products/);
      fireEvent.change(textarea, { target: { value: 'test message' } });
      fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
      expect(onSend).toHaveBeenCalledWith('test message', mockTool);
    });

    it('clears input after sending', () => {
      render(<ChatInput onSend={onSend} />);
      const textarea = screen.getByPlaceholderText('Ask anything') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'hello' } });
      fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
      expect(textarea.value).toBe('');
    });

    it('sends on Enter key', () => {
      render(<ChatInput onSend={onSend} />);
      const textarea = screen.getByPlaceholderText('Ask anything');
      fireEvent.change(textarea, { target: { value: 'hello' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      expect(onSend).toHaveBeenCalledWith('hello', null);
    });

    it('does not send on Shift+Enter', () => {
      render(<ChatInput onSend={onSend} />);
      const textarea = screen.getByPlaceholderText('Ask anything');
      fireEvent.change(textarea, { target: { value: 'hello' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe('tool selection', () => {
    it('shows tool chip when a tool is selected', () => {
      render(<ChatInput selectedTool={mockTool} onClearTool={onClearTool} />);
      expect(screen.getByText('Competitor benchmarking')).toBeInTheDocument();
    });

    it('shows contextual placeholder when tool is selected', () => {
      render(<ChatInput selectedTool={mockTool} />);
      expect(
        screen.getByPlaceholderText('e.g., Benchmark vs top products in this category')
      ).toBeInTheDocument();
    });

    it('hides suggestion chips when tool is selected', () => {
      render(<ChatInput selectedTool={mockTool} />);
      expect(screen.queryByText('Identify a product opportunity')).not.toBeInTheDocument();
    });

    it('calls onClearTool when chip close button is clicked', () => {
      render(<ChatInput selectedTool={mockTool} onClearTool={onClearTool} />);
      fireEvent.click(screen.getByRole('button', { name: 'Remove tool' }));
      expect(onClearTool).toHaveBeenCalled();
    });

    it('close button has accessible label', () => {
      render(<ChatInput selectedTool={mockTool} onClearTool={onClearTool} />);
      expect(screen.getByRole('button', { name: 'Remove tool' })).toBeInTheDocument();
    });
  });

  describe('slash command trigger', () => {
    it('calls onSlashTyped when user types "/"', () => {
      render(<ChatInput onSlashTyped={onSlashTyped} />);
      const textarea = screen.getByPlaceholderText('Ask anything');
      fireEvent.change(textarea, { target: { value: '/' } });
      expect(onSlashTyped).toHaveBeenCalled();
    });

    it('does not call onSlashTyped for other input', () => {
      render(<ChatInput onSlashTyped={onSlashTyped} />);
      const textarea = screen.getByPlaceholderText('Ask anything');
      fireEvent.change(textarea, { target: { value: 'hello' } });
      expect(onSlashTyped).not.toHaveBeenCalled();
    });
  });

  describe('tool panel visibility', () => {
    it('hides suggestion chips when tool panel is open', () => {
      render(<ChatInput toolPanelOpen={true} />);
      expect(screen.queryByText('Identify a product opportunity')).not.toBeInTheDocument();
    });

    it('shows suggestion chips when tool panel is closed and no text', () => {
      render(<ChatInput toolPanelOpen={false} />);
      expect(screen.getByText('Identify a product opportunity')).toBeInTheDocument();
    });
  });

  describe('attachment button', () => {
    it('is a real button element', () => {
      render(<ChatInput />);
      const attachBtn = screen.getByRole('button', { name: 'Attach file' });
      expect(attachBtn.tagName).toBe('BUTTON');
    });
  });
});
