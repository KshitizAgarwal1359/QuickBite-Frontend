import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegisterRestaurantRequest, UpdateRestaurantRequest, RestaurantResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class RestaurantApiService {
  private readonly baseUrl = environment.apiUrls.restaurant;
  constructor(private http: HttpClient) {}

  register(request: RegisterRestaurantRequest): Observable<RestaurantResponse> { return this.http.post<RestaurantResponse>(this.baseUrl, request); }
  getById(id: number): Observable<RestaurantResponse> { return this.http.get<RestaurantResponse>(`${this.baseUrl}/${id}`); }
  getAll(): Observable<RestaurantResponse[]> { return this.http.get<RestaurantResponse[]>(`${this.baseUrl}/all`); }
  getByOwner(ownerId: number): Observable<RestaurantResponse[]> { return this.http.get<RestaurantResponse[]>(`${this.baseUrl}/owner/${ownerId}`); }
  getByCuisine(type: string): Observable<RestaurantResponse[]> { return this.http.get<RestaurantResponse[]>(`${this.baseUrl}/cuisine/${type}`); }
  getByCity(city: string): Observable<RestaurantResponse[]> { return this.http.get<RestaurantResponse[]>(`${this.baseUrl}/city/${city}`); }
  getNearby(lat: number, lng: number, radius: number = 5): Observable<RestaurantResponse[]> { return this.http.get<RestaurantResponse[]>(`${this.baseUrl}/nearby?latitude=${lat}&longitude=${lng}&radiusInKm=${radius}`); }
  search(keyword: string): Observable<RestaurantResponse[]> { return this.http.get<RestaurantResponse[]>(`${this.baseUrl}/search?keyword=${encodeURIComponent(keyword)}`); }
  update(id: number, request: UpdateRestaurantRequest): Observable<RestaurantResponse> { return this.http.put<RestaurantResponse>(`${this.baseUrl}/${id}`, request); }
  approve(id: number): Observable<RestaurantResponse> { return this.http.put<RestaurantResponse>(`${this.baseUrl}/${id}/approve`, {}); }
  toggleOpen(id: number): Observable<RestaurantResponse> { return this.http.put<RestaurantResponse>(`${this.baseUrl}/${id}/toggleOpen`, {}); }
  delete(id: number): Observable<any> { return this.http.delete(`${this.baseUrl}/${id}`); }
}
