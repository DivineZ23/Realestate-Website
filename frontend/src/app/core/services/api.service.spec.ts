import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('serializes scalar and repeated query parameters', () => {
    service
      .get('/properties', { page: 2, amenities: ['Parking', 'Security'], empty: null })
      .subscribe();
    const request = http.expectOne((req) => req.url.endsWith('/properties'));
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.getAll('amenities')).toEqual(['Parking', 'Security']);
    expect(request.request.params.has('empty')).toBe(false);
    request.flush({});
  });
});
