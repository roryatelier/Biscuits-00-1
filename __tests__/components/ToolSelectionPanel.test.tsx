// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ToolSelectionPanel from '@/components/ToolSelectionPanel/ToolSelectionPanel';
import { TOOLS } from '@/components/ToolSelectionPanel/tools';

describe('ToolSelectionPanel', () => {
  const onSelectTool = vi.fn();
  const onToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('collapsed state', () => {
    it('renders the header with correct label and tool count', () => {
      render(<ToolSelectionPanel onSelectTool={onSelectTool} />);

      expect(screen.getByText('Research and innovation tools')).toBeInTheDocument();
      expect(screen.getByText(String(TOOLS.length))).toBeInTheDocument();
    });

    it('does not expose tool cards when collapsed (body is not expanded)', () => {
      const { container } = render(<ToolSelectionPanel onSelectTool={onSelectTool} />);

      // The body element should exist but NOT have the bodyOpen class
      const body = container.querySelector('.body');
      expect(body).not.toBeNull();
      expect(body?.className).not.toContain('bodyOpen');
    });
  });

  describe('expanding and collapsing', () => {
    it('toggles open when header is clicked (uncontrolled)', () => {
      render(<ToolSelectionPanel onSelectTool={onSelectTool} />);

      const header = screen.getByRole('button', { expanded: false });
      fireEvent.click(header);

      // Should now show the expanded label
      expect(screen.getByText('Select a tool to accelerate your work')).toBeInTheDocument();
    });

    it('calls onToggle when controlled', () => {
      render(
        <ToolSelectionPanel
          isOpen={false}
          onToggle={onToggle}
          onSelectTool={onSelectTool}
        />
      );

      fireEvent.click(screen.getByText('Research and innovation tools'));
      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('opens via controlled isOpen prop', () => {
      render(
        <ToolSelectionPanel
          isOpen={true}
          onToggle={onToggle}
          onSelectTool={onSelectTool}
        />
      );

      expect(screen.getByText('Select a tool to accelerate your work')).toBeInTheDocument();
    });

    it('sets aria-expanded correctly', () => {
      const { rerender } = render(
        <ToolSelectionPanel isOpen={false} onToggle={onToggle} onSelectTool={onSelectTool} />
      );
      expect(screen.getByRole('button', { name: /research and innovation/i })).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <ToolSelectionPanel isOpen={true} onToggle={onToggle} onSelectTool={onSelectTool} />
      );
      expect(screen.getByRole('button', { name: /select a tool/i })).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('tool grid', () => {
    it('shows only 4 tools initially (collapsed count)', () => {
      render(
        <ToolSelectionPanel isOpen={true} onToggle={onToggle} onSelectTool={onSelectTool} />
      );

      const toolButtons = screen.getAllByRole('button', { name: /^Use / });
      expect(toolButtons).toHaveLength(4);
    });

    it('shows all tools after clicking "Show more"', () => {
      render(
        <ToolSelectionPanel isOpen={true} onToggle={onToggle} onSelectTool={onSelectTool} />
      );

      fireEvent.click(screen.getByText('Show more'));

      const toolButtons = screen.getAllByRole('button', { name: /^Use / });
      expect(toolButtons).toHaveLength(TOOLS.length);
    });

    it('collapses tools back when clicking "Show less"', () => {
      render(
        <ToolSelectionPanel isOpen={true} onToggle={onToggle} onSelectTool={onSelectTool} />
      );

      fireEvent.click(screen.getByText('Show more'));
      fireEvent.click(screen.getByText('Show less'));

      const toolButtons = screen.getAllByRole('button', { name: /^Use / });
      expect(toolButtons).toHaveLength(4);
    });

    it('calls onSelectTool when a tool card is clicked', () => {
      render(
        <ToolSelectionPanel isOpen={true} onToggle={onToggle} onSelectTool={onSelectTool} />
      );

      const firstTool = TOOLS[0];
      fireEvent.click(screen.getByRole('button', { name: new RegExp(firstTool.name) }));

      expect(onSelectTool).toHaveBeenCalledWith(firstTool);
    });

    it('highlights the selected tool card', () => {
      render(
        <ToolSelectionPanel
          isOpen={true}
          onToggle={onToggle}
          onSelectTool={onSelectTool}
          selectedToolId={TOOLS[0].id}
        />
      );

      const selectedCard = screen.getByRole('button', { name: new RegExp(TOOLS[0].name) });
      expect(selectedCard.className).toContain('cardSelected');
    });
  });

  describe('keyboard accessibility', () => {
    it('tool cards are focusable buttons', () => {
      render(
        <ToolSelectionPanel isOpen={true} onToggle={onToggle} onSelectTool={onSelectTool} />
      );

      const cards = screen.getAllByRole('button', { name: /^Use / });
      cards.forEach((card) => {
        expect(card.tagName).toBe('BUTTON');
      });
    });

    it('tool cards have descriptive aria-labels', () => {
      render(
        <ToolSelectionPanel isOpen={true} onToggle={onToggle} onSelectTool={onSelectTool} />
      );

      const firstTool = TOOLS[0];
      const card = screen.getByRole('button', {
        name: `Use ${firstTool.name}: ${firstTool.description}`,
      });
      expect(card).toBeInTheDocument();
    });
  });
});
