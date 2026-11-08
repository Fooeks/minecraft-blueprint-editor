import { estado } from "../estado.js";

const corCampo = document.getElementById("campo-cor");

function corMudar() {
    if (estado.projetoAberto === null) {
        return;
    }

    estado.corAtiva = corCampo.value;
}

export function corIniciar() {
    corCampo.value = estado.corAtiva;
    corCampo.addEventListener("input", corMudar);
}