"use client"

import { useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"

/**
 * This component doesn't render anything visible but handles refreshing
 * recommendations when user preferences change.
 *
 * It can be placed in App.js or any parent component that wraps the routes.
 */
const RecommendationRefresher = () => {
  const { isAuthenticated, userPreferences } = useAuth()

  // Track changes to user preferences
  useEffect(() => {
    if (isAuthenticated && userPreferences) {
      // Create a custom event that components can listen for
      const event = new CustomEvent("userPreferencesChanged", {
        detail: { timestamp: new Date().getTime() },
      })

      // Dispatch the event
      window.dispatchEvent(event)

      console.log("User preferences changed, dispatched refresh event")
    }
  }, [isAuthenticated, userPreferences])

  // This component doesn't render anything
  return null
}

export default RecommendationRefresher
