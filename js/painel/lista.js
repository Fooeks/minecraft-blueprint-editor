import { estado } from "../estado.js";
import { celulasEventoMudou } from "../celulas.js";
import { formaEventoSelecionar } from "../forma.js";

const listaFormas = document.getElementById("lista-formas");
const listaVazio = document.getElementById("lista-vazio");

export function listaSincronizar() {
    const formas = [...estado.formas.values()].sort((formaA, formaB) => formaA.idForma - formaB.idForma);

    listaFormas.replaceChildren();

    for (const forma of formas) {
        const item = document.createElement("li");
        const botao = document.createElement("button");

        botao.textContent = forma.nome + " (Y " + forma.nivelY + ")";
        botao.type = "button";
        botao.dataset.idForma = forma.idForma;
        item.append(botao);
        listaFormas.append(item);
    }

    listaVazio.hidden = formas.length > 0;
    listaFormas.hidden = formas.length === 0;
}

export function listaMarcarSelecionada() {
    const idEmEdicao = estado.previaForma !== null ? estado.previaForma.idForma : null;

    for (const botao of listaFormas.querySelectorAll("button")) {
        botao.classList.toggle("marcado", Number(botao.dataset.idForma) === idEmEdicao);
    }
}

function listaClicar(evento) {
    if (estado.projetoAberto === null) {
        return;
    }

    const botao = evento.target.closest("button");

    if (botao === null) {
        return;
    }

    const idForma = Number(botao.dataset.idForma);

    document.dispatchEvent(new CustomEvent(formaEventoSelecionar, { detail: { idForma: idForma } }));
}

export function listaIniciar() {
    document.addEventListener(celulasEventoMudou, listaSincronizar);
    listaFormas.addEventListener("click", listaClicar);
}