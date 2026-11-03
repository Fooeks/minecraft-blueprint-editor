import { estado } from "../estado.js";
import { pedirRedesenho } from "../grid.js";
import { selecionarFerramenta } from "./ativa.js";

const gridDesenho = document.getElementById("grid-desenho");

let arrastando = false;
let ultimoX = 0;
let ultimoZ = 0;
let ferramentaAnterior = null;

function moverCampoDeTexto(alvo) {
    return alvo.closest("input, textarea") !== null;
}

function moverRestaurar() {
    if (ferramentaAnterior === null) {
        return;
    }

    selecionarFerramenta(ferramentaAnterior);
    ferramentaAnterior = null;
}

function moverTeclaApertada(evento) {
    if (estado.projetoAberto === null) {
        return;
    }

    if (evento.key !== " " || moverCampoDeTexto(evento.target)) {
        return;
    }

    evento.preventDefault();

    if (evento.repeat) {
        return;
    }

    ferramentaAnterior = estado.ferramenta;
    selecionarFerramenta("mover");
}

function moverTeclaSolta(evento) {
    if (evento.key !== " ") {
        return;
    }

    moverRestaurar();
}

function moverComecar(evento) {
    if (estado.projetoAberto === null) {
        return;
    }

    if (evento.button !== 0 || estado.ferramenta !== "mover") {
        return;
    }

    arrastando = true;
    ultimoX = evento.clientX;
    ultimoZ = evento.clientY;
    gridDesenho.setPointerCapture(evento.pointerId);
}

function moverMover(evento) {
    if (!arrastando) {
        return;
    }

    const deslocamentoX = evento.clientX - ultimoX;
    const deslocamentoZ = evento.clientY - ultimoZ;
    ultimoX = evento.clientX;
    ultimoZ = evento.clientY;

    estado.camera.deslocamentoX -= deslocamentoX / estado.camera.pixelsPorCelula;
    estado.camera.deslocamentoZ -= deslocamentoZ / estado.camera.pixelsPorCelula;
    pedirRedesenho();
}

function moverTerminar() {
    arrastando = false;
}

export function moverIniciar() {
    gridDesenho.addEventListener("pointerdown", moverComecar);
    gridDesenho.addEventListener("pointermove", moverMover);
    gridDesenho.addEventListener("pointerup", moverTerminar);
    gridDesenho.addEventListener("pointercancel", moverTerminar);

    document.addEventListener("keydown", moverTeclaApertada);
    document.addEventListener("keyup", moverTeclaSolta);
    window.addEventListener("blur", moverRestaurar);
}