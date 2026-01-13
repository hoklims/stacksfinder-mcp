# Smithery Deployment Requirements

Guide pour déployer le MCP server sur [Smithery](https://smithery.ai).

## Exigences Critiques

### 1. Export Default = Fonction `createServer`

Smithery attend un **export default** qui est une **fonction** retournant l'instance du serveur MCP:

```typescript
// ✅ CORRECT
export function createSandboxServer() {
    return createServer();
}
export default createSandboxServer;

// ❌ INCORRECT - objet
export default { createSandboxServer, fetch: ... };

// ❌ INCORRECT - pas de default export
export { createSandboxServer };
```

**Erreur si non respecté:**
```
Invalid user module: default export must be a function (createServer). Got object.
```

### 2. JSON Imports Statiques (pas de fs.readFileSync)

esbuild bundle le code en CJS. Les fichiers JSON doivent être importés statiquement pour être inlinés:

```typescript
// ✅ CORRECT - esbuild inline le JSON
import techScores from './data/technology_scores.json' with { type: 'json' };

// ❌ INCORRECT - ENOENT en runtime
import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('./data/file.json', 'utf-8'));

// ❌ INCORRECT - import.meta.url vide en CJS
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
```

**Erreur si non respecté:**
```
ENOENT: no such file or directory, open '/home/repo/.smithery/shttp/file.json'
```

### 3. Pas de Démarrage Serveur HTTP Automatique

Le fichier entry point ne doit **pas** démarrer de serveur HTTP lors de l'import (scan des capabilities):

```typescript
// ✅ CORRECT - conditionnel
const isDirectRun = process.argv[1]?.includes('http');
if (isDirectRun && !process.env.SMITHERY_SCAN) {
    main(); // Démarre le serveur HTTP
}

// ❌ INCORRECT - démarre toujours
main().catch(console.error);
```

**Erreur si non respecté:**
```
EADDRINUSE: address already in use 0.0.0.0:3000
```

## Configuration

### smithery.yaml

```yaml
startCommand:
  type: stdio
  configSchema:
    type: object
    properties:
      STACKSFINDER_API_KEY:
        type: string
        description: API key for authenticated features
    required: []
  commandFunction: |-
    (config) => ({
      command: 'node',
      args: ['dist/index.js'],
      env: {
        STACKSFINDER_API_KEY: config.STACKSFINDER_API_KEY || ''
      }
    })

build:
  dockerfile: Dockerfile
```

### package.json Scripts

```json
{
  "scripts": {
    "build": "tsc && npm run copy-data && npx @smithery/cli build src/http.ts"
  },
  "devDependencies": {
    "@smithery/cli": "^3.1.2"
  }
}
```

## Fichiers Requis

| Fichier | Rôle |
|---------|------|
| `src/http.ts` | Entry point Smithery avec `export default createSandboxServer` |
| `src/index.ts` | Entry point stdio standard |
| `src/server.ts` | Factory `createServer()` |
| `smithery.yaml` | Config Smithery |
| `Dockerfile` | Build container |

## Debugging

```bash
# Test local du build Smithery
npx @smithery/cli build src/http.ts

# Vérifier les exports
node -e "import('./dist/http.js').then(m => console.log(typeof m.default))"
# Doit afficher: function
```

## Liens

- [Smithery Docs - Sandbox Server](https://smithery.ai/docs/deploy#sandbox-server)
- [Cloudflare Workers Errors](https://developers.cloudflare.com/workers/observability/errors/)
