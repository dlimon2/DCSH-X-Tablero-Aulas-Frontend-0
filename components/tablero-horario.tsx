"use client"

import { useEffect, useRef, useState } from "react"
import { Clock, Wifi, WifiOff, AlertCircle } from "lucide-react"

// Tipos para los datos de la API
interface TimeSlot {
  program: string
  subject: string
  professor: string
  time: string
  status: 'available' | 'occupied'
}

interface Classroom {
  number: string
  building: string
  name: string
  capacity: number
  schedule_for_day: TimeSlot[]
  last_updated: string
}

interface ClassroomData {
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

// Hook para WebSocket
const useWebSocket = (url: string) => {
  const [data, setData] = useState<ClassroomData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ws = new WebSocket(url)
    
    ws.onopen = () => {
      console.log('WebSocket conectado')
      setIsConnected(true)
      setError(null)
    }

    ws.onmessage = (event) => {
        try {
          // Validar si es JSON antes de parsear
          if (typeof event.data !== "string" || !event.data.trim().startsWith("{")) {
            console.warn("WebSocket ignorado (no es JSON):", event.data)
            return
          }
      
          const message: WebSocketMessage = JSON.parse(event.data)
      
          if (message.type === "classrooms_update") {
            setData(message.data)
          }
        } catch (err) {
          console.error("Error al parsear WebSocket:", err, event.data)
        }
      }

    ws.onclose = () => {
      console.log('WebSocket desconectado')
      setIsConnected(false)
      
      // Intentar reconectar después de 3 segundos
      setTimeout(() => {
        console.log('Intentando reconectar...')
      }, 3000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setError('Error en la conexión WebSocket')
      setIsConnected(false)
    }

    // Enviar ping cada 30 segundos para mantener la conexión activa
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 30000)

    return () => {
      clearInterval(pingInterval)
      ws.close()
    }
  }, [url])

  return { data, isConnected, error }
}

export default function TableroHorario() {
  const [currentPage, setCurrentPage] = useState(0)
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [transitioning, setTransitioning] = useState(false)

  // Referencias para evitar closure problems
  const transitioningRef = useRef(false)
  const currentPageRef = useRef(0)
  const totalPagesRef = useRef(0)

  // Conectar al WebSocket
  const { data: classroomData, isConnected, error } = useWebSocket('ws://localhost:8000/ws')

  // Actualizar reloj cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const parseTimeSlots = (timeSlots: TimeSlot[]) => {
    const mergedSlots = []
  
    let currentSlot: TimeSlot | null = null
    let startTime = ""
    let endTime = ""
  
    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i]
      const nextSlot = timeSlots[i + 1]
  
      if (!currentSlot) {
        currentSlot = slot
        startTime = slot.time.split("-")[0]
        endTime = slot.time.split("-")[1]
      } else {
        // ¿Es igual al anterior?
        const sameClass =
          slot.program === currentSlot.program &&
          slot.subject === currentSlot.subject &&
          slot.professor === currentSlot.professor &&
          slot.status === currentSlot.status
  
        if (sameClass) {
          // Extiende el horario de fin
          endTime = slot.time.split("-")[1]
        } else {
          // Guarda el bloque anterior
          mergedSlots.push({
            program: currentSlot.program,
            subject: currentSlot.subject,
            professor: currentSlot.professor,
            time: `${startTime}-${endTime}`,
            status: currentSlot.status
          })
          currentSlot = slot
          startTime = slot.time.split("-")[0]
          endTime = slot.time.split("-")[1]
        }
      }
  
      // Último bloque
      if (i === timeSlots.length - 1 && currentSlot) {
        mergedSlots.push({
          program: currentSlot.program,
          subject: currentSlot.subject,
          professor: currentSlot.professor,
          time: `${startTime}-${endTime}`,
          status: currentSlot.status
        })
      }
    }
  
    // Mismo procesamiento que antes
    return mergedSlots
      .map((slot, index) => {
        const [startTime, endTime] = slot.time.split('-')
        const startHour = parseInt(startTime.split(':')[0])
        const startMinute = parseInt(startTime.split(':')[1])
        const endHour = parseInt(endTime.split(':')[0])
        const endMinute = parseInt(endTime.split(':')[1])
  
        return {
          id: index,
          aula: '',
          materia: slot.subject || slot.program.split(' ').slice(1).join(' ') || 'Sin materia',
          profesor: slot.professor || 'No especificado',
          horaInicio: startHour + startMinute / 60,
          horaFin: endHour + endMinute / 60,
          estado: slot.status === 'occupied' ? 'En curso' : 'Disponible',
          programa: slot.program.split(' ')[0] || ''
        }
      })
      .filter(slot => slot.materia !== 'Sin materia' && slot.programa !== '')
  }

  // Obtener aulas de los datos del WebSocket
  const getAulasFromData = () => {
    if (!classroomData) return []
    
    return classroomData.classrooms.map(classroom => ({
      nombre: classroom.name,
      numero: classroom.number,
      edificio: classroom.building,
      capacidad: classroom.capacity,
      clases: parseTimeSlots(classroom.schedule_for_day).map(clase => ({
        ...clase,
        aula: classroom.name
      }))
    }))
  }

  const aulas = getAulasFromData()
  const aulasPerPage = 6
  const totalPages = Math.ceil(aulas.length / aulasPerPage)

  // Actualizar referencias cuando cambien los valores
  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

  useEffect(() => {
    totalPagesRef.current = totalPages
  }, [totalPages])

  useEffect(() => {
    transitioningRef.current = transitioning
  }, [transitioning])

  // Función para cambiar de página con animación
  const changePage = () => {
    if (transitioningRef.current || totalPagesRef.current <= 1) return

    const next = (currentPageRef.current + 1) % totalPagesRef.current
    setNextPage(next)
    setTransitioning(true)

    setTimeout(() => {
      setCurrentPage(next)
      setNextPage(null)
      setTransitioning(false)
    }, 800)
  }

  // Cambiar página automáticamente cada 20 segundos
  useEffect(() => {
    if (totalPages <= 1) return

    const interval = setInterval(() => {
      changePage()
    }, 20000)

    return () => clearInterval(interval)
  }, [totalPages]) // Mantener totalPages como dependencia

  // Obtener aulas para una página específica
  const getAulasForPage = (page: number) => {
    return aulas.slice(page * aulasPerPage, (page + 1) * aulasPerPage)
  }

  // Formatear hora actual
  const formattedTime = currentTime.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  // Formatear fecha actual
  const formattedDate = currentTime.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Obtener la hora actual en formato decimal
  const horaActual = currentTime.getHours() + currentTime.getMinutes() / 60

  // Generar horas para las columnas (de 7 a 21)
  const horas = Array.from({ length: 14 }, (_, i) => i + 7)

  // Renderizar tabla de horarios
  const renderHorarioTable = (aulasPage: any[]) => {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0971ce]/80 text-white">
              <th className="p-3 text-left border-b-2 border-gray-700 w-[120px] sticky left-0 z-10 bg-[#0971ce]/80">
                Aula
              </th>
              {horas.map((hora) => (
                <th
                  key={hora}
                  className={`p-2 text-center border-b-2 border-gray-700 min-w-[80px] ${
                    Math.floor(horaActual) === hora
                      ? "bg-[#0971ce] relative after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0 after:border-l-[8px] after:border-l-transparent after:border-r-[8px] after:border-r-transparent after:border-t-[8px] after:border-t-[#0971ce]"
                      : ""
                  }`}
                >
                  {hora}:00
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aulasPage.map((aula, index) => (
              <tr key={`${aula.numero}-${index}`} className="border-b border-gray-700">
                <td className="p-3 text-xl font-bold sticky left-0 z-10 bg-gray-900">
                  <div className="flex flex-col">
                    <span className="text-lg">{aula.nombre}</span>
                    <span className="text-sm text-gray-400">Cap: {aula.capacidad}</span>
                  </div>
                </td>
                <td colSpan={horas.length} className="p-0 relative" style={{ height: '80px' }}>
                  {/* Columna resaltada para la hora actual */}
                  {horas.map((hora) => (
                    <div
                      key={hora}
                      className={`absolute top-0 bottom-0 ${
                        Math.floor(horaActual) === hora ? "bg-[#0971ce]/10 z-0" : ""
                      }`}
                      style={{
                        left: `${((hora - 7) / horas.length) * 100}%`,
                        width: `${(1 / horas.length) * 100}%`,
                      }}
                    />
                  ))}
                  {/* Indicador de tiempo actual */}
                  {Math.floor(horaActual) >= 7 && Math.floor(horaActual) <= 20 && (
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-20"
                      style={{
                        left: `${((Math.floor(horaActual) - 7 + currentTime.getMinutes() / 60) / horas.length) * 100}%`,
                      }}
                    />
                  )}
                  {aula.clases.map((clase: any) => {
                    const inicioCol = clase.horaInicio - 7
                    const duracion = clase.horaFin - clase.horaInicio
                    const esActual = clase.horaInicio <= horaActual && clase.horaFin > horaActual

                    return (
                      <div
                        key={`${clase.id}-${index}`}
                        className={`absolute top-0 bottom-0 p-1 border border-gray-600 rounded-md overflow-hidden ${
                          esActual
                            ? "bg-green-600"
                            : clase.estado === "Disponible"
                              ? "bg-gray-700"
                              : "bg-[#0971ce]/80"
                        }`}
                        style={{
                          left: `${(inicioCol / horas.length) * 100}%`,
                          width: `${(duracion / horas.length) * 100}%`,
                          minHeight: "80px",
                        }}
                      >
                        <div className="text-xs font-bold text-orange-200 mb-1">{clase.programa}</div>
                        <div className="text-sm font-bold truncate">{clase.materia}</div>
                        <div className="text-xs truncate">{clase.profesor}</div>
                        <div className="text-xs">
                          {Math.floor(clase.horaInicio).toString().padStart(2, '0')}:
                          {Math.floor((clase.horaInicio % 1) * 60).toString().padStart(2, '0')}
                          {" - "}
                          {Math.floor(clase.horaFin).toString().padStart(2, '0')}:
                          {Math.floor((clase.horaFin % 1) * 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                    )
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-[Arial,sans-serif]">
      {/* Encabezado */}
      <header className="bg-[#0971ce] p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold">DCSH Posgrados - UAM Xochimilco</h1>
          <p className="text-sm opacity-80">
            Tablero de aulas en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Indicador de conexión */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-300">
                <Wifi className="h-4 w-4" />
                <span className="text-sm">Conectado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-300">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm">Desconectado</span>
              </div>
            )}
          </div>
          
          {/* Reloj */}
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6" />
            <div>
              <div className="text-xl font-bold">{formattedTime}</div>
              <div className="text-sm capitalize">{formattedDate}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="container mx-auto p-4">
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {!classroomData ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0971ce] mx-auto mb-4"></div>
              <p className="text-gray-400">Cargando datos del tablero...</p>
            </div>
          </div>
        ) : aulas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No hay aulas disponibles en este momento</p>
          </div>
        ) : (
          <>
            {/* Tabla de horarios */}
            <div className="transition-container" style={{ minHeight: `${aulasPerPage * 80}px` }}>
              <div className={`transition-page current ${transitioning ? "slide-out-up" : ""}`}>
                {renderHorarioTable(getAulasForPage(currentPage))}
              </div>

              {nextPage !== null && (
                <div className="transition-page slide-in-up">
                  {renderHorarioTable(getAulasForPage(nextPage))}
                </div>
              )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full ${
                        currentPage === index ? "bg-[#0971ce]" : "bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Pie de página */}
        <div className="mt-8 text-center text-gray-400">
          <p className="flex items-center justify-center gap-2">
            <span>
              {classroomData ? 
                `Mostrando ${aulas.length} de ${classroomData.total_classrooms} aulas` :
                'Cargando...'
              }
            </span>
            {totalPages > 1 && (
              <>
                <span>•</span>
                <span>Página {currentPage + 1} de {totalPages}</span>
              </>
            )}
          </p>
          {classroomData && (
            <p className="text-sm mt-2 opacity-70">
              Última actualización: {new Date(classroomData.last_updated).toLocaleString('es-MX')}
            </p>
          )}
        </div>
      </div>

      {/* Estilos para las animaciones */}
      <style jsx>{`
        .transition-container {
          position: relative;
          overflow: hidden;
        }

        .transition-page {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
          backface-visibility: hidden;
        }

        .transition-page.current {
          position: relative;
          transform: translateY(0);
          z-index: 1;
        }

        .transition-page.slide-out-up {
          transform: translateY(-100%);
          z-index: 0;
        }

        .transition-page.slide-in-up {
          transform: translateY(100%);
          z-index: 2;
          animation: slideInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes slideInUp {
          0% {
            transform: translateY(100%);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}