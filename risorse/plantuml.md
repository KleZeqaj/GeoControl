# Plantuml diagrams

## Use cases diagram

``` plantuml
@startuml
left to right direction

rectangle Utente {
actor Tecnico #green
actor Admin #red
actor Operator #purple
actor Viewer #blue
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

Viewer --> UC1 #blue
Viewer --> UC18 #blue
Viewer --> UC38 #blue
Admin --> UC1 #red
Admin --> UC2 #red
Admin --> UC14 #red
Admin --> UC20 #red
Admin --> UC38 #red
Operator --> UC1 #purple
Operator --> UC14 #purple
Operator --> UC20 #purple
Operator --> UC38 #purple
Tecnico --> UC20 #green
UC14 --> Gateway
UC20 --> Network
@enduml
```

## Class diagram

``` plantuml
@startuml
class Utente{
  - username: \t string
  - password: \t string
  - tipo: \t \t Ruolo
}

enum Ruolo{
Admin
Operator
Viewer
}

class Token {
  - token: \t \t \t string
  - data_generazione: \t time
}

note top of Token : il Token viene generato dopo l'autenticazione

class Network {
  - codice: \t \t string
  - nome: \t \t string
  - descrizione: \t string
}

class Gateway {
  - MAC: \t \t string
  - nome: \t \t string
  - descrizione: \t string
}

class Sensor {
  - MAC: \t \t string
  - nome: \t \t string
  - descrizione: \t string
  - variabile: \t \t string
  - unita: \t \t string
}

class Misurazione {
  - valore: \t float
  - tempo: \t ISO 8601 format time
} 


class Analisi{
  - media : \t \t \t float
  - varianza : \t \t float 
  - soglia_minima : \t float
  - soglia_massima : \t float
  - data_inizio : \t \t ISO 8601 format time
  - data_fine : \t \t ISO 8601 format time

}

class prodotta_da {
  - outlier : \t boolean
}


note "Gli Admin e gli Operator possono \ngestire tutti i Network senza limitazioni. \nIn questo diagramma viene salvato l'utente \nche ha creato i Network per tracciabilità" as N1

Token "0..*" -- "1" Utente : generato da >
Utente "Admin \n1" -- "0..*" Network : creata da <
Utente "Operator \n1" -- "0..*" Network : creata da <
Network "1" -- "*" Gateway : fa parte di <
Sensor "*" -- "1" Gateway : manda dati a >
Misurazione "*" -- "1" Sensor : generata da >
Ruolo <- Utente
Misurazione "1..*" -- "0..*" Analisi : prodotta da <
(Analisi, Misurazione) .. prodotta_da
Utente .. N1
N1 .. Network
@enduml
```

## System Design

``` plantuml
@startuml
class GeoControl_System
class GeoControl_Server
class Software
class Network
class Gateway

GeoControl_System -- GeoControl_Server
GeoControl_Server -- Software

GeoControl_System o-- "*" Network
Network o-- "*" Gateway
@enduml
```


## Deployment Diagram

``` plantuml
@startuml

node "Server_GeoControl" {
  component "GeoControl Application" {
    artifact "GeoControl.war" {
      node "Application Server" {
        component "API"
        component "Database"
      }
    }
    note "Gestisce le Reti (logiche)\n di Gateway e Sensori. \nLe regole di accesso degli \nutenti sono definite a \nlivello di rete." as N1
  }
}

node "Gateway_Devices" {
  component "Gateway Software" {
    artifact "GatewayApp.jar"
  }
  note "Appartiene a una Rete (logica). \nComunica con i sensori e il server." as N2
}

node "Sensor_Devices" {
  component "Sensor Hardware"
  note "Appartiene a una Rete \n(logica) tramite il Gateway. \nEffettua le misurazioni." as N3
}

database "Database_Server" {
  node "Database Instance" {
    component "GeoControl DB"
  }
  note "Memorizza informazioni \nsulle Reti, Gateway, \nSensori e utenti/permessi." as N4
}

node "User_Devices" {
  component "ViewerBrowser"
  component "OperatorBrowser"
  component "AdministratorBrowser"
  note "Interagiscono con l'applicazione,\ncon accesso limitato in base \nal ruolo e alla Rete." as N5
}

'Connessioni
Gateway_Devices -- Server_GeoControl : "via Rete Internet"
Sensor_Devices -- Gateway_Devices : "Connessione Seriale"
User_Devices -- Server_GeoControl : "via Rete Internet (HTTP/HTTPS)"

@enduml
```

