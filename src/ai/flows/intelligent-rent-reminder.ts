'use server';
/**
 * @fileOverview A Genkit flow for generating intelligent, personalized WhatsApp rent reminders.
 *
 * - intelligentRentReminder - A function that generates a personalized rent reminder.
 * - IntelligentRentReminderInput - The input type for the intelligentRentReminder function.
 * - IntelligentRentReminderOutput - The return type for the intelligentRentReminder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentRentReminderInputSchema = z.object({
  tenantName: z.string().describe('The name of the tenant.'),
  amount: z.number().describe('The rent amount due.'),
  dueDate: z.string().describe('The due date of the rent, e.g., "October 5th, 2024".'),
  paymentLink: z.string().url().describe('A UPI payment deep link for the tenant to pay.'),
  paymentHistory: z.array(
    z.object({
      month: z.string().describe('The month of the invoice, e.g., "2024-09".'),
      status: z.enum(['pending', 'paid', 'overdue']).describe('The payment status for that month.'),
    })
  ).describe('The tenant\'s past payment history.'),
  reminderType: z.enum(['due_soon', 'on_due_date', 'overdue']).describe('The type of reminder to generate.'),
});
export type IntelligentRentReminderInput = z.infer<typeof IntelligentRentReminderInputSchema>;

const IntelligentRentReminderOutputSchema = z.object({
  reminderMessage: z.string().describe('The personalized WhatsApp rent reminder message.'),
});
export type IntelligentRentReminderOutput = z.infer<typeof IntelligentRentReminderOutputSchema>;

export async function intelligentRentReminder(input: IntelligentRentReminderInput): Promise<IntelligentRentReminderOutput> {
  return intelligentRentReminderFlow(input);
}

const reminderPrompt = ai.definePrompt({
  name: 'intelligentRentReminderPrompt',
  input: {schema: IntelligentRentReminderInputSchema},
  output: {schema: IntelligentRentReminderOutputSchema},
  prompt: `You are an AI assistant that generates personalized WhatsApp rent reminders for landlords.
Your goal is to maintain a good relationship with tenants while effectively reminding them about rent payments.
Adjust the tone of the message based on the tenant's payment history and the type of reminder.

Tenant Name: {{{tenantName}}}
Rent Amount: ₹{{{amount}}}
Due Date: {{{dueDate}}}
Payment Link: {{{paymentLink}}}
Reminder Type: {{{reminderType}}}

Payment History:
{{#each paymentHistory}}
- Month: {{{this.month}}}, Status: {{{this.status}}}
{{/each}}

Instructions:
1. If the tenant has a perfect payment history ('paid' for all past months), use a friendly and appreciative tone.
2. If the tenant has occasional 'pending' statuses but always pays, use a polite and gentle tone.
3. If the tenant has 'overdue' statuses in their history, use a firm but still professional and clear tone.
4. Craft the message to be concise and suitable for WhatsApp.
5. Include the tenant's name, rent amount, due date, and the payment link.
6. Adapt the opening based on 'reminderType':
   - 'due_soon': "Just a friendly reminder..."
   - 'on_due_date': "This is a reminder that..."
   - 'overdue': "This is an urgent reminder that..."

Generate the personalized WhatsApp rent reminder message:`,
});

const intelligentRentReminderFlow = ai.defineFlow(
  {
    name: 'intelligentRentReminderFlow',
    inputSchema: IntelligentRentReminderInputSchema,
    outputSchema: IntelligentRentReminderOutputSchema,
  },
  async (input) => {
    const {output} = await reminderPrompt(input);
    return output!;
  }
);
