import { estado } from "../estado.js";
import { pixelParaCelulaX, pixelParaCelulaZ, verificarPosicaoCelula, pedirRedesenho } from "../grid.js";
import { celulasAlterar, celulasEventoMudou } from "../celulas.js";

const gridDesenho = document.getElementById("grid-desenho");

let pintando = false;

function pincelPintar(evento) {
    const celulaX = Math.floor(pixelParaCelulaX(evento.offsetX));
    const celulaZ = Math.floor(pixelParaCelulaZ(evento.offsetY));

    if (!verificarPosicaoCelula(celulaX, celulaZ)) {
        return;
    }

    const celula = { cor: estado.corAtiva, idForma: null, idGrupo: null, ordem: 0 };
    const mudanca = celulasAlterar(estado.camadaAtiva, [
        { celulaX, celulaZ, depois: [celula] }
    ]);

    if (mudanca.length === 0) {
        return;
    }

    pedirRedesenho();
    document.dispatchEvent(new Event(celulasEventoMudou));
}

function pincelComecar(evento) {
    if (estado.projetoAberto === null) {
        return;
    }

    if (evento.button !== 0 || estado.ferramenta !== "pincel") {
        return;
    }

    pintando = true;
    gridDesenho.setPointerCapture(evento.pointerId);
    pincelPintar(evento);
}

function pincelMover(evento) {
    if (!pintando) {
        return;
    }

    if (estado.projetoAberto === null || estado.ferramenta !== "pincel") {
        return;
    }

    pincelPintar(evento);
}

function pincelTerminar() {
    pintando = false;
}

export function pincelIniciar() {
    gridDesenho.addEventListener("pointerdown", pincelComecar);
    gridDesenho.addEventListener("pointermove", pincelMover);
    gridDesenho.addEventListener("pointerup", pincelTerminar);
    gridDesenho.addEventListener("pointercancel", pincelTerminar);
}