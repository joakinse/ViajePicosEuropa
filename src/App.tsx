import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Todo = {
  id: string
  text: string
  done: boolean
  created_at?: string
}

type DayPlan = {
  date: string
  title: string
  badge: string
  summary: string
  schedule: string[]
  notes?: string[]
}

type RouteOption = {
  name: string
  tag: string
  description: string
  details: string[]
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

const days: DayPlan[] = [
  {
    date: 'Viernes 17',
    title: 'Madrid → Cangas / alrededores',
    badge: 'Llegada tranquila',
    summary: 'Salida a las 14:30 y llegada razonable entre 20:00 y 21:00.',
    schedule: ['Check-in en el alojamiento.', 'Cena en Cangas o cerca.', 'Paseo corto si no llegáis tarde.'],
    notes: ['No tocaría nada más: llegar, cenar y descansar.'],
  },
  {
    date: 'Sábado 18',
    title: 'Sella + Ribadesella + Cangas',
    badge: 'Día largo',
    summary: 'Mantenerlo todo con mentalidad de jornada completa y noche en Cangas.',
    schedule: [
      '09:45-10:00 salida hacia Arriondas / empresa del Sella.',
      '10:30-15:30 descenso del Sella, comida y cambio.',
      '16:00-19:00 Ribadesella: paseo marítimo, Santa Marina, puerto, casco histórico y Ermita de la Guía.',
      '19:30-20:00 vuelta a Cangas.',
      '20:00-21:00 ducha y descanso.',
      '21:00 en adelante: puente romano, centro y sidrería.',
    ],
  },
  {
    date: 'Domingo 19',
    title: 'Lagos + Covadonga + traslado + final',
    badge: 'Reservar bus',
    summary: 'Día eficiente, sin obsesionarse con llegar a las 18:00 si cenáis viendo el partido.',
    schedule: [
      '07:30 salida del alojamiento.',
      '07:45-08:00 estar en parking o punto de bus.',
      '08:00-08:30 bus a Lagos.',
      '09:00-12:00 ruta circular: Enol, Ercina, Entrelagos y Minas de Buferrera.',
      '12:00-13:00 bajada.',
      '13:00-13:45 Santuario de Covadonga.',
      '14:00-15:15 comida.',
      '15:30-18:00 traslado hacia Potes o alrededores.',
      '18:00-20:30 check-in, ducha, paseo corto o descanso.',
      '21:00 cena viendo la final del Mundial.',
    ],
    notes: ['Intentad no apurar: la carretera hacia Liébana puede hacerse lenta y conviene localizar sitio con calma.'],
  },
  {
    date: 'Lunes 20',
    title: 'Fuente Dé con tres opciones abiertas',
    badge: 'Teleférico temprano',
    summary: 'Reservar una franja 09:00-09:30 o 09:30-10:00 para mantener abierta la ruta larga.',
    schedule: [
      'Subida en teleférico según franja reservada.',
      'Decidir ruta final según clima, cansancio y visibilidad.',
      'Tarde adaptable: Mogrovejo, Santo Toribio de Liébana, Potes y cena tranquila.',
    ],
  },
  {
    date: 'Martes 21',
    title: 'Desfiladero + vuelta a Madrid',
    badge: 'No cargar demasiado',
    summary: 'Cerrar el viaje sin apurar, especialmente si el lunes fue montañero.',
    schedule: [
      '10:00 salida.',
      '10:45-12:30 Desfiladero de la Hermida y Mirador de Santa Catalina.',
      '13:00-14:30 comida.',
      '15:00-16:00 salida hacia Madrid.',
      '21:00-22:30 llegada aproximada.',
    ],
  },
]

const routeOptions: RouteOption[] = [
  {
    name: 'Opción 1: miradores de El Cable',
    tag: 'Suave',
    description: 'Para cansancio, niebla o un día contemplativo.',
    details: ['1-2 h arriba.', 'Dificultad baja.', 'Deja mucha tarde para Mogrovejo, Santo Toribio y Potes.'],
  },
  {
    name: 'Opción 2: El Cable → Hotel Áliva → vuelta',
    tag: 'Base',
    description: 'La opción equilibrada para disfrutar sin complicarse.',
    details: ['Unos 7 km ida y vuelta.', '2h30-3h30 con paradas.', 'Dificultad baja/media.'],
  },
  {
    name: 'Opción 3: Horcados Rojos',
    tag: 'Montañera',
    description: 'La ruta seria si hay buen tiempo y energía.',
    details: ['Unos 11 km ida y vuelta.', '5-6 h con paradas.', 'Dificultad media-alta y vistas al Naranjo si acompaña.'],
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

  return (
    <main>
      <section className="hero-section" id="inicio">
        <nav className="topbar" aria-label="Navegación principal">
          <a href="#plan">Plan</a>
          <a href="#fuente-de">Fuente Dé</a>
          <a href="#tareas">Tareas</a>
        </nav>

        <div className="hero-grid">
          <div>
            <p className="eyebrow">17-21 julio · Asturias y Cantabria</p>
            <h1>Viaje a Picos de Europa</h1>
            <p className="hero-copy">
              Ruta ligera para tener claro qué toca cada día: Sella, Lagos, Covadonga,
              Fuente Dé, pueblos de Liébana y vuelta por la Hermida.
            </p>
          </div>
          <aside className="hero-card" aria-label="Resumen rápido">
            <span>Decisiones clave</span>
            <strong>Bus de Lagos y teleférico temprano.</strong>
            <p>La final del Mundial queda como plan de cena del domingo a las 21:00.</p>
          </aside>
        </div>
      </section>

      <section className="section" id="plan">
        <div className="section-heading">
          <p className="eyebrow">Planning ajustado</p>
          <h2>Plan del viaje</h2>
        </div>

        <div className="timeline">
          {days.map((day) => (
            <article className="day-card" key={day.date}>
              <div className="day-header">
                <div>
                  <p>{day.date}</p>
                  <h3>{day.title}</h3>
                </div>
                <span>{day.badge}</span>
              </div>
              <p className="summary">{day.summary}</p>
              <ul>
                {day.schedule.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {day.notes?.map((note) => (
                <p className="note" key={note}>{note}</p>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section className="section route-section" id="fuente-de">
        <div className="section-heading">
          <p className="eyebrow">Lunes 20</p>
          <h2>Tres niveles para Fuente Dé</h2>
          <p>Elegid la ruta final según clima, cansancio y visibilidad al llegar arriba.</p>
        </div>

        <div className="route-grid">
          {routeOptions.map((option) => (
            <article className="route-card" key={option.name}>
              <span>{option.tag}</span>
              <h3>{option.name}</h3>
              <p>{option.description}</p>
              <ul>
                {option.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
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
