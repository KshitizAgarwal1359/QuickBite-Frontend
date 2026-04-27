import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MenuApiService } from '../../core/services/menu-api.service';
import { ToastService } from '../../core/services/toast.service';
import { CategoryResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-menu-manage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page container">
      <div class="page-header"><h1>📋 Menu Management</h1><p class="text-muted">Restaurant #{{ restId }} — Manage categories and items</p></div>
      <!-- Add Category -->
      <div class="card mb-24"><div class="card-body">
        <h3>Add Category</h3>
        <div class="mt-8" style="display: grid; grid-template-columns: 1fr 180px auto; gap: 8px; align-items: end;">
          <div class="form-group" style="margin: 0;">
            <label for="catName">Category Name</label>
            <input id="catName" type="text" class="form-control" [(ngModel)]="newCatName" placeholder="e.g., Appetizers, Main Course" required />
          </div>
          <div class="form-group" style="margin: 0;">
            <label for="catOrder">Display Order</label>
            <input id="catOrder" type="number" class="form-control" [(ngModel)]="newCatOrder" placeholder="1, 2, 3..." min="0" />
          </div>
          <button class="btn btn-primary btn-sm" (click)="addCategory()" style="height: 36px;">Add</button>
        </div>
        <p class="text-sm text-muted" style="margin-top: 4px;">Display order controls how categories appear in your menu (lower numbers first)</p>
      </div></div>

      @if (loading) { <div class="loading-spinner"></div> }
      @else if (categories.length === 0) {
        <div class="empty-state"><h3>No categories yet</h3><p>Add your first menu category above to get started.</p></div>
      }

      <!-- Categories & Items -->
      @for (cat of categories; track cat.categoryId) {
        <div class="card mb-16"><div class="card-body">
          <div class="flex-between"><h3>{{ cat.name }}</h3><button class="btn btn-danger btn-sm" (click)="deleteCategory(cat.categoryId)">Delete Category</button></div>

          @if (!cat.items || cat.items.length === 0) {
            <p class="text-muted mt-8 text-sm">No items in this category. Add one below.</p>
          }

          @for (item of cat.items; track item.itemId) {
            <div class="menu-item-row">
              @if (editingItemId === item.itemId) {
                <div class="w-full">
                  <div class="add-item-grid mb-8">
                    <input type="text" class="form-control" [(ngModel)]="editItemData.name" placeholder="Name *" />
                    <input type="number" class="form-control" [(ngModel)]="editItemData.price" placeholder="Price *" />
                    <input type="text" class="form-control" [(ngModel)]="editItemData.description" placeholder="Description" />
                    <input type="text" class="form-control" [(ngModel)]="editItemData.imageUrl" placeholder="Image URL (optional)" />
                    <input type="number" class="form-control" [(ngModel)]="editItemData.discountedPrice" placeholder="Discount Price" />
                    <input type="number" class="form-control" [(ngModel)]="editItemData.calories" placeholder="Calories" />
                    <select class="form-control" [(ngModel)]="editItemData.isVeg"><option [ngValue]="true">Veg</option><option [ngValue]="false">Non-Veg</option></select>
                  </div>
                  <div class="flex gap-8">
                    <button class="btn btn-success btn-sm" (click)="saveEditItem(item, cat)">Save</button>
                    <button class="btn btn-outline btn-sm" (click)="cancelEdit()">Cancel</button>
                  </div>
                </div>
              } @else {
                <div class="w-full flex-between">
                  <div class="mi-info">
                    <span [class]="item.isVeg ? 'badge badge-veg' : 'badge badge-nonveg'">{{ item.isVeg ? 'Veg' : 'Non-Veg' }}</span>
                    <strong style="margin-left:8px">{{ item.name }}</strong>
                    <span class="text-muted text-sm" style="margin-left:8px">₹{{ item.discountedPrice || item.price }}</span>
                    @if (item.discountedPrice && item.discountedPrice < item.price) { <span class="price-old" style="margin-left:4px">₹{{ item.price }}</span> }
                    <span [class]="item.isAvailable ? 'badge badge-success' : 'badge badge-error'" style="margin-left:8px">{{ item.isAvailable ? 'In Stock' : 'Out of Stock' }}</span>
                  </div>
                  <div class="flex gap-8">
                    <button class="btn btn-outline btn-sm" (click)="startEdit(item)">Edit</button>
                    <button class="btn btn-outline btn-sm" (click)="toggleItem(item)">{{ item.isAvailable ? 'Mark Out' : 'Mark In' }}</button>
                    <button class="btn btn-danger btn-sm" (click)="deleteItem(item.itemId, cat)">✕</button>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Add Item Form -->
          <details class="mt-16"><summary class="btn btn-accent btn-sm">+ Add Item</summary>
            <div class="add-item-grid mt-8">
              <input type="text" class="form-control" [(ngModel)]="newItems[cat.categoryId].name" placeholder="Item name *" />
              <input type="number" class="form-control" [(ngModel)]="newItems[cat.categoryId].price" placeholder="Price *" />
              <input type="text" class="form-control" [(ngModel)]="newItems[cat.categoryId].description" placeholder="Description" />
              <input type="text" class="form-control" [(ngModel)]="newItems[cat.categoryId].imageUrl" placeholder="Image URL (optional)" />
              <input type="number" class="form-control" [(ngModel)]="newItems[cat.categoryId].discountedPrice" placeholder="Discounted Price" />
              <input type="number" class="form-control" [(ngModel)]="newItems[cat.categoryId].calories" placeholder="Calories" />
              <select class="form-control" [(ngModel)]="newItems[cat.categoryId].isVeg"><option [ngValue]="true">Veg</option><option [ngValue]="false">Non-Veg</option></select>
            </div>
            <button class="btn btn-primary btn-sm mt-8" (click)="addItem(cat)">Save Item</button>
          </details>
        </div></div>
      }
    </div>
  `,
  styles: [`
    .menu-item-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .mi-info { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
    .add-item-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .w-full { width: 100%; }
  `]
})
export class MenuManageComponent implements OnInit {
  categories: CategoryResponse[] = []; restId = 0; loading = true;
  newCatName = '';
  newCatOrder = 0;
  newItems: Record<number, any> = {};
  editingItemId: number | null = null;
  editItemData: any = {};
  constructor(private route: ActivatedRoute, private menuApi: MenuApiService, private toast: ToastService) {}

  ngOnInit() {
    this.restId = Number(this.route.snapshot.paramMap.get('restId'));
    this.load();
  }

  load() {
    this.loading = true;
    // Use getCategories (returns ALL items including unavailable) instead of getFullMenu (filters to available only)
    this.menuApi.getCategories(this.restId).subscribe({
      next: (c) => { 
        this.categories = c; 
        c.forEach(cat => {
          if (!this.newItems[cat.categoryId]) {
            this.newItems[cat.categoryId] = { name: '', price: 0, description: '', discountedPrice: 0, isVeg: true, calories: 0, imageUrl: '' };
          }
        });
        this.loading = false; 
      },
      error: () => { this.categories = []; this.loading = false; }
    });
  }

  addCategory() {
    if (!this.newCatName.trim()) return;
    this.menuApi.addCategory({ restaurantId: this.restId, name: this.newCatName, displayOrder: this.newCatOrder }).subscribe({
      next: () => { this.newCatName = ''; this.newCatOrder = 0; this.load(); this.toast.success('Category added'); },
      error: (e) => this.toast.error(e.error?.message || 'Failed')
    });
  }

  deleteCategory(id: number) {
    if (!confirm('Are you sure you want to delete this category? This will permanently delete all items within it.')) return;
    this.menuApi.deleteCategory(id).subscribe({
      next: () => { this.load(); this.toast.info('Category deleted'); },
      error: (e) => this.toast.error(e.error?.message || 'Failed')
    });
  }

  addItem(cat: CategoryResponse) {
    const newItemData = this.newItems[cat.categoryId];
    if (!newItemData.name?.trim() || !newItemData.price) {
      this.toast.error('Item name and price are required');
      return;
    }
    this.menuApi.addItem({ categoryId: cat.categoryId, restaurantId: this.restId, ...newItemData }).subscribe({
      next: (addedItem) => {
        if (!cat.items) cat.items = [];
        cat.items.push(addedItem);
        this.newItems[cat.categoryId] = { name: '', price: 0, description: '', discountedPrice: 0, isVeg: true, calories: 0, imageUrl: '' };
        this.toast.success('Item added');
      },
      error: (e) => this.toast.error(e.error?.message || 'Failed')
    });
  }

  toggleItem(item: any) {
    this.menuApi.toggleAvailability(item.itemId).subscribe({
      next: (updated) => item.isAvailable = updated.isAvailable,
      error: (e) => this.toast.error(e.error?.message || 'Failed')
    });
  }

  deleteItem(id: number, cat: CategoryResponse) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    this.menuApi.deleteItem(id).subscribe({
      next: () => { cat.items = cat.items.filter(i => i.itemId !== id); this.toast.info('Item deleted'); },
      error: (e) => this.toast.error(e.error?.message || 'Failed')
    });
  }

  startEdit(item: any) {
    this.editingItemId = item.itemId;
    this.editItemData = { ...item };
  }

  cancelEdit() {
    this.editingItemId = null;
    this.editItemData = {};
  }

  saveEditItem(item: any, cat: CategoryResponse) {
    if (!this.editItemData.name?.trim() || !this.editItemData.price) {
      this.toast.error('Item name and price are required');
      return;
    }
    this.menuApi.updateItem(item.itemId, this.editItemData).subscribe({
      next: (updatedItem) => {
        this.toast.success('Item updated successfully');
        const index = cat.items.findIndex((i: any) => i.itemId === item.itemId);
        if (index !== -1) {
          cat.items[index] = updatedItem;
        }
        this.cancelEdit();
      },
      error: (e) => this.toast.error(e.error?.message || 'Failed to update item')
    });
  }
}
