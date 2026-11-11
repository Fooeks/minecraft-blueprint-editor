import { estado } from "../estado.js";
import { celulasCompactar } from "../celulas.js";

const salvarProjetoBotao = document.getElementById("btn-salvar");
const salvarProjetoStatus = document.getElementById("salvar-status");

const salvarProjetoTempoSucesso = 3000;
const salvarProjetoTempoErro = 8000;

let salvarProjetoTemporizador = null;

function salvarProjetoMostrar(texto, duracao) {
    clearTimeout(salvarProjetoTemporizador);

    salvarProjetoStatus.textContent = texto;
    salvarProjetoStatus.hidden = false;

    salvarProjetoTemporizador = setTimeout(function () {
        salvarProjetoStatus.hidden = true;
    }, duracao);
}

function salvarProjetoContinuaAberto(idProjeto) {
    return estado.projetoAberto !== null && estado.projetoAberto.idProjeto === idProjeto;
}

export function salvarProjetoIniciar() {

    salvarProjetoBotao.addEventListener("click", async function () {
        if (estado.projetoAberto === null) {
            return;
        }

        const idProjeto = estado.projetoAberto.idProjeto;

        clearTimeout(salvarProjetoTemporizador);
        salvarProjetoStatus.hidden = true;
        salvarProjetoBotao.disabled = true;

        try {
            const corpo = JSON.stringify({ id: idProjeto, camadas: celulasCompactar() });

            const resposta = await fetch("api/salvarProjeto.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: corpo
            });

            if (!resposta.ok) {
                throw new Error("Falha ao salvar projeto: " + resposta.status);
            }

            if (salvarProjetoContinuaAberto(idProjeto)) {
                salvarProjetoMostrar("Projeto salvo.", salvarProjetoTempoSucesso);
            }
        } catch (erro) {
            console.error(erro);

            if (salvarProjetoContinuaAberto(idProjeto)) {
                salvarProjetoMostrar("Não foi possível salvar o projeto. Tente novamente.", salvarProjetoTempoErro);
            }
        } finally {
            salvarProjetoBotao.disabled = false;
        }
    });
}