import { estado } from "../estado.js";

const abasNomes = ["cor", "propriedades", "lista"];

export function abasSincronizar() {
    for (const nome of abasNomes) {
        const aba = document.getElementById("aba-" + nome);
        const conteudo = document.getElementById("conteudo-" + nome);
        const ativa = nome === estado.abaAtiva;

        aba.disabled = estado.projetoAberto === null;
        aba.classList.toggle("marcado", ativa);
        conteudo.hidden = !ativa;
    }
}

function abasSelecionar(nome) {
    if (estado.projetoAberto === null) {
        return;
    }

    estado.abaAtiva = nome;
    abasSincronizar();
}

export function abasIniciar() {
    for (const nome of abasNomes) {
        document.getElementById("aba-" + nome).addEventListener("click", () => abasSelecionar(nome));
    }

    abasSincronizar();
}