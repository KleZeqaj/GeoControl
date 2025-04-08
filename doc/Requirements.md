# Requirements Document - GeoControl

Date:

Version: V1 - description of Geocontrol as described in the swagger

| Version number | Change |
| :------------: | :----: |
|                |        |

# Contents

- [Requirements Document - GeoControl](#requirements-document---geocontrol)
- [Contents](#contents)
- [Informal description](#informal-description)
- [Business model](#business-model)
- [Stakeholders](#stakeholders)
- [Context Diagram and interfaces](#context-diagram-and-interfaces)
  - [Context Diagram](#context-diagram)
  - [Interfaces](#interfaces)
- [Stories and personas](#stories-and-personas)
- [Functional and non functional requirements](#functional-and-non-functional-requirements)
  - [Functional Requirements](#functional-requirements)
  - [Non Functional Requirements](#non-functional-requirements)
- [Use case diagram and use cases](#use-case-diagram-and-use-cases)
  - [Use case diagram](#use-case-diagram)
    - [Use case 1, UC1](#use-case-1-uc1)
      - [Scenario 1.1](#scenario-11)
      - [Scenario 1.2](#scenario-12)
      - [Scenario 1.x](#scenario-1x)
    - [Use case 2, UC2](#use-case-2-uc2)
    - [Use case x, UCx](#use-case-x-ucx)
- [Glossary](#glossary)
- [System Design](#system-design)
- [Deployment Diagram](#deployment-diagram)

# Informal description

GeoControl is a software system designed for monitoring physical and environmental variables in various contexts: from hydrogeological analyses of mountain areas to the surveillance of historical buildings, and even the control of internal parameters (such as temperature or lighting) in residential or working environments.

# Business Model
L'azienda sviluppatrice viene incaricata di realizzare un sistema software (**GeoControl**) per il monitoraggio di parametri interni, quali temperatura e illuminazione, e l'analisi idrogeologica di aree montuose.
La realizzazione del software viene richiesta e finanziata parzialmente dall'unione delle comunità montane della regione Piemonte, ma prevede, a seguito di trattative con la comunità, di poter avere come **target di mercato** anche entità pubbliche o private che necessitano di monitoraggio costante per parametri come quelli sopra citati.\
E' previsto anche, in futuro, la progettazione e vendita di sensori ottimizzati per il sistema.
La principale strategia di marketing è quella di generare **revenues** mediante la vendita di lincenze.\
Inzialmente sono previsti piani a pagamento aventi costo differente a seconda della durata della licenza, in particolare:


| Licenza |  Durata | Risparmio |
| :--------------: | :---------: | :---------: |
| Mensile  | 1 mese | 0%  |
| Annuale  | 12 mesi | 10% |

E' prevista la possibilità di avere un servizio aggiuntivo a pagamento per l'installazione e la configurazione del sistema mediante l'intervento di un tecnico. L'applicativo deve poter supportare sensori di tipo COTS, reperibili sul mercato, e i sensori che in futuro verranno progettati e venduti dall'azienda.
Inoltre, l'applicativo dovrà gestire i seguenti ruoli:

| User |  Funzionalità disponibili |
| :--------------: | :---------: |
| Operatore |  inserimento manualmente delle misurazioni, gestione dei dispositivi come sensori, gateways etc|
| Viewer | operazione di sola lettura su dati, sensori e gateway|
| Amministratore | ha accesso a tutte le risorse, quindi può eseguire operazioni su utenti e reti |

Visto quindi la possibile diversità di utenti, bisognerà offrire un sistema di autenticazione, con diverse interfacce

Inoltre, GeoControl dovrà essere in grado di comunicare con dispositivi come sensori e gateways tramite Internet, utilizzando il protocollo HTTP. Questo permetterà al sistema di ricevere, gestire e analizzare i dati e i timestamps provenienti dalle misurazioni, effettuate con una frequenza di aggiornamento ogni 10 minuti, garantendo così un monitoraggio costante e in tempo reale delle variabili ambientali.\
Perciò le features principali del software, che costituiscono un valore,  saranno:
- capacità di gestione di grandi quantità di dati 
- scalabilità: possibilità di aggiungere quanti più dispositivi si desidera
- affidabilità: basso tasso di misurazioni incorrette in 1 anno
- facilità di utilizzo -> basta inserire i dati dei propri sensori


# Stakeholders

| Stakeholder name | Description |
| :--------------: | :---------: |
| Unità delle comunità montane  |  Analisi del territorio e dei relativi parametri|
| Ambiente (Zone montuose  e Edifici storici)| Mantenimento sotto controllo e in salute |
| Viewer | Disponibilità di una grande quantità di misurazioni da poter consultare|
| Operator | Gestione e mantenimento di una grande quantità di misurazioni |
| Amministratore | Gestione degli utenti e delle reti |
| Servizio di pagamenti | Gestione dei pagamenti delle licenze |
| Tecnico | Manutenzione/ Installazione / Configurazione dei sensori |



# Context Diagram and interfaces

## Context Diagram

![Alt text](../risorse/context-diagram.png)


## Interfaces

\<describe here each interface in the context diagram>


|   Actor   | Logical Interface | Physical Interface |
| :-------: | :---------------: | :----------------: |
| Servizio pagamenti |   API Paypal, BancaSella, IntesaSanpaolo, Unicredit     |       Connessione Internet          |
| Viewer |  GUI | PC |
| Operator | GUI | PC |
| Amministratore | GUI | PC |
| Tecnico | GUI | PC |
| Ambiente |  Temperatura e illuminazione e varie | Modulo di misurazione del sensore |


# Stories and personas

| ID Persona  | Sesso | Età | Occupazione | Conoscenza Tecnica | Conoscenza di Dominio |
| :-------: | :---------------: | :----------------: | :----------------: | :----------------: | :----------------: |
| 1 | M | Mezza età | Manager del Museo | Bassa | Alta |
| 2 | F | Giovane | Studente PhD | Alta | Alta |
| 3 | M | Mezza età | Tecnico | Alta | Media |
| 4 | F | Giovane | Fotografo | Media | Alta |
| 5 | M | Anziano | Pensionato | Bassa | Bassa |
| 6 | M | Giovane | Amministratore | Alta | Media |

- **Storia persona 1**: Ha bisogno di capire se è necessario investire in un nuovo sistema di regolazione della temperature e/o di illuminazione, necessita di dati molto precisi e affidabili per prendere una decisione.
- **Storia persona 2**: Sta effettuando un progetto di ricerca in collaborazione con un ente che si occupa del monitoraggio e depurazione della rete fognaria di una grande città. Ha bisogno di fare analisi su una grandi moli di dati relativi ad un ampio intervallo temporale.
- **Storia persona 3**: Deve installare il sistema GeoControl presso aziende/strutture/località montane. Deve aver la possibilità di interagire con il sistema temporaneamente con il ruolo di Amministratore e necessità di un sistema fortemente integrato.
- **Storia persona 4**: Ha uno studio fotografico e deve poter tenere sotto controllo il livello dell'illuminazione per poter offrire un servizio di qualità.
- **Storia persona 5**: L'Istituto Nazionale di Geofisica e Vulcanologia mette a disposizione i dati delle misurazioni dell'attività sismica di alcune zone d'Italia per gli utenti, attraverso il ruolo Viewer dell'applicativo. L'interfaccia deve essere estremamente user friendly, garantendo la fruizione di dati semplici e dettagliati.
- **Storia persona 6**: È l'amministratore di sistema di un'azienda privata che vuole tenere sotto controllo la temperatura dell'ambiente di lavoro. Deve poter gestire le reti e i ruoli del sistema in maniera intuitiva e affidabile.

# Functional and non functional requirements

## Functional Requirements

\<In the form DO SOMETHING, or VERB NOUN, describe high level capabilities of the system>

\<they match to high level use cases>

|  ID   | Description |
| :---: | :---------: |
|  FR1  | Autenticazione |
| FR1.1 | Login (inserimento username e password) |
| FR1.2 | Generazione del token di sessione |
| FR1.3 | Logout |
| FR2   | CRUD utenze |
| FR2.1 | Creazione e inserimento dell'utenza |
| FR2.1.1 | Raccolta informazioni utente |
| FR2.1.2 | Inserimento utenza con credenziali di default (amministratore) |
| FR2.2 | Modifica dell'utenza |
| FR2.2.1 | Modifica lato amministratore |
| FR2.2.2 | Modifica lato utente (credenziali/informazioni) |
| FR2.3 | Cancellazione dell'utenza |
| FR2.4 | Ricerca utenze |
| FR2.4.1 | Operazioni di filtraggio delle utenze |
| FR3 | CRUD misurazioni |
| FR3.1 | Creazione e inserimento delle misurazioni |
| FR3.1.1 | Conversione timezone del timestamp della misurazione |
| FR3.1.2 | Inserimento e associazione delle misurazioni ricevute |
| FR3.1.3 | Inserimento misurazioni lato operatore/amministratore |
| FR3.2 | Modifica delle misurazioni |
| FR3.3 | Cancellazione delle misurazioni |
| FR3.4 | Navigazione e ricerca delle misurazioni |
| FR3.4.1 | Operazioni di filtraggio delle misurazioni |
| FR4   | Gestione della topologia |
| FR4.1 | Inserimento nuovi dispositivi |
| FR4.1.1 | Generazione ID univoco secondo specifiche |
| FR4.2 | Modifica della topologia |
| FR4.3 | Rimozione dispositivi |
| FR4.4 | Navigazione dei dispositivi |
| FR5   | Operazioni di calcolo e analisi statistica |

## Non Functional Requirements

\<Describe constraints on functional requirements>

|   ID    | Type (efficiency, reliability, ..) | Description | Refers to |
| :-----: | :--------------------------------: | :---------: | :-------: |
|  NFR1   |      Efficienza                    | Le misurazioni devono essere realizzate ogni 10 minuti | FR3.1.2 |
|  NFR2   |      Privacy                       | I dati devono essere trattati in accordo con le normative del GDPR | FR2 |
|  NFR3   |      Dominio                       | Il timestamp delle misurazioni devono essere convertite secondo il formato ISO8601 | FR3.1.1 |
|  NFR4   |      Affidabilità                  | Non più di 6 misurazioni all'anno, per sensore, devono essere perse | FR3 |
|  NFR3   |      Sicurezza                     | Il sistema deve impedire agli utenti di eseguire operazioni per le quali non sono autorizzati e deve impedire accessi malevoli| FR1, FR2 |
|  NFR3   |      Dominio                       | Il timestamp delle misurazioni devono essere convertite secondo il formato ISO8601 | FR3.1.1 |
| NFRx .. |                                    |             |           |

# Use case diagram and use cases

## Use case diagram

\<define here UML Use case diagram UCD summarizing all use cases, and their relationships>

![Alt text](../risorse/use-cases.png)

\<next describe here each use case in the UCD>

### Use case 1: Autenticazione Utente

| Actors Involved  |                              Utente (Operatore,  Amministratore)                                        |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | Il sistema GeoControl è attivo e accessibile. L'utente possiede credenziali valide. |
|  Post condition  |  L'utente è autenticato e un token di autenticazione è stato generato e fornito.   |
| Nominal Scenario |         1. L'utente inserisce username e password. 2. Il sistema verifica le credenziali. 3. Il sistema genera un token di autenticazione. 4. Il sistema restituisce il token all'utente.         |
|     Variants     |                      Nessuno specificato al momento.                      |
|    Exceptions    |                        E1: Credenziali Invalide. E2: Errore interno del sistema durante l'autenticazione.                        |

##### Scenario 1.1

Autenticazione Utente con Successo

|  Scenario 1.1  |                                                                            |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | Il sistema GeoControl è attivo e accessibile. L'utente possiede credenziali valide. |
| Post condition |    L'utente è autenticato e un token di autenticazione valido è stato generato e fornito.   |
|     Step#      |                                Descrizione                                 |
|       1        |   L'utente naviga alla pagina di login.                                                                         |
|       2        |   L'utente inserisce il proprio username nel campo dedicato.                                                                         |
|      3       |    L'utente inserisce la propria password nel campo dedicato.                                                                        |
|      4       |             L'utente clicca sul pulsante "Accedi".                                                               |
|    5       |       Il sistema riceve le credenziali.                                                                     |
|      6       |        Il sistema confronta le credenziali inserite con quelle memorizzate nel database.                                                                    |
|      7       |    	Le credenziali corrispondono.                                                                        |
|      8       |     Il sistema genera un token di autenticazione univoco.                                                                       |    
|      9       |     Il sistema memorizza il token associato all'utente e alla sessione (se necessario).                                                                       | 
|      10       |     Il sistema restituisce il token all'applicazione client dell'utente.| 
|      11      |     L'utente viene reindirizzato alla pagina principale o all'area riservata.                                                                      | 

##### Scenario 1.2

Tentativo di Autenticazione con Credenziali Invalide

|  Scenario 1.2  |                                                                            |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | Il sistema GeoControl è attivo e accessibile. L'utente possiede credenziali non valide o le inserisce in modo errato. |
| Post condition |  L'utente non è autenticato. Viene visualizzato un messaggio di errore.   |
|     Step#      |                                Descrizione                                 |
|       1        |    L'utente naviga alla pagina di login.                                                                        |
|       2        |      L'utente inserisce un username non valido o inesistente.                                                                      |
|      3       |       L'utente inserisce una password errata.                                                                     |
|      4       |       L'utente clicca sul pulsante "Accedi". errata.                                                                     |
|      5       |      Il sistema riceve le credenziali.errata.                                                                     |
|      6       |      Il sistema confronta le credenziali inserite con quelle memorizzate nel database.errata.                                                                     |
|      7       |       Le credenziali non corrispondono. errata.                                                                     |
|      8       |       Il sistema visualizza un messaggio di errore all'utente (es. "Username o password errati").errata.                                                                     |
|      9       |       L'utente rimane sulla pagina di login e può tentare nuovamente l'accesso. errata.                                                                     |



### Use case 2: Visualizzazione Dati di Monitoraggio

| Actors Involved  |             Utente (Operatore, Amministratore)                                                         |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | L'utente è autenticato e possiede un token valido. Sono presenti dati di monitoraggio nel sistema. |
|  Post condition  |  I dati di monitoraggio selezionati vengono visualizzati all'utente.   |
| Nominal Scenario |         1. L'utente seleziona una rete, un gateway o un sensore. 2. Il sistema recupera le misurazioni associate. 3. Il sistema visualizza i dati.         |
|     Variants     |          V1: Visualizzazione in formato tabellare. V2: Visualizzazione in formato grafico.                      |
|    Exceptions    |         E1: Nessun dato disponibile per la selezione. E2: Errore durante il recupero dei dati dal database.                       |

##### Scenario 2.1

Visualizzazione Dati di un Sensore Specifico in Formato Tabellare



|  Scenario 1.1  |                                                                            |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | L'utente è autenticato e possiede un token valido. Sono presenti misurazioni per il sensore selezionato. |
| Post condition |  Le misurazioni del sensore selezionato vengono visualizzate in una tabella con timestamp e valori.   |
|     Step#      |                                Descrizione                                 |
|       1        |  L'utente naviga alla sezione di visualizzazione dati.                                                                          |
|       2        |     	L'utente seleziona un sensore specifico da un elenco o tramite una mappa.                                                                       |
|      3       |      L'utente seleziona l'opzione di visualizzazione "Tabella".                                                                      |
|      4       |         Il sistema riceve la richiesta del sensore.                                                                   |
|      5       |       Il sistema interroga il database per recuperare tutte le misurazioni associate a quel sensore.                                                                     |
|      6       |     Il database restituisce le misurazioni trovate.                                                                       |
|      7       |     Il sistema formatta i dati in una tabella con colonne per timestamp e valore della misurazione.                                                                       |
|      8       |    	Il sistema visualizza la tabella all'utente.                                                                        |

##### Scenario 2.2
Nessun Dato Disponibile per il Sensore Selezionato


|  Scenario 2.2  |                                                                            |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | L'utente è autenticato e possiede un token valido. Non sono presenti misurazioni per il sensore selezionato. |
| Post condition |  Viene visualizzato un messaggio indicante l'assenza di dati.   |
|     Step#      |                                Descrizione                                 |
|       1        |      L'utente naviga alla sezione di visualizzazione dati.                                                                      |
|       2        |         	L'utente seleziona un sensore specifico da un elenco o tramite una mappa.                                                                   |
|      3       |           Il sistema riceve la richiesta del sensore.                                                                 |
|      4       |               Il sistema interroga il database per recuperare le misurazioni associate a quel sensore.                                                             |
|      5       |               Il database non trova misurazioni per quel sensore.                                                            |
|      6       |                      Il sistema visualizza un messaggio all'utente (es. "Nessun dato di monitoraggio disponibile per il sensore selezionato.").                                                      |
     


### Use case 3: Creazione e Inserimento di Misurazioni

| Actors Involved  |             Sistema (attraverso i Gateway), Amministratore                                                     |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | Il sistema GeoControl è attivo. Per l'inserimento via Gateway: il Gateway è configurato correttamente e connesso. Per l'inserimento manuale: l'Amministratore è autenticato. |
|  Post condition  | 	La nuova misurazione è stata memorizzata nel database ed è associata al sensore corretto. Il timestamp è in formato ISO8601.  |
| Nominal Scenario |        1a. (Via Gateway) Il Gateway invia una misurazione. 1b. (Manuale) L'Amministratore inserisce i dati della misurazione. 2. Il sistema valida i dati. 3. Il sistema converte il timestamp in ISO8601. 4. Il sistema associa e memorizza la misurazione.         |
|     Variants     |          	Nessuno specificato al momento.                    |
|    Exceptions    |      E1: Errore di validazione dei dati. E2: Errore durante la conversione del timestamp. E3: Errore durante la memorizzazione nel database.    |

##### Scenario 3.1

Ricezione e Inserimento di una Misurazione Valida da Gateway


|  Scenario 3.1  |                                                                            |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | Il sistema GeoControl è attivo. Il Gateway è configurato correttamente e connesso. La misurazione inviata è in un formato valido. |
| Post condition |  La misurazione ricevuta è stata validata, il timestamp convertito in ISO8601 e memorizzata nel database associata al sensore corretto.   |
|     Step#      |                                Descrizione                                 |
|       1        |     Il Gateway rileva un valore dal sensore.                                                                       |
|       2        |          Il Gateway formatta i dati della misurazione (valore, timestamp, ID sensore).                                                                  |
|      3       |       Il Gateway invia i dati della misurazione al sistema GeoControl (tramite API di ingestione).                                                                     |
|      4       |      	Il sistema riceve i dati della misurazione.                                                                      |
|      5       |          Il sistema valida il formato dei dati ricevuti (es. presenza di tutti i campi necessari, tipi di dati corretti).                                                                  |
|      6       |        Il sistema estrae il timestamp originale.                                                                    |
|      7       |           Il sistema converte il timestamp nel formato ISO8601.                                                                 |
|      8       |           	Il sistema identifica il sensore associato tramite l'ID fornito.                                                                 |
|      9       |             	Il sistema memorizza la misurazione (valore e timestamp convertito) nel database, collegandola al sensore identificato.                                                               |
|      10       |          Il sistema (opzionalmente) invia una conferma di ricezione al Gateway.                                                                  |


##### Scenario 3.2

Inserimento Manuale di una Misurazione Valida da Parte dell'Amministratore

|  Scenario 1.1  |                                                                            |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | Il sistema GeoControl è attivo. L'Amministratore è autenticato e ha accesso alla funzionalità di inserimento manuale. |
| Post condition |  La misurazione inserita è stata validata, il timestamp convertito in ISO8601 e memorizzata nel database associata al sensore selezionato.   |
|     Step#      |                                Descrizione                                 |
|       1        |      L'Amministratore naviga alla sezione di inserimento manuale misurazioni.                                                                      |
|       2        |        L'Amministratore seleziona un sensore dalla lista.                                                                    |
|      3       |          L'Amministratore inserisce il valore della misurazione.                                                                  |
|      4       |             L'Amministratore inserisce il timestamp della misurazione.                                                               |
|      5       |           L'Amministratore clicca sul pulsante "Salva".                                                                 |
|      6       |                   	Il sistema riceve i dati inseriti.                                                         |
|      7       |                  Il sistema valida il formato dei dati inseriti (es. tipo di dato del valore).                                                          |
|      8       |               Il sistema converte il timestamp inserito nel formato ISO8601.                                                             |
|      9       |                	Il sistema memorizza la misurazione (valore e timestamp convertito) nel database, collegandola al sensore selezionato.                                                            |
|      10       |          Il sistema visualizza un messaggio di conferma dell'inserimento.                                                                  |


### Use case 4: Gestione della Topologia

| Actors Involved  |             Amministratore                                                         |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | L'Amministratore è autenticato e ha accesso alle funzionalità di gestione della topologia. |
|  Post condition  |  La topologia del sistema (reti, gateway, sensori) è stata modificata come richiesto. Gli ID univoci sono generati secondo le specifiche.   |
| Nominal Scenario |       1. L'Amministratore seleziona l'operazione desiderata (inserimento, modifica, rimozione). 2. L'Amministratore fornisce i dati necessari. 3. Il sistema valida i dati. 4. Il sistema esegue l'operazione e (se necessario) genera un ID univoco. 5. Il sistema aggiorna la topologia.        |
|     Variants     |          V1: Inserimento di una nuova rete. V2: Inserimento di un nuovo gateway. V3: Inserimento di un nuovo sensore. V4: Modifica di un dispositivo esistente. V5: Rimozione di un dispositivo.                     |
|    Exceptions    |        E1: Errore di validazione dei dati inseriti. E2: Tentativo di inserire un ID univoco già esistente. E3: Errore durante l'aggiornamento del database. E4: Tentativo di rimuovere un dispositivo con dipendenze attive.                |

##### Scenario 4.1

Inserimento di un Nuovo Sensore


|  Scenario 1.1  |                                                                            |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | L'Amministratore è autenticato e ha accesso alla funzionalità di gestione della topologia. Esiste almeno un gateway nel sistema a cui poter associare il sensore. |
| Post condition |  Un nuovo sensore è stato registrato nel sistema con un ID univoco generato secondo le specifiche ed è associato al gateway selezionato.   |
|     Step#      |                                Descrizione                                 |
|       1        |   	L'Amministratore naviga alla sezione di gestione della topologia e seleziona "Aggiungi Nuovo Sensore".                                                                         |
|       2        |      	L'Amministratore inserisce i dettagli del sensore: nome descrittivo, tipo di sensore.                                                                      |
|      3       |       L'Amministratore seleziona il gateway a cui associare il sensore da un elenco.                                                                     |
|      4       |        Il sistema genera un ID univoco per il nuovo sensore secondo le specifiche (FR4.1.1).                                                                    |
|      5       |       Il sistema convalida i dati inseriti (es. che il gateway selezionato esista).                                                                     |
|      6       |         	Il sistema memorizza le informazioni del nuovo sensore (ID univoco, nome, tipo, gateway associato) nel database.                                                                   |
|      7       |         Il sistema visualizza un messaggio di conferma dell'inserimento, mostrando l'ID univoco generato.                                                                   |


##### Scenario 4.2

Tentativo di Inserire un Sensore con un ID Univoco Già Esistente (se permesso l'inserimento manuale dell'ID)

\<a scenario is a sequence of steps that corresponds to a particular execution of one use case>

\<a scenario is a more formal description of a story>

\<only relevant scenarios should be described>

|  Scenario 1.1  |                                                                            |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | L'Amministratore è autenticato e ha accesso alla funzionalità di gestione della topologia. |
| Post condition |  L'inserimento del sensore fallisce e viene visualizzato un messaggio di errore.   |
|     Step#      |                                Descrizione                                 |
|       1        |       L'Amministratore naviga alla sezione di gestione della topologia e seleziona "Aggiungi Nuovo Sensore".                                                                     |
|       2        |       L'Amministratore inserisce i dettagli del sensore, incluso un ID univoco che è già presente nel sistema.                                                                     |
|      3       |          	L'Amministratore seleziona il gateway a cui associare il sensore.                                                                  |
|      4       |             	L'Amministratore clicca su "Salva".                                                               |
|      5       |           Il sistema verifica se l'ID univoco inserito è già presente nel database.                                                                 |
|      6       |              	L'ID univoco risulta già esistente.                                                              |
|      7       |               Il sistema visualizza un messaggio di errore (es. "L'ID univoco specificato è già in uso. Si prega di inserirne uno diverso o lasciare che il sistema ne generi uno automaticamente.").                                                             |
|      8       |           	Il sistema non memorizza le informazioni del nuovo sensore.                                                                 |


### Use case 5: Modifica di un Sensore Esistente
| Actors Involved  |             Amministratore                                                         |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | L'Amministratore è autenticato e ha accesso alle funzionalità di gestione della topologia. Esiste almeno un sensore registrato nel sistema.|
|  Post condition  | Le informazioni del sensore selezionato sono state aggiornate nel sistema.   |
| Nominal Scenario |         1. L'Amministratore seleziona "Modifica Dispositivo" e sceglie un sensore. 2. Il sistema visualizza i dettagli del sensore. 3. L'Amministratore modifica i campi desiderati. 4. L'Amministratore conferma le modifiche. 5. Il sistema convalida i nuovi dati. 6. Il sistema aggiorna il database. 7. Il sistema visualizza un messaggio di conferma.      |
|     Variants     |        	Nessuno specificato al momento.                     |
|    Exceptions    |         E1: Tentativo di modifica di un campo non modificabile. E2: Inserimento di dati non validi. E3: Tentativo di associare a un gateway inesistente. E4: Errore durante l'aggiornamento del database.      |

#### Scenario 5.1

Modifica del Nome Descrittivo di un Sensore



|  Scenario 5.1  |                                                                            |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | L'Amministratore è autenticato e ha accesso alla gestione della topologia. Il sensore da modificare esiste. |
| Post condition |  Il nome descrittivo del sensore è stato aggiornato nel sistema.  |
|     Step#      |                                Description                                 |
|       1        |                                                                            |
|       2        |                                                                            |
|      3       |                                                                            |
|      4       |                                                                            |
|      5       |                                                                            |
|      6       |                                                                            |
|      7       |                                                                            |
|      8       |                                                                            |
|      9       |                                                                            |
|      10       |                                                                            |
|      11       |                                                                            |
|      12       |                                                                            |




### Use case 2: Visualizzazione Dati di Monitoraggio

| Actors Involved  |             Utente (Operatore, Amministratore)                                                         |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | L'utente è autenticato e possiede un token valido. Sono presenti dati di monitoraggio nel sistema. |
|  Post condition  |  I dati di monitoraggio selezionati vengono visualizzati all'utente.   |
| Nominal Scenario |         1. L'utente seleziona una rete, un gateway o un sensore. 2. Il sistema recupera le misurazioni associate. 3. Il sistema visualizza i dati.         |
|     Variants     |          V1: Visualizzazione in formato tabellare. V2: Visualizzazione in formato grafico.                      |
|    Exceptions    |         E1: Nessun dato disponibile per la selezione. E2: Errore durante il recupero dei dati dal database.                       |

##### Scenario 2.1

Visualizzazione Dati di un Sensore Specifico in Formato Tabellare

\<a scenario is a sequence of steps that corresponds to a particular execution of one use case>

\<a scenario is a more formal description of a story>

\<only relevant scenarios should be described>

|  Scenario 1.1  |                                                                            |
| :------------: | :------------------------------------------------------------------------: |
|  Precondition  | \<Boolean expression, must evaluate to true before the scenario can start> |
| Post condition |  \<Boolean expression, must evaluate to true after scenario is finished>   |
|     Step#      |                                Description                                 |
|       1        |                                                                            |
|       2        |                                                                            |
|      3       |                                                                            |
|      4       |                                                                            |
|      5       |                                                                            |
|      6       |                                                                            |
|      7       |                                                                            |
|      8       |                                                                            |
|      9       |                                                                            |
|      10       |                                                                            |
|      11       |                                                                            |
|      12       |                                                                            |


### Use case x, UCx

..

# Glossary

\<use UML class diagram to define important terms, or concepts in the domain of the application, and their relationships>

\<concepts must be used consistently all over the document, ex in use cases, requirements etc>

# System Design

\<describe here system design>

\<must be consistent with Context diagram>

# Deployment Diagram

\<describe here deployment diagram >
