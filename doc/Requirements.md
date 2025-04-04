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
|  FR1  |             |
|  FR2  |             |
| FRx.. |             |

## Non Functional Requirements

\<Describe constraints on functional requirements>

|   ID    | Type (efficiency, reliability, ..) | Description | Refers to |
| :-----: | :--------------------------------: | :---------: | :-------: |
|  NFR1   |                                    |             |           |
|  NFR2   |                                    |             |           |
|  NFR3   |                                    |             |           |
| NFRx .. |                                    |             |           |

# Use case diagram and use cases

## Use case diagram

\<define here UML Use case diagram UCD summarizing all use cases, and their relationships>

\<next describe here each use case in the UCD>

### Use case 1, UC1

| Actors Involved  |                                                                      |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | \<Boolean expression, must evaluate to true before the UC can start> |
|  Post condition  |  \<Boolean expression, must evaluate to true after UC is finished>   |
| Nominal Scenario |         \<Textual description of actions executed by the UC>         |
|     Variants     |                      \<other normal executions>                      |
|    Exceptions    |                        \<exceptions, errors >                        |

##### Scenario 1.1

\<describe here scenarios instances of UC1>

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
|      ...       |                                                                            |

##### Scenario 1.2

##### Scenario 1.x

### Use case 2, UC2

..

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
