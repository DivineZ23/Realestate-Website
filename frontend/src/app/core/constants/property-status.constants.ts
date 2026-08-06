import { PropertyStatus, PropertyType } from '../models/property.models';

export const PROPERTY_STATUSES: readonly { value: PropertyStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'booked', label: 'Booked' },
  { value: 'owned', label: 'Occupied' },
];

export const PROPERTY_TYPES: readonly PropertyType[] = [
  'apartment',
  'house',
  'villa',
  'office',
  'shop',
  'warehouse',
  'land',
  'other',
];
