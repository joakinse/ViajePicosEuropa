# Viaje Picos de Europa

Web ligera en español para organizar el viaje del 17 al 21 de julio: planning diario, opciones de Fuente Dé y lista de tareas compartida.

## Desarrollo

```bash
npm install
npm run dev
```

Si no configuras Supabase, las tareas funcionan en modo local con `localStorage`.

## Tareas compartidas

GitHub Pages es estático, así que para que las tareas sean iguales para todos hay que usar una base de datos externa. Este proyecto está preparado para Supabase.

1. Crea un proyecto en Supabase.
2. Ejecuta el contenido de `supabase.sql` en el SQL Editor.
3. Copia `.env.example` a `.env` y rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` para desarrollo local.
4. En GitHub Pages ya se compilan con los valores públicos del proyecto Supabase configurados en el workflow.

## Despliegue en GitHub Pages

1. Sube este proyecto a un repositorio llamado `ViajePicosEuropa`.
2. En GitHub, ve a `Settings > Pages`.
3. Selecciona `GitHub Actions` como fuente de despliegue.
4. Haz push a `main` y el workflow `.github/workflows/deploy.yml` publicará la carpeta `dist`.

## Scripts

- `npm run dev`: servidor local.
- `npm run build`: build de producción.
- `npm run preview`: previsualización del build.
- `npm run lint`: lint con Oxlint.
