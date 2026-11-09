import type { Vehicle } from '../types';

/** "ab-12 cd" → "AB12CD". A Portuguese plate has six letters or digits. */
export const plateKey = (plate: string) => plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Pretend registration lookup: the same plate always gives the same van. */
export function lookUpPlate(key: string): Vehicle {
  const models = ['Ford Transit Custom', 'Renault Master', 'Peugeot Boxer', 'Citroën Jumpy', 'Mercedes-Benz Vito', 'Ford Transit'];
  const sum = [...key].reduce((n, c) => n + c.charCodeAt(0), 0);
  return { plate: `${key.slice(0, 2)}-${key.slice(2, 4)}-${key.slice(4, 6)}`, model: models[sum % models.length], year: 2019 + (sum % 6) };
}
