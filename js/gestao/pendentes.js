import { estado } from "../estado.js";
import { salvarProjeto } from "./salvar.js";

const pendentesJanela = document.getElementById("pendentes-alteracoes");
const pendentesAlerta = document.getElementById("pendentes-alerta");
const pendentesSalvar = document.getElementById("btn-pendentes-salvar");
const pendentesContinuar = document.getElementById("btn-pendentes-continuar");
const pendentesCancelar = document.getElementById("btn-pendentes-cancelar");

let pendentesAoContinuar = null;

export function pendentesPerguntar(aoSeguir) {
    if (estado.projetoAberto === null || !estado.alteracoesPendentes) {
        aoSeguir();
        return;
    }

    pendentesAoContinuar = aoSeguir;
    pendentesAlerta.hidden = true;
    pendentesJanela.showModal();
}

export function pendentesIniciar() {
    pendentesSalvar.addEventListener("click", async function () {
        const aoSeguir = pendentesAoContinuar;

        pendentesAlerta.hidden = true;
        pendentesSalvar.disabled = true;

        try {
            const deuCerto = await salvarProjeto();

            if (pendentesAoContinuar !== aoSeguir) {
                return;
            }

            if (!deuCerto) {
                pendentesAlerta.textContent = "Não foi possível salvar o projeto. Tente novamente.";
                pendentesAlerta.hidden = false;
                return;
            }

            pendentesJanela.close();
            aoSeguir();
        } finally {
            pendentesSalvar.disabled = false;
        }
    });

    pendentesContinuar.addEventListener("click", function () {
        const aoSeguir = pendentesAoContinuar;

        pendentesJanela.close();
        aoSeguir();
    });

    pendentesCancelar.addEventListener("click", function () {
        pendentesJanela.close();
    });

    pendentesJanela.addEventListener("close", function () {
        pendentesAlerta.hidden = true;
        pendentesAoContinuar = null;
    });
}