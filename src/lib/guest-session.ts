import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Cookies from 'js-cookie'

interface GuestHistory {
  seenOppIds: string[];
  likedOppIds: string[];
}

export function useGuestId() {
  const { data: session } = useSession()
  const [guestId, setGuestId] = useState<string | null>(null)
  const [guestHistory, setGuestHistory] = useState<GuestHistory>({
    seenOppIds: [],
    likedOppIds: [],
  })

  const emptyGuestHistory: GuestHistory = {
    seenOppIds: [],
    likedOppIds: [],
  }

  useEffect(() => {
    if (session?.user) {
      // User is authenticated, clear guest data
      setGuestId(null)
      setGuestHistory([])
    } else {
      // User is not authenticated, get or create guest ID
      let storedGuestId = Cookies.get('guestId')
      
      if (!storedGuestId) {
        // This should rarely happen due to middleware, but just in case
        storedGuestId = crypto.randomUUID()
        Cookies.set('guestId', storedGuestId, { 
          expires: 365, // 365 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
      }
      
      setGuestId(storedGuestId)

      // Load guest history from localStorage
      const storedHistory = localStorage.getItem('guestHistory')
      if (storedHistory) {
        try {
          setGuestHistory(JSON.parse(storedHistory))
        } catch (error) {
          console.error('Error parsing guest history:', error)
          setGuestHistory([])
        }
      }
    }
  }, [session])

  const updateGuestHistory = (type: 'seen' | 'liked', oppId: string) => {
    if (!session?.user && guestId) {
      const updatedHistory = { ...guestHistory }
      
      if (type === 'seen' && !updatedHistory.seenOppIds.includes(oppId)) {
        updatedHistory.seenOppIds.push(oppId)
      } else if (type === 'liked' && !updatedHistory.likedOppIds.includes(oppId)) {
        updatedHistory.likedOppIds.push(oppId)
      }
      
      setGuestHistory(updatedHistory)
      localStorage.setItem('guestHistory', JSON.stringify(updatedHistory))
    }
  }

  const clearGuestHistory = () => {
    setGuestHistory(emptyGuestHistory)
    localStorage.removeItem('guestHistory')
  }

  const addSeenOpportunity = (oppId: string) => updateGuestHistory('seen', oppId)
  const addLikedOpportunity = (oppId: string) => updateGuestHistory('liked', oppId)
  
  const isOpportunitySeen = (oppId: string) => guestHistory.seenOppIds.includes(oppId)
  const isOpportunityLiked = (oppId: string) => guestHistory.likedOppIds.includes(oppId)
  
  const removeSeenOpportunity = (oppId: string) => {
    if (!session?.user && guestId) {
      const updatedHistory = {
        ...guestHistory,
        seenOppIds: guestHistory.seenOppIds.filter(id => id !== oppId)
      }
      setGuestHistory(updatedHistory)
      localStorage.setItem('guestHistory', JSON.stringify(updatedHistory))
    }
  }
  
  const removeLikedOpportunity = (oppId: string) => {
    if (!session?.user && guestId) {
      const updatedHistory = {
        ...guestHistory,
        likedOppIds: guestHistory.likedOppIds.filter(id => id !== oppId)
      }
      setGuestHistory(updatedHistory)
      localStorage.setItem('guestHistory', JSON.stringify(updatedHistory))
    }
  }

  return {
    guestId,
    guestHistory,
    updateGuestHistory,
    addSeenOpportunity,
    addLikedOpportunity,
    isOpportunitySeen,
    isOpportunityLiked,
    removeSeenOpportunity,
    removeLikedOpportunity,
    clearGuestHistory,
    isGuest: !session?.user && !!guestId
  }
}