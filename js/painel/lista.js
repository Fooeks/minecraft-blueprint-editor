import { estado } from "../estado.js";
import { celulasEventoMudou } from "../celulas.js";

const listaFormas = document.getElementById("lista-formas");
const listaVazio = document.getElementById("lista-vazio");

export function listaSincronizar() {
    const formas = [...estado.formas.values()].sort((formaA, formaB) => formaA.idForma - formaB.idForma);

    listaFormas.replaceChildren();

    for (const forma of formas) {
        const item = document.createElement("li");

        item.textContent = forma.nome + " (Y " + forma.nivelY + ")";
        listaFormas.append(item);
    }

    listaVazio.hidden = formas.length > 0;
    listaFormas.hidden = formas.length === 0;
}

export function listaIniciar() {
    document.addEventListener(celulasEventoMudou, listaSincronizar);
}