import { readSession } from './session';
import type { AdminUser } from './types';

export async function getAdmin(): Promise<AdminUser | null> {
  return readSession();
}
