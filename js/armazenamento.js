const CHAVE = "ultimo-projeto";

export function guardarUltimoProjeto(idProjeto) {
    try {
        localStorage.setItem(CHAVE, idProjeto);
    } catch (erro) {
        console.error("Não foi possível guardar o id do último projeto:", erro);
    }
}

export function lerUltimoProjeto() {
    try {
        return localStorage.getItem(CHAVE);
    } catch (erro) {
        console.error("Não foi possível ler o id do último projeto guardado:", erro);
        return null;
    }
}

export function apagarUltimoProjeto() {
    try {
        localStorage.removeItem(CHAVE);
    } catch (erro) {
        console.error("Não foi possível apagar o id do último projeto guardado:", erro);
    }
}