<template>
  <div class="container mx-auto px-4 py-8 lg:px-8">
    <!-- Search Bar & Filters -->
    <div class="mb-10 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      <form @submit.prevent="handleSearch" class="mb-6 relative">
        <SearchIcon class="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchInput"
          name="q"
          type="text"
          placeholder="Tìm kiếm bài viết, tác giả, nội dung..."
          class="w-full rounded-xl border border-gray-200 bg-gray-50 py-4 pl-14 pr-4 text-lg outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
        />
        <button type="submit" class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700">
          Tìm kiếm
        </button>
      </form>

      <div class="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-6">
        <div class="flex items-center gap-2 text-gray-700 font-medium">
          <Filter class="h-5 w-5" /> Bộ lọc:
        </div>

        <select
          v-model="categoryFilter"
          @change="applyFilters"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Tất cả danh mục</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>

        <select class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">Tất cả tác giả</option>
          <option value="A">Nguyễn Văn A</option>
          <option value="B">Trần Thị B</option>
        </select>
      </div>

      <div v-if="selectedCategory" class="mt-6 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="font-bold text-gray-900">Nhận email về chủ đề {{ selectedCategory.name }}</h3>
          <p class="text-sm text-gray-600">Theo dõi chủ đề này để nhận thông báo khi có bài báo mới.</p>
        </div>
        <button
          @click="toggleCategorySubscription"
          :disabled="categoryFollowLoading"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Loader2 v-if="categoryFollowLoading" class="h-4 w-4 animate-spin" />
          <BellRing v-else-if="isCategoryFollowing" class="h-4 w-4" />
          <BellPlus v-else class="h-4 w-4" />
          {{ isCategoryFollowing ? 'Đã theo dõi' : 'Theo dõi qua email' }}
        </button>
      </div>
      <p v-if="followMessage" class="mt-3 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700">{{ followMessage }}</p>
      <p v-if="followError" class="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700">{{ followError }}</p>
    </div>

    <!-- Results -->
    <div>
      <h2 class="mb-6 text-xl font-bold text-gray-900">
        {{ filteredArticles.length > 0 ? `Tìm thấy ${filteredArticles.length} kết quả` : 'Kết quả tìm kiếm' }}
      </h2>

      <div v-if="filteredArticles.length > 0" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ArticleCard v-for="article in filteredArticles" :key="article.id" :article="article" />
      </div>

      <div v-else class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
        <SearchX class="mb-4 h-16 w-16 text-gray-400" />
        <h3 class="mb-2 text-xl font-bold text-gray-900">Không tìm thấy kết quả</h3>
        <p class="text-gray-500">
          Rất tiếc, chúng tôi không tìm thấy bài viết nào phù hợp với "{{ query }}".<br />
          Vui lòng thử lại với từ khóa khác.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search as SearchIcon, Filter, SearchX, BellPlus, BellRing, Loader2 } from 'lucide-vue-next'
import { articles, categories } from '@/app/lib/mock-data'
import ArticleCard from '@/components/ArticleCard.vue'
import { useAuthStore } from '@/stores/auth'
import {
  getMySubscriptions,
  subscribeToTarget,
  unsubscribeFromTarget,
  type SubscriptionResponse,
} from '@/api/usecaseFeatures'
import { canUseBackendId, getBackendCategoryId } from '@/utils/backendIds'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const searchInput = ref((route.query.q as string) ?? '')
const categoryFilter = ref((route.query.category as string) ?? '')
const query = ref((route.query.q as string) ?? '')
const subscriptions = ref<SubscriptionResponse[]>([])
const categoryFollowLoading = ref(false)
const followMessage = ref('')
const followError = ref('')

watch(() => route.query, (q) => {
  searchInput.value = (q.q as string) ?? ''
  categoryFilter.value = (q.category as string) ?? ''
  query.value = (q.q as string) ?? ''
  followMessage.value = ''
  followError.value = ''
  loadSubscriptions()
}, { immediate: true })

const selectedCategory = computed(() => categories.find(cat => cat.id === categoryFilter.value))
const backendCategoryId = computed(() => getBackendCategoryId(categoryFilter.value))
const isCategoryFollowing = computed(() =>
  subscriptions.value.some(sub => sub.targetType === 'CATEGORY' && sub.targetId === backendCategoryId.value),
)

const filteredArticles = computed(() => {
  return articles.filter(article => {
    const matchesQuery =
      article.title.toLowerCase().includes(query.value.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(query.value.toLowerCase())
    const matchesCategory = categoryFilter.value ? article.category === categoryFilter.value : true
    return matchesQuery && matchesCategory
  })
})

function handleSearch() {
  const params: Record<string, string> = {}
  if (searchInput.value) params.q = searchInput.value
  if (categoryFilter.value) params.category = categoryFilter.value
  router.push({ path: '/search', query: params })
}

function applyFilters() {
  const params: Record<string, string> = {}
  if (query.value) params.q = query.value
  if (categoryFilter.value) params.category = categoryFilter.value
  router.push({ path: '/search', query: params })
}

async function loadSubscriptions() {
  if (!auth.isLoggedIn || !auth.isVip) {
    subscriptions.value = []
    return
  }
  try {
    subscriptions.value = await getMySubscriptions()
  } catch {
    subscriptions.value = []
  }
}

function requireVipFeature() {
  followMessage.value = ''
  followError.value = ''
  if (!auth.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return false
  }
  if (!auth.isVip) {
    router.push('/vip')
    return false
  }
  return true
}

async function toggleCategorySubscription() {
  if (!selectedCategory.value || !requireVipFeature()) return
  if (!canUseBackendId(backendCategoryId.value)) {
    followError.value = 'Chưa xác định được ID chủ đề trong backend.'
    return
  }

  categoryFollowLoading.value = true
  try {
    if (isCategoryFollowing.value) {
      await unsubscribeFromTarget('CATEGORY', backendCategoryId.value)
      subscriptions.value = subscriptions.value.filter(
        sub => !(sub.targetType === 'CATEGORY' && sub.targetId === backendCategoryId.value),
      )
      followMessage.value = 'Đã hủy theo dõi chủ đề.'
    } else {
      const sub = await subscribeToTarget('CATEGORY', backendCategoryId.value)
      subscriptions.value = [
        sub,
        ...subscriptions.value.filter(item => !(item.targetType === 'CATEGORY' && item.targetId === sub.targetId)),
      ]
      followMessage.value = 'Bạn sẽ nhận email khi chủ đề này có bài viết mới.'
    }
  } catch (err: any) {
    followError.value = err?.response?.data?.message ?? 'Không thể cập nhật theo dõi chủ đề.'
  } finally {
    categoryFollowLoading.value = false
  }
}
</script>
