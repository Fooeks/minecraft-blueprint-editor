import { montarListaProjetos } from "./lista.js";
import { exibirProjeto } from "../grid.js";

const abrirProjetoBotao = document.getElementById("btn-abrir");
const abrirProjetoJanela = document.getElementById("abrir-projeto");
const abrirProjetoLista = document.getElementById("abrir-lista");
const abrirProjetoVazio = document.getElementById("abrir-vazio");
const abrirProjetoAlerta = document.getElementById("abrir-alerta");
const abrirProjetoCancelar = document.getElementById("btn-abrir-cancelar");
const abrirProjetoConfirmar = document.getElementById("btn-abrir-confirmar");

export function abrirProjetoIniciar(){

    abrirProjetoBotao.addEventListener("click", async function () {
        abrirProjetoVazio.hidden = true;
        abrirProjetoAlerta.hidden = true;
        montarListaProjetos(abrirProjetoLista, "abrir", []);
        abrirProjetoConfirmar.disabled = true;
        
        abrirProjetoJanela.showModal();

        try {
            const resposta = await fetch("api/listarProjetos.php");
        
            if (!resposta.ok) {
                throw new Error("Falha ao listar os projetos: " + resposta.status);
            }

            const dados = await resposta.json();
            const projetos = dados.projetos;

            montarListaProjetos(abrirProjetoLista, "abrir", projetos);

            if (projetos.length === 0){
                abrirProjetoVazio.hidden = false;
            }

        } catch (erro) {
            console.error(erro);
            abrirProjetoAlerta.textContent = "Não foi possível listar os projetos. Tente novamente.";
            abrirProjetoAlerta.hidden = false;
        } 
    }); 

    abrirProjetoLista.addEventListener("change", function(){
        abrirProjetoConfirmar.disabled = false;
    });

    abrirProjetoConfirmar.addEventListener("click", async function () {
        const marcado = abrirProjetoLista.querySelector('input[name="abrir"]:checked');
        const idProjeto = marcado.value;

        abrirProjetoAlerta.hidden = true;
        abrirProjetoConfirmar.disabled = true;

        try {
            const resposta = await fetch("api/abrirProjeto.php?id=" + encodeURIComponent(idProjeto));

            if (!resposta.ok) {
                throw new Error("Falha ao abrir o projeto: " + resposta.status);
            }

            const projeto = await resposta.json();
            exibirProjeto(projeto);
            abrirProjetoJanela.close();
        } catch (erro) {
            console.error(erro);
            abrirProjetoAlerta.textContent = "Não foi possível abrir o projeto. Tente novamente.";
            abrirProjetoAlerta.hidden = false;
        } finally {
            abrirProjetoConfirmar.disabled = false;
        }
    });

    abrirProjetoCancelar.addEventListener("click", function () {
        abrirProjetoJanela.close();
    });
}