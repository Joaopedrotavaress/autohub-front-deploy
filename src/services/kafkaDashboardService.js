import apiFetch from './apiFetch'

export async function getKafkaDashboardSummary() {
  return apiFetch('/api/admin/kafka-dashboard/summary')
}

export async function getKafkaDashboardTimeseries({ minutes = 10, bucketSeconds = 3 } = {}) {
  const params = new URLSearchParams({
    minutes: String(minutes),
    bucketSeconds: String(bucketSeconds),
  })

  return apiFetch(`/api/admin/kafka-dashboard/timeseries?${params.toString()}`)
}

export async function getKafkaDashboardFailures() {
  return apiFetch('/api/admin/kafka-dashboard/failures')
}
