const db = new Dexie('FinanceAgendaDB');
db.version(2).stores({
    transactions: '++id, name, amount, date, status, category'
});

let currentDate = new Date(2026, 9, 1); // Outubro 2026
let pickerYear = currentDate.getFullYear();

const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const calendarGrid = document.getElementById('calendarGrid');
const currentMonthYearEl = document.getElementById('currentMonthYear');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const transactionModal = document.getElementById('transactionModal');
const transactionForm = document.getElementById('transactionForm');
const deleteBtn = document.getElementById('deleteBtn');
const modalTitle = document.getElementById('modalTitle');
const monthSelectorBtn = document.getElementById('monthSelectorBtn');
const monthPickerDropdown = document.getElementById('monthPickerDropdown');
const pickerYearLabel = document.getElementById('pickerYearLabel');
const monthsGrid = document.getElementById('monthsGrid');

const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const menuReportsBtn = document.getElementById('menuReportsBtn');
const reportsModal = document.getElementById('reportsModal');
const closeReportsBtn = document.getElementById('closeReportsBtn');
const menuExportBtn = document.getElementById('menuExportBtn');
const importFile = document.getElementById('importFile');

const recurrenceSection = document.getElementById('recurrenceSection');
const installmentsContainer = document.getElementById('installmentsContainer');
const recurrenceRadios = document.querySelectorAll('input[name="recurrenceType"]');

recurrenceRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'multiple') {
            installmentsContainer.classList.remove('hidden');
        } else {
            installmentsContainer.classList.add('hidden');
        }
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    await seedInitialDataIfNeeded();
    renderCalendar();
    setupSwipeGestures();
    setupPullToRefresh();
    registerServiceWorker();
});

// Função para tratar valores monetários com vírgula e ponto corretamente
function parseCurrency(valueStr) {
    if (!valueStr) return 0;
    let clean = String(valueStr).trim();
    // Se contiver ponto e vírgula (ex: 1.500,50), remove o ponto de milhar e troca vírgula por ponto
    if (clean.includes('.') && clean.includes(',')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
        // Se contiver apenas vírgula (ex: 150,50), troca por ponto
        clean = clean.replace(',', '.');
    }
    return parseFloat(clean) || 0;
}

function setupPullToRefresh() {
    const swipeContainer = document.getElementById('swipeContainer');
    const indicator = document.getElementById('pullToRefreshIndicator');
    let startY = 0;
    let pulling = false;

    swipeContainer.addEventListener('touchstart', (e) => {
        if (swipeContainer.scrollTop === 0) {
            startY = e.touches[0].clientY;
            pulling = true;
        }
    }, { passive: true });

    swipeContainer.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0 && swipeContainer.scrollTop === 0) {
            const pullDistance = Math.min(diff * 0.4, 60);
            indicator.style.height = `${pullDistance}px`;
            indicator.style.opacity = `${pullDistance / 60}`;
        }
    }, { passive: true });

    swipeContainer.addEventListener('touchend', (e) => {
        if (!pulling) return;
        pulling = false;
        const currentY = e.changedTouches[0].clientY;
        const diff = currentY - startY;

        if (diff > 70 && swipeContainer.scrollTop === 0) {
            indicator.style.height = '40px';
            indicator.style.opacity = '1';
            indicator.innerHTML = '<i class="fa-solid fa-rotate animate-spin mr-2"></i> Atualizando...';
            
            setTimeout(() => {
                renderCalendar();
                indicator.style.height = '0px';
                indicator.style.opacity = '0';
                indicator.innerHTML = '<i class="fa-solid fa-rotate animate-spin mr-2"></i> Solte para atualizar...';
            }, 600);
        } else {
            indicator.style.height = '0px';
            indicator.style.opacity = '0';
        }
    }, { passive: true });
}

function setupSwipeGestures() {
    const swipeContainer = document.getElementById('swipeContainer');
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;

    swipeContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    swipeContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const distance = touchEndX - touchStartX;
        if (Math.abs(distance) < minSwipeDistance) return;

        if (distance > 0) {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else {
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        renderCalendar();
    }
}

async function seedInitialDataIfNeeded() {
    const count = await db.transactions.count();
    if (count === 0) {
        const sampleData = [
            { name: 'Nubank', amount: 350.00, date: '2026-10-27', status: 'paid', category: 'Transporte' },
            { name: 'Celular', amount: 69.90, date: '2026-10-01', status: 'pending', category: 'Lazer' },
            { name: 'RecargaP', amount: 30.00, date: '2026-10-01', status: 'paid', category: 'Transporte' },
            { name: 'Jejum', amount: 0, date: '2026-10-04', status: 'pending', category: 'Outros' },
            { name: 'Ipanema', amount: 120.00, date: '2026-10-08', status: 'paid', category: 'Outros' },
            { name: 'Itaú', amount: 450.00, date: '2026-10-08', status: 'paid', category: 'Transporte' },
            { name: 'Caixa', amount: 800.00, date: '2026-10-10', status: 'paid', category: 'Moradia' },
            { name: 'Faculdade', amount: 650.00, date: '2026-10-10', status: 'paid', category: 'Educação' },
            { name: 'Terreno', amount: 500.00, date: '2026-10-10', status: 'pending', category: 'Moradia' },
            { name: 'Google One', amount: 14.99, date: '2026-10-12', status: 'paid', category: 'Lazer' },
            { name: 'Água / Luz', amount: 210.50, date: '2026-10-13', status: 'paid', category: 'Moradia' },
            { name: 'Bradesco', amount: 320.00, date: '2026-10-13', status: 'paid', category: 'Transporte' },
            { name: 'Netflix', amount: 55.90, date: '2026-10-13', status: 'paid', category: 'Lazer' },
            { name: 'Nubank', amount: 420.00, date: '2026-10-27', status: 'pending', category: 'Transporte' }
        ];
        await db.transactions.bulkAdd(sampleData);
    }
}

async function renderCalendar() {
    calendarGrid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    currentMonthYearEl.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;
    
    const transactions = await db.transactions
        .where('date')
        .between(startDateStr, endDateStr + '\uffff', true, true)
        .toArray();

    const txByDay = {};
    transactions.forEach(tx => {
        const dayNum = parseInt(tx.date.split('-')[2], 10);
        if (!txByDay[dayNum]) txByDay[dayNum] = [];
        txByDay[dayNum].push(tx);
    });

    let cellsHTML = '';

    for (let i = firstDayIndex; i > 0; i--) {
        const dayNum = prevTotalDays - i + 1;
        cellsHTML += `
            <div class="border-b border-r border-gray-800/60 p-0.5 min-h-[95px] bg-[#121212]/40 opacity-40">
                <span class="text-xs text-gray-500 font-semibold px-1">${dayNum}</span>
            </div>
        `;
    }

    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
        const dayTxs = txByDay[day] || [];

        let txBadges = '';
        dayTxs.forEach(tx => {
            const bgClass = tx.status === 'paid' ? 'bg-paidGreen/90 text-white' : 'bg-pendingOrange/90 text-white';
            txBadges += `
                <div onclick="openEditModal(${tx.id})" class="${bgClass} w-full text-[10px] font-medium px-0.5 py-0.5 rounded-sm mb-0.5 cursor-pointer shadow-sm hover:opacity-80 transition-opacity flex items-center justify-between leading-tight overflow-hidden">
                    <span class="truncate w-full text-left">${tx.name}</span>
                </div>
            `;
        });

        cellsHTML += `
            <div onclick="openAddModalForDate(${day})" class="border-b border-r border-gray-800 p-0.5 min-h-[100px] bg-darkBg hover:bg-[#1a1a1a] transition-colors cursor-pointer flex flex-col">
                <div class="flex items-center justify-between mb-0.5 px-0.5">
                    <span class="text-xs font-bold px-1 py-0.2 rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-400'}">${day}</span>
                </div>
                <div class="flex-1 overflow-y-auto space-y-0.5 w-full">
                    ${txBadges}
                </div>
            </div>
        `;
    }

    calendarGrid.innerHTML = cellsHTML;
}

function toggleSidebar() {
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    if (isOpen) {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
    } else {
        sidebar.classList.remove('-translate-x-full');
        sidebarOverlay.classList.remove('hidden');
    }
}

menuBtn.addEventListener('click', toggleSidebar);
closeSidebarBtn.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', toggleSidebar);

async function openReports() {
    toggleSidebar();
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;
    
    const transactions = await db.transactions
        .where('date')
        .between(startDateStr, endDateStr + '\uffff', true, true)
        .toArray();

    let paidSum = 0;
    let pendingSum = 0;
    const catTotals = {};

    transactions.forEach(tx => {
        const amount = parseFloat(tx.amount) || 0;
        const cat = tx.category || 'Outros';

        if (tx.status === 'paid') {
            paidSum += amount;
        } else {
            pendingSum += amount;
        }

        catTotals[cat] = (catTotals[cat] || 0) + amount;
    });

    const totalSum = paidSum + pendingSum;

    document.getElementById('reportPaid').textContent = `R$ ${paidSum.toFixed(2)}`;
    document.getElementById('reportPending').textContent = `R$ ${pendingSum.toFixed(2)}`;
    document.getElementById('reportTotal').textContent = `R$ ${totalSum.toFixed(2)}`;

    const categorySummaryList = document.getElementById('categorySummaryList');
    categorySummaryList.innerHTML = '';

    const categories = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);

    if (categories.length === 0) {
        categorySummaryList.innerHTML = '<p class="text-xs text-gray-500 italic">Nenhum lançamento no mês.</p>';
    } else {
        categories.forEach(cat => {
            const val = catTotals[cat];
            const pct = totalSum > 0 ? Math.round((val / totalSum) * 100) : 0;
            categorySummaryList.innerHTML += `
                <div class="bg-[#121212] border border-gray-800 rounded-xl p-3">
                    <div class="flex justify-between items-center text-xs font-semibold mb-1">
                        <span class="text-gray-300">${cat}</span>
                        <span class="text-white">R$ ${val.toFixed(2)} (${pct}%)</span>
                    </div>
                    <div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div class="bg-indigo-500 h-full rounded-full transition-all duration-300" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        });
    }

    reportsModal.classList.remove('hidden');
}

menuReportsBtn.addEventListener('click', openReports);
closeReportsBtn.addEventListener('click', () => {
    reportsModal.classList.add('hidden');
});

menuExportBtn.addEventListener('click', async () => {
    toggleSidebar();
    const allTransactions = await db.transactions.toArray();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allTransactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `backup_financas_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

importFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            if (Array.isArray(importedData)) {
                if (confirm(`Deseja importar ${importedData.length} registros?`)) {
                    const cleanData = importedData.map(({ id, ...rest }) => rest);
                    await db.transactions.bulkAdd(cleanData);
                    alert('Backup restaurado com sucesso!');
                    renderCalendar();
                }
            } else {
                alert('Arquivo de backup inválido.');
            }
        } catch (err) {
            alert('Erro ao ler o arquivo JSON.');
            console.error(err);
        }
        toggleSidebar();
        importFile.value = '';
    };
    reader.readAsText(file);
});

function renderMonthPicker() {
    pickerYearLabel.textContent = pickerYear;
    monthsGrid.innerHTML = '';
    
    const currentSelectedMonth = currentDate.getMonth();
    const currentSelectedYear = currentDate.getFullYear();

    monthNames.forEach((m, index) => {
        const isSelected = index === currentSelectedMonth && pickerYear === currentSelectedYear;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `py-2 text-xs font-semibold rounded-xl transition-colors ${
            isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-[#121212] text-gray-300 hover:bg-gray-800'
        }`;
        btn.textContent = m.substring(0, 3);
        btn.addEventListener('click', () => {
            currentDate = new Date(pickerYear, index, 1);
            monthPickerDropdown.classList.add('hidden');
            renderCalendar();
        });
        monthsGrid.appendChild(btn);
    });
}

monthSelectorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pickerYear = currentDate.getFullYear();
    renderMonthPicker();
    monthPickerDropdown.classList.toggle('hidden');
});

document.getElementById('prevYearBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    pickerYear--;
    renderMonthPicker();
});

document.getElementById('nextYearBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    pickerYear++;
    renderMonthPicker();
});

document.addEventListener('click', (e) => {
    if (!monthPickerDropdown.contains(e.target) && !monthSelectorBtn.contains(e.target)) {
        monthPickerDropdown.classList.add('hidden');
    }
});

function openAddModalForDate(day) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    
    document.getElementById('transactionId').value = '';
    document.getElementById('nameInput').value = '';
    document.getElementById('amountInput').value = '';
    document.getElementById('categoryInput').value = 'Outros';
    document.getElementById('dateInput').value = `${year}-${month}-${dayStr}`;
    document.querySelector('input[name="status"][value="pending"]').checked = true;
    
    recurrenceSection.classList.remove('hidden');
    document.querySelector('input[name="recurrenceType"][value="single"]').checked = true;
    installmentsContainer.classList.add('hidden');

    modalTitle.textContent = 'Nova Conta';
    deleteBtn.classList.add('hidden');
    transactionModal.classList.remove('hidden');
}

openModalBtn.addEventListener('click', () => {
    const todayStr = currentDate.toISOString().split('T')[0];
    document.getElementById('transactionId').value = '';
    document.getElementById('nameInput').value = '';
    document.getElementById('amountInput').value = '';
    document.getElementById('categoryInput').value = 'Outros';
    document.getElementById('dateInput').value = todayStr;
    document.querySelector('input[name="status"][value="pending"]').checked = true;
    
    recurrenceSection.classList.remove('hidden');
    document.querySelector('input[name="recurrenceType"][value="single"]').checked = true;
    installmentsContainer.classList.add('hidden');

    modalTitle.textContent = 'Nova Conta';
    deleteBtn.classList.add('hidden');
    transactionModal.classList.remove('hidden');
});

closeModalBtn.addEventListener('click', () => {
    transactionModal.classList.add('hidden');
});

window.openEditModal = async function(id) {
    event.stopPropagation();
    const tx = await db.transactions.get(id);
    if (!tx) return;

    document.getElementById('transactionId').value = tx.id;
    document.getElementById('nameInput').value = tx.name;
    document.getElementById('amountInput').value = tx.amount;
    document.getElementById('categoryInput').value = tx.category || 'Outros';
    document.getElementById('dateInput').value = tx.date;
    document.querySelector(`input[name="status"][value="${tx.status}"]`).checked = true;

    recurrenceSection.classList.add('hidden');

    modalTitle.textContent = 'Editar Conta';
    deleteBtn.classList.remove('hidden');
    transactionModal.classList.remove('hidden');
};

transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('transactionId').value;
    const name = document.getElementById('nameInput').value;
    const rawAmount = document.getElementById('amountInput').value;
    const amount = parseCurrency(rawAmount);
    const category = document.getElementById('categoryInput').value;
    const baseDateStr = document.getElementById('dateInput').value;
    const status = document.querySelector('input[name="status"]:checked').value;

    if (id) {
        await db.transactions.update(parseInt(id), { name, amount, category, date: baseDateStr, status });
    } else {
        const recurrenceType = document.querySelector('input[name="recurrenceType"]:checked').value;
        
        if (recurrenceType === 'multiple') {
            const totalMonths = parseInt(document.getElementById('installmentsInput').value) || 12;
            const [baseYear, baseMonth, baseDay] = baseDateStr.split('-').map(Number);
            
            const newTransactions = [];
            for (let i = 0; i < totalMonths; i++) {
                let targetYear = baseYear;
                let targetMonth = baseMonth + i;
                
                while (targetMonth > 12) {
                    targetMonth -= 12;
                    targetYear += 1;
                }

                const lastDayOfTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
                const targetDay = Math.min(baseDay, lastDayOfTargetMonth);

                const formattedDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
                const itemStatus = (i === 0) ? status : 'pending';

                newTransactions.push({
                    name: name,
                    amount: amount,
                    category: category,
                    date: formattedDate,
                    status: itemStatus
                });
            }
            await db.transactions.bulkAdd(newTransactions);
        } else {
            await db.transactions.add({ name, amount, category, date: baseDateStr, status });
        }
    }

    transactionModal.classList.add('hidden');
    renderCalendar();
});

deleteBtn.addEventListener('click', async () => {
    const id = document.getElementById('transactionId').value;
    if (id && confirm('Deseja realmente excluir esta conta?')) {
        await db.transactions.delete(parseInt(id));
        transactionModal.classList.add('hidden');
        renderCalendar();
    }
});

document.getElementById('todayBtn').addEventListener('click', () => {
    currentDate = new Date();
    renderCalendar();
});

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log("Service Worker registrado com sucesso!"))
            .catch((err) => console.log("Erro ao registrar Service Worker:", err));
    }
}
