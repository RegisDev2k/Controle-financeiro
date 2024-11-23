// State management
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// DOM Elements
const addTransactionBtn = document.getElementById('addTransactionBtn');
const transactionModal = document.getElementById('transactionModal');
const closeModal = document.getElementById('closeModal');
const transactionForm = document.getElementById('transactionForm');
const transactionsList = document.getElementById('transactionsList');


// Event Listeners
addTransactionBtn.addEventListener('click', () => {
    transactionModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    transactionModal.classList.add('hidden');
});

transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        date: document.getElementById('date').value
    };

    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    updateUI();
    transactionForm.reset();
    transactionModal.classList.add('hidden');
});

// Helper Functions
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function getCategoryIcon(category) {
    const icons = {
        salary: 'fa-money-bill-wave',
        food: 'fa-utensils',
        transport: 'fa-car',
        housing: 'fa-home',
        entertainment: 'fa-film',
        other: 'fa-question-circle'
    };
    return icons[category] || 'fa-question-circle';
}

function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();
}

function updateUI() {
    // Update totals
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalBalance = totalIncome - totalExpenses;

    document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);

    // Atualizar a lista de transações
    transactionsList.innerHTML = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(transaction => `
            <div class="flex items-center justify-between p-6 hover:bg-gray-50">
                <div class="flex items-center">
                    <div class="bg-gray-100 rounded-full p-3 mr-4">
                        <i class="fas ${getCategoryIcon(transaction.category)} text-gray-600"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-900 text-center">${transaction.description}</p>
                        <p class="text-sm text-gray-500">${new Date(transaction.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
                <div class="flex items-center">
                    <span class="text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                        ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(Math.abs(transaction.amount))}
                    </span>
                    <button onclick="deleteTransaction(${transaction.id})" class="ml-4 text-red-500 hover:text-red-700">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');

    // Verificar se a lista de transações tem 5 ou mais itens
    if (transactions.length >= 5) {
        transactionsList.classList.add('scrollable');
    } else {
        transactionsList.classList.remove('scrollable');
    }

         // Verificar se a lista de transações tem 5 ou mais itens

        renderChart(); // Atualizando o gráfico após atualizar a UI
}

// Gráficos com Chart.js
// Gráficos com Chart.js
let chartInstance = null;

function renderChart() {
    const ctx = document.getElementById('transactionsChart').getContext('2d');

    // Agrupando as transações por categoria
    const categories = ['salary', 'food', 'transport', 'housing', 'entertainment', 'other'];
    const categoryTotals = categories.map(category => {
        return transactions
            .filter(t => t.category === category)
            .reduce((sum, t) => sum + t.amount, 0);
    });

    if (chartInstance) {
        // Se o gráfico já existe, atualiza os dados
        chartInstance.data.datasets[0].data = categoryTotals;
        chartInstance.update();
    } else {
        // Criando o gráfico
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories.map(category => {
                    const categoryNames = {
                        salary: 'Salário',
                        food: 'Alimentação',
                        transport: 'Transporte',
                        housing: 'Moradia',
                        entertainment: 'Entretenimento',
                        other: 'Outros'
                    };
                    return categoryNames[category] || category;
                }),
                datasets: [{
                    label: 'Total por Categoria',
                    data: categoryTotals,
                    backgroundColor: ['#4CAF50', '#FFEB3B', '#03A9F4', '#FF5722', '#9C27B0', '#FF9800'],
                    borderColor: ['#388E3C', '#FBC02D', '#0288D1', '#D32F2F', '#8E24AA', '#F57C00'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return 'R$ ' + value.toFixed(2); }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                    }
                }
            }
        });
    }
}

// Exportar para PDF
document.getElementById('downloadListBtn').addEventListener('click', exportToPDF);

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    // Título do documento
    pdf.setFontSize(16);
    pdf.text('Relatório de Transações', 105, 20, { align: 'center' });

    // Cabeçalho da tabela
    const tableHeaders = ['Descrição', 'Data', 'Valor'];
    let y = 40;

    pdf.setFontSize(12);
    pdf.text('Descrição', 20, y);
    pdf.text('Data', 100, y);
    pdf.text('Valor', 160, y);
    y += 10;

    // Traduzir categoria
    const translateCategory = (category) => {
        const categoryNames = {
            salary: 'Salário',
            food: 'Alimentação',
            transport: 'Transporte',
            housing: 'Moradia',
            entertainment: 'Entretenimento',
            other: 'Outros'
        };
        return categoryNames[category] || 'Outros';
    };

    // Listar as transações
    transactions.forEach(transaction => {
        const description = `${transaction.description} (${translateCategory(transaction.category)})`;
        const date = new Date(transaction.date).toLocaleDateString('pt-BR');
        const amount = formatCurrency(transaction.amount);

        pdf.text(description, 20, y);
        pdf.text(date, 100, y);
        pdf.text(amount, 160, y);
        y += 10;
    });

    // Linha separadora
    pdf.line(20, y, 190, y);
    y += 10;

    // Resumo
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = totalIncome - totalExpenses;

    pdf.text(`Receitas: ${formatCurrency(totalIncome)}`, 20, y);
    y += 10;
    pdf.text(`Despesas: ${formatCurrency(totalExpenses)}`, 20, y);
    y += 10;
    pdf.text(`Saldo Total: ${formatCurrency(totalBalance)}`, 20, y);

    // Salvar o PDF
    pdf.save('Relatorio_Transacoes.pdf');
}

// Atualizar o UI e Carregar o Gráfico:
updateUI();
renderChart();




// Exportar para WhatsApp (sem emojis)
document.getElementById('exportToWhatsappBtn').addEventListener('click', () => {
    // Traduzir categoria sem emojis
    const translateCategory = (category) => {
        const categoryNames = {
            salary: 'Salário',
            food: 'Alimentação',
            transport: 'Transporte',
            housing: 'Moradia',
            entertainment: 'Entretenimento',
            other: 'Outros'
        };
        return categoryNames[category] || 'Outros';
    };

    // Gerar mensagem formatada sem emojis
    const messageHeader = '*Relatório de Transações:*\n\n';
    const transactionsMessage = transactions.map(transaction => {
        const description = `${transaction.description} (${translateCategory(transaction.category)})`;
        const amount = formatCurrency(transaction.amount);
        return `• ${description}: ${amount}`;
    }).join('\n');

    // Resumo
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = totalIncome - totalExpenses;

    const summary = `\n\n*Resumo:*\nReceitas: ${formatCurrency(totalIncome)}\nDespesas: ${formatCurrency(totalExpenses)}\nSaldo Total: ${formatCurrency(totalBalance)}`;

    // Mensagem completa
    const message = `${messageHeader}${transactionsMessage}${summary}`;

    // Garantir que a mensagem seja corretamente codificada para a URL do WhatsApp
    const encodedMessage = encodeURIComponent(message);

    // URL do WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    // Abrir no WhatsApp
    window.open(whatsappUrl, '_blank');
});


// Atualizar o UI e Carregar o Gráfico:
updateUI();
renderChart();
