# Tower Defense

Juego de torres hecho con HTML, Canvas y JavaScript, sin dependencias.

**[Jugar online](https://pinuer.github.io/tower-defense/)**

## Cómo se juega

- Elige una torre y haz clic en un tile verde para colocarla.
- Haz clic en una torre ya colocada para mejorarla (hasta nivel 3) o venderla.
- Pulsa **Iniciar oleada**. Sobrevive 20 oleadas sin quedarte sin vidas.
- Son 5 niveles (Valle, Nieve, Desierto, Volcán y Pantano). El Pantano tiene dos caminos que se bifurcan: los enemigos se reparten entre ambos y hay que defender los dos. Al superar uno se desbloquea el siguiente; el progreso se guarda en el navegador.
- El botón de velocidad alterna entre x1, x2 y x3.
- Atajos de teclado: **Espacio** inicia la oleada, **los números** eligen la torre y **P** pausa o reanuda.

| Torre  | Costo | Efecto                      |
|--------|-------|-----------------------------|
| Flecha | 50    | Disparo rápido, daño bajo   |
| Cañón  | 100   | Daño en área, disparo lento |
| Hielo  | 75    | Ralentiza a los enemigos    |
| Fuego  | 120   | Alcance corto, daño y quema |
| Rayo   | 150   | Desde el nivel 2: rayo en cadena entre enemigos |
| Veneno | 110   | Desde el nivel 3: veneno que se acumula y daña con el tiempo |
| Mortero| 180   | Desde el nivel 4: largo alcance, daño en área, muy lento |

## Enemigos por nivel

Además de los básicos (soldado, rápido y acorazado), cada nivel suma un enemigo propio desde la oleada 3:

| Nivel | Enemigo   | Rasgo                          |
|-------|-----------|--------------------------------|
| 1     | Curandero | Cura a los enemigos cercanos   |
| 2     | Yeti      | Inmune a la ralentización      |
| 3     | Escorpión | Inmune a la quema              |
| 4     | Magma     | Se divide en dos al morir      |
| 5     | Cieno     | Inmune al veneno               |

## Jefes

En la oleada 20 de cada nivel llega un jefe con vida enorme. Si cruza el camino te quita 5 vidas.

| Nivel | Jefe                | Habilidad                                              |
|-------|---------------------|--------------------------------------------------------|
| 1     | Caudillo            | Invoca 2 soldados cada 5 segundos                      |
| 2     | Gigante de escarcha | Congela las torres cercanas; inmune a la ralentización |
| 3     | Escorpión rey       | Embiste a gran velocidad; inmune a la quema            |
| 4     | Titán de magma      | Se enfurece bajo la mitad de vida y suelta 4 brasas    |
| 5     | Rey del pantano     | Se regenera con el tiempo; inmune al veneno            |

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
    ├── maps.js
    └── game.js
```

## Personalizar

Los mapas (ruta, colores, oro inicial y dificultad de cada nivel) están en `js/maps.js`. El resto del balance está al inicio de `js/game.js`: `TYPES` (torres), `KINDS` (enemigos) y `MAXW` (oleadas).
