const categoryBackendIds: Record<string, number> = {
  tech: 1,
  business: 2,
  lifestyle: 3,
  science: 4,
}

const authorBackendIds: Record<string, number> = {
  'author-1': 13,
  'author-2': 14,
  'author-3': 15,
  'author-4': 16,
  'author-5': 17,
}

export function getBackendAuthorId(authorId: string) {
  if (authorBackendIds[authorId]) return authorBackendIds[authorId]

  const match = authorId.match(/(\d+)$/)
  return match ? Number(match[1]) : Number(authorId)
}

export function getBackendCategoryId(categoryId: string) {
  return categoryBackendIds[categoryId] ?? Number(categoryId)
}

export function canUseBackendId(value: number) {
  return Number.isFinite(value) && value > 0
}
