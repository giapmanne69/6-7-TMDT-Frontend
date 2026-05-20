<template>
  <div class="container mx-auto max-w-5xl px-4 py-10 lg:px-8">
    <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wider text-blue-600">Email updates</p>
        <h1 class="text-3xl font-bold text-gray-900">Theo dõi của tôi</h1>
        <p class="mt-2 max-w-2xl text-gray-600">
          Quản lý tác giả và chủ đề bạn đã đăng ký để nhận email khi có bài viết mới.
        </p>
      </div>
      <RouterLink
        to="/search"
        class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Khám phá chủ đề
      </RouterLink>
    </div>

    <div v-if="loading" class="rounded-xl border border-gray-100 bg-white p-10 text-center text-gray-600 shadow-sm">
      <Loader2 class="mx-auto mb-3 h-6 w-6 animate-spin text-blue-600" />
      Đang tải danh sách theo dõi...
    </div>

    <div v-else-if="error" class="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700">
      {{ error }}
    </div>

    <div v-else-if="subscriptions.length === 0" class="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
      <Bell class="mx-auto mb-4 h-12 w-12 text-gray-400" />
      <h2 class="mb-2 text-xl font-bold text-gray-900">Chưa có đăng ký theo dõi</h2>
      <p class="mx-auto max-w-md text-gray-600">
        Theo dõi tác giả hoặc chủ đề yêu thích để hệ thống gửi email khi có bài viết mới.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div
        v-for="item in subscriptions"
        :key="`${item.targetType}-${item.targetId}`"
        class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <span class="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {{ item.targetType === 'AUTHOR' ? 'Tác giả' : 'Chủ đề' }}
            </span>
            <h3 class="text-lg font-bold text-gray-900">{{ item.targetName }}</h3>
            <p class="text-sm text-gray-500">ID backend: {{ item.targetId }}</p>
          </div>
          <BellRing class="h-5 w-5 flex-shrink-0 text-blue-600" />
        </div>
        <button
          @click="handleUnsubscribe(item)"
          :disabled="removingKey === `${item.targetType}-${item.targetId}`"
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          <Loader2 v-if="removingKey === `${item.targetType}-${item.targetId}`" class="h-4 w-4 animate-spin" />
          Hủy theo dõi
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Bell, BellRing, Loader2 } from 'lucide-vue-next'
import {
  getMySubscriptions,
  unsubscribeFromTarget,
  type SubscriptionResponse,
} from '@/api/usecaseFeatures'

const subscriptions = ref<SubscriptionResponse[]>([])
const loading = ref(true)
const error = ref('')
const removingKey = ref('')

onMounted(loadSubscriptions)

async function loadSubscriptions() {
  loading.value = true
  error.value = ''
  try {
    subscriptions.value = await getMySubscriptions()
  } catch (err: any) {
    error.value = err?.response?.data?.message ?? 'Vui lòng đăng nhập bằng tài khoản VIP để xem danh sách theo dõi.'
  } finally {
    loading.value = false
  }
}

async function handleUnsubscribe(item: SubscriptionResponse) {
  const key = `${item.targetType}-${item.targetId}`
  removingKey.value = key
  try {
    await unsubscribeFromTarget(item.targetType, item.targetId)
    subscriptions.value = subscriptions.value.filter(
      sub => `${sub.targetType}-${sub.targetId}` !== key,
    )
  } catch (err: any) {
    error.value = err?.response?.data?.message ?? 'Không thể hủy theo dõi. Vui lòng thử lại.'
  } finally {
    removingKey.value = ''
  }
}
</script>
