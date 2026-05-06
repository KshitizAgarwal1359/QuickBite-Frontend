import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlaceOrderRequest, UpdateStatusRequest, AssignAgentRequest, OrderResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private readonly baseUrl = environment.apiUrls.order;
  constructor(private http: HttpClient) {}

  placeOrder(request: PlaceOrderRequest): Observable<OrderResponse> { return this.http.post<OrderResponse>(this.baseUrl, request); }
  getOrder(id: number): Observable<OrderResponse> { return this.http.get<OrderResponse>(`${this.baseUrl}/${id}`); }
  getCustomerOrders(customerId: number): Observable<OrderResponse[]> { return this.http.get<OrderResponse[]>(`${this.baseUrl}/customer/${customerId}`); }
  getRestaurantOrders(restId: number): Observable<OrderResponse[]> { return this.http.get<OrderResponse[]>(`${this.baseUrl}/restaurant/${restId}`); }
  getActiveOrders(): Observable<OrderResponse[]> { return this.http.get<OrderResponse[]>(`${this.baseUrl}/active`); }
  updateStatus(id: number, request: UpdateStatusRequest): Observable<OrderResponse> { return this.http.put<OrderResponse>(`${this.baseUrl}/${id}/status`, request); }
  assignAgent(id: number, request: AssignAgentRequest): Observable<OrderResponse> { return this.http.put<OrderResponse>(`${this.baseUrl}/${id}/assignAgent`, request); }
  cancelOrder(id: number): Observable<OrderResponse> { return this.http.put<OrderResponse>(`${this.baseUrl}/${id}/cancel`, {}); }
  cancelOrderByOwner(id: number, restaurantId: number): Observable<OrderResponse> { return this.http.put<OrderResponse>(`${this.baseUrl}/${id}/cancel/owner?restaurantId=${restaurantId}`, {}); }
  reorder(id: number): Observable<PlaceOrderRequest> { return this.http.post<PlaceOrderRequest>(`${this.baseUrl}/${id}/reorder`, {}); }
  confirmReceipt(id: number): Observable<OrderResponse> { return this.http.put<OrderResponse>(`${this.baseUrl}/${id}/confirm-receipt`, {}); }
  getAgentOrders(agentId: number): Observable<OrderResponse[]> { return this.http.get<OrderResponse[]>(`${this.baseUrl}/agent/${agentId}`); }
  getOrderCount(restId: number): Observable<number> { return this.http.get<number>(`${this.baseUrl}/count/${restId}`); }
}
