
// Helper para formatar como moeda BRL
function formatBRL(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Helper para sanitizar entrada de valor monetário válido (float >= 0)
function sanitizeValue(input) {
    let val = input.replace(',', '.').replace(/[^\d.]/g, '');
    let num = parseFloat(val);
    if (isNaN(num) || num < 0) return 0;
    return num;
}

// Dados da lista
let items = [];
let total = 0;

const itemList = document.getElementById('item-list');
const addButton = document.getElementById('add-item-button');
const totalContainer = document.getElementById('total-container');

// Salvar no localStorage
function saveToStorage() {
    localStorage.setItem('marketList', JSON.stringify(items));
}

// Carregar do localStorage
function loadFromStorage() {
    const data = localStorage.getItem('marketList');
    if (data) {
        try {
            items = JSON.parse(data);
            if (!Array.isArray(items)) items = [];
        } catch {
            items = [];
        }
    } else {
        items = [
            { id: generateId(), name: 'Arroz', checked: false, value: 0 },
            { id: generateId(), name: 'Feijão', checked: false, value: 0 },
            { id: generateId(), name: 'Leite', checked: false, value: 0 },
        ];
        saveToStorage();
    }
}

// Gerar ID único simples
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Atualizar o item no array e salvar
function updateItem(id, key, value) {
    const item = items.find(i => i.id === id);
    if (item) {
        item[key] = value;
        saveToStorage();
        updateTotal();
    }
}

// Atualizar total (corrigido)
function updateTotal() {
    total = 0;
    for (const item of items) {
        if (!isNaN(item.value) && !item.checked) {
            total += item.value;
        }
    }
    totalContainer.textContent = 'Total: ' + formatBRL(total);
}

// Remover item do array e salvar
function removeItem(id) {
    items = items.filter(i => i.id !== id);
    saveToStorage();
    renderList();
    updateTotal();
}

// Criar elemento de item da lista no DOM
function createListItem(item) {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.setAttribute('role', 'listitem');
    li.dataset.id = item.id;

    const leftDiv = document.createElement('div');
    leftDiv.className = 'item-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.checked;
    checkbox.setAttribute('aria-label', 'Marcar item ' + item.name);
    checkbox.addEventListener('change', e => {
        updateItem(item.id, 'checked', e.target.checked);
        if (e.target.checked) {
            inputName.classList.add('marked');
        } else {
            inputName.classList.remove('marked');
        }
    });

    const inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.value = item.name;
    inputName.className = 'item-name';
    if (item.checked) {
        inputName.classList.add('marked');
    }
    inputName.setAttribute('aria-label', 'Nome do item');
    inputName.addEventListener('blur', e => {
        const val = e.target.value.trim();
        if (val.length === 0) {
            e.target.value = item.name;
            return;
        }
        updateItem(item.id, 'name', val);
    });
    inputName.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    });

    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(inputName);

    const inputValue = document.createElement('input');
    inputValue.type = 'text';
    inputValue.value = item.value ? item.value.toFixed(2).replace('.', ',') : '';
    inputValue.placeholder = 'R$';
    inputValue.className = 'item-value';
    inputValue.setAttribute('inputmode', 'decimal');
    inputValue.setAttribute('aria-label', 'Valor do item ' + item.name);
    inputValue.addEventListener('input', e => {
        let rawVal = e.target.value;
        rawVal = rawVal.replace(/[^\d.,]/g, '');
        e.target.value = rawVal;
    });
    inputValue.addEventListener('change', e => {
        let rawVal = e.target.value;
        const numVal = sanitizeValue(rawVal);
        updateItem(item.id, 'value', numVal);
        e.target.value = numVal > 0 ? numVal.toFixed(2).replace('.', ',') : '';
    });
    inputValue.addEventListener('blur', e => {
        if (e.target.value.trim() === '') {
            updateItem(item.id, 'value', 0);
            e.target.value = '';
        }
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.setAttribute('aria-label', 'Remover item ' + item.name);
    removeBtn.title = 'Remover item';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', e => {
        removeItem(item.id);
    });

    li.appendChild(leftDiv);
    li.appendChild(inputValue);
    li.appendChild(removeBtn);

    return li;
}

// Renderizar toda a lista
function renderList() {
    itemList.innerHTML = '';
    if (items.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.color = '#8795a1';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.marginTop = '20px';
        emptyMsg.textContent = 'Nenhum item na lista. Adicione um item.';
        itemList.appendChild(emptyMsg);
        return;
    }
    for (const item of items) {
        const li = createListItem(item);
        itemList.appendChild(li);
    }
}

// Adicionar novo item padrão
addButton.addEventListener('click', e => {
    const newItem = {
        id: generateId(),
        name: '',
        checked: false,
        value: 0,
    };
    items.push(newItem);
    saveToStorage();
    renderList();
    updateTotal();
    setTimeout(() => {
        const inputNew = itemList.querySelector('li:last-child .item-name');
        if(inputNew) inputNew.focus();
    }, 100);
});

// Inicialização
function init() {
    loadFromStorage();
    renderList();
    updateTotal();
}

init();
