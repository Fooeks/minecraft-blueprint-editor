import { estado } from "../estado.js";
import { celulasCompactar } from "../celulas.js";
import { notificacaoMostrar } from "../notificacao.js";

const salvarProjetoBotao = document.getElementById("btn-salvar");

const salvarProjetoTempoSucesso = 3000;
const salvarProjetoTempoErro = 8000;

let salvarProjetoEmAndamento = false;

function salvarProjetoContinuaAberto(idProjeto) {
    return estado.projetoAberto !== null && estado.projetoAberto.idProjeto === idProjeto;
}

export async function salvarProjeto() {
    if (estado.projetoAberto === null || salvarProjetoEmAndamento) {
        return false;
    }

    const idProjeto = estado.projetoAberto.idProjeto;
    const versaoAtual = estado.versaoAlteracoes;

    salvarProjetoBotao.disabled = true;
    salvarProjetoEmAndamento = true;

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
            if (estado.versaoAlteracoes === versaoAtual) {
                estado.alteracoesPendentes = false;
            }

            notificacaoMostrar("Projeto salvo.", "normal", salvarProjetoTempoSucesso);
        }

        return true;
    } catch (erro) {
        console.error(erro);

        if (salvarProjetoContinuaAberto(idProjeto)) {
            notificacaoMostrar("Não foi possível salvar o projeto. Tente novamente.", "erro", salvarProjetoTempoErro);
        }

        return false;
    } finally {
        salvarProjetoBotao.disabled = false;
        salvarProjetoEmAndamento = false;
    }
}

export function salvarProjetoIniciar() {
    salvarProjetoBotao.addEventListener("click", function(){
        if (estado.projetoAberto === null){
            return;
        }

        if (!estado.alteracoesPendentes){
            notificacaoMostrar("Sem alterações pendentes.", "normal", salvarProjetoTempoSucesso);
            return;
        }
        
        salvarProjeto();
    });
}