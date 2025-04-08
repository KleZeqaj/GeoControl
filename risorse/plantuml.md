# Plantuml diagrams

## Use cases diagram

``` plantuml
@startuml
left to right direction


actor Amministratore
actor Operatore
actor Visualizzatore

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
usecase "Lettura Misurazioni" as UC18
usecase "Filtraggio Misurazioni" as UC19
usecase "Gestione Topologia" as UC20
usecase "Inserimento Dispositivi" as UC21
usecase "Modifica Topologia" as UC22
usecase "Rimozione Dispositivi" as UC23
usecase "Navigazione Dispositivi" as UC24
usecase "Generazione Token" as UC26

UC1 ..> UC11 : include
UC1 ..> UC26 : include
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
UC20 ..> UC24 : include

Visualizzatore --> UC1
Visualizzatore --> UC18
Amministratore --> UC1
Amministratore --> UC2
Amministratore --> UC14
Amministratore --> UC20
Operatore --> UC1
Operatore --> UC14
Operatore --> UC20
@enduml
```

## Class diagram

```
@startuml
class Utente{
  - email: string
  - password: string
  - tipo: Ruolo
}

enum Ruolo{
Amministratore
Operatore
Visualizzatore
}

class Token {
  - data_generazione: time
  - data_scadenza: time
}

note top of Token : il Token viene generato dopo l'autenticazione

class Network {
  - nome: string
}

class Gateway {
  - MAC: string
}

class Sensor {
  - MAC: string
}

class Misurazione {
  - temperatura: float
  - illuminazione: float
  - tempo: ISO 8601 format time
} 

class Posizione {
  - x_cord: float
  - y_cord: float
  - z_cord: float
}

Token "0..*" -- "1" Utente
Utente "Amministratore" -- "*" Utente: gestisce
Utente "Amministratore" -- "*" Network : gestisce
Utente "Operatore" -- "*" Network : gestisce
Network "1" -- "*" Gateway : contiene
Sensor "*" -- "1" Gateway : manda dati a >
Gateway "1" -- "1" Posizione: si trova in >
Sensor "1" -- "1" Posizione: si trova in >
Misurazione "*" -- "1" Sensor : generata da >
Ruolo <- Utente
@enduml
```