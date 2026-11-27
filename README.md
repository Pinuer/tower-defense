# Tower Defense

Juego de torres hecho con HTML, Canvas y JavaScript, sin dependencias.

**[Jugar online](https://pinuer.github.io/tower-defense/)**

## Cómo se juega

- Elige una torre y haz clic en un tile verde para colocarla. En pantallas táctiles, el primer toque muestra el alcance y el segundo construye.
- Haz clic en una torre ya colocada para mejorarla (hasta nivel 3) o venderla.
- Pulsa **Iniciar oleada**; si no lo haces, la siguiente oleada empieza sola a los 20 segundos (el botón muestra la cuenta regresiva). Sobrevive 20 oleadas sin quedarte sin vidas.
- Son 5 niveles (Valle, Nieve, Desierto, Volcán y Pantano). El Pantano tiene dos caminos que se bifurcan: los enemigos se reparten entre ambos y hay que defender los dos. Al superar uno se desbloquea el siguiente; el progreso se guarda en el navegador.
- El botón **Objetivo** del panel de torre elige a quién apunta: primero, más fuerte, más débil o más cercano.
- El botón **Dificultad** alterna Fácil (30 vidas, +50% oro), Normal (20 vidas) y Difícil (12 vidas, −25% oro) y reinicia la partida. Se guarda en el navegador.
- Bajo los botones se ve la composición de la próxima oleada.
- Mientras el juego está en pausa no se puede construir, mejorar ni vender.
- El botón de nivel pide confirmación si hay una partida en curso.
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

## Sonido

La música y los efectos se generan con la Web Audio API (sin archivos de audio). Cada nivel tiene su propio tema; entre oleadas suena solo melodía y bajo, y al empezar una oleada entra la percusión (más rápida en la del jefe). El botón **Sonido** o la tecla **M** silencian todo y la preferencia se guarda en el navegador. El audio arranca al pulsar *Jugar*, porque los navegadores no permiten sonido antes de una interacción.

## Mejoras

Todas las torres suben hasta nivel 3. Al pasar del nivel 2 al 3 se elige entre dos caminos de mejora, por ejemplo la Flecha puede ser **Francotirador** (más daño y alcance, dispara más lento) o **Ráfaga** (dispara mucho más rápido). Al pasar el cursor por cada botón se ve qué cambia.

## Enemigos por nivel

Además de los básicos (soldado, rápido y acorazado), cada nivel suma un enemigo propio desde la oleada 3:

| Nivel | Enemigo   | Rasgo                          |
|-------|-----------|--------------------------------|
| 1     | Curandero | Cura a los enemigos cercanos   |
| 2     | Yeti      | Inmune a la ralentización      |
| 3     | Escorpión | Inmune a la quema              |
| 4     | Magma     | Se divide en dos al morir      |
| 5     | Cieno     | Inmune al veneno               |

## Voladores y fantasmas

Desde la oleada 5 aparecen **murciélagos**: vuelan en línea recta ignorando el camino (llegan antes) y el Cañón y el Mortero no pueden apuntarles. Desde la oleada 7 aparecen **fantasmas**: cada pocos segundos se vuelven invisibles un instante y las torres no pueden apuntarles ni la explosión los alcanza.

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
    ├── audio.js   (música y efectos de sonido)
    ├── title.js   (pantalla de inicio)
    ├── maps.js    (mapas y dibujo del terreno)
    ├── data.js    (torres y enemigos: balance)
    ├── render.js  (dibujo de torres, enemigos y escena)
    └── game.js    (lógica y entrada del usuario)
```

## Personalizar

Los mapas (ruta, colores, oro inicial y dificultad de cada nivel) están en `js/maps.js`. El balance está en `js/data.js` (`TYPES` para torres y `KINDS` para enemigos) y `MAXW` (oleadas) al inicio de `js/game.js`.
