import { estado } from "../estado.js";
import { exibirProjeto } from "../grid.js";
import { lerUltimoProjeto, apagarUltimoProjeto } from "../armazenamento.js";

export async function reabrirProjetoIniciar() {
    const idProjeto = lerUltimoProjeto();

    if (idProjeto === null) {
        return;
    }

    try {
        const resposta = await fetch("api/abrirProjeto.php?id=" + encodeURIComponent(idProjeto));

        if (!resposta.ok) {
            if ((resposta.status === 400 || resposta.status === 404) && estado.projetoAberto === null) {
                apagarUltimoProjeto();
            }
            throw new Error("Falha ao reabrir o último projeto: " + resposta.status);
        }

        const projeto = await resposta.json();

        if (estado.projetoAberto !== null) {
            return;
        }

        exibirProjeto(projeto);
    } catch (erro) {
        console.error(erro);
    }
}