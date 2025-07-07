import { useState, useEffect, useRef } from 'react'

// Tipos para los datos de la API
export interface TimeSlot {
  program: string
  subject: string
  professor: string
  time: string
  status: 'available' | 'occupied'
}

export interface Classroom {
  number: string
  building: string
  name: string
  capacity: number
  schedule_for_day: TimeSlot[]
  last_updated: string
}

export interface ClassroomData {
  timestamp: string
  classrooms: Classroom[]
  total_classrooms: number
  current_time: string
  current_day: string
  last_updated: string
}

interface WebSocketMessage {
  type: string
  data: ClassroomData
}

export const useWebSocket = (url: string) => {
  const [data, setData] = useState<ClassroomData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxReconnectAttempts = 5
  const reconnectAttempts = useRef(0)

  const connect = () => {
    try {
      ws.current = new WebSocket(url)
      
      ws.current.onopen = () => {
        console.log('WebSocket conectado')
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          if (message.type === 'classrooms_update') {
            setData(message.data)
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.current.onclose = () => {
        console.log('WebSocket desconectado')
        setIsConnected(false)
        
        // Intentar reconectar si no se ha alcanzado el límite
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          console.log(`Intentando reconectar... (${reconnectAttempts.current}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 3000) // Esperar 3 segundos antes de reconectar
        } else {
          setError('No se pudo conectar al servidor después de varios intentos')
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('Error en la conexión WebSocket')
      }

    } catch (err) {
      console.error('Error al crear WebSocket:', err)
      setError('Error al crear la conexión WebSocket')
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (ws.current) {
      ws.current.close()
    }
  }

  const sendMessage = (message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message)
    }
  }

  // Enviar ping cada 30 segundos para mantener la conexión activa
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (isConnected) {
        sendMessage('ping')
      }
    }, 30000)

    return () => clearInterval(pingInterval)
  }, [isConnected])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [url])

  return {
    data,
    isConnected,
    error,
    reconnect: connect,
    disconnect,
    sendMessage
  }
}