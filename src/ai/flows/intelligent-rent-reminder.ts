
'use server';
/**
 * @fileOverview AI flow to generate intelligent rent reminders.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReminderInputSchema = z.object({
  tenantName: z.string(),
  amount: z.number(),
  dueDate: z.number(),
  propertyName: z.string(),
  status: z.enum(['pending', 'overdue']),
});

const ReminderOutputSchema = z.object({
  subject: z.string().describe('Email/Message subject line'),
  message: z.string().describe('The generated reminder message'),
});

const prompt = ai.definePrompt({
  name: 'generateReminderPrompt',
  input: { schema: ReminderInputSchema },
  output: { schema: ReminderOutputSchema },
  prompt: `You are a professional property manager for RentFlow.
  Generate a polite yet clear rent reminder for a tenant.
  
  Tenant Details:
  Name: {{tenantName}}
  Property: {{propertyName}}
  Rent Amount: ₹{{amount}}
  Due Date: Day {{dueDate}} of the month
  Current Status: {{status}}

  If the status is 'overdue', be slightly more firm but still professional.
  Mention that payment can be made via UPI.
  Keep it concise and suitable for WhatsApp or Email.`,
});

export async function generateRentReminder(input: z.infer<typeof ReminderInputSchema>) {
  const { output } = await prompt(input);
  if (!output) throw new Error('Failed to generate reminder');
  return output;
}
