/* eslint-disable react/only-export-components */
import { createContext, useContext } from 'react'

const AuthContext = createContext({
  currentUser: null,
  isAdmin: false,
  logout: () => {},
})

export function AuthProvider({ value, children }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
