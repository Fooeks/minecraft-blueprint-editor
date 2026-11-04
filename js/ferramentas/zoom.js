import { estado } from "../estado.js";
import { pedirRedesenho, pixelParaCelulaX, pixelParaCelulaZ, restringirTamanhoCelula } from "../grid.js";

const gridDesenho = document.getElementById("grid-desenho");
const botaoZoomIn = document.getElementById("ferr-zoom-in");
const botaoZoomOut = document.getElementById("ferr-zoom-out");

function zoomAplicar(sentido, pixelX, pixelZ) {
    const celulaX = pixelParaCelulaX(pixelX);
    const celulaZ = pixelParaCelulaZ(pixelZ);
    const novaEscala = restringirTamanhoCelula(estado.camera.pixelsPorCelula * 1.1 ** sentido);

    estado.camera.pixelsPorCelula = novaEscala;
    estado.camera.deslocamentoX = celulaX - pixelX / estado.camera.pixelsPorCelula;
    estado.camera.deslocamentoZ = celulaZ - pixelZ / estado.camera.pixelsPorCelula;
    pedirRedesenho();
}

function zoomScroll(evento) {
    if (estado.projetoAberto === null) {
        return;
    }

    evento.preventDefault();
    zoomAplicar(-Math.sign(evento.deltaY), evento.offsetX, evento.offsetY);
}

function zoomBotoes(sentido) {
    if (estado.projetoAberto === null) {
        return;
    }

    zoomAplicar(sentido, gridDesenho.width / 2, gridDesenho.height / 2);
}

export function zoomIniciar() {
    gridDesenho.addEventListener("wheel", zoomScroll, { passive: false });
    botaoZoomIn.addEventListener("click", () => zoomBotoes(1));
    botaoZoomOut.addEventListener("click", () => zoomBotoes(-1));
}