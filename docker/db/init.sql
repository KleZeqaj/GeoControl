CREATE DATABASE IF NOT EXISTS geocontrol_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'geocontrol_user'@'%' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON geocontrol_db.* TO 'geocontrol_user'@'%';
FLUSH PRIVILEGES;
