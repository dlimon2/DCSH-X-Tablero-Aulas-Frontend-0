"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

export default function TableroContainer() {
  const [currentPage, setCurrentPage] = useState(0)
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [transitioning, setTransitioning] = useState(false)

  // Datos de ejemplo para las aulas
  const aulas = [
    {
      id: 1,
      aula: "D-101",
      profesor: "Dr. Martínez López",
      materia: "Metodología de la Investigación",
      horario: "09:00 - 11:00",
      estado: "En curso",
    },
    {
      id: 2,
      aula: "D-102",
      profesor: "Dra. Sánchez Gómez",
      materia: "Teoría Social Contemporánea",
      horario: "10:00 - 12:00",
      estado: "Próxima",
    },
    {
      id: 3,
      aula: "D-103",
      profesor: "Dr. Rodríguez Pérez",
      materia: "Seminario de Tesis",
      horario: "11:00 - 13:00",
      estado: "Próxima",
    },
    {
      id: 4,
      aula: "D-201",
      profesor: "Dra. González Ruiz",
      materia: "Estadística Avanzada",
      horario: "12:00 - 14:00",
      estado: "Próxima",
    },
    {
      id: 5,
      aula: "D-202",
      profesor: "Dr. Hernández Torres",
      materia: "Economía Política",
      horario: "13:00 - 15:00",
      estado: "Próxima",
    },
    {
      id: 6,
      aula: "D-203",
      profesor: "Dra. López Vázquez",
      materia: "Análisis del Discurso",
      horario: "14:00 - 16:00",
      estado: "Próxima",
    },
    {
      id: 7,
      aula: "D-301",
      profesor: "Dr. Ramírez Silva",
      materia: "Epistemología",
      horario: "15:00 - 17:00",
      estado: "Próxima",
    },
    {
      id: 8,
      aula: "D-302",
      profesor: "Dra. Flores Mendoza",
      materia: "Estudios Culturales",
      horario: "16:00 - 18:00",
      estado: "Próxima",
    },
    {
      id: 9,
      aula: "D-303",
      profesor: "Dr. Torres Medina",
      materia: "Políticas Públicas",
      horario: "17:00 - 19:00",
      estado: "Próxima",
    },
    {
      id: 10,
      aula: "D-401",
      profesor: "Dra. Medina Castro",
      materia: "Desarrollo Sustentable",
      horario: "18:00 - 20:00",
      estado: "Próxima",
    },
    {
      id: 11,
      aula: "D-402",
      profesor: "Dr. Castro Juárez",
      materia: "Comunicación y Sociedad",
      horario: "09:00 - 11:00",
      estado: "En curso",
    },
    {
      id: 12,
      aula: "D-403",
      profesor: "Dra. Juárez Ortiz",
      materia: "Género y Sociedad",
      horario: "10:00 - 12:00",
      estado: "Próxima",
    },
    {
      id: 13,
      aula: "D-501",
      profesor: "Dr. Ortiz Vargas",
      materia: "Historia Social",
      horario: "11:00 - 13:00",
      estado: "Próxima",
    },
    {
      id: 14,
      aula: "D-502",
      profesor: "Dra. Vargas Morales",
      materia: "Antropología Urbana",
      horario: "12:00 - 14:00",
      estado: "Próxima",
    },
    {
      id: 15,
      aula: "D-503",
      profesor: "Dr. Morales Rivas",
      materia: "Sociología de la Educación",
      horario: "13:00 - 15:00",
      estado: "Próxima",
    },
    {
      id: 16,
      aula: "D-601",
      profesor: "Dra. Rivas Mendez",
      materia: "Psicología Social",
      horario: "14:00 - 16:00",
      estado: "Próxima",
    },
    {
      id: 17,
      aula: "D-602",
      profesor: "Dr. Mendez Soto",
      materia: "Filosofía Política",
      horario: "15:00 - 17:00",
      estado: "Próxima",
    },
    {
      id: 18,
      aula: "D-603",
      profesor: "Dra. Soto Vega",
      materia: "Derecho Constitucional",
      horario: "16:00 - 18:00",
      estado: "Próxima",
    },
  ]

  // Número de aulas por página
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
    if (transitioning) return

    const next = (currentPage + 1) % totalPages
    setNextPage(next)
    setTransitioning(true)

    // Después de que termine la animación, actualizar la página actual
    setTimeout(() => {
      setCurrentPage(next)
      setNextPage(null)
      setTransitioning(false)
    }, 800) // Debe coincidir con la duración de la animación CSS
  }

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

  // Calcular segundos restantes para la próxima actualización
  const secondsRemaining = 20 - (Math.floor(Date.now() / 1000) % 20)

  // Renderizar tabla de aulas
  const renderAulasTable = (aulas: typeof getAulasForPage extends (arg: any) => infer R ? R : never) => {
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

          {/* Filas vacías para mantener altura consistente */}
          {Array.from({ length: aulasPerPage - aulas.length }).map((_, index) => (
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

      {/* Tabla de aulas */}
      <div className="container mx-auto p-4">
        <div className="transition-container" style={{ height: `${aulasPerPage * 52 + 56}px` }}>
          {/* Página actual */}
          <div className={`transition-page current ${transitioning ? "slide-out-up" : ""}`}>
            {renderAulasTable(getAulasForPage(currentPage))}
          </div>

          {/* Página siguiente (solo visible durante la transición) */}
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
