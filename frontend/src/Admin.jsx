import { useEffect, useRef, useState } from 'react'
import uitoolkit from '@zoom/videosdk-ui-toolkit'
import '@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css'

const EMOTIONS = ['happy', 'sad', 'angry']

export default function AdminPage() {
  const sessionContainerRef = useRef(null)
  const clientRef = useRef(null)
  const participantsIntervalRef = useRef(null)

  const [joined, setJoined] = useState(false)
  const [participants, setParticipants] = useState([])
  const [sendingUserId, setSendingUserId] = useState(null)

  const authEndpoint = 'http://localhost:4000/signature'
  const adminName = 'admin'

  async function joinSession() {
    try {
      const config = {
        videoSDKJWT: '',
        sessionName: 'Noonchi',
        role: 1,
        userName: adminName,
        leaveOnPageUnload: true,
        debug: true,
        featuresOptions: {
          video: { enable: true },
          audio: { enable: true },
          users: { enable: true },
          chat: { enable: true },

          viewMode: {
            enable: true,
            defaultViewMode: 'gallery',
            viewModes: ['gallery', 'speaker']
          },

          settings: { enable: false },
          caption: { enable: false },
          subsession: { enable: false },

          footer: { enable: true },
          header: { enable: true },
          leave: { enable: true }
        }
      }

      const res = await fetch(authEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionName: config.sessionName,
          role: 1,
          userIdentity: 'admin-' + Math.random().toString(36).slice(2)
        })
      })

      const data = await res.json()
      config.videoSDKJWT = data.signature

      if (!sessionContainerRef.current) return

      await uitoolkit.joinSession(sessionContainerRef.current, config)

      clientRef.current = uitoolkit.getClient()
      console.log('admin client:', clientRef.current)

      setJoined(true)

      refreshParticipants()
      startParticipantsRefresh()
    } catch (e) {
      console.error('Failed to join session:', e)
    }
  }

  function refreshParticipants() {
    try {
      const client = clientRef.current
      if (!client) return

      const allUsers = client.getAllUser?.() || []
      const currentUser = client.getCurrentUserInfo?.()

      const others = allUsers.filter((user) => {
        if (!user) return false
        if (currentUser && user.userId === currentUser.userId) return false

        const name =
          user.displayName ||
          user.userName ||
          user.name ||
          `User ${user.userId}`

        return name.toLowerCase() !== adminName.toLowerCase()
      })

      setParticipants(others)
    } catch (e) {
      console.error('Failed to refresh participants:', e)
    }
  }

  function startParticipantsRefresh() {
    stopParticipantsRefresh()

    participantsIntervalRef.current = setInterval(() => {
      refreshParticipants()
    }, 1000)
  }

  function stopParticipantsRefresh() {
    if (participantsIntervalRef.current) {
      clearInterval(participantsIntervalRef.current)
      participantsIntervalRef.current = null
    }
  }

  async function sendEmotion(participant, emotion) {
    try {
      const client = clientRef.current
      if (!client) return

      const chatClient = client.getChatClient()
      setSendingUserId(participant.userId)

      await chatClient.send(emotion, participant.userId)
      console.log(`Sent "${emotion}" to`, participant)
    } catch (e) {
      console.error(`Failed to send "${emotion}" to user ${participant.userId}:`, e)
    } finally {
      setSendingUserId(null)
    }
  }

  async function leaveSession() {
    stopParticipantsRefresh()

    try {
      await uitoolkit.leaveSession()
    } catch (e) {
      console.error(e)
    }

    clientRef.current = null
    setParticipants([])
    setJoined(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      joinSession()
    }, 0)

    return () => {
      clearTimeout(timer)
      stopParticipantsRefresh()

      try {
        uitoolkit.leaveSession()
      } catch (e) {
        console.error(e)
      }

      clientRef.current = null
    }
  }, [])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          minHeight: 0
        }}
      >
        <div
          style={{
            width: 360,
            borderRight: '1px solid #ddd',
            padding: 16,
            boxSizing: 'border-box',
            overflowX: 'auto',
            overflowY: 'auto',
            background: '#fafafa'
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Participants</h2>
          <p style={{ marginTop: 0, color: '#666' }}>
            Status: {joined ? 'joined' : 'joining...'}
          </p>

          {participants.length === 0 ? (
            <p>No other participants in the room.</p>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start'
              }}
            >
              {participants.map((participant) => {
                const participantName =
                  participant.displayName ||
                  participant.userName ||
                  participant.name ||
                  `User ${participant.userId}`

                return (
                  <div
                    key={participant.userId}
                    style={{
                      minWidth: 120,
                      padding: 12,
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      background: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                  >
                    <strong
                      style={{
                        wordBreak: 'break-word',
                        minHeight: 40
                      }}
                    >
                      {participantName}
                    </strong>

                    {EMOTIONS.map((emotion) => (
                      <button
                        key={emotion}
                        onClick={() => sendEmotion(participant, emotion)}
                        disabled={sendingUserId === participant.userId}
                        style={{
                          padding: '8px 10px',
                          border: '1px solid #ccc',
                          borderRadius: 6,
                          background: '#f5f5f5',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          opacity: sendingUserId === participant.userId ? 0.6 : 1
                        }}
                      >
                        {emotion}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0
          }}
        >
          <div
            ref={sessionContainerRef}
            style={{
              width: '100%',
              height: '100%'
            }}
          />
        </div>
      </div>
    </div>
  )
}