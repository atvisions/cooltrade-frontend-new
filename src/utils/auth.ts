// 从 localStorage 获取 token
export const getToken = (): string | null => {
  return localStorage.getItem('token')
}

// 设置 token 到 localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('token', token)
}

// 移除 token
export const removeToken = (): void => {
  localStorage.removeItem('token')
} 