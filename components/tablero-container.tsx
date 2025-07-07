"use client"

import { useEffect, useRef, useState } from "react"
import { Clock } from "lucide-react"

export default function TableroContainer() {
  const [currentPage, setCurrentPage] = useState(0)
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [transitioning, setTransitioning] = useState(false)

  const transitioningRef = useRef(false)
  const currentPageRef = useRef(0)

  const aulas = [/* ... mismo arreglo de aulas ... */]

  const aulasPerPage = 9
  const totalPages = Math.ceil(aulas.length / aulasPerPage)

  // Cambiar página automáticamente cada 20 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      changePage()
    }, 20000)

    return () => clearInterval(interval)
  }, [totalPages])

  // Actualizar reloj cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Función para cambiar de página con animación
  const changePage = () => {
    if (transitioningRef.current) return

    const next = (currentPageRef.current + 1) % totalPages
    setNextPage(next)
    setTransitioning(true)
    transitioningRef.current = true

    setTimeout(() => {
      setCurrentPage(next)
      currentPageRef.current = next
      setNextPage(null)
      setTransitioning(false)
      transitioningRef.current = false
    }, 800)
  }

  const getAulasForPage = (page: number) => {
    return aulas.slice(page * aulasPerPage, (page + 1) * aulasPerPage)
  }

  const formattedTime = currentTime.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const formattedDate = currentTime.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const secondsRemaining = 20 - (Math.floor(Date.now() / 1000) % 20)

  const renderAulasTable = (
    aulas: typeof getAulasForPage extends (arg: any) => infer R ? R : never
  ) => {
    return (
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#0971ce]/80 text-white">
            <th className="p-3 text-left border-b-2 border-gray-700 w-1/6">Aula</th>
            <th className="p-3 text-left border-b-2 border-gray-700 w-1/5">Profesor</th>
            <th className="p-3 text-left border-b-2 border-gray-700 w-2/5">Materia</th>
            <th className="p-3 text-left border-b-2 border-gray-700 w-1/6">Horario</th>
            <th className="p-3 text-left border-b-2 border-gray-700 w-1/6">Estado</th>
          </tr>
        </thead>
        <tbody>
          {aulas.map((aula) => (
            <tr key={aula.id} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
              <td className="p-3 text-xl font-bold">{aula.aula}</td>
              <td className="p-3">{aula.profesor}</td>
              <td className="p-3">{aula.materia}</td>
              <td className="p-3">{aula.horario}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded ${aula.estado === "En curso" ? "bg-green-600" : "bg-yellow-600"}`}>
                  {aula.estado}
                </span>
              </td>
            </tr>
          ))}

          {/* Filas vacías para altura constante */}
          {Array.from({ length: aulasPerPage - aulas.length % aulasPerPage || aulasPerPage }).map((_, index) => (
            <tr key={`empty-${index}`} className="border-b border-gray-700">
              <td className="p-3 h-[52px]">&nbsp;</td>
              <td className="p-3">&nbsp;</td>
              <td className="p-3">&nbsp;</td>
              <td className="p-3">&nbsp;</td>
              <td className="p-3">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-[Arial,sans-serif]">
      {/* Encabezado */}
      <header className="bg-[#0971ce] p-4 flex justify-between items-center">
        <h1 className="text-2xl md:text-4xl font-bold">DCSH Posgrados - UAM Xochimilco</h1>
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6" />
          <div>
            <div className="text-xl font-bold">{formattedTime}</div>
            <div className="text-sm capitalize">{formattedDate}</div>
          </div>
        </div>
      </header>

      {/* Tabla */}
      <div className="container mx-auto p-4">
        <div className="transition-container" style={{ height: `${aulasPerPage * 52 + 56}px` }}>
          <div className={`transition-page current ${transitioning ? "slide-out-up" : ""}`}>
            {renderAulasTable(getAulasForPage(currentPage))}
          </div>
          {nextPage !== null && (
            <div className="transition-page slide-in-up">{renderAulasTable(getAulasForPage(nextPage))}</div>
          )}
        </div>

        {/* Paginación */}
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${currentPage === index ? "bg-[#0971ce]" : "bg-gray-600"}`}
              />
            ))}
          </div>
        </div>

        {/* Pie de página */}
        <div className="mt-8 text-center text-gray-400">
          <p>
            Página {currentPage + 1} de {totalPages} • Próxima actualización en {secondsRemaining} segundos
          </p>
        </div>
      </div>
    </div>
  )
}
