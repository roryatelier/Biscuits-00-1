export interface Tool {
  id: string;
  name: string;
  description: string;
}

export const TOOLS: Tool[] = [
  {
    id: 'market-trend',
    name: 'Market trend analysis',
    description: 'Identify emerging market trends',
  },
  {
    id: 'whitespace',
    name: 'Whitespace opportunity finder',
    description: 'Identify unmet market opportunities',
  },
  {
    id: 'competitor-benchmarking',
    name: 'Competitor benchmarking',
    description: 'Benchmark product concepts against competitors',
  },
  {
    id: 'ingredient-research',
    name: 'Ingredient research',
    description: 'Surface ingredient performance and safety data',
  },
  {
    id: 'product-sentiment',
    name: 'Product sentiment',
    description: 'Translate real-world reviews into product insights',
  },
  {
    id: 'rrp-benchmarking',
    name: 'RRP benchmarking',
    description: 'Identify where pricing feels justified',
  },
  {
    id: 'synthetic-consumer',
    name: 'Synthetic consumer panel',
    description: 'Test concepts with synthetic consumers',
  },
  {
    id: 'generate-chart',
    name: 'Generate chart',
    description: 'Turn insights into charts and graphs',
  },
  {
    id: 'create-pdf',
    name: 'Create PDF',
    description: 'Export project data as a formatted PDF',
  },
];
