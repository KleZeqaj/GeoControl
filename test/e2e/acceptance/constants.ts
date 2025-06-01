export const OK = 200;
export const CREATED = 201;
export const UPDATED_DELETED = 204;
export const BAD_REQUEST = 400;
export const UNAUTHORIZED = 401;
export const INSUFFICIENT_RIGHTS = 403;
export const NOT_FOUND = 404;
export const NOT_ALLOWED = 405;
export const CONFLICT = 409;
export const INTERNAL_SERVER_ERROR = 500;

export const OBJECT_NOT_FOUND = {
    code: 404,
    name: "NotFoundError",
}

export const OBJECT_INSUFFICIENT_RIGHTS = {
    code: 403,
    name: "InsufficientRightsError",
}

export const OBJECT_CONFLICT = {
    code: 409,
    name: "ConflictError",
}

export const NETWORK1 = {
    code: "NET01",
    name: "Alp Monitor",
    description: "Alpine Weather Monitoring Network"
};

export const NETWORK2 = {
    code: "NET02",
    name: "Beach Monitor",
    description: "Beach Weather Monitoring Network"
};

export const GW1 = {
    "macAddress": "94:3F:BE:4C:4A:79",
    "name": "GW01",
    "description": "on-field aggregation node"
}

export const GW2 = {
    "macAddress": "1C:6A:66:95:EE:45",
    "name": "GW02",
    "description": "third floor aggregation node"
}

export const USER1 = {
    "username": "s0123465",
    "password": "FR90!5g@+ni",
    "type": "admin"
}

export const SENSOR1 = {
    "macAddress": "71:B1:CE:01:C6:A9",
    "name": "TH01",
    "description": "External thermometer",
    "variable": "temperature",
    "unit": "C"
}

export const SENSOR2 = {
    "macAddress": "6a:b2:f1:ae:ee:6c",
    "name": "TH02",
    "description": "Internal thermometer",
    "variable": "temperature",
    "unit": "C"
}

export const SENSOR3 = {
    "macAddress": "71:B1:CE:01:C6:AA",
    "name": "TH02",
    "description": "External thermometer",
    "variable": "temperature",
    "unit": "C"
}

export const MEASURE1 = {
    "createdAt": "2025-02-18T16:00:00Z",
    "value": 21.8567
}

export const MEASURE2 = {
    "createdAt": "2025-02-18T16:10:00Z",
    "value": 3.141592
}

export const MEAN_VALUE = 12.499145
export const VARIANCE_VALUE = 87.5638

export const DIFFERENT_TIMEZONE_MEASUREMENTS = [
    {createdAt: "2025-02-18T09:20:00-08:00", value: 13.50},
    {createdAt: "2025-02-18T09:22:00-08:00", value: 13.2},
    {createdAt: "2025-02-18T09:24:00-08:00", value: 13.5}]

export const UTC_MEASUREMENTS_STRING_ARRAY = [
    "2025-02-18T17:20:00Z",
    "2025-02-18T17:22:00Z",
    "2025-02-18T17:24:00Z"
];

export const OUTLIER_ARRAY = [{"createdAt": "2025-02-18T16:10:00Z",
    "value": 3.0},{"createdAt": "2025-02-18T16:20:00Z",
    "value": 3.1},{"createdAt": "2025-02-18T16:30:00Z",
    "value": 3.2},{"createdAt": "2025-02-18T16:40:00Z",
    "value": 3.2},{"createdAt": "2025-02-18T16:50:00Z",
    "value": 3.3},{"createdAt": "2025-02-18T17:00:00Z",
    "value": 3.2},{"createdAt": "2025-02-18T17:10:00Z",
    "value": 200},{"createdAt": "2025-02-18T17:20:00Z",
    "value": 150},{"createdAt": "2025-02-18T17:30:00Z",
    "value": 3.2},]
