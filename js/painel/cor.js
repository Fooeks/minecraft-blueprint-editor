import { estado } from "../estado.js";
import { pedirRedesenho } from "../grid.js";

const corCampo = document.getElementById("campo-cor");
const corPaleta = document.getElementById("paleta");
const corRotuloRecentes = document.getElementById("rotulo-recentes");
const corRecentes = document.getElementById("recentes");

const corPredefinida = [
    { cor: "#000000", nome: "Preto" },
    { cor: "#0000aa", nome: "Azul-escuro" },
    { cor: "#00aa00", nome: "Verde-escuro" },
    { cor: "#00aaaa", nome: "Ciano-escuro" },
    { cor: "#aa0000", nome: "Vermelho-escuro" },
    { cor: "#aa00aa", nome: "Roxo" },
    { cor: "#ffaa00", nome: "Dourado" },
    { cor: "#aaaaaa", nome: "Cinza" },
    { cor: "#555555", nome: "Cinza-escuro" },
    { cor: "#5555ff", nome: "Azul" },
    { cor: "#55ff55", nome: "Verde-claro" },
    { cor: "#55ffff", nome: "Ciano" },
    { cor: "#ff5555", nome: "Vermelho" },
    { cor: "#ff55ff", nome: "Rosa" },
    { cor: "#ffff55", nome: "Amarelo" },
    { cor: "#ffffff", nome: "Branco" }
];

const corRecenteLimite = 5;

function corAmostraCriar(amostra) {
    const botao = document.createElement("button");

    botao.type = "button";
    botao.classList.add("amostra-cor");
    botao.title = amostra.nome;
    botao.setAttribute("aria-label", amostra.nome);
    botao.dataset.cor = amostra.cor;
    botao.style.backgroundColor = amostra.cor;

    return botao;
}

function corPaletaDesenhar() {
    for (const paleta of corPredefinida) {
        corPaleta.append(corAmostraCriar(paleta));
    }
}

function corRecenteRegistrar(recente) {
    const outras = estado.coresRecentes.filter((cor) => cor !== recente);

    outras.unshift(recente);
    estado.coresRecentes = outras.slice(0, corRecenteLimite);
}

function corRecenteDesenhar() {
    corRecentes.replaceChildren();

    for (const cor of estado.coresRecentes) {
        corRecentes.append(corAmostraCriar({ cor: cor, nome: cor }));
    }

    const vazio = estado.coresRecentes.length === 0;

    corRotuloRecentes.hidden = vazio;
    corRecentes.hidden = vazio;
}

function corSincronizar() {
    corCampo.value = estado.corAtiva;

    corRecenteDesenhar();

    for (const amostra of document.querySelectorAll(".amostra-cor")) {
        amostra.classList.toggle("marcado", amostra.dataset.cor === estado.corAtiva);
    }
}

function corAtivar(cor, confirmar) {
    estado.corAtiva = cor;

    if (confirmar) {
        corRecenteRegistrar(cor);
    }

    corSincronizar();

    if (estado.previaForma !== null) {
        pedirRedesenho();
    }
}

function corAmostraClicar(evento, confirmar) {
    if (estado.projetoAberto === null) {
        return;
    }

    const botao = evento.target.closest(".amostra-cor");

    if (botao === null) {
        return;
    }

    corAtivar(botao.dataset.cor, confirmar);
}

function corCampoMudar(confirmar) {
    if (estado.projetoAberto === null) {
        return;
    }

    corAtivar(corCampo.value, confirmar);
}

export function corIniciar() {
    corCampo.addEventListener("input", () => corCampoMudar(false));
    corCampo.addEventListener("change", () => corCampoMudar(true));
    corPaleta.addEventListener("click", (evento) => corAmostraClicar(evento, true));
    corRecentes.addEventListener("click", (evento) => corAmostraClicar(evento, false));
    corPaletaDesenhar();
    corSincronizar();
}