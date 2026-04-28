// messaggio
function showMsg(msg, cls) {
    let el = document.getElementById('message');
    if (!el) return;
    el.textContent = msg;
    el.className = 'message ' + cls;
}

// funzione per inviare dati in POST e ricevere JSON
async function post(url, body) {
    let response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return response.json();
}

// auth

async function login() {
    let u = document.getElementById('username').value.trim();
    let p = document.getElementById('password').value;

    if (!u || !p) {
        showMsg('compila tutti i campi', 'error');
        return;
    }

    let data = await post('api/login.php', { username: u, password: p });

    if (data.success) {
        if (data.ruolo === 'admin') {
            location.href = 'admin.html';
        } else if (data.ruolo === 'dipendente') {
            location.href = 'dipendente.html';
        } else {
location.href = 'pannel.html';
        }
    } else {
        showMsg('credenziali errate', 'error');
    }
}

async function register() {
    let u = document.getElementById('username').value.trim();
    let e = document.getElementById('email').value.trim();
    let p = document.getElementById('password').value;
    let c = document.getElementById('confirm').value;

    if (!u || !e || !p) {
        showMsg('compila tutti i campi', 'error');
        return;
    }

    if (p !== c) {
        showMsg('le password non coincidono', 'error');
        return;
    }

    let data = await post('api/register.php', { username: u, email: e, password: p });
    showMsg(data.message, data.success ? 'success' : 'error');

    if (data.success) {
        setTimeout(() => {
            location.href = 'login.html';
        }, 1500);
    }
}

async function logout() {
    await fetch('api/logout.php', { method: 'POST' });
    location.href = 'login.html';
}

// index

let currentTab = 'servizi';
let allData = { servizi: [], ricambi: [], articoli: [] };
let productVariants = new Map();
let pending = null;

async function initPage() {
    let res = await fetch('api/check_session.php');
    let data = await res.json();

    if (!data.loggedIn) {
        location.href = 'login.html';
        return;
    }

    document.getElementById('username').textContent = data.username;

    // aggiunge link al pannello admin/magazzino in base al ruolo
    let nav = document.querySelector('header div');
    if (data.ruolo === 'admin') {
        let a = document.createElement('a');
        a.href = 'admin.html';
        a.textContent = 'Admin';
        nav.prepend(a);
    } else if (data.ruolo === 'dipendente') {
        let a = document.createElement('a');
        a.href = 'dipendente.html';
        a.textContent = 'Magazzino';
        nav.prepend(a);
    }

    // chiudi modal cliccando fuori
    document.getElementById('modal-bg').onclick = function(e) {
        if (e.target === document.getElementById('modal-bg')) {
            closeModal();
        }
    };

    await loadAll();
    await loadCart();
}

async function loadAll() {
    let serviziRes = await fetch('api/servizi.php');
    let ricambiRes = await fetch('api/ricambi.php');
    let articoliRes = await fetch('api/articolo.php');

    let serviziData = await serviziRes.json();
    let ricambiData = await ricambiRes.json();
    let articoliData = await articoliRes.json();

    productVariants.clear();

    // raccoglie tutte le varianti (officina + prezzo) per ogni prodotto
    let servizi = serviziData.data || [];
    for (let i = 0; i < servizi.length; i++) {
        let item = servizi[i];
        let key = 'servizio_' + item.codice_servizio;
        if (!productVariants.has(key)) {
            productVariants.set(key, []);
        }
        productVariants.get(key).push({
            officina_codice: item.officina_codice,
            prezzo: parseFloat(item.costo_orario)
        });
    }

    let ricambi = ricambiData.data || [];
    for (let i = 0; i < ricambi.length; i++) {
        let item = ricambi[i];
        let key = 'pezzo_' + item.codice_pezzo;
        if (!productVariants.has(key)) {
            productVariants.set(key, []);
        }
        productVariants.get(key).push({
            officina_codice: item.officina_codice,
            prezzo: parseFloat(item.costo_unitario)
        });
    }

    let articoli = articoliData.data || [];
    for (let i = 0; i < articoli.length; i++) {
        let item = articoli[i];
        let key = 'articolo_' + item.codice_articolo;
        if (!productVariants.has(key)) {
            productVariants.set(key, []);
        }
        productVariants.get(key).push({
            officina_codice: item.officina_codice,
            prezzo: parseFloat(item.costo_unitario)
        });
    }

    // rimuove i duplicati (per la vista principale)
    function unica(items, codiceKey) {
        let mappa = new Map();
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            if (!mappa.has(item[codiceKey])) {
                mappa.set(item[codiceKey], item);
            }
        }
        return Array.from(mappa.values());
    }

    allData.servizi = unica(servizi, 'codice_servizio');
    allData.ricambi = unica(ricambi, 'codice_pezzo');
    allData.articoli = unica(articoli, 'codice_articolo');

    renderGrid();
}

function filterItems() {
    renderGrid();
}

function switchTab(tab) {
    currentTab = tab;

    let searchInput = document.getElementById('search-input');
    searchInput.value = '';

    let tabs = document.querySelectorAll('.tab');
    let tabNames = ['servizi', 'ricambi', 'articoli'];

    for (let i = 0; i < tabs.length; i++) {
        if (tabNames[i] === tab) {
            tabs[i].classList.add('active');
        } else {
            tabs[i].classList.remove('active');
        }
    }

    renderGrid();
}

function renderGrid() {
    let searchText = document.getElementById('search-input').value.toLowerCase();
    let prodotti = allData[currentTab].filter(function(p) {
        return p.descrizione.toLowerCase().includes(searchText);
    });

    let contenitore = document.getElementById('item-grid');

    if (prodotti.length === 0) {
        contenitore.innerHTML = '<p class="empty">Nessun risultato</p>';
        return;
    }

    let html = '';

    for (let i = 0; i < prodotti.length; i++) {
        let oggetto = prodotti[i];
        let codice, tipo;

        if (currentTab === 'servizi') {
            codice = oggetto.codice_servizio;
            tipo = 'servizio';
        } else if (currentTab === 'ricambi') {
            codice = oggetto.codice_pezzo;
            tipo = 'pezzo';
        } else {
            codice = oggetto.codice_articolo;
            tipo = 'articolo';
        }

        let key = tipo + '_' + codice;
        let varianti = productVariants.get(key) || [];

        let prezzoMin = null;
        for (let v = 0; v < varianti.length; v++) {
            let prezzo = varianti[v].prezzo;
            if (prezzoMin === null || prezzo < prezzoMin) {
                prezzoMin = prezzo;
            }
        }

        let prezzoTxt = 'N/D';
        if (prezzoMin !== null) {
            prezzoTxt = 'da €' + prezzoMin.toFixed(2);
            if (tipo === 'servizio') {
                prezzoTxt = prezzoTxt + '/h';
            }
        }

        let numOfficine = 0;
        for (let v = 0; v < varianti.length; v++) {
            if (varianti[v].officina_codice) {
                numOfficine++;
            }
        }

        html += '<div class="card">';
        html += '<h3>' + oggetto.descrizione + '</h3>';
        html += '<div class="price">' + prezzoTxt + '</div>';
        html += '<div class="sub">Cod: ' + codice + '</div>';
        html += '<div class="sub">' + numOfficine + ' officin' + (numOfficine === 1 ? 'a' : 'e') + '</div>';

        let nomePulito = oggetto.descrizione.replace(/'/g, "\\'");

        html += '<button class="btn-green" onclick="apriOfficine(\'' + codice + '\', \'' + nomePulito + '\', \'' + tipo + '\')">';
        html += 'Vedi officine &amp; aggiungi';
        html += '</button>';
        html += '</div>';
    }

    contenitore.innerHTML = html;
}

async function apriOfficine(codice, nome, tipo) {
    let key = tipo + '_' + codice;
    let varianti = productVariants.get(key) || [];

    let prezziPerOfficina = new Map();
    for (let v = 0; v < varianti.length; v++) {
        prezziPerOfficina.set(varianti[v].officina_codice, varianti[v].prezzo);
    }

    pending = {
        codice: codice,
        nome: nome,
        tipo: tipo,
        prezziPerOfficina: prezziPerOfficina
    };

    document.getElementById('modal-title').textContent = nome;
    document.getElementById('modal-officine').innerHTML = '<p class="loading">Caricamento...</p>';
    document.getElementById('modal-bg').classList.add('open');

    let url = 'api/officine_pubbliche.php?action=per_prodotto&tipo=' + tipo + '&codice=' + encodeURIComponent(codice);
    let response = await fetch(url);
    let dati = await response.json();

    if (!dati.data || dati.data.length === 0) {
        document.getElementById('modal-officine').innerHTML = '<p class="empty">Nessuna officina disponibile</p>';
        return;
    }

    let html = '';
    for (let i = 0; i < dati.data.length; i++) {
        let o = dati.data[i];
        let prezzo = parseFloat(o.prezzo);
        let prezzoTxt = '€' + prezzo.toFixed(2);
        let qtaTxt = o.quantita !== null ? ' (disp: ' + o.quantita + ')' : '';
        if (tipo === 'servizio') {
            prezzoTxt = prezzoTxt + '/h';
        }

        html += '<div class="officina-item">';
        html += '<div class="officina-info">';
        html += '<strong>' + o.denominazione + '</strong>';
        html += '<span>' + o.indirizzo;
        if (o.telefono) {
            html += ' · ' + o.telefono;
        }
        if (o.centrale) {
            html += ' · Centrale';
        }
        html += qtaTxt;
        html += '</span><br>';
        html += '<span class="price">Prezzo: ' + prezzoTxt + '</span>';
        html += '</div>';
        html += '<button class="btn-primary" onclick="aggiungiAlCarrello(\'' + o.codice + '\',' + prezzo + ')">Aggiungi</button>';
        html += '</div>';
    }

    document.getElementById('modal-officine').innerHTML = html;
}

function closeModal() {
    document.getElementById('modal-bg').classList.remove('open');
    pending = null;
}

async function aggiungiAlCarrello(officina_codice, prezzoSpecifico) {
    if (!pending) {
        return;
    }

    let id = pending.tipo + '_' + pending.codice + '_' + officina_codice;
    let data = await post('api/carrello.php', {
        prodotto_id: id,
        nome: pending.nome,
        prezzo: prezzoSpecifico
    });

    closeModal();
    loadCart();
}

async function loadCart() {
    let response = await fetch('api/carrello.php');
    let dati = await response.json();
    let prodotti = dati.data || [];

    let cp = document.getElementById('cart-items');
    let ct = document.getElementById('cart-total');

    if (prodotti.length === 0) {
        cp.innerHTML = '<p class="empty">Carrello vuoto</p>';
        ct.textContent = '';
        return;
    }

    let totale = 0;
    let html = '';

    for (let i = 0; i < prodotti.length; i++) {
        let p = prodotti[i];
        let sub = parseFloat(p.prezzo) * parseInt(p.quantita);
        totale = totale + sub;

        html += '<div class="cart-item">';
        html += '<span>' + p.nome + '</span>';
        html += '<span class="cart-item-controls">';
        html += '<button class="btn-qty" onclick="cambiaQty(\'' + p.id + '\',\'dec\')">−</button>';
        html += '<span class="qty-value">' + p.quantita + '</span>';
        html += '<button class="btn-qty" onclick="cambiaQty(\'' + p.id + '\',\'inc\')">+</button>';
        html += '<span style="min-width:60px;text-align:right;">€' + sub.toFixed(2) + '</span>';
        html += '<button class="btn-red" onclick="rimuovi(\'' + p.id + '\')">✕</button>';
        html += '</span>';
        html += '</div>';
    }

    cp.innerHTML = html;
    ct.textContent = 'Totale: €' + totale.toFixed(2);
}

async function cambiaQty(id, op) {
    await fetch('api/carrello.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prodotto_id: id, op: op })
    });
    loadCart();
}

async function rimuovi(id) {
    await fetch('api/carrello.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prodotto_id: id })
    });
    loadCart();
}

async function acquista() {
    let totalElement = document.getElementById('cart-total');
    if (!totalElement.textContent) {
        alert('carrello vuoto');
        return;
    }

    let response = await fetch('api/acquista.php', { method: 'POST' });
    let data = await response.json();
    alert(data.message || 'Acquisto completato!');
    loadCart();
}

// pagina officine

let inventarioCompleto = [];

async function initOfficine() {
    let response = await fetch('api/officine_pubbliche.php?action=lista');
    let res = await response.json();
    let officine = res.data || [];

    let html = '';
    if (officine.length === 0) {
        html = '<p class="empty">Nessuna officina trovata</p>';
    } else {
        for (let i = 0; i < officine.length; i++) {
            let o = officine[i];
            let infoTelefono = '';
            if (o.telefono) {
                infoTelefono = o.telefono + ' · ';
            }
            let centrale = o.centrale ? 'Centrale' : 'Periferica';

            html += '<div class="card">';
            html += '<h3>' + o.denominazione + '</h3>';
            html += '<div>' + o.indirizzo + '</div>';
            html += '<div class="sub">' + infoTelefono + centrale + ' · Cod: ' + o.codice + '</div>';
            html += '<button class="btn-primary" style="margin-top:8px;" onclick="apriInventario(\'' + o.codice + '\', \'' + o.denominazione.replace(/'/g, "\\'") + '\')">Vedi listino</button>';
            html += '</div>';
        }
    }
    document.getElementById('lista-officine').innerHTML = html;

    let sessResponse = await fetch('api/check_session.php');
    let sess = await sessResponse.json();
    let nav = document.getElementById('header-nav');

    if (sess.loggedIn) {
        nav.innerHTML = '<a href="pannel.html">← Torna al sito</a> <span>Ciao, <strong>' + sess.username + '</strong>!</span> <button class="btn-logout" onclick="logout()">Logout</button>';
    } else {
        nav.innerHTML = '<a href="pannel.html">← Torna al sito</a> <a href="login.html">Login</a>';
    }

    document.getElementById('modal-bg').onclick = function(e) {
        if (e.target === document.getElementById('modal-bg')) {
            chiudiModal();
        }
    };
}

async function apriInventario(codice, nome) {
    document.getElementById('modal-title').textContent = nome;
    document.getElementById('modal-inventario').innerHTML = '<p class="loading">Caricamento...</p>';
    document.getElementById('modal-bg').classList.add('open');

    filtraInventario('tutti');

    let response = await fetch('api/officine_pubbliche.php?action=inventario&codice=' + encodeURIComponent(codice));
    let res = await response.json();
    inventarioCompleto = res.data || [];
    renderInventario('tutti');
}

function chiudiModal() {
    document.getElementById('modal-bg').classList.remove('open');
    inventarioCompleto = [];
}

function filtraInventario(filtro) {
    let tabs = document.querySelectorAll('#modal-tabs .tab');
    let valori = ['tutti', 'servizio', 'pezzo', 'articolo'];

    for (let i = 0; i < tabs.length; i++) {
        if (valori[i] === filtro) {
            tabs[i].classList.add('active');
        } else {
            tabs[i].classList.remove('active');
        }
    }

    renderInventario(filtro);
}

function renderInventario(filtro) {
    let items = [];
    if (filtro === 'tutti') {
        items = inventarioCompleto;
    } else {
        items = [];
        for (let i = 0; i < inventarioCompleto.length; i++) {
            if (inventarioCompleto[i].tipo === filtro) {
                items.push(inventarioCompleto[i]);
            }
        }
    }

    if (items.length === 0) {
        document.getElementById('modal-inventario').innerHTML = '<p class="empty">Nessun elemento</p>';
        return;
    }

    let html = '<table style="width:100%"><thead><tr><th>Descrizione</th><th>Tipo</th><th>Prezzo</th><th>Qtà</th></tr></thead><tbody>';

    for (let i = 0; i < items.length; i++) {
        let it = items[i];
        let prezzo = parseFloat(it.prezzo).toFixed(2);
        let prezzoTxt = '€' + prezzo;
        if (it.tipo === 'servizio') {
            prezzoTxt = prezzoTxt + '/h';
        }

        let qtaTxt = (it.quantita !== null) ? it.quantita : '—';

        html += '<tr>';
        html += '<td style="text-align:left;">' + it.descrizione + '</td>';
        html += '<td>' + it.tipo + '</td>';
        html += '<td>' + prezzoTxt + '</td>';
        html += '<td>' + qtaTxt + '</td>';
        html += '</tr>';
    }

    html += '</tbody></table>';
    document.getElementById('modal-inventario').innerHTML = html;
}

async function cercaPerProdotto() {
    let tipo = document.getElementById('cerca-tipo').value;
    let codice = document.getElementById('cerca-codice').value.trim();
    let div = document.getElementById('risultati-ricerca');

    if (!codice) {
        div.innerHTML = '<p class="empty">Inserisci un codice</p>';
        return;
    }

    div.innerHTML = '<p class="loading">Ricerca...</p>';

    let url = 'api/officine_pubbliche.php?action=per_prodotto&tipo=' + tipo + '&codice=' + encodeURIComponent(codice);
    let response = await fetch(url);
    let res = await response.json();

    if (!res.data || res.data.length === 0) {
        div.innerHTML = '<p class="empty">Nessuna officina offre questo prodotto</p>';
        return;
    }

    let html = '<p style="margin-bottom:8px;"><strong>' + res.data.length + ' officin' + (res.data.length === 1 ? 'a' : 'e') + ' trovat' + (res.data.length === 1 ? 'a' : 'e') + ':</strong></p>';

    for (let i = 0; i < res.data.length; i++) {
        let o = res.data[i];
        let prezzo = parseFloat(o.prezzo).toFixed(2);
        let prezzoTxt = '€' + prezzo;
        if (tipo === 'servizio') {
            prezzoTxt = prezzoTxt + '/h';
        }

        html += '<div class="officina-item">';
        html += '<div class="officina-info">';
        html += '<strong>' + o.denominazione + '</strong>';
        html += '<span>' + o.indirizzo;
        if (o.telefono) {
            html += ' · ' + o.telefono;
        }
        if (o.centrale) {
            html += ' · Centrale';
        }
        html += '</span>';
        html += '</div>';
        html += '<span class="price">' + prezzoTxt + '</span>';
        html += '</div>';
    }

    div.innerHTML = html;
}

// pagina dipendente

let dipTab = 'servizio';

async function initDipendente() {
    let response = await fetch('api/check_session.php');
    let res = await response.json();

    if (!res.loggedIn) {
        location.href = 'login.html';
        return;
    }

    if (res.ruolo !== 'dipendente') {
        location.href = 'pannel.html';
        return;
    }

    document.getElementById('username').textContent = res.username;

    let offResponse = await fetch('api/dipendente.php?action=officine');
    let offData = await offResponse.json();

    let sel = document.getElementById('sel-officina');
    sel.innerHTML = '<option value="">-- seleziona --</option>';

    let officine = offData.data || [];
    for (let i = 0; i < officine.length; i++) {
        let o = officine[i];
        sel.innerHTML += '<option value="' + o.codice + '">' + o.denominazione + '</option>';
    }
}

function switchDipTab(tab) {
    dipTab = tab;

    let tabs = document.querySelectorAll('.tab');
    let tabValues = ['servizio', 'pezzo', 'articolo'];

    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
        if (tabValues[i] === tab) {
            tabs[i].classList.add('active');
        }
    }

    caricaInventarioDip();
}

async function caricaInventarioDip() {
    let codice = document.getElementById('sel-officina').value;
    let div = document.getElementById('dip-lista');

    if (!codice) {
        div.innerHTML = '<p class="empty">Seleziona un\'officina</p>';
        return;
    }

    div.innerHTML = '<p class="loading">Caricamento...</p>';

    let response = await fetch('api/dipendente.php?action=inventario&codice=' + encodeURIComponent(codice));
    let res = await response.json();

    let itemsAll = res.data || [];
    let items = itemsAll.filter(item => item.tipo === dipTab);

    if (items.length === 0) {
        div.innerHTML = '<p class="empty">Nessun elemento</p>';
        return;
    }

    let qtaCol = dipTab === 'servizio' ? '' : '<th>Quantità</th><th>Aggiorna</th>';
    let html = '<table style="width:100%"><thead><tr><th>Codice</th><th>Descrizione</th><th>Prezzo</th>' + qtaCol + '</tr></thead><tbody>';

    for (let i = 0; i < items.length; i++) {
        let it = items[i];
        html += '<tr>';
        html += '<td>' + it.codice + '</td>';
        html += '<td style="text-align:left;">' + it.descrizione + '</td>';
        html += '<td>€' + parseFloat(it.prezzo).toFixed(2) + '</td>';
        
        if (dipTab !== 'servizio') {
            html += '<td><input type="number" id="qty_' + it.codice + '" value="' + it.quantita + '" min="0" style="width:70px;padding:4px;border:1px solid #ccc;border-radius:4px;text-align:center;"></td>';
            html += '<td><button class="btn-green" onclick="aggiornaQty(\'' + it.codice + '\',\'' + codice + '\')">Salva</button></td>';
        }
        html += '</tr>';
    }

    html += '</tbody></table>';
    div.innerHTML = html;
}

async function aggiornaQty(codice, officina_codice) {
    let qtaInput = document.getElementById('qty_' + codice);
    let qta = parseInt(qtaInput.value);

    await fetch('api/dipendente.php?action=quantita', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'quantita',
            tipo: dipTab,
            codice: codice,
            officina_codice: officina_codice,
            quantita: qta
        })
    });

    caricaInventarioDip();
}

// pagina admin

let adminTab = 'servizio';
let officineList = [];

async function initAdmin() {
    let response = await fetch('api/check_session.php');
    let res = await response.json();

    if (!res.loggedIn) {
        location.href = 'login.html';
        return;
    }

    if (res.ruolo !== 'admin') {
        location.href = 'pannel.html';
        return;
    }

    document.getElementById('username').textContent = res.username;
    await caricaOfficine();
    switchAdminTab('servizio');
}

async function caricaOfficine() {
    let response = await fetch('api/admin.php?tipo=officine');
    let data = await response.json();
    officineList = data.data || [];
}

function switchAdminTab(tipo) {
    adminTab = tipo;

    let tabs = document.querySelectorAll('.tab');
    let tipi = ['servizio', 'pezzo', 'articolo', 'officina', 'utenti'];

    for (let i = 0; i < tabs.length; i++) {
        if (tipi[i] === tipo) {
            tabs[i].classList.add('active');
        } else {
            tabs[i].classList.remove('active');
        }
    }

    let titoli = {
        servizio: 'Servizi',
        pezzo: 'Ricambi',
        articolo: 'Accessori',
        officina: 'Officine',
        utenti: 'Utenti'
    };
    document.getElementById('lista-title').textContent = titoli[tipo];

    document.getElementById('form-msg').textContent = '';

    let nascondi = (tipo === 'utenti');
    let formBox = document.getElementById('form-box');
    if (nascondi) {
        formBox.style.display = 'none';
    } else {
        formBox.style.display = 'block';
        let formTitoli = {
            servizio: 'Aggiungi Servizio',
            pezzo: 'Aggiungi Ricambio',
            articolo: 'Aggiungi Accessorio',
            officina: 'Aggiungi Officina'
        };
        document.getElementById('form-title').textContent = formTitoli[tipo];
        generaForm();
    }

    caricaListaAdmin();
}

function generaForm() {
    let opzioni = '<option value="">-- Nessuna (non associato) --</option>';
    for (let i = 0; i < officineList.length; i++) {
        let o = officineList[i];
        opzioni += '<option value="' + o.codice + '">' + o.denominazione + '</option>';
    }

    let campi = [];

    if (adminTab === 'officina') {
        campi = [
            { id: 'codice', label: 'Codice (5 car.)', type: 'text' },
            { id: 'denominazione', label: 'Nome officina', type: 'text' },
            { id: 'indirizzo', label: 'Indirizzo', type: 'text' },
            { id: 'telefono', label: 'Telefono', type: 'text' },
            { id: 'centrale', label: 'È centrale?', type: 'checkbox' }
        ];
    } else if (adminTab === 'servizio') {
        campi = [
            { id: 'codice_servizio', label: 'Codice servizio', type: 'text' },
            { id: 'descrizione', label: 'Descrizione', type: 'text' },
            { id: 'costo_orario', label: 'Costo orario (€)', type: 'number' },
            { id: 'officina_codice', label: 'Officina (opzionale)', type: 'select', opzioni: opzioni }
        ];
    } else if (adminTab === 'pezzo') {
        campi = [
            { id: 'codice_pezzo', label: 'Codice pezzo', type: 'text' },
            { id: 'descrizione', label: 'Descrizione', type: 'text' },
            { id: 'costo_unitario', label: 'Costo unitario (€)', type: 'number' },
            { id: 'quantita', label: 'Quantità', type: 'number' },
            { id: 'officina_codice', label: 'Officina (opzionale)', type: 'select', opzioni: opzioni }
        ];
    } else {
        // articolo
        campi = [
            { id: 'codice_articolo', label: 'Codice accessorio', type: 'text' },
            { id: 'descrizione', label: 'Descrizione', type: 'text' },
            { id: 'costo_unitario', label: 'Costo unitario (€)', type: 'number' },
            { id: 'quantita', label: 'Quantità', type: 'number' },
            { id: 'officina_codice', label: 'Officina (opzionale)', type: 'select', opzioni: opzioni }
        ];
    }

    let html = '';
    for (let i = 0; i < campi.length; i++) {
        let c = campi[i];
        if (c.type === 'select') {
            html += '<div><label>' + c.label + '</label><select id="' + c.id + '">' + c.opzioni + '</select></div>';
        } else if (c.type === 'checkbox') {
            html += '<div><label><input id="' + c.id + '" type="checkbox"> ' + c.label + '</label></div>';
        } else {
            html += '<div><label>' + c.label + '</label><input id="' + c.id + '" type="' + c.type + '" step="0.01"></div>';
        }
    }

    document.getElementById('form-fields').innerHTML = html;
}

async function aggiungi() {
    let nomiCampi = [];
    if (adminTab === 'officina') {
        nomiCampi = ['codice', 'denominazione', 'indirizzo', 'telefono', 'centrale'];
    } else if (adminTab === 'servizio') {
        nomiCampi = ['codice_servizio', 'descrizione', 'costo_orario', 'officina_codice'];
    } else if (adminTab === 'pezzo') {
        nomiCampi = ['codice_pezzo', 'descrizione', 'costo_unitario', 'quantita', 'officina_codice'];
    } else if (adminTab === 'articolo') {
        nomiCampi = ['codice_articolo', 'descrizione', 'costo_unitario', 'quantita', 'officina_codice'];
    }

    let dati = { tipo: adminTab };

    for (let i = 0; i < nomiCampi.length; i++) {
        let id = nomiCampi[i];
        let el = document.getElementById(id);
        if (el.type === 'checkbox') {
            dati[id] = el.checked ? 1 : 0;
        } else {
            dati[id] = el.value.trim();
        }
    }

    let response = await fetch('api/admin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dati)
    });

    let ris = await response.json();
    let msg = document.getElementById('form-msg');

    if (ris.success) {
        msg.style.color = 'green';
        msg.textContent = 'Aggiunto!';

        for (let i = 0; i < nomiCampi.length; i++) {
            let id = nomiCampi[i];
            let el = document.getElementById(id);
            if (el && el.type !== 'checkbox') {
                el.value = '';
            }
        }

        if (adminTab === 'officina') {
            await caricaOfficine();
        }
        caricaListaAdmin();
    } else {
        msg.style.color = 'red';
        msg.textContent = ris.error || 'Errore';
    }
}

async function caricaListaAdmin() {
    let grid = document.getElementById('lista-items');
    grid.innerHTML = '<p class="loading">caricamento...</p>';

    if (adminTab === 'utenti') {
        let response = await fetch('api/admin.php?tipo=utenti');
        let data = await response.json();
        let utenti = data.data || [];

        if (utenti.length === 0) {
            grid.innerHTML = '<p class="empty">nessun utente</p>';
            return;
        }

        let html = '<table style="width:100%"><thead><tr><th>Username</th><th>Ruolo</th><th>Azione</th></tr></thead><tbody>';

        for (let i = 0; i < utenti.length; i++) {
            let u = utenti[i];
            html += '<tr>';
            html += '<td>' + u.username + '</td>';
            html += '<td>' + u.ruolo + '</td>';
            html += '<td style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">';

            if (u.ruolo !== 'admin') {
                html += '<button class="btn-green" onclick="cambiaRuolo(' + u.id + ',\'admin\')">Admin</button>';
            }
            if (u.ruolo !== 'dipendente') {
                html += '<button class="btn-primary" onclick="cambiaRuolo(' + u.id + ',\'dipendente\')">Dipendente</button>';
            }
            if (u.ruolo !== 'cliente') {
                html += '<button class="btn-red" onclick="cambiaRuolo(' + u.id + ',\'cliente\')">Cliente</button>';
            }

            html += '</td>';
            html += '</tr>';
        }

        html += '</tbody></table>';
        grid.innerHTML = html;
        return;
    }

    if (adminTab === 'officina') {
        let response = await fetch('api/admin.php?tipo=officine');
        let data = await response.json();
        let items = data.data || [];

        if (items.length === 0) {
            grid.innerHTML = '<p class="empty">Nessuna officina</p>';
            return;
        }

        let html = '';
        for (let i = 0; i < items.length; i++) {
            let o = items[i];
            let infoTelefono = o.telefono ? o.telefono + ' · ' : '';
            let centrale = o.centrale ? 'Centrale' : 'Periferica';

            html += '<div class="card">';
            html += '<h3>' + o.denominazione + '</h3>';
            html += '<div>' + o.indirizzo + '</div>';
            html += '<div class="sub">' + infoTelefono + centrale + ' · Cod: ' + o.codice + '</div>';
            html += '<button style="width:auto;margin-top:5px;" class="btn-red" onclick="eliminaOfficina(\'' + o.codice + '\')">Elimina</button>';
            html += '</div>';
        }

        grid.innerHTML = html;
        return;
    }

    // SERVIZI, RICAMBI, ARTICOLI
    let endpoint = '';
    if (adminTab === 'servizio') endpoint = 'servizi';
    else if (adminTab === 'pezzo') endpoint = 'ricambi';
    else endpoint = 'articolo';

    let tabella = '';
    if (adminTab === 'servizio') tabella = 'Servizio';
    else if (adminTab === 'pezzo') tabella = 'Pezzo';
    else tabella = 'Articolo';

    let response = await fetch('api/' + endpoint + '.php');
    let data = await response.json();
    let items = data.data || [];

    if (items.length === 0) {
        grid.innerHTML = '<p class="empty">Nessun elemento</p>';
        return;
    }

    let opzioniOfficine = '<option value="">-- Nessuna --</option>';
    for (let i = 0; i < officineList.length; i++) {
        let o = officineList[i];
        opzioniOfficine += '<option value="' + o.codice + '">' + o.denominazione + '</option>';
    }

    let html = '';

    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let codice = '';
        let prezzo = '';
        let qtaHtml = '';

        if (adminTab === 'servizio') {
            codice = item.codice_servizio;
            prezzo = '€' + item.costo_orario + '/h';
        } else if (adminTab === 'pezzo') {
            codice = item.codice_pezzo;
            prezzo = '€' + item.costo_unitario;
            qtaHtml = '<div>Qtà: ' + item.quantita + '</div>';
        } else {
            codice = item.codice_articolo;
            prezzo = '€' + item.costo_unitario;
            qtaHtml = '<div>Qtà: ' + item.quantita + '</div>';
        }

        let selOfficine = opzioniOfficine;
        if (item.officina_codice) {
            selOfficine = selOfficine.replace('value="' + item.officina_codice + '"', 'value="' + item.officina_codice + '" selected');
        }

        html += '<div class="card">';
        html += '<h3>' + item.descrizione + '</h3>';
        html += '<div class="price">' + prezzo + '</div>';
        html += '<div class="sub">Cod: ' + codice + '</div>';
        html += qtaHtml;
        html += '<div style="margin-top:8px;">';
        html += '<label style="font-size:0.85rem;">Officina:</label>';
        html += '<select id="off_' + item.id + '" style="width:100%;margin-top:3px;">' + selOfficine + '</select>';
        html += '<button class="btn-primary" style="width:100%;margin-top:4px;" onclick="associaOfficina(' + item.id + ',\'' + tabella + '\')">Salva officina</button>';
        html += '</div>';
        html += '<button style="width:100%;margin-top:6px;" class="btn-red" onclick="elimina(' + item.id + ')">Elimina</button>';
        html += '</div>';
    }

    grid.innerHTML = html;
}

async function cambiaRuolo(id, nuovoRuolo) {
    await fetch('api/admin.php?tipo=utente_ruolo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, ruolo: nuovoRuolo })
    });
    caricaListaAdmin();
}

async function associaOfficina(id, tabella) {
    let select = document.getElementById('off_' + id);
    let officina_codice = select.value;
    if (officina_codice === '') {
        officina_codice = null;
    }

    await fetch('api/admin.php?tipo=associa_officina', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, tabella: tabella, officina_codice: officina_codice })
    });
    caricaListaAdmin();
}

async function elimina(id) {
    if (!confirm('Eliminare?')) {
        return;
    }

    await fetch('api/admin.php?tipo=' + adminTab, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
    });
    caricaListaAdmin();
}

async function eliminaOfficina(codice) {
    if (!confirm('Eliminare officina e tutto ciò che contiene?')) {
        return;
    }

    await fetch('api/admin.php?tipo=officina', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codice: codice })
    });

    await caricaOfficine();
    caricaListaAdmin();
}

// avvio prevent back button
window.onpageshow = function(event) {
    if (event.persisted) {
        location.reload();
    }
};

let page = location.pathname.split('/').pop();

if (page === 'login.html' || page === '') {
    let passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login();
        });
    }
}

if (page === 'register.html') {
    let confirmField = document.getElementById('confirm');
    if (confirmField) {
        confirmField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') register();
        });
    }
}


if (page === 'pannel.html') {
    initPage();
}

if (page === 'admin.html') {
    initAdmin();
}

if (page === 'index.html') {
    initOfficine();
}

if (page === 'dipendente.html') {
    initDipendente();
}
