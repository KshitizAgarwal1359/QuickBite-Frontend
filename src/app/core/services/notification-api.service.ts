import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationItem } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly baseUrl = environment.apiUrls.notification;
  constructor(private http: HttpClient) {}

  getByRecipient(userId: number): Observable<NotificationItem[]> { return this.http.get<NotificationItem[]>(`${this.baseUrl}/${userId}`); }
  getUnreadCount(userId: number): Observable<number> { return this.http.get<number>(`${this.baseUrl}/unread/${userId}`); }
  markAsRead(notificationId: number): Observable<void> { return this.http.put<void>(`${this.baseUrl}/${notificationId}/read`, {}); }
  markAllRead(userId: number): Observable<void> { return this.http.put<void>(`${this.baseUrl}/readAll/${userId}`, {}); }
  deleteNotification(id: number): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}`); }
}
