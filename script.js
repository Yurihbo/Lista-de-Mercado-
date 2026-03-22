function formatBRL(value) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}


function sanitizeValue(input) {
    let val = input.replace(',', '.').replace(/[^\d.]/g, '');
    let num = parseFloat(val);
    return isNaN(num) || num < 0 ? 0 : num;
}


function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}


let items = [];

const itemList = document.getElementById('item-list');
const addButton = document.getElementById('add-item-button');
const totalContainer = document.getElementById('total-container');

function saveToStorage() {
    localStorage.setItem('marketList', JSON.stringify(items));
}


function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem('marketList'));

        if (Array.isArray(data)) {
            items = data;
        } else {
            throw new Error();
        }
    } catch {
        items = [
            { id: generateId(), name: 'Arroz', checked: false, value: 0 },
            { id: generateId(), name: 'Feijão', checked: false, value: 0 },
            { id: generateId(), name: 'Leite', checked: false, value: 0 },
        ];
        saveToStorage();
    }
}


function updateItem(id, key, value) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    item[key] = value;
    saveToStorage();
    updateTotal();
}


function updateTotal() {
    const total = items.reduce((acc, item) => {
        if (!item.checked && !isNaN(item.value)) {
            return acc + item.value;
        }
        return acc;
    }, 0);

    totalContainer.textContent = 'Total: ' + formatBRL(total);
}

function removeItem(id) {
    items = items.filter(i => i.id !== id);
    saveToStorage();
    renderList();
    updateTotal();
}


function createListItem(item) {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.dataset.id = item.id;

    const leftDiv = document.createElement('div');
    leftDiv.className = 'item-left';

  
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.checked;

   
    const inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.value = item.name;
    inputName.className = 'item-name';

    if (item.checked) inputName.classList.add('marked');

   
    checkbox.addEventListener('change', () => {
        updateItem(item.id, 'checked', checkbox.checked);
        inputName.classList.toggle('marked', checkbox.checked);
    });

   
    inputName.addEventListener('blur', () => {
        const val = inputName.value.trim();
        if (val) updateItem(item.id, 'name', val);
        else inputName.value = item.name;
    });

    inputName.addEventListener('keydown', e => {
        if (e.key === 'Enter') inputName.blur();
    });

    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(inputName);

  
    const inputValue = document.createElement('input');
    inputValue.type = 'text';
    inputValue.className = 'item-value';
    inputValue.placeholder = 'R$';
    inputValue.inputMode = 'decimal';

    if (item.value > 0) {
        inputValue.value = item.value.toFixed(2).replace('.', ',');
    }

    
    inputValue.addEventListener('input', () => {
        let raw = inputValue.value.replace(/[^\d.,]/g, '');
        inputValue.value = raw;

        const num = sanitizeValue(raw);
        updateItem(item.id, 'value', num); 
    });

    inputValue.addEventListener('blur', () => {
        const num = sanitizeValue(inputValue.value);
        inputValue.value = num > 0
            ? num.toFixed(2).replace('.', ',')
            : '';
    });

    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '&times;';

    removeBtn.addEventListener('click', () => {
        removeItem(item.id);
    });

    li.appendChild(leftDiv);
    li.appendChild(inputValue);
    li.appendChild(removeBtn);

    return li;
}

function renderList() {
    itemList.innerHTML = '';

    if (items.length === 0) {
        itemList.innerHTML = `
            <p style="color:#8795a1;text-align:center;margin-top:20px">
                Nenhum item na lista. Adicione um item.
            </p>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach(item => {
        fragment.appendChild(createListItem(item));
    });

    itemList.appendChild(fragment);
}


addButton.addEventListener('click', () => {
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
        const input = itemList.querySelector('li:last-child .item-name');
        if (input) input.focus();
    }, 50);

    
    if (navigator.vibrate) navigator.vibrate(50);
});


function init() {
    loadFromStorage();
    renderList();
    updateTotal();
    setupShareButton();
}

let deferredPrompt;
const installBtn = document.getElementById('install-button');

// Captura evento do navegador
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    installBtn.style.display = 'block';
});

// Clique no botão instalar
installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
        console.log('Usuário instalou o app');
    } else {
        console.log('Usuário cancelou');
    }

    deferredPrompt = null;
    installBtn.style.display = 'none';
});

// Quando já está instalado
window.addEventListener('appinstalled', () => {
    console.log('App instalado!');
    installBtn.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {

    function setupShareButton() {
    const shareBtn = document.getElementById('share-button');

    if (!shareBtn) return;

    shareBtn.onclick = () => {
        if (!items.length) {
            alert('Sua lista está vazia!');
            return;
        }

        let texto = '🛒 *Lista de Mercado*\n\n';

        items.forEach(item => {
            const status = item.checked ? '✅' : '⬜';
            const valor = item.value > 0
                ? ` - R$ ${item.value.toFixed(2).replace('.', ',')}`
                : '';

            texto += `${status} ${item.name}${valor}\n`;
        });

        const total = items
            .filter(i => !i.checked)
            .reduce((acc, i) => acc + i.value, 0);

        texto += `\n💰 Total: R$ ${total.toFixed(2).replace('.', ',')}`;

        if (navigator.share) {
            navigator.share({
                title: 'Lista de Mercado',
                text: texto
            });
        } else {
            const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
            window.open(url, '_blank');
        }
    };
}

});
init();
