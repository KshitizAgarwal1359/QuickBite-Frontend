import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddCategoryRequest, UpdateCategoryRequest, CategoryResponse, AddMenuItemRequest, UpdateMenuItemRequest, MenuItemResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class MenuApiService {
  private readonly baseUrl = environment.apiUrls.menu;
  constructor(private http: HttpClient) {}

  addCategory(request: AddCategoryRequest): Observable<CategoryResponse> { return this.http.post<CategoryResponse>(`${this.baseUrl}/category`, request); }
  updateCategory(id: number, request: UpdateCategoryRequest): Observable<CategoryResponse> { return this.http.put<CategoryResponse>(`${this.baseUrl}/category/${id}`, request); }
  deleteCategory(id: number): Observable<any> { return this.http.delete(`${this.baseUrl}/category/${id}`); }
  getCategories(restId: number): Observable<CategoryResponse[]> { return this.http.get<CategoryResponse[]>(`${this.baseUrl}/categories/${restId}`); }
  getFullMenu(restId: number): Observable<CategoryResponse[]> { return this.http.get<CategoryResponse[]>(`${this.baseUrl}/restaurant/${restId}`); }
  addItem(request: AddMenuItemRequest): Observable<MenuItemResponse> { return this.http.post<MenuItemResponse>(`${this.baseUrl}/item`, request); }
  getItem(id: number): Observable<MenuItemResponse> { return this.http.get<MenuItemResponse>(`${this.baseUrl}/item/${id}`); }
  updateItem(id: number, request: UpdateMenuItemRequest): Observable<MenuItemResponse> { return this.http.put<MenuItemResponse>(`${this.baseUrl}/item/${id}`, request); }
  toggleAvailability(id: number): Observable<MenuItemResponse> { return this.http.put<MenuItemResponse>(`${this.baseUrl}/item/${id}/toggle`, {}); }
  deleteItem(id: number): Observable<any> { return this.http.delete(`${this.baseUrl}/item/${id}`); }
  searchItems(keyword: string): Observable<MenuItemResponse[]> { return this.http.get<MenuItemResponse[]>(`${this.baseUrl}/search?keyword=${keyword}`); }
  getVegItems(restId: number): Observable<MenuItemResponse[]> { return this.http.get<MenuItemResponse[]>(`${this.baseUrl}/veg/${restId}`); }
}
