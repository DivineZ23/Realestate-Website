import { PropertyStatus, PropertyType } from '../models/property.models';

export const PROPERTY_STATUSES: readonly { value: PropertyStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'booked', label: 'Booked' },
  { value: 'owned', label: 'Occupied' },
];

export const PROPERTY_TYPE_OPTIONS: readonly {
  value: PropertyType;
  label: string;
  personCapacity: number;
  stateCost: number;
  storageCapacity: number;
}[] = [
  { value: 'motel', label: 'Motel', personCapacity: 1, stateCost: 500, storageCapacity: 1500 },
  {
    value: 'trevorsTrailer',
    label: "Trevor's Trailer",
    personCapacity: 2,
    stateCost: 1000,
    storageCapacity: 2250,
  },
  {
    value: 'janitorApartment',
    label: 'Janitor Apartment',
    personCapacity: 2,
    stateCost: 1500,
    storageCapacity: 3000,
  },
  {
    value: 'lowEndApartment',
    label: 'Low-End Apartment',
    personCapacity: 2,
    stateCost: 2000,
    storageCapacity: 3750,
  },
  {
    value: 'lestersHouse',
    label: "Lester's House",
    personCapacity: 3,
    stateCost: 3000,
    storageCapacity: 5250,
  },
  {
    value: 'franklinsHouse',
    label: "Franklin's House",
    personCapacity: 3,
    stateCost: 4000,
    storageCapacity: 6000,
  },
  {
    value: 'midEndApartment',
    label: 'Mid-End Apartment (House)',
    personCapacity: 4,
    stateCost: 4500,
    storageCapacity: 7500,
  },
  {
    value: 'trevorsBeachHouse',
    label: "Trevor's Beach House",
    personCapacity: 4,
    stateCost: 5000,
    storageCapacity: 9000,
  },
  {
    value: 'michaelsMansion',
    label: "Michael's Mansion",
    personCapacity: 4,
    stateCost: 8000,
    storageCapacity: 15000,
  },
  {
    value: 'franklinsMansion',
    label: "Franklin's Mansion",
    personCapacity: 4,
    stateCost: 8000,
    storageCapacity: 15000,
  },
  {
    value: 'highEndApartment',
    label: 'High-End Apartment',
    personCapacity: 5,
    stateCost: 8000,
    storageCapacity: 15000,
  },
];

export const PROPERTY_TYPES: readonly PropertyType[] = PROPERTY_TYPE_OPTIONS.map(
  (option) => option.value,
);

export function propertyTypeLabel(type: PropertyType): string {
  return (
    PROPERTY_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
    type.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (value) => value.toUpperCase())
  );
}

export function propertyTypeCapacity(type: PropertyType): number | null {
  return PROPERTY_TYPE_OPTIONS.find((option) => option.value === type)?.personCapacity ?? null;
}

export function isSupportedPropertyType(type: PropertyType): boolean {
  return PROPERTY_TYPES.includes(type);
}
