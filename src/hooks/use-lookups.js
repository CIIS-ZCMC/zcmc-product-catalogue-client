import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { FALLBACK_UNITS } from '@/lib/product'

// Reference lists change rarely, so they are fetched once per page load and shared.
let internalCategoriesPromise = null
let unitsPromise = null

function loadInternalCategories() {
  if (!internalCategoriesPromise) {
    internalCategoriesPromise = api
      .getInternalCategories()
      .then((res) => (Array.isArray(res?.data) ? res.data : []))
      .catch((err) => {
        internalCategoriesPromise = null
        throw err
      })
  }
  return internalCategoriesPromise
}

function loadUnits() {
  if (!unitsPromise) {
    unitsPromise = api
      .getItemUnits()
      .then((res) => {
        const names = Array.isArray(res?.data)
          ? res.data.map((u) => u.name).filter(Boolean)
          : []
        return names.length > 0 ? names : FALLBACK_UNITS
      })
      .catch(() => {
        unitsPromise = null
        return FALLBACK_UNITS
      })
  }
  return unitsPromise
}

export function useInternalCategories() {
  const [state, setState] = useState({ data: [], loading: true, error: null })

  useEffect(() => {
    let active = true
    loadInternalCategories()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: [], loading: false, error }))
    return () => {
      active = false
    }
  }, [])

  return state
}

export function useUnits() {
  const [units, setUnits] = useState(FALLBACK_UNITS)

  useEffect(() => {
    let active = true
    loadUnits().then((data) => active && setUnits(data))
    return () => {
      active = false
    }
  }, [])

  return units
}
