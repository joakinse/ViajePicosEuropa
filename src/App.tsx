import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Todo = {
  id: string
  text: string
  done: boolean
  created_at?: string
}

type ScheduleItem = {
  time: string
  title: string
  text: string
}

type RouteOption = {
  name: string
  tag: string
  text: string
  details: string[]
}

type DayPlan = {
  id: string
  date: string
  title: string
  short: string
  image: string
  imageAlt: string
  schedule: ScheduleItem[]
  notes?: string[]
  options?: RouteOption[]
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const hasSupabase = Boolean(supabaseUrl && supabaseKey)
const localStorageKey = 'viaje-picos-europa-todos'

const initialTodos: Todo[] = [
  { id: 'bus-lagos', text: 'Reservar bus de Lagos de Covadonga para el domingo 19 a primera hora.', done: false },
  { id: 'teleferico-fuente-de', text: 'Reservar teleférico de Fuente Dé para el lunes 20 entre 09:00 y 10:00.', done: false },
  { id: 'mesa-final', text: 'Llamar o reservar mesa en Potes para cenar viendo la final del Mundial.', done: false },
  { id: 'meteo-picos', text: 'Revisar la previsión antes de decidir entre Áliva y Horcados Rojos.', done: false },
]

const mondayOptions: RouteOption[] = [
  {
    name: 'Miradores de El Cable',
    tag: 'Suave',
    text: 'Para cansancio, niebla o si preferís un día contemplativo.',
    details: ['1-2 h arriba.', 'Dificultad baja.', 'Deja mucha tarde para Mogrovejo, Santo Toribio y Potes.'],
  },
  {
    name: 'El Cable → Hotel Áliva → vuelta',
    tag: 'Base',
    text: 'La opción equilibrada: montaña bonita sin complicaros.',
    details: ['Unos 7 km ida y vuelta.', '2h30-3h30 con paradas.', 'Dificultad baja/media.'],
  },
  {
    name: 'Horcados Rojos',
    tag: 'Montañera',
    text: 'La ruta seria si el día sale despejado y os levantáis con energía.',
    details: ['Unos 11 km ida y vuelta.', '5-6 h con paradas.', 'Dificultad media-alta. No subestimar terreno, viento o niebla.'],
  },
]

const days: DayPlan[] = [
  {
    id: 'viernes',
    date: 'Viernes 17',
    title: 'Madrid → Cangas / alrededores',
    short: 'Viaje en coche, llegada tranquila, check-in y cena cerca de Cangas.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Carretera al atardecer para representar el viaje en coche',
    schedule: [
      { time: '14:30', title: 'Salida de Madrid', text: 'Salir sin meter más planes en el día. La prioridad es llegar con calma.' },
      { time: '20:00-21:00', title: 'Llegada y check-in', text: 'Hora razonable de llegada a Cangas o alrededores según tráfico y paradas.' },
      { time: '21:00', title: 'Cena y paseo corto', text: 'Cena cerca del alojamiento. Si no llegáis tarde, paseo breve por Cangas.' },
    ],
    notes: ['No añadiría nada más: este día es para llegar, cenar y descansar.'],
  },
  {
    id: 'sabado',
    date: 'Sábado 18',
    title: 'Sella + Ribadesella + Cangas',
    short: 'Descenso del Sella por la mañana, Ribadesella por la tarde y Cangas de noche.',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Río entre montañas para representar el descenso del Sella',
    schedule: [
      { time: '09:45-10:00', title: 'Salida hacia Arriondas', text: 'Ir hacia la empresa del Sella con margen suficiente.' },
      { time: '10:30-15:30', title: 'Descenso del Sella', text: 'Descenso, comida y cambio. Día largo asumido, sin prisas después.' },
      { time: '16:00-19:00', title: 'Ribadesella', text: 'Paseo marítimo, playa de Santa Marina, puerto, casco histórico y mirador de la Ermita de la Guía.' },
      { time: '19:30-20:00', title: 'Vuelta a Cangas', text: 'Regreso para ducha y descanso.' },
      { time: '21:00', title: 'Cangas de noche', text: 'Puente romano, centro y sidrería. Cangas queda como plan de noche, no como visita extensa.' },
    ],
  },
  {
    id: 'domingo',
    date: 'Domingo 19',
    title: 'Lagos + Covadonga + traslado + final',
    short: 'Lagos de Covadonga temprano, santuario, traslado a Potes y final del Mundial cenando.',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Lago de montaña para representar Lagos de Covadonga',
    schedule: [
      { time: '07:30', title: 'Salida del alojamiento', text: 'Ir directos al parking o punto de bus.' },
      { time: '07:45-08:00', title: 'Parking / bus', text: 'Estar listos para subir pronto. Reservar bus con antelación.' },
      { time: '08:00-08:30', title: 'Bus a Lagos', text: 'Objetivo: estar arriba sobre 08:30-09:00.' },
      { time: '09:00-12:00', title: 'Ruta circular por Lagos', text: 'Lago Enol, Lago Ercina, Mirador Entrelagos y Minas de Buferrera.' },
      { time: '12:00-13:00', title: 'Bajada', text: 'Bajar con margen para no encajar mal comida y traslado.' },
      { time: '13:00-13:45', title: 'Santuario de Covadonga', text: 'Visita concentrada, sin convertirlo en un plan largo.' },
      { time: '14:00-15:15', title: 'Comida', text: 'Comer antes del traslado hacia Liébana.' },
      { time: '15:30-18:00', title: 'Traslado a Potes o alrededores', text: 'La carretera hacia Liébana puede hacerse lenta. Mejor no apurar.' },
      { time: '18:00-20:30', title: 'Check-in y descanso', text: 'Aparcar, ducha, paseo corto o descanso.' },
      { time: '21:00', title: 'Final del Mundial', text: 'Cena viendo el partido. Si España llega, reservar mesa o llamar por la mañana.' },
    ],
  },
  {
    id: 'lunes',
    date: 'Lunes 20',
    title: 'Fuente Dé + Liébana',
    short: 'Teleférico temprano y decisión en altura entre miradores, Áliva u Horcados Rojos.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Montañas altas para representar Fuente Dé y Picos de Europa',
    schedule: [
      { time: '09:00-10:00', title: 'Teleférico de Fuente Dé', text: 'Reservar franja de primera hora: 09:00-09:30 o 09:30-10:00.' },
      { time: 'Mañana', title: 'Elegir ruta arriba', text: 'Decidir según clima, cansancio y visibilidad. Si hay niebla, viento o cansancio fuerte, bajar a opción suave o media.' },
      { time: 'Tarde', title: 'Mogrovejo / Santo Toribio / Potes', text: 'Si hacéis opción 1 o 2, cabe todo con calma. Si hacéis Horcados Rojos, priorizar Mogrovejo y Potes.' },
      { time: 'Noche', title: 'Cena tranquila', text: 'No meter planes por obligación después de una ruta larga.' },
    ],
    options: mondayOptions,
  },
  {
    id: 'martes',
    date: 'Martes 21',
    title: 'Desfiladero + vuelta a Madrid',
    short: 'Desfiladero de la Hermida, Mirador de Santa Catalina, comida y vuelta sin apurar.',
    image: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Desfiladero y carretera de montaña para representar la Hermida',
    schedule: [
      { time: '10:00', title: 'Salida', text: 'Empezar sin prisa, especialmente si el lunes fue montañero.' },
      { time: '10:45-12:30', title: 'Hermida + Santa Catalina', text: 'Desfiladero de la Hermida y Mirador de Santa Catalina.' },
      { time: '13:00-14:30', title: 'Comida', text: 'Última comida del viaje antes de carretera.' },
      { time: '15:00-16:00', title: 'Salida hacia Madrid', text: 'No apurar demasiado el regreso.' },
      { time: '21:00-22:30', title: 'Llegada aproximada', text: 'Llegada estimada a Madrid según tráfico y paradas.' },
    ],
  },
]

function getSupabaseHeaders() {
  return {
    apikey: supabaseKey ?? '',
    Authorization: `Bearer ${supabaseKey ?? ''}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

async function loadTodos() {
  if (!hasSupabase) {
    const savedTodos = window.localStorage.getItem(localStorageKey)
    return savedTodos ? (JSON.parse(savedTodos) as Todo[]) : initialTodos
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/todos?select=*&order=created_at.asc`, {
    headers: getSupabaseHeaders(),
  })

  if (!response.ok) {
    throw new Error('No se pudieron cargar las tareas.')
  }

  const todos = (await response.json()) as Todo[]

  if (todos.length > 0) {
    return todos
  }

  const seedResponse = await fetch(`${supabaseUrl}/rest/v1/todos`, {
    method: 'POST',
    headers: getSupabaseHeaders(),
    body: JSON.stringify(initialTodos),
  })

  if (!seedResponse.ok) {
    throw new Error('No se pudieron crear las tareas iniciales.')
  }

  return (await seedResponse.json()) as Todo[]
}

async function createTodo(text: string) {
  const newTodo: Todo = { id: crypto.randomUUID(), text, done: false }

  if (!hasSupabase) {
    return newTodo
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/todos`, {
    method: 'POST',
    headers: getSupabaseHeaders(),
    body: JSON.stringify(newTodo),
  })

  if (!response.ok) {
    throw new Error('No se pudo crear la tarea.')
  }

  const [createdTodo] = (await response.json()) as Todo[]
  return createdTodo
}

async function updateTodo(todo: Todo) {
  if (!hasSupabase) {
    return todo
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/todos?id=eq.${todo.id}`, {
    method: 'PATCH',
    headers: getSupabaseHeaders(),
    body: JSON.stringify({ done: todo.done }),
  })

  if (!response.ok) {
    throw new Error('No se pudo actualizar la tarea.')
  }

  const [updatedTodo] = (await response.json()) as Todo[]
  return updatedTodo
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodoText, setNewTodoText] = useState('')
  const [status, setStatus] = useState('Cargando tareas...')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let ignore = false

    const refreshTodos = async () => {
      try {
        const loadedTodos = await loadTodos()
        if (!ignore) {
          setTodos(loadedTodos)
          setStatus(hasSupabase ? 'Tareas sincronizadas para todos.' : 'Modo local: añade Supabase para compartirlas.')
        }
      } catch (error) {
        if (!ignore) {
          setStatus(error instanceof Error ? error.message : 'Error al cargar las tareas.')
        }
      }
    }

    void refreshTodos()
    const intervalId = window.setInterval(refreshTodos, 10000)

    return () => {
      ignore = true
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (!hasSupabase && todos.length > 0) {
      window.localStorage.setItem(localStorageKey, JSON.stringify(todos))
    }
  }, [todos])

  async function handleAddTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedText = newTodoText.trim()

    if (!trimmedText) {
      return
    }

    setIsSaving(true)

    try {
      const todo = await createTodo(trimmedText)
      setTodos((currentTodos) => [...currentTodos, todo])
      setNewTodoText('')
      setStatus(hasSupabase ? 'Tarea añadida y compartida.' : 'Tarea añadida en este navegador.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Error al crear la tarea.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleTodo(todo: Todo) {
    const updatedTodo = { ...todo, done: !todo.done }
    setTodos((currentTodos) => currentTodos.map((item) => (item.id === todo.id ? updatedTodo : item)))

    try {
      await updateTodo(updatedTodo)
      setStatus(hasSupabase ? 'Tarea actualizada para todos.' : 'Tarea actualizada en local.')
    } catch (error) {
      setTodos((currentTodos) => currentTodos.map((item) => (item.id === todo.id ? todo : item)))
      setStatus(error instanceof Error ? error.message : 'Error al actualizar la tarea.')
    }
  }

  function handleDayChange(dayId: string) {
    document.getElementById(dayId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main>
      <nav className="topbar" aria-label="Navegación principal">
        <a href="#resumen">Resumen</a>
        <label>
          <span>Día</span>
          <select defaultValue="" onChange={(event) => handleDayChange(event.target.value)}>
            <option value="" disabled>Ver detalle</option>
            {days.map((day) => (
              <option value={day.id} key={day.id}>{day.date}</option>
            ))}
          </select>
        </label>
        <a href="#tareas">Tareas</a>
      </nav>

      <section className="hero-section" id="inicio">
        <p className="eyebrow">17-21 julio · Asturias y Cantabria</p>
        <h1>Viaje a Picos de Europa</h1>
      </section>

      <section className="section" id="resumen">
        <div className="section-heading">
          <p className="eyebrow">Vista rápida</p>
          <h2>Qué hacemos cada día</h2>
          <p>Un resumen corto para ubicarse. El detalle completo está más abajo, día por día, con horario.</p>
        </div>
        <div className="summary-grid">
          {days.map((day) => (
            <a className="summary-card" href={`#${day.id}`} key={day.id}>
              <img src={day.image} alt={day.imageAlt} loading="lazy" />
              <div>
                <span>{day.date}</span>
                <h3>{day.title}</h3>
                <p>{day.short}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="section details-section" id="detalle">
        <div className="section-heading">
          <p className="eyebrow">Horario detallado</p>
          <h2>Detalle por días</h2>
        </div>

        <div className="day-details">
          {days.map((day) => (
            <article className="detail-card" id={day.id} key={day.id}>
              <img className="detail-image" src={day.image} alt={day.imageAlt} loading="lazy" />
              <div className="detail-content">
                <p className="eyebrow">{day.date}</p>
                <h3>{day.title}</h3>
                <p className="summary">{day.short}</p>
                <div className="schedule">
                  {day.schedule.map((item) => (
                    <div className="schedule-item" key={`${day.id}-${item.time}-${item.title}`}>
                      <time>{item.time}</time>
                      <div>
                        <h4>{item.title}</h4>
                        <p>{item.text}</p>
                        {day.id === 'lunes' && item.time === 'Mañana' && day.options ? (
                          <div className="option-grid">
                            {day.options.map((option) => (
                              <section className="option-card" key={option.name}>
                                <span>{option.tag}</span>
                                <h5>{option.name}</h5>
                                <p>{option.text}</p>
                                <ul>
                                  {option.details.map((detail) => (
                                    <li key={detail}>{detail}</li>
                                  ))}
                                </ul>
                              </section>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                {day.notes?.map((note) => (
                  <p className="note" key={note}>{note}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section todos-section" id="tareas">
        <div className="section-heading">
          <p className="eyebrow">Compartido</p>
          <h2>To-dos del viaje</h2>
          <p>{status}</p>
        </div>

        <form className="todo-form" onSubmit={handleAddTodo}>
          <label htmlFor="new-todo">Nueva tarea</label>
          <div>
            <input
              id="new-todo"
              type="text"
              value={newTodoText}
              onChange={(event) => setNewTodoText(event.target.value)}
              placeholder="Ej. Comprar snacks para el coche"
            />
            <button type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Añadir'}</button>
          </div>
        </form>

        <ul className="todo-list">
          {todos.map((todo) => (
            <li className={todo.done ? 'done' : ''} key={todo.id}>
              <label>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => void handleToggleTodo(todo)}
                />
                <span>{todo.text}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
