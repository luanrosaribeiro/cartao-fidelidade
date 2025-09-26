document.addEventListener('DOMContentLoaded', () => {
    const logSistemaDiv = document.getElementById('log-sistema');
    const btnMostrarMais = document.getElementById('btn-mostrar-mais');
    
    let todosOsLogs = JSON.parse(sessionStorage.getItem('sistemaLogs')) || [];
    
    const maxLogsIniciais = 10;
    
    function renderizarLogs(limite) {
        logSistemaDiv.innerHTML = '';
        const logsParaExibir = todosOsLogs.slice(0, limite);
        
        if (logsParaExibir.length === 0) {
            logSistemaDiv.innerHTML = '<p class="feedback info">Nenhum log para exibir. Realize ações no sistema para gerar logs.</p>';
            btnMostrarMais.style.display = 'none';
            return;
        }

        logsParaExibir.forEach(logItem => {
            const logElement = document.createElement('div');
            logElement.className = `feedback ${logItem.tipo}`;
            logElement.innerHTML = logItem.mensagem;
            logSistemaDiv.appendChild(logElement);
        });
        
        if (todosOsLogs.length > limite) {
            btnMostrarMais.style.display = 'block';
        } else {
            btnMostrarMais.style.display = 'none';
        }
    }
    
    btnMostrarMais.addEventListener('click', () => {
        renderizarLogs(todosOsLogs.length);
    });
    
    renderizarLogs(maxLogsIniciais);
});