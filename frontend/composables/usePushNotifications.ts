interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const config = useRuntimeConfig()
  const supported = ref(false)
  const permission = ref<NotificationPermission>('default')
  const subscribed = ref(false)
  const loading = ref(false)
  const error = ref('')

  const checkSupport = () => {
    supported.value =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    if (supported.value) {
      permission.value = Notification.permission
    }
  }

  const getUserId = (): number | null => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub ? Number(payload.sub) : null
    } catch {
      return null
    }
  }

  const subscribe = async (): Promise<boolean> => {
    if (!supported.value) {
      error.value = '이 브라우저는 웹 푸시를 지원하지 않습니다.'
      return false
    }

    loading.value = true
    error.value = ''
    try {
      const perm = await Notification.requestPermission()
      permission.value = perm
      if (perm !== 'granted') {
        error.value = '알림 권한이 거부되었습니다.'
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const vapidKey = config.public.vapidPublicKey
      if (!vapidKey) {
        error.value = 'VAPID 공개키가 설정되지 않았습니다.'
        return false
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      const res = await fetch(`${config.public.apiBase}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          subscription: subscription.toJSON(),
        }),
      })

      if (!res.ok) throw new Error(`서버 등록 실패: ${res.status}`)
      subscribed.value = true
      return true
    } catch (e: any) {
      error.value = e?.message || '알림 구독에 실패했습니다.'
      return false
    } finally {
      loading.value = false
    }
  }

  const unsubscribe = async (): Promise<boolean> => {
    loading.value = true
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await fetch(`${config.public.apiBase}/push/subscribe`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }
      subscribed.value = false
      return true
    } catch (e: any) {
      error.value = e?.message || '알림 해지에 실패했습니다.'
      return false
    } finally {
      loading.value = false
    }
  }

  const refreshStatus = async () => {
    if (!supported.value) return
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      subscribed.value = !!subscription
    } catch {
      // 서비스 워커 미준비 시 무시
    }
  }

  onMounted(() => {
    checkSupport()
    refreshStatus()
  })

  return { supported, permission, subscribed, loading, error, subscribe, unsubscribe, refreshStatus }
}
