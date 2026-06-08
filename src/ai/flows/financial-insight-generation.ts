'use server';
/**
 * @fileOverview A Genkit flow for generating financial insights for landlords.
 *
 * - generateFinancialInsights - A function that generates natural language summaries and actionable insights from financial reports.
 * - GenerateFinancialInsightsInput - The input type for the generateFinancialInsights function.
 * - GenerateFinancialInsightsOutput - The return type for the generateFinancialInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MonthlyCollectionSchema = z.object({
  month: z.string().describe('Month in YYYY-MM format.'),
  collectedAmount: z.number().describe('Total rent collected for the month.'),
  pendingAmount: z.number().describe('Total rent pending for the month.'),
});

const OverduePaymentPatternSchema = z.object({
  tenantName: z.string().describe('Name of the tenant.'),
  overdueAmount: z.number().describe('Amount currently overdue.'),
  daysOverdue: z.number().describe('Number of days the payment is overdue.'),
  propertyName: z.string().describe('Name of the property associated with the tenant.'),
});

const GenerateFinancialInsightsInputSchema = z.object({
  totalProperties: z.number().describe('Total number of properties managed.'),
  totalTenants: z.number().describe('Total number of tenants.'),
  totalPendingRent: z.number().describe('Total pending rent across all tenants.'),
  totalCollectedRent: z.number().describe('Total collected rent over a specified period.'),
  monthlyCollections: z.array(MonthlyCollectionSchema).describe('Monthly collection trends.'),
  overduePaymentPatterns: z.array(OverduePaymentPatternSchema).describe('Detailed overdue payment patterns.'),
});
export type GenerateFinancialInsightsInput = z.infer<typeof GenerateFinancialInsightsInputSchema>;

const GenerateFinancialInsightsOutputSchema = z.object({
  summary: z.string().describe('A natural language summary of the overall financial performance.'),
  actionableInsights: z.array(z.string()).describe('A list of specific, actionable recommendations to improve financial performance.'),
});
export type GenerateFinancialInsightsOutput = z.infer<typeof GenerateFinancialInsightsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateFinancialInsightsPrompt',
  input: {schema: GenerateFinancialInsightsInputSchema},
  output: {schema: GenerateFinancialInsightsOutputSchema},
  prompt: `You are an expert financial analyst providing insights to landlords.
Your task is to analyze the provided financial data and generate a concise natural language summary of the landlord's overall portfolio performance, followed by specific, actionable recommendations to improve rent collection and financial health.

Focus on identifying trends, potential risks, and opportunities for improvement.

Financial Data:
Total Properties: {{{totalProperties}}}
Total Tenants: {{{totalTenants}}}
Total Pending Rent: {{{totalPendingRent}}}
Total Collected Rent: {{{totalCollectedRent}}}

Monthly Collections:
{{#each monthlyCollections}}
- Month: {{{month}}}, Collected: {{{collectedAmount}}}, Pending: {{{pendingAmount}}}
{{/each}}

Overdue Payment Patterns:
{{#each overduePaymentPatterns}}
- Tenant: {{{tenantName}}}, Property: {{{propertyName}}}, Overdue Amount: {{{overdueAmount}}}, Days Overdue: {{{daysOverdue}}}
{{/each}}

Based on this data, provide:
1.  A natural language summary of the financial performance.
2.  A list of actionable insights/recommendations.
`
});

const generateFinancialInsightsFlow = ai.defineFlow(
  {
    name: 'generateFinancialInsightsFlow',
    inputSchema: GenerateFinancialInsightsInputSchema,
    outputSchema: GenerateFinancialInsightsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function generateFinancialInsights(
  input: GenerateFinancialInsightsInput
): Promise<GenerateFinancialInsightsOutput> {
  return generateFinancialInsightsFlow(input);
}
