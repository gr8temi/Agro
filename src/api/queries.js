import { useQuery } from '@tanstack/react-query';
import client from './client';
import reportsApi from './reports';

// List endpoints may return a plain array or a paginated { results } object.
const listData = (res) => {
  const data = res.data?.results ?? res.data;
  return Array.isArray(data) ? data : [];
};

// Only send ?currency= when converting, matching the existing screens.
const currencyParams = (currency, baseCurrency) =>
  currency && currency !== baseCurrency ? { currency } : {};

export const queryKeys = {
  flocks: (status) => ['flocks', { status: status ?? 'all' }],
  flock: (id, params) => ['flock', id, params],
  healthLogs: (flockId, params) => ['healthLogs', flockId, params],
  eggCollections: (flockId) => ['eggCollections', flockId],
  reportConfig: () => ['reportConfig'],
};

export const useFlocks = (status) =>
  useQuery({
    queryKey: queryKeys.flocks(status),
    queryFn: () => client.get('/flocks/', { params: status ? { status } : {} }).then(listData),
  });

export const useFlock = (flockId, currency, baseCurrency) => {
  const params = currencyParams(currency, baseCurrency);
  return useQuery({
    queryKey: queryKeys.flock(flockId, params),
    queryFn: () => client.get(`/flocks/${flockId}/`, { params }).then((res) => res.data),
  });
};

export const useHealthLogs = (flockId, currency, baseCurrency) => {
  const params = currencyParams(currency, baseCurrency);
  return useQuery({
    queryKey: queryKeys.healthLogs(flockId, params),
    queryFn: () => client.get('/health-logs/', { params: { flock: flockId, ...params } }).then(listData),
  });
};

export const useEggCollections = (flockId) =>
  useQuery({
    queryKey: queryKeys.eggCollections(flockId),
    queryFn: () => client.get('/egg-collections/', { params: { flock: flockId } }).then(listData),
  });

export const useReportConfig = () =>
  useQuery({
    queryKey: queryKeys.reportConfig(),
    queryFn: () => reportsApi.getConfig().then((res) => listData(res)[0] ?? null),
  });
