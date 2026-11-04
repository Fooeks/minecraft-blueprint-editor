import { exibirProjeto } from "../grid.js";

const novoProjetoBotao = document.getElementById("btn-novo");
const novoProjetoJanela = document.getElementById("criar-projeto");
const novoProjetoNome = document.getElementById("campo-nome");
const novoProjetoDimensaoX = document.getElementById("campo-dimensao-x");
const novoProjetoDimensaoZ = document.getElementById("campo-dimensao-z");
const novoProjetoAlerta = document.getElementById("criar-alerta");
const novoProjetoCancelar = document.getElementById("btn-criar-cancelar");
const novoProjetoConfirmar = document.getElementById("btn-criar-confirmar");

function medidaDimensaoValida(valor) {
    return Number.isInteger(valor) && valor >= 1 && valor <= 500;
}

export function novoProjetoIniciar(){

    novoProjetoBotao.addEventListener("click", function () {
        novoProjetoJanela.showModal();
    });

    novoProjetoCancelar.addEventListener("click", function () {
        novoProjetoJanela.close();
    });

    novoProjetoJanela.addEventListener("close", function () {
        novoProjetoNome.value = "";
        novoProjetoDimensaoX.value = 100;
        novoProjetoDimensaoZ.value = 100;
        novoProjetoAlerta.hidden = true;
    });

    novoProjetoConfirmar.addEventListener("click", async function () {
        const dimensaoX = Number(novoProjetoDimensaoX.value);
        const dimensaoZ = Number(novoProjetoDimensaoZ.value);

        if (!medidaDimensaoValida(dimensaoX) || !medidaDimensaoValida(dimensaoZ)) {
            novoProjetoAlerta.textContent = "Informe números inteiros entre 1 e 500.";
            novoProjetoAlerta.hidden = false;
            return;
        }

        novoProjetoAlerta.hidden = true;
        novoProjetoConfirmar.disabled = true;

        try {
            const resposta = await fetch("api/criarProjeto.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: novoProjetoNome.value,
                    dimensaoX: dimensaoX,
                    dimensaoZ: dimensaoZ
                })
            });

            if (!resposta.ok) {
                throw new Error("Falha na criação do projeto: " + resposta.status);
            }

            const projeto = await resposta.json();
            exibirProjeto(projeto);
            novoProjetoJanela.close();
        } catch (erro) {
            console.error(erro);
            novoProjetoAlerta.textContent = "Não foi possível criar o projeto. Tente novamente.";
            novoProjetoAlerta.hidden = false;
        } finally {
            novoProjetoConfirmar.disabled = false;
        }
    });
}