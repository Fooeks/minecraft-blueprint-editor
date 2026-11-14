const notificacaoElemento = document.getElementById("notificacao");

let notificacaoTemporizador = null;

export function notificacaoMostrar(texto, tipo, duracao) {
    clearTimeout(notificacaoTemporizador);

    notificacaoElemento.textContent = texto;
    notificacaoElemento.classList.toggle("notificacao-erro", tipo === "erro");

    if (notificacaoElemento.matches(":popover-open")) {
        notificacaoElemento.hidePopover();
    }
    notificacaoElemento.showPopover();

    notificacaoTemporizador = setTimeout(function () {
        notificacaoElemento.hidePopover();
    }, duracao);
}