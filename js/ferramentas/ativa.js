import { estado } from "../estado.js";
import { pedirRedesenho } from "../grid.js";

const nomesFerramentas = ["selecao", "mover", "pincel", "balde", "borracha", "regua"];
const atalhosFerramentas = { p: "pincel", e: "borracha", v: "selecao" };

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

    if (ferramenta !== "selecao" && ferramenta !== "mover") {
        estado.previaForma = null;
    }

    marcarAtiva(ferramenta);
    pedirRedesenho();
}

export function janelaAberta() {
    return document.querySelector("dialog[open]") !== null;
}

export function campoDeTexto(alvo) {
    const campo = alvo.closest("input, textarea");

    if (campo === null) {
        return false;
    }

    if (campo.tagName === "TEXTAREA") {
        return true;
    }

    return campo.type === "text" || campo.type === "number";
}

function atalhoAtivo(evento) {
    if (estado.projetoAberto === null) {
        return;
    }

    if (evento.ctrlKey || evento.altKey || evento.metaKey || evento.shiftKey) {
        return;
    }

    if (evento.repeat) {
        return;
    }

    if (campoDeTexto(evento.target) || janelaAberta()) {
        return;
    }

    const acao = atalhosFerramentas[evento.key.toLowerCase()];

    if (acao === undefined) {
        return;
    }

    selecionarFerramenta(acao);
}

export function ferramentaAtivaIniciar() {
    document.addEventListener("keydown", atalhoAtivo);
    
    for (const nome of nomesFerramentas) {
        document.getElementById("ferr-" + nome).addEventListener("click", () => selecionarFerramenta(nome));
    }

    marcarAtiva(estado.ferramenta);
}