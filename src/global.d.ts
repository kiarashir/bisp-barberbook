// Tells TypeScript that importing CSS files is OK.
// Without this, TS shows a fake "Cannot find module" error (ts2882)
// on lines like `import './globals.css'`. It does NOT affect how the app runs.
declare module '*.css'
