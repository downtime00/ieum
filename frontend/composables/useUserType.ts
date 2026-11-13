import { ref } from 'vue'

export type UserType = 'user' | 'lecture' | 'care'

export const USER_TYPES: UserType[] = ['user', 'lecture', 'care']

const USER_TYPE_KEY = 'ieum_user_type'

// 모듈 레벨 반응형 사용자 유형 (클라이언트에서 localStorage 복원)
export const userType = ref<UserType>('user')

export const setUserType = (next: UserType) => {
  userType.value = USER_TYPES.includes(next) ? next : 'user'
  if (import.meta.client) {
    localStorage.setItem(USER_TYPE_KEY, userType.value)
  }
}

export const initUserType = () => {
  if (!import.meta.client) return
  const saved = localStorage.getItem(USER_TYPE_KEY) as UserType | null
  if (saved && USER_TYPES.includes(saved)) {
    userType.value = saved
  }
}

export const useUserType = () => {
  return { userType, setUserType }
}
