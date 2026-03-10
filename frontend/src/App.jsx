import { useEffect, useRef, useState } from 'react'
import uitoolkit from '@zoom/videosdk-ui-toolkit'
import '@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css'
import JoinPage from './JoinPage'

export default function App() {
  const sessionContainerRef = useRef(null)

  const [joined, setJoined] = useState(false)
  const [userName, setUserName] = useState('')

  const authEndpoint = '/signature'
  
  async function joinSession(name) {
    try {
      const config = {
        videoSDKJWT: '',
        sessionName: 'Noonchi',
        userName: name,
        role: 0,
        leaveOnPageUnload: true,
        featuresOptions: {
          video: { enable: true },
          audio: { enable: true },
          users: { enable: true },

          recording: { enable: false },
          chat: { enable: false },

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
          userIdentity: 'user-' + Math.random().toString(36).slice(2)
        })
      })

      const data = await res.json()
      config.videoSDKJWT = data.signature

      setUserName(name)
      setJoined(true)

      // wait until the meeting container is rendered
      setTimeout(() => {
        if (sessionContainerRef.current) {
          uitoolkit.joinSession(sessionContainerRef.current, config)
        }
      }, 0)
    } catch (e) {
      console.error('Failed to join session:', e)
    }
  }

  function leaveSession() {
    try {
      uitoolkit.leaveSession(sessionContainerRef.current)
    } catch (e) {
      console.error(e)
    }

    setJoined(false)
  }

  useEffect(() => {
    return () => {
      try {
        uitoolkit.leaveSession(sessionContainerRef.current)
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  if (!joined) {
    return <JoinPage onJoin={joinSession} />
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        ref={sessionContainerRef}
        style={{
          flex: 1,
          width: '100%'
        }}
      />
    </div>
  )
}