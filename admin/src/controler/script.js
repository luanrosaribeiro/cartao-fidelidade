document.addEventListener('DOMContentLoaded', () => {
    const btnLogin = document.getElementById('btn-login');
    const usuarioInput = document.getElementById('usuario');
    const senhaInput = document.getElementById('senha');
    
    btnLogin.addEventListener('click', async () => {
        const usuario = usuarioInput.value;
        const senha = senhaInput.value;
        
        try {
            const response = await fetch(API_URL + '/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ usuario, senha })
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = result.redirectUrl;
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert('Erro ao tentar fazer login. Tente novamente mais tarde.');
        }
    });
});