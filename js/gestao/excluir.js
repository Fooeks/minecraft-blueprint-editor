import { montarListaProjetos } from "./lista.js";
import { estado } from "../estado.js";
import { limparProjeto } from "../grid.js";
import { apagarUltimoProjeto } from "../armazenamento.js";
import { notificacaoMostrar } from "../notificacao.js";

const excluirProjetoBotao = document.getElementById("btn-excluir");
const excluirProjetoJanela = document.getElementById("excluir-projeto");
const excluirProjetoLista = document.getElementById("excluir-lista");
const excluirProjetoVazio = document.getElementById("excluir-vazio");
const excluirProjetoAlerta = document.getElementById("excluir-alerta");
const excluirProjetoConfirmar = document.getElementById("btn-excluir-confirmar");
const excluirProjetoCancelar = document.getElementById("btn-excluir-cancelar");
const excluirProjetoConfirmacaoJanela = document.getElementById("excluir-projeto-confirmacao");
const excluirProjetoConfirmacaoNome = document.getElementById("excluir-confirmacao-nome");
const excluirProjetoConfirmacaoAlerta = document.getElementById("excluir-confirmacao-alerta");
const excluirProjetoConfirmacaoConfirmar = document.getElementById("btn-excluir-confirmacao-confirmar");
const excluirProjetoConfirmacaoCancelar = document.getElementById("btn-excluir-confirmacao-cancelar");

const excluirProjetoTempoAviso = 3000;

export function excluirProjetoIniciar() {

    excluirProjetoBotao.addEventListener("click", async function () {
        excluirProjetoVazio.hidden = true;
        excluirProjetoAlerta.hidden = true;
        montarListaProjetos(excluirProjetoLista, "excluir", []);
        excluirProjetoConfirmar.disabled = true;

        excluirProjetoJanela.showModal();

        try {
            const resposta = await fetch("api/listarProjetos.php");

            if (!resposta.ok) {
                throw new Error("Falha ao listar os projetos: " + resposta.status);
            }

            const dados = await resposta.json();
            const projetos = dados.projetos;

            montarListaProjetos(excluirProjetoLista, "excluir", projetos);

            if (projetos.length === 0) {
                excluirProjetoVazio.hidden = false;
            }
        } catch (erro) {
            console.error(erro);
            excluirProjetoAlerta.textContent = "Não foi possível listar os projetos. Tente novamente.";
            excluirProjetoAlerta.hidden = false;
        }
    });

    excluirProjetoLista.addEventListener("change", function () {
        excluirProjetoConfirmar.disabled = false;
    });

    excluirProjetoConfirmar.addEventListener("click", function () {
        const marcado = excluirProjetoLista.querySelector('input[name="excluir"]:checked');
        const nome = marcado.closest("label").querySelector("span").textContent;

        excluirProjetoConfirmacaoNome.textContent = nome;
        excluirProjetoConfirmacaoAlerta.hidden = true;
        excluirProjetoConfirmacaoJanela.showModal();
    });

    excluirProjetoCancelar.addEventListener("click", function () {
        excluirProjetoJanela.close();
    });

    excluirProjetoJanela.addEventListener("close", function () {
        montarListaProjetos(excluirProjetoLista, "excluir", []);
        excluirProjetoVazio.hidden = true;
        excluirProjetoAlerta.hidden = true;
        excluirProjetoConfirmar.disabled = true;
    });
    
    excluirProjetoConfirmacaoConfirmar.addEventListener("click", async function () {
        const marcado = excluirProjetoLista.querySelector('input[name="excluir"]:checked');
        const idProjeto = marcado.value;

        excluirProjetoConfirmacaoAlerta.hidden = true;
        excluirProjetoConfirmacaoConfirmar.disabled = true;

        try {
            const resposta = await fetch("api/excluirProjeto.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: idProjeto })
            });

            if (!resposta.ok) {
                throw new Error("Falha ao excluir o projeto: " + resposta.status);
            }

            if (estado.projetoAberto !== null && estado.projetoAberto.idProjeto === idProjeto) {
                limparProjeto();
                apagarUltimoProjeto();
            }

            excluirProjetoConfirmacaoJanela.close();
            excluirProjetoJanela.close();
            notificacaoMostrar("Projeto excluído.", "normal", excluirProjetoTempoAviso);
        } catch (erro) {
            console.error(erro);
            excluirProjetoConfirmacaoAlerta.textContent = "Não foi possível excluir o projeto. Tente novamente.";
            excluirProjetoConfirmacaoAlerta.hidden = false;
        } finally {
            excluirProjetoConfirmacaoConfirmar.disabled = false;
        }
    });

    excluirProjetoConfirmacaoCancelar.addEventListener("click", function () {
        excluirProjetoConfirmacaoJanela.close();
    });
}