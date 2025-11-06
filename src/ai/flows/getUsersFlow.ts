'use server';
/**
 * @fileOverview A flow to retrieve user data from Firestore.
 *
 * - getUsersFlow - A function that fetches users.
 * - GetUsersOutput - The return type for the getUsersFlow function.
 */

import { ai } from '@/ai/genkit';
import { getUsers } from '@/services/firestore';
import { z } from 'genkit';

export const GetUsersOutputSchema = z.array(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
}));
export type GetUsersOutput = z.infer<typeof GetUsersOutputSchema>;

export async function getUsersFlow(): Promise<GetUsersOutput> {
  return getUsersFlowFunc();
}

const getUsersFlowFunc = ai.defineFlow(
  {
    name: 'getUsersFlow',
    outputSchema: GetUsersOutputSchema,
  },
  async () => {
    return await getUsers();
  }
);
