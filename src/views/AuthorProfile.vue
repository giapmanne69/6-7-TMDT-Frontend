<template>
  <div class="bg-gray-50 min-h-screen pb-16">
    <!-- Cover Image -->
    <div class="h-64 w-full bg-slate-800 relative">
      <img :src="author.cover" alt="Cover" class="h-full w-full object-cover opacity-60" />
      <div class="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
    </div>

    <div class="container mx-auto px-4 lg:px-8 max-w-5xl -mt-24 relative z-10">
      <!-- Author Info Card -->
      <div class="rounded-2xl bg-white p-6 shadow-xl shadow-gray-200/50 mb-10 border border-gray-100">
        <div class="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-20 mb-6">
          <img
            :src="author.avatar"
            :alt="author.name"
            class="h-32 w-32 rounded-full border-4 border-white object-cover bg-white shadow-md"
          />
          <div class="flex-1 w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-1">{{ author.name }}</h1>
              <p class="text-blue-600 font-medium text-sm mb-2">{{ author.role }}</p>
            </div>
            <div class="flex gap-3 w-full md:w-auto">
              <button
                @click="toggleAuthorSubscription"
                :disabled="followLoading"
                :class="[
                  'flex-1 md:flex-none flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 font-semibold transition-colors disabled:opacity-60',
                  isFollowing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                ]"
              >
                <Loader2 v-if="followLoading" class="h-4 w-4 animate-spin" />
                <UserCheck v-else-if="isFollowing" class="h-4 w-4" />
                <UserPlus v-else class="h-4 w-4" />
                {{ isFollowing ? 'Đã theo dõi' : 'Theo dõi' }}
              </button>
              <RouterLink to="/subscriptions" class="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2.5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
                <Mail class="h-5 w-5" />
              </RouterLink>
            </div>
          </div>
        </div>
        <p v-if="followMessage" class="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700">{{ followMessage }}</p>
        <p v-if="followError" class="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700">{{ followError }}</p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-gray-100">
          <div class="md:col-span-2">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Giới thiệu</h3>
            <p class="text-gray-700 leading-relaxed">{{ author.bio }}</p>
          </div>
          <div class="space-y-4">
            <div class="flex items-center gap-3 text-sm text-gray-600">
              <Calendar class="h-5 w-5 text-gray-400" />
              <span>Tham gia: <strong class="text-gray-900">{{ author.joined }}</strong></span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-600">
              <Users class="h-5 w-5 text-gray-400" />
              <span><strong class="text-gray-900">{{ author.followers.toLocaleString() }}</strong> Người theo dõi</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-600">
              <UserPlus class="h-5 w-5 text-gray-400" />
              <span>Đang theo dõi <strong class="text-gray-900">{{ author.following }}</strong> người</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Author's Articles -->
      <div>
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900">Bài viết của {{ author.name }}</h2>
          <span class="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{{ authorArticles.length }} bài viết</span>
        </div>

        <div v-if="authorArticles.length > 0" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ArticleCard v-for="article in authorArticles" :key="article.id" :article="article" />
        </div>
        <div v-else class="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          Tác giả này chưa có bài viết nào.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UserPlus, UserCheck, Users, Calendar, Mail, Loader2 } from 'lucide-vue-next'
import { authors, articles } from '@/app/lib/mock-data'
import ArticleCard from '@/components/ArticleCard.vue'
import { useAuthStore } from '@/stores/auth'
import {
  getMySubscriptions,
  subscribeToTarget,
  unsubscribeFromTarget,
  type SubscriptionResponse,
} from '@/api/usecaseFeatures'
import { canUseBackendId, getBackendAuthorId } from '@/utils/backendIds'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const id = computed(() => route.params.id as string)
const author = computed(() => authors.find(a => a.id === id.value) ?? authors[0])
const authorArticles = computed(() => articles.filter(a => a.authorId === id.value))
const backendAuthorId = computed(() => getBackendAuthorId(id.value))

const subscriptions = ref<SubscriptionResponse[]>([])
const followLoading = ref(false)
const followMessage = ref('')
const followError = ref('')

const isFollowing = computed(() =>
  subscriptions.value.some(sub => sub.targetType === 'AUTHOR' && sub.targetId === backendAuthorId.value),
)

watch(id, () => {
  followMessage.value = ''
  followError.value = ''
  loadSubscriptions()
}, { immediate: true })

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

async function toggleAuthorSubscription() {
  if (!requireVipFeature()) return
  if (!canUseBackendId(backendAuthorId.value)) {
    followError.value = 'Chưa xác định được ID tác giả trong backend.'
    return
  }

  followLoading.value = true
  try {
    if (isFollowing.value) {
      await unsubscribeFromTarget('AUTHOR', backendAuthorId.value)
      subscriptions.value = subscriptions.value.filter(
        sub => !(sub.targetType === 'AUTHOR' && sub.targetId === backendAuthorId.value),
      )
      followMessage.value = 'Đã hủy theo dõi tác giả.'
    } else {
      const sub = await subscribeToTarget('AUTHOR', backendAuthorId.value)
      subscriptions.value = [
        sub,
        ...subscriptions.value.filter(item => !(item.targetType === 'AUTHOR' && item.targetId === sub.targetId)),
      ]
      followMessage.value = 'Bạn sẽ nhận email khi tác giả này có bài viết mới.'
    }
  } catch (err: any) {
    followError.value = err?.response?.data?.message ?? 'Không thể cập nhật theo dõi tác giả.'
  } finally {
    followLoading.value = false
  }
}
</script>
