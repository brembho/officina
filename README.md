# Casa Automobilistica - Gestione Officine

Un'applicazione web per la gestione di una rete di officine automobilistiche, che consente la ricerca di servizi, ricambi e accessori disponibili presso le varie officine, con sistema di carrello e acquisto integrato.

## 🎯 Funzionalità

### Per Clienti
- **Ricerca officine**: Visualizzazione completa delle officine disponibili
- **Catalogo prodotti**: Servizi, ricambi e accessori con prezzi variegati per officina
- **Carrello**: Aggiunta prodotti al carrello con controllo automatico della disponibilità
- **Acquisto**: Completamento dei pagamenti con aggiornamento automatico delle quantità del database
- **Ricerca avanzata**: Ricerca di officine per prodotto/servizio specifico

### Per Dipendenti
- **Gestione inventario**: Visualizzazione e aggiornamento delle quantità di prodotti
- **Pannello magazzino**: Interfaccia dedicata per la gestione dello stock

### Per Amministratori
- **Pannello admin**: Gestione completa del sistema
- **Gestione utenti**: Creazione e gestione di ruoli e permessi
- **Monitoraggio**: Controllo complessivo di officine, prodotti e transazioni

## 🏗️ Struttura del Progetto

```
officina/
├── api/                          # Endpoint API
│   ├── acquista.php             # Gestione acquisti e aggiornamento DB
│   ├── admin.php                # API amministrazione
│   ├── articolo.php             # API accessori
│   ├── carrello.php             # Gestione carrello
│   ├── check_session.php        # Verifica sessione utente
│   ├── dipendente.php           # API dipendente
│   ├── home.php                 # Home API
│   ├── login.php                # Autenticazione
│   ├── logout.php               # Disconnessione
│   ├── officine_pubbliche.php   # API officine pubbliche
│   ├── register.php             # Registrazione utenti
│   ├── ricambi.php              # API ricambi
│   ├── servizi.php              # API servizi
│   └── verify.php               # Verifica email
├── classes/
│   └── database.php             # Classe gestione database
├── configs/
│   └── config.php               # Configurazione applicazione
├── js/
│   └── main.js                  # Logica frontend principale
├── style/
│   └── style.css                # Stili CSS
├── vendor/                       # Dipendenze Composer
│   ├── autoload.php
│   ├── PHPMailer/               # Libreria email
│   ├── phpdotenv/               # Variabili ambiente
│   └── ...
├── index.html                   # Home page pubbliche (officine)
├── pannel.html                  # Pannello utenti autenticati
├── login.html                   # Pagina login
├── register.html                # Pagina registrazione
├── admin.html                   # Pannello amministratore
├── dipendente.html              # Pannello dipendente
├── composer.json                # Dipendenze PHP
└── db.txt                       # Schema database SQL
```

## 🔧 Requisiti

- PHP >= 7.4
- MySQL/MariaDB
- Composer
- XAMPP (o server web Apache equivalente)

## 📦 Installazione

### 1. Clone del progetto
```bash
git clone https://github.com/brembho/officina
cd officina
```

### 2. Installazione dipendenze
```bash
composer install
```

### 3. Setup database
1. Importa lo schema dal file `db.txt` nel tuo MySQL:
```bash
mysql -u root -p < db.txt
```

2. Configura le credenziali nel file `configs/config.php`

### 4. Configurazione
Copia il file `.env.example` in `.env` e configura:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=officina
```

## 🚀 Utilizzo

### Creazione account
1. Vai a `/register.html`
2. Compila il modulo di registrazione
3. Verifica l'email ricevuta
4. Accedi con le tue credenziali

### Come utente
1. Accedi al pannello personale
2. Seleziona tipo di prodotto (Servizi, Ricambi, Accessori)
3. Visualizza disponibilità presso le varie officine
4. Aggiungi prodotti al carrello rispettando le quantità disponibili
5. Completa l'acquisto

### Come admin
1. Accedi con account admin
2. Usa il pannello admin per gestire the sistema
3. Monitoraggio di officine, prodotti e utenti

## 🔐 Ruoli e Permessi

- **Utente**: Accesso base ai servizi, ricerca e acquisto
- **Dipendente**: Gestione inventario e stock dell'officina
- **Admin**: Accesso completo al sistema

Per assegnare il ruolo di admin:
```sql
UPDATE users SET ruolo = 'admin' WHERE username = 'username';
```

## 📋 Funzionalità Principali

### Sistema Carrello Intelligente
- Controllo automatico della disponibilità
- Impossibile aggiungere più unità della disponibilità
- Aggiornamento quantità in tempo reale
- Calcolo automatico del totale

### Gestione Inventario
- Visualizzazione di prodotti con disponibilità zero nelle officine
- Aggiornamento automatico dopo l'acquisto
- Tracciamento stock per officina

### Ricerca Avanzata
- Ricerca per tipo di prodotto
- Ricerca per codice
- Filtro per officina
- Visualizzazione prezzi variegati

## 📚 API Endpoints

### Prodotti
- `GET /api/servizi.php` - Servizi disponibili
- `GET /api/ricambi.php` - Ricambi disponibili
- `GET /api/articolo.php` - Accessori disponibili

### Carrello
- `GET /api/carrello.php` - Visualizza carrello
- `POST /api/carrello.php` - Aggiungi prodotto
- `PUT /api/carrello.php` - Modifica quantità
- `DELETE /api/carrello.php` - Rimuovi prodotto

### Acquisti
- `POST /api/acquista.php` - Completa acquisto e aggiorna DB

### Officine
- `GET /api/officine_pubbliche.php?action=lista` - Lista officine
- `GET /api/officine_pubbliche.php?action=inventario&codice=OP01` - Inventario officina
- `GET /api/officine_pubbliche.php?action=per_prodotto&tipo=pezzo&codice=123` - Officine con prodotto

### Autenticazione
- `POST /api/login.php` - Login
- `POST /api/register.php` - Registrazione
- `POST /api/logout.php` - Logout
- `GET /api/check_session.php` - Verifica sessione

## 💾 Database

Le tabelle principali sono:
- **Officina**: Dati officine
- **Pezzo**: Ricambi con quantità per officina
- **Articolo**: Accessori con quantità per officina
- **Servizio**: Servizi per officina
- **users**: Utenti registrati con ruoli
- **Cliente**: Informazioni clienti
- **Veicolo**: Veicoli dei clienti
- **Intervento**: Storico interventi

## 🔄 Flusso Acquisto

1. Utente seleziona un prodotto dalla home
2. Sistema mostra disponibilità presso le varie officine
3. Utente sceglie un'officina e aggiunge al carrello
4. Sistema verifica disponibilità e blocca se superata
5. Utente completa acquisto
6. Sistema aggiorna cantità in DB (`Pezzo` e `Articolo`)
7. Carrello viene svuotato

## 📧 Email

L'applicazione usa PHPMailer per:
- Invio email di registrazione
- Verifica account
- Notifiche

Configura credenziali SMTP in `configs/config.php`

## 🛠️ Troubleshooting

### Errore connessione database
- Verifica credenziali in `configs/config.php`
- Assicurati che MySQL sia in esecuzione
- Controlla il nome del database

### Autorizzazione negata
- Verifica ruolo utente nel database
- Controlla permessi file su server

### Carrello non funziona
- Abilita le sessioni PHP
- Controlla memory limit PHP

##  Supporto

Per segnalare bug o richiedere features, apri un issue su GitHub.

---

**Ultima modifica**: Aprile 2026
