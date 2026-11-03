import { estado } from "../estado.js";

const nomesFerramentas = ["selecao", "mover", "pincel", "balde", "formas", "borracha", "regua"];

function marcarAtiva(ferramenta) {
    const anterior = document.querySelector("#barra-ferramentas .marcado");

    if (anterior !== null) {
        anterior.classList.remove("marcado");
    }

    document.getElementById("ferr-" + ferramenta).classList.add("marcado");
}

export function selecionarFerramenta(ferramenta) {
    if (estado.projetoAberto === null) {
        return;
    }

    estado.ferramenta = ferramenta;
    marcarAtiva(ferramenta);
}

export function ferramentaAtivaIniciar() {
    for (const nome of nomesFerramentas) {
        document.getElementById("ferr-" + nome).addEventListener("click", () => selecionarFerramenta(nome));
    }

    marcarAtiva(estado.ferramenta);
}