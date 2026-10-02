# Tower Defense

Juego de torres sin dependencias: `index.html`, `style.css` y `game.js`. HTML + Canvas + JavaScript.

## Jugar

Abre `index.html` en el navegador, o publícalo con GitHub Pages:
**Settings → Pages → Deploy from a branch → `main` / root**.

## Cómo se juega

- Elige una torre y haz clic en un tile verde para colocarla.
- Haz clic en una torre ya colocada para mejorarla (hasta nivel 3) o venderla.
- Pulsa **Iniciar oleada**. Sobrevive 20 oleadas sin quedarte sin vidas.

| Torre  | Costo | Efecto                      |
|--------|-------|-----------------------------|
| Flecha | 50    | Disparo rápido, daño bajo   |
| Cañón  | 100   | Daño en área, disparo lento |
| Hielo  | 75    | Ralentiza a los enemigos    |

## Personalizar

Todo el balance está al inicio del script: `TYPES` (torres), `KINDS` (enemigos), `WP` (ruta) y `MAXW` (oleadas).

## Licencia

MIT
