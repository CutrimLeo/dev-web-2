/**
 * Adiciona um ouvinte de evento para executar uma função quando o DOM estiver totalmente carregado.
 * Exibe 'charged' no console quando o evento 'DOMContentLoaded' é disparado.
 */
document.addEventListener('DOMContentLoaded', function(event) {
    console.log('charged');

    const formSearch = document.querySelector('#form-search');

    formSearch.addEventListener('submit', function(event) {
        event.preventDefault(); // Previne o comportamento padrão do formulário
        const formData = new FormData(formSearch);
        // Converte os dados do formulário em um objeto JSON
        const formjson = JSON.stringify(Object.fromEntries(formData.entries()));
        console.log(formjson);
    });
});
