import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AgentRegistrationRequest, LocationUpdateRequest, AssignOrderRequest, AgentRatingRequest, AgentResponse, AgentDistanceResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class DeliveryApiService {
  private readonly baseUrl = environment.apiUrls.delivery;
  constructor(private http: HttpClient) {}

  registerAgent(request: AgentRegistrationRequest): Observable<AgentResponse> { return this.http.post<AgentResponse>(`${this.baseUrl}/register`, request); }
  getAgent(id: number): Observable<AgentResponse> { return this.http.get<AgentResponse>(`${this.baseUrl}/${id}`); }
  getAllAgents(): Observable<AgentResponse[]> { return this.http.get<AgentResponse[]>(`${this.baseUrl}/all`); }
  getNearby(lat: number, lng: number, radius: number = 5): Observable<AgentDistanceResponse[]> { return this.http.get<AgentDistanceResponse[]>(`${this.baseUrl}/nearby?latitude=${lat}&longitude=${lng}&radiusInKm=${radius}`); }
  updateLocation(id: number, request: LocationUpdateRequest): Observable<AgentResponse> { return this.http.put<AgentResponse>(`${this.baseUrl}/${id}/location`, request); }
  setAvailability(id: number, isAvailable: boolean): Observable<AgentResponse> { return this.http.put<AgentResponse>(`${this.baseUrl}/${id}/availability?isAvailable=${isAvailable}`, {}); }
  verifyAgent(id: number): Observable<AgentResponse> { return this.http.put<AgentResponse>(`${this.baseUrl}/${id}/verify`, {}); }
  updateRating(id: number, request: AgentRatingRequest): Observable<AgentResponse> { return this.http.put<AgentResponse>(`${this.baseUrl}/${id}/rating`, request); }
  assignOrder(id: number, request: AssignOrderRequest): Observable<AgentResponse> { return this.http.post<AgentResponse>(`${this.baseUrl}/${id}/assignOrder`, request); }
  completeDelivery(id: number, request: AssignOrderRequest): Observable<AgentResponse> { return this.http.post<AgentResponse>(`${this.baseUrl}/${id}/completeDelivery`, request); }
  getActiveDeliveries(id: number): Observable<number[]> { return this.http.get<number[]>(`${this.baseUrl}/${id}/activeDeliveries`); }
}
