import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { PagedResult } from '../models/api.models';
import {
  AssignTenantRequest,
  EvictTenantRequest,
  Property,
  PropertyQuery,
  PropertyStatus,
  PublicProperty,
  UpsertPropertyRequest,
} from '../models/property.models';
import { StatusHistory } from '../models/management.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private readonly api = inject(ApiService);
  available(query: PropertyQuery): Observable<PagedResult<PublicProperty>> {
    return this.api.get(API_ENDPOINTS.properties.available, query);
  }
  featured(): Observable<PublicProperty[]> {
    return this.api.get(API_ENDPOINTS.properties.featured);
  }
  publicDetails(id: string): Observable<PublicProperty> {
    return this.api.get(`${API_ENDPOINTS.properties.root}/${id}`);
  }
  all(query: PropertyQuery): Observable<PagedResult<Property>> {
    return this.api.get(API_ENDPOINTS.properties.root, query);
  }
  details(id: string): Observable<Property> {
    return this.api.get(`${API_ENDPOINTS.properties.root}/${id}/manage`);
  }
  create(body: UpsertPropertyRequest): Observable<Property> {
    return this.api.post(API_ENDPOINTS.properties.root, body);
  }
  update(id: string, body: UpsertPropertyRequest): Observable<Property> {
    return this.api.put(`${API_ENDPOINTS.properties.root}/${id}`, body);
  }
  changeStatus(
    id: string,
    status: PropertyStatus,
    reason?: string,
    enquiryId?: string,
  ): Observable<Property> {
    return this.api.patch(`${API_ENDPOINTS.properties.root}/${id}/status`, {
      status,
      reason,
      enquiryId,
    });
  }
  assignTenant(id: string, body: AssignTenantRequest): Observable<Property> {
    return this.api.post(`${API_ENDPOINTS.properties.root}/${id}/assign-tenant`, body);
  }
  evict(id: string, request: EvictTenantRequest): Observable<Property> {
    return this.api.post(`${API_ENDPOINTS.properties.root}/${id}/evict`, request);
  }
  history(id: string): Observable<StatusHistory[]> {
    return this.api.get(`${API_ENDPOINTS.properties.root}/${id}/history`);
  }
  delete(id: string): Observable<void> {
    return this.api.delete(`${API_ENDPOINTS.properties.root}/${id}`);
  }
}
