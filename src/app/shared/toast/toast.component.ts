import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of (toastService.toasts$ | async); track toast.id) {
        <div class="toast toast-{{ toast.type }}">
          <span>{{ toast.message }}</span>
          <button class="toast-dismiss" (click)="toastService.dismiss(toast.id)">&times;</button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
