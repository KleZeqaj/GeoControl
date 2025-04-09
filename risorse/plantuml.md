# Plantuml diagrams

## Use cases diagram

``` plantuml
@startuml
left to right direction

rectangle Utente {
actor Amministratore #red
actor Operatore #purple
actor Visualizzatore #blue
}

rectangle Sistema {
actor Network
actor Gateway
}

usecase "Autenticazione utente" as UC1
usecase "Gestione Utenti" as UC2
usecase "Creazione Nuovo Utente" as UC8
usecase "Eliminazione Utente" as UC9
usecase "Modifica Dati Utente" as UC10
usecase "Logout" as UC11
usecase "Ricerca Utenze" as UC12
usecase "Filtraggio Utenze" as UC13
usecase "Gestione Misurazioni" as UC14
usecase "Inserimento Misurazioni" as UC15
usecase "Modifica Misurazioni" as UC16
usecase "Cancellazione Misurazioni" as UC17
usecase "Visualizzazione Misurazioni" as UC18
usecase "Filtraggio Misurazioni" as UC19
usecase "Gestione Topologia" as UC20
usecase "CRUD Network" as UC21
usecase "CRUD Gateway" as UC22
usecase "CRUD Sensori" as UC23
usecase "Creazione Network" as UC24
usecase "Visualizzazione Network" as UC25
usecase "Modifica Network" as UC26
usecase "Cancellazione Network" as UC27
usecase "Creazione Gateway" as UC28
usecase "Visualizzazione Gateway" as UC29
usecase "Modifica Gateway" as UC30
usecase "Cancellazione Gateway" as UC31
usecase "Creazione Sensore" as UC32
usecase "Visualizzazione Sensore" as UC33
usecase "Modifica Sensore" as UC34
usecase "Cancellazione Sensore" as UC35
usecase "Modifica ID univoco sensore" as UC36
usecase "Generazione Token" as UC37
usecase "Analisi statistica" as UC38
usecase "Calcolo media" as UC39
usecase "Calcolo varianza" as UC40
usecase "Calcolo threshold superiore" as UC41
usecase "Calcolo threshold inferiore" as UC42
usecase "Calcolo outlier" as UC43

UC1 .u.> UC11 : include
UC1 .d.> UC37 : include
UC2 ..> UC8 : include
UC2 ..> UC9 : include
UC2 ..> UC10 : include
UC2 ..> UC12 : include
UC12 ..> UC13 : include
UC14 ..> UC15 : include
UC14 ..> UC16 : include
UC14 ..> UC17 : include
UC14 ..> UC18 : include
UC18 ..> UC19 : include
UC20 ..> UC21 : include
UC20 ..> UC22 : include
UC20 ..> UC23 : include
UC21 ..> UC24 : include
UC21 ..> UC25 : include
UC21 ..> UC26 : include
UC21 ..> UC27 : include
UC22 ..> UC28 : include
UC22 ..> UC29 : include
UC22 ..> UC30 : include
UC22 ..> UC31 : include
UC23 ..> UC32 : include
UC23 ..> UC33 : include
UC23 ..> UC34 : include
UC23 ..> UC35 : include
UC34 ..> UC36 : include
UC38 ..> UC39 : include
UC38 ..> UC40 : include
UC38 ..> UC41 : include
UC38 ..> UC42 : include
UC38 ..> UC43 : include

Visualizzatore --> UC1 #blue
Visualizzatore --> UC18 #blue
Visualizzatore --> UC38 #blue
Amministratore --> UC1 #red
Amministratore --> UC2 #red
Amministratore --> UC14 #red
Amministratore --> UC20 #red
Amministratore --> UC38 #red
Operatore --> UC1 #purple
Operatore --> UC14 #purple
Operatore --> UC20 #purple
Operatore --> UC38 #purple
UC14 --> Gateway
UC20 --> Network
@enduml
```

## Class diagram

``` plantuml
@startuml
class Utente{
  - username: string
  - password: string
  - tipo: Ruolo
}

enum Ruolo{
Amministratore
Operatore
Visualizzatore
}

class Token {
  - token: string
  - data_generazione: time
  - data_scadenza: time
}

note top of Token : il Token viene generato dopo l'autenticazione

class Network {
  - codice: string
  - nome: string
  - descrizione: string
}

class Gateway {
  - MAC: string
  - nome: string
  - descrizione: string
}

class Sensor {
  - MAC: string
  - nome: string
  - descrizione: string
  - variabile: string
  - unita: string
}

class Misurazione {
  - valore: float
  - tempo: ISO 8601 format time
} 


class Analisi{
  - media : float
  - varianza : float 
  - soglia_minima : float
  - soglia_massima : float
  - data_inizio : ISO 8601 format time
  - data_fine : ISO 8601 format time

}

class Outlier {
  - outlier : boolean
}


note "Gli amministratori e gli operatori possono \ngestire tutti i network senza limitazioni. \nIn questo diagramma viene salvato l'utente \nche ha creato i network per tracciabilità" as N1

Token "0..*" -- "1" Utente
Utente "Amministratore \n1" -- "0..*" Network : creata da <
Utente "Operatore \n1" -- "0..*" Network : creata da <
Network "1" -- "*" Gateway : fa parte di <
Sensor "*" -- "1" Gateway : manda dati a >
Misurazione "*" -- "1" Sensor : generata da >
Ruolo <- Utente
Misurazione "1..*" -- "0..*" Analisi
(Analisi, Misurazione) .. Outlier
Utente .. N1
N1 .. Network
@enduml
```