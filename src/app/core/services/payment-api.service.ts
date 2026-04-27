import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProcessPaymentRequest, PaymentResponse, WalletTopupRequest, WalletPayRequest, WalletResponse, WalletStatementResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly payUrl = environment.apiUrls.payment;
  private readonly walletUrl = environment.apiUrls.wallet;
  constructor(private http: HttpClient) {}

  processPayment(request: ProcessPaymentRequest): Observable<PaymentResponse> { return this.http.post<PaymentResponse>(`${this.payUrl}/process`, request); }
  getPaymentByOrder(orderId: number): Observable<PaymentResponse> { return this.http.get<PaymentResponse>(`${this.payUrl}/order/${orderId}`); }
  getCustomerPayments(customerId: number): Observable<PaymentResponse[]> { return this.http.get<PaymentResponse[]>(`${this.payUrl}/customer/${customerId}`); }
  getAllPayments(): Observable<PaymentResponse[]> { return this.http.get<PaymentResponse[]>(`${this.payUrl}/all`); }
  refundPayment(paymentId: number): Observable<PaymentResponse> { return this.http.post<PaymentResponse>(`${this.payUrl}/refund/${paymentId}`, {}); }
  createRazorpayOrder(amount: number): Observable<{ razorpayOrderId: string }> { return this.http.post<{ razorpayOrderId: string }>(`${this.payUrl}/razorpay-order`, amount); }

  getWalletBalance(customerId: number): Observable<WalletResponse> { return this.http.get<WalletResponse>(`${this.walletUrl}/balance/${customerId}`); }
  addToWallet(request: WalletTopupRequest): Observable<WalletResponse> { return this.http.post<WalletResponse>(`${this.walletUrl}/add`, request); }
  payFromWallet(request: WalletPayRequest): Observable<WalletResponse> { return this.http.post<WalletResponse>(`${this.walletUrl}/pay`, request); }
  getWalletStatements(customerId: number): Observable<WalletStatementResponse[]> { return this.http.get<WalletStatementResponse[]>(`${this.walletUrl}/statements/${customerId}`); }
}
