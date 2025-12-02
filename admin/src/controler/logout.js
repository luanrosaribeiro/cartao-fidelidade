document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch(`${API_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (data.success) {
                    window.location.href = '/'; // Redireciona para a tela de login
                } else {
                    alert('Erro ao fazer logout.');
                }
            } catch (error) {
                console.error('Erro de rede:', error);
                alert('Erro de rede ao fazer logout.');
            }
        });
    }
});