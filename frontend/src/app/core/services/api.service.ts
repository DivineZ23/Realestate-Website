import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<T>(url: string, query?: object): Observable<T> {
    return this.http.get<T>(this.url(url), { params: this.params(query) });
  }
  post<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
    return this.http.post<TResponse>(this.url(url), body);
  }
  put<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
    return this.http.put<TResponse>(this.url(url), body);
  }
  patch<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
    return this.http.patch<TResponse>(this.url(url), body);
  }
  delete<T>(url: string, body?: unknown): Observable<T> {
    return this.http.delete<T>(this.url(url), body === undefined ? {} : { body });
  }
  upload<T>(url: string, file: File): Observable<HttpEvent<T>> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<T>(this.url(url), body, { observe: 'events', reportProgress: true });
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }
  private params(query?: object): HttpParams {
    let params = new HttpParams();
    if (!query) return params;
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === '') continue;
      if (Array.isArray(value))
        value.forEach((item) => {
          params = params.append(key, item);
        });
      else params = params.set(key, String(value));
    }
    return params;
  }
}
