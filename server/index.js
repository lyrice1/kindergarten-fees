import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadGroups, saveGroups, resetToDefault } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 80

app.use(express.json({ limit: '10mb' }))

app.use('/data-api', (req, res, next) => {
  if (req.path === '/groups') {
    if (req.method === 'GET') {
      try {
        return res.json(loadGroups())
      } catch (e) {
        return res.status(500).json({ error: e.message })
      }
    }
    if (req.method === 'PUT') {
      try {
        if (!Array.isArray(req.body)) {
          return res.status(400).json({ error: 'Invalid data format' })
        }
        saveGroups(req.body)
        return res.json({ ok: true })
      } catch (e) {
        return res.status(500).json({ error: e.message })
      }
    }
  }
  if (req.path === '/groups/reset' && req.method === 'POST') {
    try {
      resetToDefault()
      return res.json({ ok: true })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }
  next()
})

const napcatTarget = process.env.NAPCAT_TARGET || 'http://172.17.0.1:3100'
app.use('/api', createProxyMiddleware({
  target: napcatTarget,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  ws: true
}))

app.use(express.static(path.join(__dirname, '..', 'dist'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    }
  }
}))

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
