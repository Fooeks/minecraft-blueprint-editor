import { estado } from "./estado.js";

const gridGrid = document.getElementById("grid");
const gridMensagemVazio = document.getElementById("mensagem-vazio");
const gridDesenho = document.getElementById("grid-desenho");
const contexto = gridDesenho.getContext("2d");

let tamanhoCelula = 20;

function criarGrid() {
    if (estado.projetoAberto === null) {
        return;
    }

    const dimensaoX = estado.projetoAberto.dimensaoX;
    const dimensaoZ = estado.projetoAberto.dimensaoZ;

    contexto.clearRect(0, 0, gridDesenho.width, gridDesenho.height);
    contexto.strokeStyle = "#e40d0d";
    contexto.lineWidth = 1;

    const larguraTotal = dimensaoX * tamanhoCelula;
    const alturaTotal = dimensaoZ * tamanhoCelula;

    contexto.beginPath();

    for (let i = 0; i <= dimensaoX; i++) {
        const x = i * tamanhoCelula + 0.5;
        contexto.moveTo(x, 0);
        contexto.lineTo(x, alturaTotal);
    }

    for (let j = 0; j <= dimensaoZ; j++) {
        const y = j * tamanhoCelula + 0.5;
        contexto.moveTo(0, y);
        contexto.lineTo(larguraTotal, y);
    }

    contexto.stroke();
}
export function exibirProjeto(projeto) {
    estado.projetoAberto = projeto;
    gridMensagemVazio.hidden = true;
    gridDesenho.hidden = false;
    criarGrid();
    console.log(estado.projetoAberto);
}

export function limparProjeto() {
    estado.projetoAberto = null;
    gridDesenho.hidden = true;
    gridMensagemVazio.hidden = false;
}

function ajustarTamanhoGrid() {
    gridDesenho.width = gridGrid.clientWidth;
    gridDesenho.height = gridGrid.clientHeight;
    criarGrid();
}

window.addEventListener("resize", ajustarTamanhoGrid);

ajustarTamanhoGrid();