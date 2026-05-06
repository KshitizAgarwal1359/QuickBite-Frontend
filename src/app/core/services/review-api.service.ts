import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateReviewRequest, UpdateReviewRequest, ReviewResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ReviewApiService {
  private readonly baseUrl = environment.apiUrls.review;
  constructor(private http: HttpClient) {}

  submitReview(request: CreateReviewRequest): Observable<ReviewResponse> { return this.http.post<ReviewResponse>(this.baseUrl, request); }
  getByRestaurant(restaurantId: number): Observable<ReviewResponse[]> { return this.http.get<ReviewResponse[]>(`${this.baseUrl}/restaurant/${restaurantId}`); }
  getByCustomer(customerId: number): Observable<ReviewResponse[]> { return this.http.get<ReviewResponse[]>(`${this.baseUrl}/customer/${customerId}`); }
  getByOrder(orderId: number): Observable<ReviewResponse> { return this.http.get<ReviewResponse>(`${this.baseUrl}/order/${orderId}`); }
  updateReview(reviewId: number, request: UpdateReviewRequest): Observable<ReviewResponse> { return this.http.put<ReviewResponse>(`${this.baseUrl}/${reviewId}`, request); }
  deleteReview(reviewId: number): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${reviewId}`); }
  getAvgFoodRating(restaurantId: number): Observable<number> { return this.http.get<number>(`${this.baseUrl}/avgFood/${restaurantId}`); }
  getAvgDeliveryRating(agentId: number): Observable<number> { return this.http.get<number>(`${this.baseUrl}/avgDelivery/${agentId}`); }
}
