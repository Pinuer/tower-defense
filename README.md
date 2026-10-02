# Tower Defense

Juego de torres hecho con HTML, Canvas y JavaScript, sin dependencias.

**[Jugar online](https://pinuer.github.io/tower-defense/)**

## Cómo se juega

- Elige una torre y haz clic en un tile verde para colocarla.
- Haz clic en una torre ya colocada para mejorarla (hasta nivel 3) o venderla.
- Pulsa **Iniciar oleada**. Sobrevive 20 oleadas sin quedarte sin vidas.
- El botón de velocidad alterna entre x1, x2 y x3.

| Torre  | Costo | Efecto                      |
|--------|-------|-----------------------------|
| Flecha | 50    | Disparo rápido, daño bajo   |
| Cañón  | 100   | Daño en área, disparo lento |
| Hielo  | 75    | Ralentiza a los enemigos    |
| Fuego  | 120   | Alcance corto, daño y quema |

## Ejecutar en local

Abre `index.html` en el navegador, o levanta un servidor desde la carpeta del proyecto:

```bash
npx serve
```

## Estructura

```
tower-defense/
├── index.html
├── css/
│   └── style.css
└── js/
    └── game.js
```

## Personalizar

Todo el balance está al inicio de `js/game.js`: `TYPES` (torres), `KINDS` (enemigos), `WP` (ruta) y `MAXW` (oleadas).

## Licencia

MIT
