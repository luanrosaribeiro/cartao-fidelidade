document.addEventListener('DOMContentLoaded', () => {
    const clienteNomeInput = document.getElementById('cliente-nome');
    const btnBuscarNome = document.getElementById('btn-buscar-nome');
    const btnNovaBusca = document.getElementById('btn-nova-busca');
    const statusClienteDiv = document.getElementById('status-cliente');
    const btnRegistrar = document.getElementById('btn-registrar');
    const btnResgatar = document.getElementById('btn-resgatar');
    const btnEditar = document.getElementById('btn-editar');
    const btnExcluir = document.getElementById('btn-excluir');

    const btnMostrarTodos = document.getElementById('btn-mostrar-todos');

    const modalBuscaNome = document.getElementById('modal-busca-nome');
    const resultadosBuscaDiv = document.getElementById('resultados-busca');
    const closeButtonBusca = modalBuscaNome.querySelector('.close-button');

    const modalEdicao = document.getElementById('modal-edicao');
    const formEdicao = document.getElementById('form-edicao');
    const editNomeInput = document.getElementById('edit-nome');
    const editTelefoneInput = document.getElementById('edit-telefone');
    const editEmailInput = document.getElementById('edit-email');
    const closeButtonEdicao = modalEdicao.querySelector('.close-button-edicao');

    const modalTodosClientes = document.getElementById('modal-todos-clientes');
    const todosClientesLista = document.getElementById('todos-clientes-lista');
    const closeButtonTodos = modalTodosClientes.querySelector('.close-button-todos');

    let clienteAtual = null;

    function logEvent(mensagem, tipo) {
        const dataHora = new Date().toLocaleString('pt-BR');
        const logItem = { mensagem: `[${dataHora}] - ${mensagem}`, tipo };
        let logs = JSON.parse(sessionStorage.getItem('sistemaLogs')) || [];
        logs.unshift(logItem);
        sessionStorage.setItem('sistemaLogs', JSON.stringify(logs));
    }
    
    function showStatus(mensagem, tipo) {
        statusClienteDiv.className = `feedback ${tipo}`;
        statusClienteDiv.innerHTML = mensagem;
    }

    function resetarStatusCliente() {
        showStatus('Aguardando busca...', 'info');
        btnRegistrar.disabled = true;
        btnResgatar.disabled = true;
        btnEditar.disabled = true;
        btnExcluir.disabled = true;
    }

    function resetarBusca() {
        clienteNomeInput.value = '';
        resetarStatusCliente();
        clienteAtual = null;
    }

    function renderizarTabelaClientes(container, clientes, fecharModal) {
        if (clientes.length === 0) {
            container.innerHTML = '<p>Nenhum cliente encontrado.</p>';
            return;
        }

        const tabela = document.createElement('table');
        tabela.className = 'tabela-clientes';
        tabela.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Telefone</th>
                    <th>Almoços</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = tabela.querySelector('tbody');

        clientes.forEach(c => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${c.id}</td>
                <td>${c.nome}</td>
                <td>${c.cpf}</td>
                <td>${c.telefone}</td>
                <td>${c.almoços_acumulados}</td>
            `;
            linha.addEventListener('click', () => {
                exibirDadosCliente(c);
                if (fecharModal) fecharModal();
            });
            tbody.appendChild(linha);
        });

        container.innerHTML = '';
        container.appendChild(tabela);
    }
    
    function exibirDadosCliente(cliente) {
        clienteAtual = cliente;
        let dataInicioFormatada = 'N/A';
        let dataExpiraFormatada = 'N/A';
        if (cliente.data_inicio_acm) {
            const dataInicioObj = new Date(cliente.data_inicio_acm);
            const dataExpiraObj = new Date(dataInicioObj);
            dataExpiraObj.setDate(dataExpiraObj.getDate() + 30);
            dataInicioFormatada = dataInicioObj.toLocaleDateString('pt-BR');
            dataExpiraFormatada = dataExpiraObj.toLocaleDateString('pt-BR');
        }
        const statusMessage = `
            **ID:** ${cliente.id}<br>
            **Nome:** ${cliente.nome}<br>
            **CPF:** ${cliente.cpf}<br>
            **Telefone:** ${cliente.telefone}<br>
            **Almoços Acumulados:** ${cliente.almoços_acumulados} de 10<br>
            **Início do Ciclo:** ${dataInicioFormatada}<br>
            **Ciclo expira em:** ${dataExpiraFormatada}
        `;
        showStatus(statusMessage, 'info');
        btnRegistrar.disabled = false;
        btnResgatar.disabled = cliente.almoços_acumulados < 10;
        btnEditar.disabled = false;
        btnExcluir.disabled = false;
    }

    async function buscarCliente(id) {
        try {
            const response = await fetch(API_URL + `/api/clientes/${id}`);
            const data = await response.json();
            if (response.ok) {
                exibirDadosCliente(data);
            } else {
                showStatus(`Erro: ${data.error}`, 'erro');
                resetarStatusCliente();
            }
        } catch (error) {
            showStatus('Erro de conexão com o servidor.', 'erro');
            resetarStatusCliente();
        }
    }
    
    btnBuscarNome.addEventListener('click', async () => {
        const nome = clienteNomeInput.value.trim();
        if (!nome) {
            showStatus('Nome do cliente é obrigatório para a busca.', 'erro');
            return;
        }
        try {
            const response = await fetch(API_URL + `/api/clientes/buscar-nome/${nome}`);
            const clientes = await response.json();
            if (response.ok) {
                renderizarTabelaClientes(resultadosBuscaDiv, clientes, () => modalBuscaNome.style.display = 'none');
                modalBuscaNome.style.display = 'block';
            } else {
                showStatus(`Erro na busca: ${clientes.error}`, 'erro');
                resultadosBuscaDiv.innerHTML = `<span class="erro">${clientes.error}</span>`;
                modalBuscaNome.style.display = 'block';
            }
        } catch (error) {
            showStatus('Erro de conexão com o servidor.', 'erro');
        }
    });

    btnNovaBusca.addEventListener('click', resetarBusca);

    btnRegistrar.addEventListener('click', async () => {
        if (!clienteAtual) return;
        try {
            const response = await fetch(API_URL + `/api/clientes/${clienteAtual.id}/registrar`, { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                showStatus(data.mensagem, 'sucesso');
                logEvent(`Almoço registrado para ${clienteAtual.nome} (ID: ${clienteAtual.id}).`, 'sucesso');
                buscarCliente(clienteAtual.id);
            } else {
                showStatus(`Erro: ${data.error}`, 'erro');
                logEvent(`Erro ao registrar almoço para ${clienteAtual.nome}.`, 'erro');
            }
        } catch (error) {
            showStatus('Erro de conexão com o servidor.', 'erro');
        }
    });

    btnResgatar.addEventListener('click', async () => {
        if (!clienteAtual) return;
        try {
            const response = await fetch(API_URL + `/api/clientes/${clienteAtual.id}/resgatar`, { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                showStatus(data.mensagem, 'sucesso');
                logEvent(`Cliente ${clienteAtual.nome} (ID: ${clienteAtual.id}) resgatou a cortesia.`, 'sucesso');
                buscarCliente(clienteAtual.id);
            } else {
                showStatus(`Erro: ${data.error}`, 'erro');
                logEvent(`Erro ao resgatar cortesia para ${clienteAtual.nome}.`, 'erro');
            }
        } catch (error) {
            showStatus('Erro de conexão com o servidor.', 'erro');
        }
    });
    
    btnEditar.addEventListener('click', () => {
        if (!clienteAtual) return;
        editNomeInput.value = clienteAtual.nome;
        editTelefoneInput.value = clienteAtual.telefone;
        editEmailInput.value = clienteAtual.email || '';
        modalEdicao.style.display = 'block';
    });

    btnExcluir.addEventListener('click', async () => {
        if (!clienteAtual) return;
        const confirmacao = confirm(`Tem certeza que deseja excluir o cliente ${clienteAtual.nome} (ID: ${clienteAtual.id})?`);
        if (confirmacao) {
            try {
                const response = await fetch(API_URL + `/api/clientes/${clienteAtual.id}`, { method: 'DELETE' });
                const data = await response.json();
                if (response.ok) {
                    showStatus(`Cliente **${clienteAtual.nome}** (ID: ${clienteAtual.id}) excluído com sucesso.`, 'sucesso');
                    logEvent(`Cliente ${clienteAtual.nome} (ID: ${clienteAtual.id}) excluído.`, 'sucesso');
                    resetarBusca();
                } else {
                    showStatus(`Erro ao excluir: ${data.error}`, 'erro');
                    logEvent(`Erro ao excluir cliente ${clienteAtual.nome}.`, 'erro');
                }
            } catch (error) {
                showStatus('Erro de conexão com o servidor.', 'erro');
            }
        }
    });

    formEdicao.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = editNomeInput.value.trim();
        const telefone = editTelefoneInput.value.trim();
        const email = editEmailInput.value.trim();
        
        if (!nome || !telefone) {
            showStatus('Nome e telefone são obrigatórios para a edição.', 'erro');
            return;
        }

        try {
            const response = await fetch(API_URL + `/api/clientes/${clienteAtual.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, telefone, email })
            });
            const data = await response.json();
            if (response.ok) {
                showStatus(data.mensagem, 'sucesso');
                logEvent(`Dados do cliente ${clienteAtual.nome} (ID: ${clienteAtual.id}) atualizados.`, 'sucesso');
                modalEdicao.style.display = 'none';
                buscarCliente(clienteAtual.id);
            } else {
                showStatus(`Erro ao editar: ${data.error}`, 'erro');
                logEvent(`Erro ao editar cliente ${clienteAtual.nome}.`, 'erro');
            }
        } catch (error) {
            showStatus('Erro de conexão com o servidor.', 'erro');
        }
    });

    btnMostrarTodos.addEventListener('click', async () => {
        try {
            const response = await fetch(API_URL + '/api/clientes');
            const clientes = await response.json();
            if (response.ok) {
                renderizarTabelaClientes(todosClientesLista, clientes, () => modalTodosClientes.style.display = 'none');
                modalTodosClientes.style.display = 'block';
            } else {
                showStatus(`Erro ao buscar todos os clientes: ${clientes.error}`, 'erro');
            }
        } catch (error) {
            showStatus('Erro de conexão com o servidor.', 'erro');
        }
    });
    
    closeButtonBusca.addEventListener('click', () => {
        modalBuscaNome.style.display = 'none';
    });
    closeButtonEdicao.addEventListener('click', () => {
        modalEdicao.style.display = 'none';
    });
    closeButtonTodos.addEventListener('click', () => {
        modalTodosClientes.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target == modalBuscaNome) {
            modalBuscaNome.style.display = 'none';
        }
        if (event.target == modalEdicao) {
            modalEdicao.style.display = 'none';
        }
        if (event.target == modalTodosClientes) {
            modalTodosClientes.style.display = 'none';
        }
    });
});