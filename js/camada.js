import { estado } from "./estado.js";
import { pedirRedesenho } from "./grid.js";
import { celulasLimiteCamadaY, celulasApagarCamadasYVazias, celulasCamadaYMaxima, celulasEventoMudou } from "./celulas.js";

const camadaYCampo = document.getElementById("campo-camada-y");
const camadaYSlider = document.getElementById("slider-camada-y");

export function camadaYSincronizar() {
    camadaYCampo.value = estado.camadaAtiva;
    camadaYSlider.max = celulasLimiteCamadaY(estado.camadaAtiva);
    camadaYSlider.value = estado.camadaAtiva;
}

export function camadaYMudar(nivelY) {
    const valido = estado.projetoAberto !== null
        && Number.isInteger(nivelY)
        && nivelY >= 1
        && nivelY <= celulasCamadaYMaxima;

    if (valido && nivelY !== estado.camadaAtiva) {
        estado.camadaAtiva = nivelY;
        celulasApagarCamadasYVazias();
        pedirRedesenho();
    }

    camadaYSincronizar();
}

function camadaYIniciar() {
    camadaYCampo.addEventListener("change", function () {
        camadaYMudar(Number(camadaYCampo.value));
    });

    camadaYSlider.addEventListener("input", function () {
        camadaYCampo.value = camadaYSlider.value;
    });

    camadaYSlider.addEventListener("change", function () {
        camadaYMudar(Number(camadaYSlider.value));
    });

    document.addEventListener(celulasEventoMudou, camadaYSincronizar);

    camadaYSincronizar();
}

camadaYIniciar();