import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast { message: string; type: 'success' | 'error' | 'info'; id: number; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts: Toast[] = [];
  private toastSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastSubject.asObservable();
  private counter = 0;

  show(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast: Toast = { message, type, id: ++this.counter };
    this.toasts.push(toast);
    this.toastSubject.next([...this.toasts]);
    setTimeout(() => this.dismiss(toast.id), 4000);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void { this.show(message, 'error'); }
  info(message: string): void { this.show(message, 'info'); }

  dismiss(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toastSubject.next([...this.toasts]);
  }
}
