import { estado } from "../estado.js";
import { pedirRedesenho } from "../grid.js";
import { camadaYMudar } from "../camada.js";
import { celulasEventoMudou } from "../celulas.js";
import { historicoAoMudar, historicoDesfazer, historicoRefazer } from "../historico.js";
import { campoDeTexto, janelaAberta } from "./ativa.js";
import { formaRascunhoDescartar } from "../forma.js";

const desfazerBotao = document.getElementById("ferr-desfazer");
const refazerBotao = document.getElementById("ferr-refazer");

function desfazerSincronizar() {
    const semProjeto = estado.projetoAberto === null;

    desfazerBotao.disabled = semProjeto || estado.historico.desfazer.length === 0;
    refazerBotao.disabled = semProjeto || estado.historico.refazer.length === 0;
}

function desfazerAplicar(funcaoHistorico) {
    if (estado.projetoAberto === null) {
        return;
    }

    const nivelY = funcaoHistorico();

    if (nivelY === null) {
        return;
    }

    formaRascunhoDescartar();
    camadaYMudar(nivelY);
    pedirRedesenho();
    document.dispatchEvent(new Event(celulasEventoMudou));
}

function desfazerTeclaApertada(evento) {
    if (estado.projetoAberto === null) {
        return;
    }

    if (!evento.ctrlKey || evento.shiftKey || campoDeTexto(evento.target) || janelaAberta()) {
        return;
    }

    const tecla = evento.key.toLowerCase();

    if (tecla !== "z" && tecla !== "y") {
        return;
    }

    evento.preventDefault();

    if (evento.repeat) {
        return;
    }

    desfazerAplicar(tecla === "z" ? historicoDesfazer : historicoRefazer);
}

export function desfazerIniciar() {
    desfazerBotao.addEventListener("click", () => desfazerAplicar(historicoDesfazer));
    refazerBotao.addEventListener("click", () => desfazerAplicar(historicoRefazer));
    document.addEventListener("keydown", desfazerTeclaApertada);
    historicoAoMudar(desfazerSincronizar);
    desfazerSincronizar();
}