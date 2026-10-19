/* eslint-disable react/only-export-components */
import { createContext, useContext } from 'react'

const AuthContext = createContext({
  currentUser: null,
  isAdmin: false,
  assignedCategoryIds: null,
  canManageCategory: () => false,
  logout: () => {},
  updateCurrentUser: () => {},
})

/**
 * Builds the context value from the signed-in user. Encoders are limited to their assigned
 * internal categories (`internal_category_ids`). If the server does not send the list the UI
 * stays permissive and the server (authoritative) rejects what is not allowed.
 */
export function buildAuthValue(currentUser, logout, updateCurrentUser) {
  const isAdmin = currentUser?.is_admin === true
  const assignedCategoryIds = Array.isArray(currentUser?.internal_category_ids)
    ? currentUser.internal_category_ids.map(Number)
    : null

  const canManageCategory = (internalCategoryId) => {
    if (isAdmin) return true
    if (assignedCategoryIds === null) return true
    if (internalCategoryId === null || internalCategoryId === undefined || internalCategoryId === '') return true
    return assignedCategoryIds.includes(Number(internalCategoryId))
  }

  return { currentUser, isAdmin, assignedCategoryIds, canManageCategory, logout, updateCurrentUser }
}

export function AuthProvider({ value, children }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
