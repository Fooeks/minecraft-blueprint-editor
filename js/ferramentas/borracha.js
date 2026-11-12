import { estado } from "../estado.js";
import { pixelParaCelulaX, pixelParaCelulaZ, verificarPosicaoCelula, pedirRedesenho } from "../grid.js";
import { celulasAlterar, celulasEventoMudou } from "../celulas.js";
import { historicoIniciarAcao, historicoRegistrar, historicoFecharAcao } from "../historico.js";

const gridDesenho = document.getElementById("grid-desenho");

let apagando = false;

function borrachaApagar(evento) {
    const celulaX = Math.floor(pixelParaCelulaX(evento.offsetX));
    const celulaZ = Math.floor(pixelParaCelulaZ(evento.offsetY));

    if (!verificarPosicaoCelula(celulaX, celulaZ)) {
        return;
    }

    const mudanca = celulasAlterar(estado.camadaAtiva, [
        { celulaX, celulaZ, depois: [] }
    ]);

    if (mudanca.length === 0) {
        return;
    }

    historicoRegistrar(mudanca);
    pedirRedesenho();
    document.dispatchEvent(new Event(celulasEventoMudou));
}

function borrachaComecar(evento) {
    if (estado.projetoAberto === null) {
        return;
    }

    if (evento.button !== 0 || estado.ferramenta !== "borracha") {
        return;
    }

    apagando = true;
    historicoIniciarAcao();
    gridDesenho.setPointerCapture(evento.pointerId);
    borrachaApagar(evento);
}

function borrachaMover(evento) {
    if (!apagando) {
        return;
    }

    if (estado.projetoAberto === null || estado.ferramenta !== "borracha") {
        return;
    }

    borrachaApagar(evento);
}

function borrachaTerminar() {
    if (!apagando) {
        return;
    }

    apagando = false;
    historicoFecharAcao();
}

export function borrachaIniciar() {
    gridDesenho.addEventListener("pointerdown", borrachaComecar);
    gridDesenho.addEventListener("pointermove", borrachaMover);
    gridDesenho.addEventListener("pointerup", borrachaTerminar);
    gridDesenho.addEventListener("pointercancel", borrachaTerminar);
}