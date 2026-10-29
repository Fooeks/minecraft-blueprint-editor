import { estado } from "./estado.js";

const gridGrid = document.getElementById("grid");
const gridMensagemVazio = document.getElementById("mensagem-vazio");
const gridDesenho = document.getElementById("grid-desenho");

export function exibirProjeto(projeto) {
    estado.projetoAberto = projeto;
    gridMensagemVazio.hidden = true;
    gridDesenho.hidden = false;
    console.log(estado.projetoAberto);
}

function ajustarTamanhoGrid() {
    gridDesenho.width = gridGrid.clientWidth;
    gridDesenho.height = gridGrid.clientHeight;
}

window.addEventListener("resize", ajustarTamanhoGrid);

ajustarTamanhoGrid();