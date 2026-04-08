// Notion Databases API
import type {
  CreateDatabaseResponse,
  GetDatabaseResponse,
  GetDataSourceResponse,
  QueryDataSourceResponse,
  SearchResponse,
  UpdateDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints';

import { formatApiError, getQueryEndpoint, resolveDataSourceId } from '../helpers';
import { apiFetch } from './client';

export function getDatabase(databaseId: string): Promise<GetDatabaseResponse> {
  return apiFetch<GetDatabaseResponse>(`/databases/${databaseId}`);
}

/**
 * Resolve a database container ID to its first data_source ID.
 */
export async function resolveDataSourceIdCompat(databaseId: string): Promise<string> {
  try {
    return await resolveDataSourceId(databaseId);
  } catch (error) {
    throw new Error(
      `Database has no data sources or is not accessible. Share the database with your integration. ${formatApiError(error)}`
    );
  }
}

export function getDataSource(dataSourceId: string): Promise<GetDataSourceResponse> {
  return apiFetch<GetDataSourceResponse>(`/data_sources/${dataSourceId}`);
}

/**
 * Query a database via its data source endpoint.
 */
export async function queryDataSource(
  databaseId: string,
  body?: Record<string, unknown>
): Promise<QueryDataSourceResponse> {
  const endpoint = await getQueryEndpoint(databaseId);
  const requestBody = body || {};

  console.log(`[notion][databases] Querying ${endpoint}`);

  return await apiFetch<QueryDataSourceResponse>(endpoint, {
    method: 'POST',
    body: requestBody,
  });
}

export async function createDatabase(
  body: Record<string, unknown>
): Promise<CreateDatabaseResponse> {
  return apiFetch<CreateDatabaseResponse>('/databases', { method: 'POST', body });
}

export async function updateDatabase(
  databaseId: string,
  body: Record<string, unknown>
): Promise<UpdateDatabaseResponse> {
  return apiFetch<UpdateDatabaseResponse>(`/databases/${databaseId}`, {
    method: 'PATCH',
    body,
  });
}

/**
 * List all databases via search with data_source filter.
 */
export async function listAllDatabases(pageSize: number = 20): Promise<SearchResponse> {
  const filter = { property: 'object', value: 'data_source' };

  return await apiFetch<SearchResponse>('/search', {
    method: 'POST',
    body: { filter, page_size: pageSize },
  });
}
