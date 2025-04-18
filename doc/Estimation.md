# Project Estimation

Date: 19/04/2025

Version: 1.0

# Estimation approach

Consider the GeoControl project as described in the swagger, assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch

# Estimate by size

###

|                                                                                                         | Estimate |
| ------------------------------------------------------------------------------------------------------- | -------- |
| NC = Estimated number of classes to be developed                                                        |     15     | 
| A = Estimated average size per class, in LOC                                                            |       160   |
| S = Estimated size of project, in LOC (= NC \* A)                                                       |    2400      |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)                    |     240     |
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro)                                     |     7200     |
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |     0,75     |

# Estimate by product decomposition

###

| component name       | Estimated effort (person hours) |
| -------------------- | ------------------------------- |
| requirement document |               50                |
| design document      |               40                |
| code                 |              240                |
| unit tests           |              40                 |
| api tests            |              25                 |
| management documents |              10                 |

# Estimate by activity decomposition

###

| Activity name | Estimated effort (person hours) |
| ------------- | ------------------------------- |
| Business Model & Stakeholders & Context Diagram & Interfaces |    6ph      |
| Stories and Personas & Functional Requirements & Non-Functional Requirements  |    18ph         |
| Use Cases Diagram and Use Cases & Glossary & System Design & Deployment Diagram |    25ph       |
| Design |    40ph    |
| Implementation |    240ph    |
| Testing |    65ph    |
| Dockerization |    15ph    |

###

Insert here Gantt chart with above activities

![Alt text](../risorse/Gantt-1.png)
![Alt text](../risorse/Gantt-2.png)
![Alt text](../risorse/Gantt-3.png)
![Alt text](../risorse/Gantt-4.png)
![Alt text](../risorse/Gantt-5.png)

### Milestones
M1: Requirements Document -> Dipendenze: T1.1 - T1.12\
M2: Design Document -> Dipendenze: T2.1 - T2.2\
M3: Development -> Dipendenze: T2.3\
M4: Validation & Verification -> Dipendenze: T3.1 - T3.3\
M5: Dockerization -> Dipendenze: T4.1

### Deliverables

D1.1 - Business Model Paragraph\
D1.2 - Stakeholders \
D1.3 - Context-Diagram\
D1.4 - Interfaces\
D1.5 - Stories and Personas Paragraph\
D1.6 - Functional Requirements\
D1.7 - Non-Functional Requirements\
D1.8 - Use Cases Diagram and Use Cases Paragraph\
D1.9 - Glossary\
D1.10 - System Design Diagram\
D1.11 - Deployment Diagram\
D1.12 - Estimation Document

D2.1 - Architectural patterns\
D2.2 - Design Document\
D2.2.1 - Package Diagram\
D2.2.2 - Class Diagram\
D2.3 - GeoControl Source Code

D3.1 - Test Design\
D3.2 - Validation Results\
D3.3 - Updated Source Code

D4.1 - Dockerized Project


# Summary

Report here the results of the three estimation approaches. The estimates may differ. Discuss here the possible reasons for the difference

|                                    | Estimated effort | Estimated duration |
| ---------------------------------- | ---------------- | ------------------ |
| estimate by size                   |        240ph       | 0,75 weeks|
| estimate by product decomposition  |      405ph            | 2,53 weeks |
| estimate by activity decomposition |      409ph            | 2,55 weeks |

Nota: nel calcolo dell'estimate by size abbiamo tenuto conto unicamente delle linee di codice, dal momento che ci siamo attenuti alle formule fornite (considerando quindi le classi).
