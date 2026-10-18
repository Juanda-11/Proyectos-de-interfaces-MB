# Contribuir

1. Crea una rama desde `main` (`feat/...`, `fix/...`).
2. Haz commits pequeños, un cambio lógico por commit (`feat(api): ...`, `fix(store): ...`, `test(...)`, `docs: ...`).
3. Ejecuta `npm run check && npm test` antes de subir.
4. Abre un pull request; el CI debe pasar.

Convenciones: sin dependencias nuevas salvo que sean imprescindibles; las reglas de negocio van en `lib/domain`
como funciones puras; cada endpoint nuevo se documenta en `docs/API.md` y lleva pruebas.
