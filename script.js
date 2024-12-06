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

    // Configurações gerais
    const pageHeight = pdf.internal.pageSize.height;
    const marginTop = 20;
    const marginBottom = 20;
    const usableHeight = pageHeight - marginTop - marginBottom;
    const columnWidths = [80, 50, 40]; // Largura das colunas: Descrição, Data, Valor
    const rowHeight = 10; // Altura de cada linha
    let y = marginTop;

    // Título do documento
    pdf.setFontSize(16);
    pdf.text('Relatório de Transações', 105, y, { align: 'center' });
    y += 20;

    // Função para desenhar cabeçalho da tabela
    const drawTableHeader = () => {
        pdf.setFontSize(12);
        pdf.text('Descrição', 20 + columnWidths[0] / 2, y + rowHeight / 2, { align: 'center' });
        pdf.text('Data', 100 + columnWidths[1] / 2, y + rowHeight / 2, { align: 'center' });
        pdf.text('Valor', 150 + columnWidths[2] / 2, y + rowHeight / 2, { align: 'center' });

        // Desenhar linha abaixo do cabeçalho
        pdf.line(20, y + rowHeight, 190, y + rowHeight);
        y += rowHeight;
    };

    // Inicializa o cabeçalho da tabela
    drawTableHeader();

    // Função para traduzir categoria
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

    // Função para verificar altura e adicionar nova página
    const checkPageHeight = () => {
        if (y + rowHeight > usableHeight + marginTop) {
            pdf.addPage();
            y = marginTop;
            drawTableHeader();
        }
    };

    // Função para desenhar uma linha da tabela
    const drawRow = (description, date, amount) => {
        // Desenhar células da linha
        pdf.rect(20, y, columnWidths[0], rowHeight); // Descrição
        pdf.rect(100, y, columnWidths[1], rowHeight); // Data
        pdf.rect(150, y, columnWidths[2], rowHeight); // Valor

        // Centralizar texto dentro das células
        const centerY = y + rowHeight / 2 + 3; // Ajuste vertical (depende da fonte)
        pdf.text(description, 20 + columnWidths[0] / 2, centerY, { align: 'center' });
        pdf.text(date, 100 + columnWidths[1] / 2, centerY, { align: 'center' });
        pdf.text(amount, 150 + columnWidths[2] / 2, centerY, { align: 'center' });
    };

    // Listar as transações
    transactions.forEach(transaction => {
        checkPageHeight();

        const description = `${transaction.description} (${translateCategory(transaction.category)})`;
        const date = new Date(transaction.date).toLocaleDateString('pt-BR');
        const amount = formatCurrency(transaction.amount);

        drawRow(description, date, amount); // Desenhar linha para a transação
        y += rowHeight; // Incrementar posição vertical
    });

    // Linha separadora final
    checkPageHeight();
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

    checkPageHeight();
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
