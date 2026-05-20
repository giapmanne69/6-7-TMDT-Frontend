import api from '@/api'

export type SubscriptionTargetType = 'AUTHOR' | 'CATEGORY'

export interface SubscriptionResponse {
  id: number
  targetType: SubscriptionTargetType
  targetId: number
  targetName: string
}

export async function getMySubscriptions() {
  const res = await api.get<SubscriptionResponse[]>('/api/subscriptions/my')
  return res.data
}

export async function subscribeToTarget(targetType: SubscriptionTargetType, targetId: number) {
  const res = await api.post<SubscriptionResponse>('/api/subscriptions', {
    targetType,
    targetId,
  })
  return res.data
}

export async function unsubscribeFromTarget(targetType: SubscriptionTargetType, targetId: number) {
  await api.delete(`/api/subscriptions/${targetType}/${targetId}`)
}

export async function downloadArticlePdf(articleId: string | number) {
  const res = await api.get(`/api/articles/${articleId}/download-pdf`, {
    responseType: 'blob',
  })

  const disposition = res.headers['content-disposition'] as string | undefined
  const fileName = extractFileName(disposition) ?? `article-${articleId}.pdf`
  return {
    blob: new Blob([res.data], { type: 'application/pdf' }),
    fileName,
  }
}

function extractFileName(contentDisposition?: string) {
  if (!contentDisposition) return null
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1])

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return plainMatch?.[1] ?? null
}
