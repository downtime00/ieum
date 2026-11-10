import { DataSource } from 'typeorm';

export interface DataSourceAdapter {
  name: string;

  getApiUrl(): string;

  getAuthHeaders(token?: string): Record<string, string>;

  getContentList(page?: number, limit?: number, filters?: any): Promise<any[]>;

  getContentDetail(contentId: number | string): Promise<any>;

  parseContentList(data: any): any[];

  parseContentDetail(data: any): any;
}