document.addEventListener('DOMContentLoaded', () => {
    const nomeInput = document.getElementById('nome');
    const cpfInput = document.getElementById('cpf');
    const telefoneInput = document.getElementById('telefone');
    const emailInput = document.getElementById('email');
    const btnCadastrar = document.getElementById('btn-cadastrar');
    const btnLimparCampos = document.getElementById('btn-limpar-campos');
    const statusDiv = document.getElementById('status-cadastro');

    // Função para formatar o CPF
    cpfInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 11) {
            value = value.slice(0, 11);
        }

        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{3})$/, '$1.$2');
        } else {
            value = value.replace(/^(\d{3})$/, '$1');
        }
        
        e.target.value = value;
    });

    // Função para formatar o telefone
    telefoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 11) {
            value = value.slice(0, 11);
        }

        if (value.length > 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
        } else {
            value = value.replace(/^(\d*)$/, '($1');
        }
        
        e.target.value = value;
    });


    function showStatus(mensagem, tipo) {
        statusDiv.className = `feedback ${tipo}`;
        statusDiv.innerHTML = mensagem;
    }

    function clearInputs() {
        nomeInput.value = '';
        cpfInput.value = '';
        telefoneInput.value = '';
        emailInput.value = '';
    }

    btnLimparCampos.addEventListener('click', () => {
        clearInputs();
        showStatus('Aguardando cadastro...', 'info');
    });
    
    btnCadastrar.addEventListener('click', async () => {
        const nome = nomeInput.value.trim();
        const cpf = cpfInput.value.replace(/\D/g, '');
        const telefone = telefoneInput.value.replace(/\D/g, ''); // Remove a formatação para enviar
        const email = emailInput.value.trim();

        if (!nome || cpf.length !== 11 || telefone.length !== 11) {
            showStatus('Nome, CPF (11 dígitos) e Telefone (11 dígitos, ex: (53) 99999-9999) são obrigatórios.', 'erro');
            return;
        }

        try {
            const response = await fetch('/clientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nome, cpf, telefone, email })
            });
            const data = await response.json();
            if (response.ok) {
                showStatus(data.mensagem || 'Cliente cadastrado com sucesso!', 'sucesso');
                clearInputs();
            } else {
                showStatus(`Erro: ${data.error}`, 'erro');
            }
        } catch (error) {
            showStatus('Erro de conexão com o servidor.', 'erro');
        }
    });
});