# Test Report

<The goal of this document is to explain how the application was tested, detailing how the test cases were defined and what they cover>

# Contents

- [Test Report](#test-report)
- [Contents](#contents)
- [Dependency graph](#dependency-graph)
- [Integration approach](#integration-approach)
- [Tests](#tests)
- [Coverage](#coverage)
  - [Coverage of FR](#coverage-of-fr)
  - [Coverage white box](#coverage-white-box)

# Dependency graph

     <report the here the dependency graph of EzElectronics>

  ![Alt text](../risorse/dependency-graph.jpg)

# Integration approach

    <Write here the integration sequence you adopted, in general terms (top down, bottom up, mixed) and as sequence

    (ex: step1: unit A, step 2: unit A+B, step 3: unit A+B+C, etc)>

    <Some steps may  correspond to unit testing (ex step1 in ex above)>

    <One step will  correspond to API testing, or testing unit route.js>

  L’approccio adottato per l’integrazione dei moduli del progetto è di tipo bottom-up, con una progressione graduale a partire dai componenti più vicini al database fino ai livelli superiori dell’architettura. Questo ha permesso di testare e validare singolarmente ciascun livello prima della loro combinazione in flussi più complessi.

  ## User Module

| **Step** | **Livello**         | **Componenti Coinvolti**                                        | **Tipo di test**             |
|----------|---------------------|------------------------------------------------------------------|------------------------------|
| 1        | Repository / DAO     | `UserRepository.ts` + `UserDAO.ts`                              |  Unit test                  |
| 2        | Service             | `authService.ts` + `mapperService.ts`                                   |  Integration test           |
| 3        | Controller          | `userController.ts`                                                 |  Integration test           |
| 4        | Routes              | `userRoutes.ts`                                                     |  Integration test           |
| 5        | API / E2E           | Percorso completo da `Routes` al `DB`                      |  API testing / End-to-End   |

  ## Network Module

| **Step** | **Livello**         | **Componenti Coinvolti**                                        | **Tipo di test**             |
|----------|---------------------|------------------------------------------------------------------|------------------------------|
| 1        | Repository / DAO     | `NetworkRepository.ts` + `NetworkDAO.ts`                              |  Unit test                  |
| 2        | Service             | `authService.ts` + `mapperService.ts`                          |  Integration test           |
| 3        | Controller          | `networkController.ts`                                                 |  Integration test           |
| 4        | Routes              | `networkRoutes.ts`                                                     |  Integration test           |
| 5        | API / E2E           | Percorso completo da `Routes` al `DB`                      |  API testing / End-to-End   |

  ## Gateway Module

| **Step** | **Livello**         | **Componenti Coinvolti**                                        | **Tipo di test**             |
|----------|---------------------|------------------------------------------------------------------|------------------------------|
| 1        | Repository / DAO     | `GatewayRepository.ts` + `GatewayDAO.ts`                              |  Unit test                  |
| 2        | Service             | `gatewayService.ts` + `authService.ts` + `mapperService.ts`             |  Integration test           |
| 3        | Controller          | `gatewayController.ts`                                                 |  Integration test           |
| 4        | Routes              | `gatewayRoutes.ts`                                                     |  Integration test           |
| 5        | API / E2E           | Percorso completo da `Routes` al `DB`                      |  API testing / End-to-End   |

  ## Sensor Module

| **Step** | **Livello**         | **Componenti Coinvolti**                                        | **Tipo di test**             |
|----------|---------------------|------------------------------------------------------------------|------------------------------|
| 1        | Repository / DAO     | `SensorRepository.ts` + `SensorDAO.ts`                              |  Unit test                  |
| 2        | Service             | `sensorService.ts` + `authService.ts` + `mapperService.ts`        |  Integration test           |
| 3        | Controller          | `sensorController.ts`                                                 |  Integration test           |
| 4        | Routes              | `sensorRoutes.ts`                                                     |  Integration test           |
| 5        | API / E2E           | Percorso completo da `Routes` al `DB`                      |  API testing / End-to-End   |

  ## Measurement Module

| **Step** | **Livello**         | **Componenti Coinvolti**                                        | **Tipo di test**             |
|----------|---------------------|------------------------------------------------------------------|------------------------------|
| 1        | Repository / DAO     | `MeasurementRepository.ts` + `MeasurementDAO.ts`                 |  Unit test                  |
| 2        | Service             | `measurementService.ts` + `authService.ts` + `mapperService.ts`     |  Integration test           |
| 3        | Controller          | `measurementController.ts`                                      |  Integration test           |
| 4        | Routes              | `measurementRoutes.ts`                                       |  Integration test           |
| 5        | API / E2E           | Percorso completo da `Routes` al `DB`                      |  API testing / End-to-End   |


# Tests

<in the table below list the test cases defined For each test report the object tested, the test level (API, integration, unit) and the technique used to define the test case (BB/ eq partitioning, BB/ boundary, WB/ statement coverage, etc)> <split the table if needed>

| Test case name | Object(s) tested | Test level | Technique used |
| :------------: | :--------------: | :--------: | :------------: |
|                |                  |            |                |

# Coverage

## Coverage of FR

<Report in the following table the coverage of functional requirements and scenarios(from official requirements) >

| Functional Requirement or scenario | Test(s) |
| :--------------------------------: | :-----: |
|                FRx                 |         |
|                FRy                 |         |
|                ...                 |         |

## Coverage white box

Report here the screenshot of coverage values obtained with jest-- coverage
