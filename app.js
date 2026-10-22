
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CELDAS = 20;
const TAM = canvas.width / CELDAS;

const $ = (id) => document.getElementById(id);

let serpiente = [];
let fruta = { x: 10, y: 10 };
let direccion = { x: 1, y: 0 };
let siguienteDireccion = { x: 1, y: 0 };

let puntos = 0;
let nivel = 1;
let estado = "listo";
let temporizador = null;

let mejorPuntuacion = 0;

try {
  mejorPuntuacion = Number(
    localStorage.getItem("snakeRetro.mejorPuntuacion") || 0
  );

  if (!Number.isFinite(mejorPuntuacion) || mejorPuntuacion < 0) {
    mejorPuntuacion = 0;
  }
} catch {
  mejorPuntuacion = 0;
}

$("bestScore").textContent = mejorPuntuacion;

function dibujarFondo() {
  ctx.fillStyle = "#101a2b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Cuadrícula retro.
  ctx.strokeStyle = "#ffffff09";
  ctx.lineWidth = 1;

  for (let i = 0; i <= CELDAS; i++) {
    const posicion = i * TAM;

    ctx.beginPath();
    ctx.moveTo(posicion, 0);
    ctx.lineTo(posicion, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, posicion);
    ctx.lineTo(canvas.width, posicion);
    ctx.stroke();
  }
}

function dibujarFruta() {
  const x = fruta.x * TAM + TAM / 2;
  const y = fruta.y * TAM + TAM / 2;

  ctx.save();
  ctx.shadowColor = "#ff4ecd";
  ctx.shadowBlur = 18;

  ctx.fillStyle = "#ff4ecd";
  ctx.beginPath();
  ctx.arc(x, y, TAM * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // Brillo de la fruta.
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x - 3, y - 3, TAM * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function dibujarSerpiente() {
  serpiente.forEach((parte, indice) => {
    const margen = 2;
    const x = parte.x * TAM + margen;
    const y = parte.y * TAM + margen;
    const tamano = TAM - margen * 2;

    ctx.save();

    ctx.fillStyle = indice === 0 ? "#d7ff85" : "#7dfb57";
    ctx.shadowColor = "#7dfb57";
    ctx.shadowBlur = indice === 0 ? 14 : 5;

    ctx.beginPath();
    ctx.roundRect(x, y, tamano, tamano, 5);
    ctx.fill();

    // Ojos de la cabeza.
    if (indice === 0) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#14241b";

      const ojo1 = {
        x: x + tamano * 0.35,
        y: y + tamano * 0.35
      };

      const ojo2 = {
        x: x + tamano * 0.65,
        y: y + tamano * 0.35
      };

      if (direccion.x === 1) {
        ojo1.x = x + tamano * 0.65;
        ojo2.x = x + tamano * 0.65;
        ojo1.y = y + tamano * 0.35;
        ojo2.y = y + tamano * 0.65;
      } else if (direccion.x === -1) {
        ojo1.x = x + tamano * 0.35;
        ojo2.x = x + tamano * 0.35;
        ojo1.y = y + tamano * 0.35;
        ojo2.y = y + tamano * 0.65;
      } else if (direccion.y === 1) {
        ojo1.y = y + tamano * 0.65;
        ojo2.y = y + tamano * 0.65;
        ojo1.x = x + tamano * 0.35;
        ojo2.x = x + tamano * 0.65;
      } else {
        ojo1.y = y + tamano * 0.35;
        ojo2.y = y + tamano * 0.35;
        ojo1.x = x + tamano * 0.35;
        ojo2.x = x + tamano * 0.65;
      }

      const radioOjo = Math.max(2, TAM * 0.07);

      [ojo1, ojo2].forEach((ojo) => {
        ctx.beginPath();
        ctx.arc(ojo.x, ojo.y, radioOjo, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.restore();
  });
}

function dibujar() {
  dibujarFondo();
  dibujarFruta();
  dibujarSerpiente();
}

function actualizarMarcador() {
  $("score").textContent = String(puntos).padStart(3, "0");
  $("level").textContent = String(nivel).padStart(2, "0");
  $("bestScore").textContent = mejorPuntuacion;
}

function generarFruta() {
  let nuevaFruta;

  do {
    nuevaFruta = {
      x: Math.floor(Math.random() * CELDAS),
      y: Math.floor(Math.random() * CELDAS)
    };
  } while (
    serpiente.some(
      (parte) =>
        parte.x === nuevaFruta.x &&
        parte.y === nuevaFruta.y
    )
  );

  fruta = nuevaFruta;
}

function iniciarPartida() {
  detenerTemporizador();

  serpiente = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 }
  ];

  direccion = { x: 1, y: 0 };
  siguienteDireccion = { x: 1, y: 0 };

  puntos = 0;
  nivel = 1;
  estado = "jugando";

  generarFruta();
  actualizarMarcador();

  $("overlay").classList.add("hidden");
  $("pauseButton").disabled = false;
  $("pauseButton").textContent = "Ⅱ PAUSAR";

  dibujar();
  programarSiguienteMovimiento();
}

function detenerTemporizador() {
  if (temporizador !== null) {
    clearTimeout(temporizador);
    temporizador = null;
  }
}

function velocidad() {
  return Math.max(65, 145 - (nivel - 1) * 8);
}

function programarSiguienteMovimiento() {
  detenerTemporizador();

  if (estado !== "jugando") return;

  temporizador = setTimeout(() => {
    temporizador = null;
    avanzar();
  }, velocidad());
}

function avanzar() {
  if (estado !== "jugando") return;

  direccion = { ...siguienteDireccion };

  const cabeza = {
    x: serpiente[0].x + direccion.x,
    y: serpiente[0].y + direccion.y
  };

  // Chocar contra los bordes termina la partida.
  if (
    cabeza.x < 0 ||
    cabeza.x >= CELDAS ||
    cabeza.y < 0 ||
    cabeza.y >= CELDAS
  ) {
    terminarPartida();
    return;
  }

  const comeFruta =
    cabeza.x === fruta.x &&
    cabeza.y === fruta.y;

  // Si no come, la cola se mueve y deja libre su última celda.
  const cuerpoParaColision = comeFruta
    ? serpiente
    : serpiente.slice(0, -1);

  const chocaConsigoMisma = cuerpoParaColision.some(
    (parte) => parte.x === cabeza.x && parte.y === cabeza.y
  );

  if (chocaConsigoMisma) {
    terminarPartida();
    return;
  }

  serpiente.unshift(cabeza);

  if (comeFruta) {
    puntos += 10;
    nivel = Math.floor(puntos / 50) + 1;

    if (puntos > mejorPuntuacion) {
      mejorPuntuacion = puntos;

      try {
        localStorage.setItem(
          "snakeRetro.mejorPuntuacion",
          String(mejorPuntuacion)
        );
      } catch {
        // El juego sigue funcionando si no se puede guardar el récord.
      }
    }

    actualizarMarcador();

    if (serpiente.length === CELDAS * CELDAS) {
      dibujar();
      terminarPartida(true);
      return;
    }

    generarFruta();
  } else {
    serpiente.pop();
  }

  dibujar();
  programarSiguienteMovimiento();
}

function mostrarOverlay(emoji, titulo, mensaje, textoBoton) {
  $("overlayEmoji").textContent = emoji;
  $("overlayTitle").textContent = titulo;
  $("overlayText").textContent = mensaje;
  $("startButton").textContent = textoBoton;
  $("overlay").classList.remove("hidden");
}

function terminarPartida(ganaste = false) {
  detenerTemporizador();
  estado = "terminado";

  $("pauseButton").disabled = true;

  if (ganaste) {
    mostrarOverlay(
      "🏆",
      "¡GANASTE!",
      `¡Completaste el tablero! Puntuación: ${puntos}`,
      "JUGAR DE NUEVO"
    );
  } else {
    mostrarOverlay(
      "💥",
      "GAME OVER",
      `Conseguiste ${puntos} puntos. ¡Inténtalo otra vez!`,
      "VOLVER A JUGAR"
    );
  }
}

function alternarPausa() {
  if (estado === "jugando") {
    detenerTemporizador();
    estado = "pausado";

    $("pauseButton").textContent = "▶ CONTINUAR";

    mostrarOverlay(
      "⏸️",
      "PAUSA",
      "Tu partida está detenida.",
      "CONTINUAR"
    );
  } else if (estado === "pausado") {
    estado = "jugando";

    $("overlay").classList.add("hidden");
    $("pauseButton").textContent = "Ⅱ PAUSAR";

    programarSiguienteMovimiento();
  }
}

function cambiarDireccion(nuevaDireccion) {
  if (estado !== "jugando") return;

  // Impide girar directamente en sentido contrario.
  if (
    nuevaDireccion.x === -direccion.x &&
    nuevaDireccion.y === -direccion.y
  ) {
    return;
  }

  siguienteDireccion = nuevaDireccion;
}

// Botón de inicio, continuación y nueva partida.
$("startButton").addEventListener("click", () => {
  if (estado === "pausado") {
    alternarPausa();
  } else {
    iniciarPartida();
  }
});

$("pauseButton").addEventListener("click", alternarPausa);
$("restartButton").addEventListener("click", iniciarPartida);

// Teclado: flechas o WASD. Espacio para pausar.
document.addEventListener("keydown", (evento) => {
  const teclas = [
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    " ", "w", "a", "s", "d",
    "W", "A", "S", "D"
  ];

  if (teclas.includes(evento.key)) {
    evento.preventDefault();
  }

  switch (evento.key) {
    case "ArrowUp":
    case "w":
    case "W":
      cambiarDireccion({ x: 0, y: -1 });
      break;

    case "ArrowDown":
    case "s":
    case "S":
      cambiarDireccion({ x: 0, y: 1 });
      break;

    case "ArrowLeft":
    case "a":
    case "A":
      cambiarDireccion({ x: -1, y: 0 });
      break;

    case "ArrowRight":
    case "d":
    case "D":
      cambiarDireccion({ x: 1, y: 0 });
      break;

    case " ":
      if (estado === "jugando" || estado === "pausado") {
        alternarPausa();
      }
      break;
  }
});

// Controles táctiles para el iPhone.
document.querySelectorAll("[data-dir]").forEach((boton) => {
  boton.addEventListener("pointerdown", (evento) => {
    evento.preventDefault();

    const direcciones = {
      up:    { x: 0, y: -1 },
      down:  { x: 0, y: 1 },
      left:  { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };

    cambiarDireccion(direcciones[boton.dataset.dir]);
  });
});

// Dibuja una pantalla inicial incluso antes de empezar.
serpiente = [
  { x: 9, y: 10 },
  { x: 8, y: 10 },
  { x: 7, y: 10 }
];

generarFruta();
actualizarMarcador();
dibujar();
