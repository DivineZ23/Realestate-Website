export type PropertyStatus =
  'available' | 'booked' | 'auction' | 'paid' | 'overdue' | 'evictable' | 'onHold';
export type PropertyType =
  | 'motel'
  | 'trevorsTrailer'
  | 'janitorApartment'
  | 'lowEndApartment'
  | 'lestersHouse'
  | 'franklinsHouse'
  | 'midEndApartment'
  | 'trevorsBeachHouse'
  | 'michaelsMansion'
  | 'franklinsMansion'
  | 'highEndApartment'
  | 'apartment'
  | 'house'
  | 'villa'
  | 'office'
  | 'shop'
  | 'warehouse'
  | 'land'
  | 'other';

export interface Block {
  id: string;
  blockId: number;
  blockName: string;
  description?: string;
  address?: string;
  imageUrl?: string;
  numberOfProperties: number;
  totalCost: number;
  totalRent: number;
  totalProfit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  propertyId: number;
  blockId: string;
  blockName: string;
  propertyName: string;
  description?: string;
  type: PropertyType;
  personCapacity?: number;
  stateCost?: number;
  storageCapacity?: number;
  storage?: string;
  rent: number;
  securityDeposit?: number;
  status: PropertyStatus;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  area?: number;
  furnishingStatus?: string;
  amenities: string[];
  images: string[];
  currentTenantId?: string;
  tenantName?: string;
  tenantCid?: number;
  tenantPhoneNumber?: string;
  rentPaidThrough?: string;
  bookedByEnquiryId?: string;
  bookingCount: number;
  unavailableReason?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PublicProperty = Omit<
  Property,
  | 'currentTenantId'
  | 'tenantName'
  | 'tenantCid'
  | 'tenantPhoneNumber'
  | 'rentPaidThrough'
  | 'bookedByEnquiryId'
  | 'bookingCount'
  | 'unavailableReason'
  | 'isActive'
  | 'updatedAt'
>;

export interface PropertyQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  blockId?: string;
  type?: PropertyType | '';
  status?: PropertyStatus | '';
  minRent?: number | null;
  maxRent?: number | null;
  bedrooms?: number | null;
  personCapacity?: number | null;
  storageCapacity?: number | null;
  furnishing?: string;
  amenities?: string[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface UpsertPropertyRequest {
  propertyId: number;
  blockId: string;
  propertyName: string;
  description?: string | null;
  type: PropertyType;
  storage?: string | null;
  rent: number;
  securityDeposit?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor?: number | null;
  area?: number | null;
  furnishingStatus?: string | null;
  amenities: string[];
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
}

export interface UpsertBlockRequest {
  blockId: number;
  blockName: string;
  description?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface AssignTenantRequest {
  cid: number;
  fullName: string;
  phoneNumber: string;
  discordId: string;
  startDate: string;
  expectedEndDate?: string;
  monthlyRent: number;
  securityDeposit: number;
  emergencyContact?: string;
  notes?: string;
}

export interface EvictTenantRequest {
  reason: string;
  storageImageUrls: string[];
}

export interface PropertyBooking {
  id: string;
  propertyId: string;
  cid: number;
  fullName: string;
  phoneNumber: string;
  discordId: string;
  monthlyRent: number;
  bookingAmount: number;
  notes?: string;
  status: 'active' | 'cancelled' | 'converted';
  createdByUserId?: string;
  createdByDisplayName?: string;
  createdAt: string;
}

export interface PropertyBookingGroup {
  propertyId: string;
  propertyNumber: number;
  propertyName: string;
  blockName: string;
  type: PropertyType;
  status: PropertyStatus;
  bookings: PropertyBooking[];
}

export interface CreatePropertyBookingRequest {
  cid: number;
  fullName: string;
  phoneNumber: string;
  discordId: string;
  monthlyRent: number;
  bookingAmount: number;
  notes?: string;
}
