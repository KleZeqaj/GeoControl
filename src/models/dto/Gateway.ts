/* tslint:disable */
/* eslint-disable */
/**
 * GeoControl API
 * **GeoControl System Overview**  GeoControl is a software system designed for monitoring physical and environmental variables in various contexts: from hydrogeological analyses of mountain areas to the surveillance of historical buildings, and even the control of internal parameters (such as temperature or lighting) in residential or working environments.   It was commissioned by the Union of Mountain Communities of the Piedmont region for managing the hydrogeological state of its territories. However, thanks to its modular structure, GeoControl has also been commercialized to different public or private entities requiring continuous monitoring of physical parameters.   The system meets high reliability requirements and must ensure that no more than six measurements per year, per sensor, are lost. From an organizational perspective, GeoControl uses a token-based authentication mechanism, with different user roles to regulate access levels to the functionalities.  ---  **Hierarchical Structure and Components**  GeoControl’s hierarchy is organized into three main levels:  1. **Network**      - A logical grouping that acts as a container for multiple gateways (and their associated sensors).      - Identified by a unique alphanumeric code (chosen at creation time) and can represent, for example, a monitoring network for a single municipality or an entire building.      - Does not correspond to a physical device but is instead a software definition to organize and manage different groups of devices.  2. **Gateway**      - A physical device uniquely identified by its MAC address, equipped with a network interface and connected through it to the GeoControl system.      - Connected to one or more sensors via serial interfaces, through which it receives measured values and timestamps.      - Performs the digital conversion of data from the sensors and transmits them over the network.  3. **Sensor**      - The physical device that actually measures the physical quantity (temperature, inclination, etc.) every 10 minutes.      - Lacks its own network interface but is uniquely identified by its MAC address (e.g., 71:B1:CE:01:C6:A9).      - Communicates exclusively with its reference gateway via a serial connection, sending the measured value and a timestamp.      - The timestamp corresponds to the exact moment of measurement. Sensors send the date to the system in **ISO 8601 format with their local timezone**.  This structure allows for an accurate modeling of field devices, maintaining a precise correspondence between physical entities and the software representation. The GeoControl system, installed on a server, receives sensor measurements from the gateways and manages their storage, analysis, and retrieval.  ---  **Main Functionalities**  Below are the main functionalities provided by GeoControl, aligned with the system’s main areas:  1. **Authentication and User Management**      - The system requires login credentials (username and password) and issues a token to be included in the `Authorization` header of subsequent requests.      - The *Admin* role has full access to all resources, including user and network management.      - The *Operator* role can manage networks, gateways, sensors, and insert measurements, but does not have access to user-related functionalities.      - The *Viewer* role can only consult data (read-only operations on networks, gateways, and sensors, as well as measurements), and does not have access to user information.  2. **Topology Management and Synchronization**      - Creation, updating, and removal of networks, gateways, and sensors, reflecting any field changes (new devices, replacements, decommissioning, etc.).      - Unique identification of elements (code for networks, MAC address for gateways and sensors).  3. **Measurement Collection and Storage**      - The system records all measurements received from the gateways, associating them with the correct sensors.      - Each measurement includes a numeric value and the timestamp. **The system converts and stores the timestamp in ISO 8601 format using the UTC timezone.** When retrieving data, the system always returns timestamps in UTC, allowing clients to convert them to their local timezone if needed.       Example:          - Sensor sends: \"2025-02-18T15:30:00+01:00\" (Sensor\'s local timezone: UTC+1)         - System stores: \"2025-02-18T14:30:00Z\" (Converted to UTC)         - System returns: \"2025-02-18T14:30:00Z\"         - Client can convert it back to local timezone if needed: \"2025-02-18T15:30:00+01:00\"  4. **Calculations and Statistical Analysis**      - The system must be able to compute:        - **Mean** (μ) and **variance** (σ²) of measurements over a given time span.        - **Thresholds** (upper and lower) to identify potential anomalous values, calculated as:         ```        upperThreshold = μ + 2σ        lowerThreshold = μ - 2σ        ```       - **Outlier**: any value exceeding the upper threshold or dropping below the lower threshold is considered anomalous and is flagged accordingly as an outlier. 
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import type { Sensor } from './Sensor';
import {
    SensorFromJSON,
    SensorFromJSONTyped,
    SensorToJSON,
    SensorToJSONTyped,
} from './Sensor';

/**
 * 
 * @export
 * @interface Gateway
 */
export interface Gateway {
    /**
     * Unique identifier for the gateway (MAC address)
     * @type {string}
     * @memberof Gateway
     */
    macAddress?: string;
    /**
     * Name of the gateway
     * @type {string}
     * @memberof Gateway
     */
    name?: string;
    /**
     * Description of the gateway
     * @type {string}
     * @memberof Gateway
     */
    description?: string;
    /**
     * 
     * @type {Array<Sensor>}
     * @memberof Gateway
     */
    sensors?: Array<Sensor>;
}

/**
 * Check if a given object implements the Gateway interface.
 */
export function instanceOfGateway(value: object): value is Gateway {
    return true;
}

export function GatewayFromJSON(json: any): Gateway {
    return GatewayFromJSONTyped(json, false);
}

export function GatewayFromJSONTyped(json: any, ignoreDiscriminator: boolean): Gateway {
    if (json == null) {
        return json;
    }
    return {
        
        'macAddress': json['macAddress'] == null ? undefined : json['macAddress'],
        'name': json['name'] == null ? undefined : json['name'],
        'description': json['description'] == null ? undefined : json['description'],
        'sensors': json['sensors'] == null ? undefined : ((json['sensors'] as Array<any>).map(SensorFromJSON)),
    };
}

export function GatewayToJSON(json: any): Gateway {
    return GatewayToJSONTyped(json, false);
}

export function GatewayToJSONTyped(value?: Gateway | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'macAddress': value['macAddress'],
        'name': value['name'],
        'description': value['description'],
        'sensors': value['sensors'] == null ? undefined : ((value['sensors'] as Array<any>).map(SensorToJSON)),
    };
}

