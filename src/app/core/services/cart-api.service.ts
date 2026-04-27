import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddItemRequest, UpdateQuantityRequest, ApplyPromoRequest, CartResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly baseUrl = environment.apiUrls.cart;
  public cartCount$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  private updateCount(c: CartResponse) {
    const count = c?.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
    this.cartCount$.next(count);
  }

  getCart(customerId: number): Observable<CartResponse> { return this.http.get<CartResponse>(`${this.baseUrl}/${customerId}`).pipe(tap(c => this.updateCount(c))); }
  addItem(request: AddItemRequest): Observable<CartResponse> { return this.http.post<CartResponse>(`${this.baseUrl}/addItem`, request).pipe(tap(c => this.updateCount(c))); }
  removeItem(cartId: number, itemId: number): Observable<CartResponse> { return this.http.delete<CartResponse>(`${this.baseUrl}/removeItem/${cartId}/${itemId}`).pipe(tap(c => this.updateCount(c))); }
  updateQuantity(request: UpdateQuantityRequest): Observable<CartResponse> { return this.http.put<CartResponse>(`${this.baseUrl}/updateQty`, request).pipe(tap(c => this.updateCount(c))); }
  clearCart(cartId: number): Observable<any> { return this.http.delete(`${this.baseUrl}/clear/${cartId}`).pipe(tap(() => this.cartCount$.next(0))); }
  applyPromo(request: ApplyPromoRequest): Observable<CartResponse> { return this.http.post<CartResponse>(`${this.baseUrl}/applyPromo`, request).pipe(tap(c => this.updateCount(c))); }
}
