import { estado } from "../estado.js";
import { pedirRedesenho, pixelParaCelulaX, pixelParaCelulaZ } from "../grid.js";

const gridDesenho = document.getElementById("grid-desenho");

function destaqueSair() {
    if (estado.projetoAberto === null) {
        return;
    }

    if (estado.celulaDestacada === null) {
        return;
    }

    estado.celulaDestacada = null;
    pedirRedesenho();
}

function destaquePosicaoCelula(celulaX, celulaZ) {
    return celulaX >= 0 && celulaX < estado.projetoAberto.dimensaoX
        && celulaZ >= 0 && celulaZ < estado.projetoAberto.dimensaoZ;
}

function destaqueCompararCelula(celulaX, celulaZ) {
    return estado.celulaDestacada !== null
        && estado.celulaDestacada.celulaX === celulaX
        && estado.celulaDestacada.celulaZ === celulaZ;
}

function destaqueMover(evento) {
    if (estado.projetoAberto === null) {
        return;
    }

    const x = Math.floor(pixelParaCelulaX(evento.offsetX));
    const z = Math.floor(pixelParaCelulaZ(evento.offsetY));

    if (estado.ferramenta === "mover" || !destaquePosicaoCelula(x, z)) {
        destaqueSair();
        return;
    }

    if (destaqueCompararCelula(x, z)) {
        return;
    }

    estado.celulaDestacada = { celulaX: x, celulaZ: z };
    pedirRedesenho();
}

export function destaqueIniciar() {
    gridDesenho.addEventListener("pointermove", destaqueMover);
    gridDesenho.addEventListener("pointerleave", destaqueSair);
    gridDesenho.addEventListener("pointercancel", destaqueSair);
}