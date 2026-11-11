import { estado } from "./estado.js";
import { celulasEventoMudou } from "./celulas.js";

function avisoIniciar() {
    document.addEventListener(celulasEventoMudou, function() {
        if (estado.projetoAberto === null) {
            return;
        }

        estado.alteracoesPendentes = true;
        estado.versaoAlteracoes++;
    });

    window.addEventListener("beforeunload", function(evento) {
        if (estado.projetoAberto === null) {
            return;
        }

        if (estado.alteracoesPendentes) {
            evento.preventDefault();
        }
    });
}

avisoIniciar();