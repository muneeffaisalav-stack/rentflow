
'use server';
/**
 * @fileOverview AI flow to generate financial insights for property portfolios.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InsightInputSchema = z.object({
  totalProperties: z.number(),
  totalTenants: z.number(),
  collectedRent: z.number(),
  pendingRent: z.number(),
  overdueCount: z.number(),
});

const InsightOutputSchema = z.object({
  summary: z.string().describe('A brief summary of current financial health'),
  recommendations: z.array(z.string()).describe('List of actionable steps to improve cash flow'),
  riskLevel: z.enum(['Low', 'Medium', 'High']).describe('Calculated risk level of the portfolio'),
});

const prompt = ai.definePrompt({
  name: 'financialInsightPrompt',
  input: { schema: InsightInputSchema },
  output: { schema: InsightOutputSchema },
  prompt: `You are an expert financial consultant for real estate investors.
  Analyze the following portfolio data and provide strategic insights:
  
  Properties: {{totalProperties}}
  Tenants: {{totalTenants}}
  Collected Rent: ₹{{collectedRent}}
  Pending Rent: ₹{{pendingRent}}
  Overdue Invoices: {{overdueCount}}

  Calculate the collection efficiency. If overdue count is high, suggest specific debt recovery strategies.
  If efficiency is high, suggest reinvestment or maintenance improvements.`,
});

export async function generateFinancialInsights(input: z.infer<typeof InsightInputSchema>) {
  const { output } = await prompt(input);
  if (!output) throw new Error('Failed to generate insights');
  return output;
}
