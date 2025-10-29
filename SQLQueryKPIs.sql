use KPIDB;

SELECT * FROM INFORMATION_SCHEMA.TABLES;
SELECT * FROM Login_Users;
ALTER TABLE Login_Users ADD foto VARBINARY(MAX);
SELECT * FROM scrapProcesos;
ALTER TABLE scrapProcesos ALTER COLUMN Fecha DATETIME
SELECT * FROM materialCosts;
SELECT * FROM energyConsumption;
ALTER TABLE materialCosts ALTER COLUMN fecha datetime;
DELETE FROM materialCosts WHERE id=2

INSERT INTO Login_Users (userName, password_user, [name], lastName) VALUES
('DSANTAN2', 'Budokai2020@', 'Diego', 'Santana'),
('COLAGU', 'Budokai2020@', 'Cielo', 'Olague');

UPDATE scrapProcesos SET amountProceso=600 WHERE amountProceso=348;
UPDATE scrapProcesos SET nombreProceso='Cels Ensamb Inicial' WHERE nombreProceso='Cels Ensam Final';
UPDATE materialCosts SET porcentScrap=8.4 WHERE id=1;

-- Script SQL para crear la tabla de consumo de energía
CREATE TABLE energyConsumption (
    id INT IDENTITY(1,1) PRIMARY KEY,
    fecha DATE NOT NULL,
    electricidad_consumo DECIMAL(10, 3) NOT NULL,
    electricidad_produccion INT NOT NULL,
    helio_consumo DECIMAL(10, 3) NOT NULL,
    helio_produccion INT NOT NULL
);

SELECT id, fecha, costEndItem, costScrap, porcentScrap FROM materialCosts WHERE CAST(fecha AS DATE) BETWEEN '2025-10-1' AND '2025-10-25';
SELECT (SUM(costScrap) / SUM(costEndItem) * 100) AS porcentScrap FROM materialCosts WHERE CAST(fecha AS DATE) BETWEEN '2025-10-25' AND '2025-10-25'

TRUNCATE TABLE scrapProcesos
TRUNCATE TABLE materialCosts

