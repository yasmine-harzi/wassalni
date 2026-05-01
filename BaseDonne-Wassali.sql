-- ============================================================
--  WASSALI — Script complet de la base de données
--  Généré le : 2026-04-24
--  Charset   : utf8mb4 | Moteur : InnoDB
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS `wassali-backend`;
CREATE DATABASE `wassali-backend`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `wassali-backend`;

-- ============================================================
-- 1. TABLE : users
--    Table centrale — tous les acteurs du système héritent d'ici
-- ============================================================
CREATE TABLE `users` (
  `id_user`       int(11)       NOT NULL AUTO_INCREMENT,
  `nom`           varchar(50)   NOT NULL,
  `prenom`        varchar(50)   NOT NULL,
  `email`         varchar(100)  NOT NULL,
  `password`      varchar(255)  NOT NULL,
  `telephone`     varchar(20)   DEFAULT NULL,
  `adresse`       varchar(100)  DEFAULT NULL,
  `role`          enum('admin','vendeur','coursier','client') NOT NULL,
  `date_creation` timestamp     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active`     tinyint(1)    DEFAULT 1,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. TABLE : compte
--    Identifiants de connexion (séparés du profil)
-- ============================================================
CREATE TABLE `compte` (
  `id_compte`  int(11)      NOT NULL AUTO_INCREMENT,
  `email`      varchar(100) NOT NULL,
  `password`   varchar(255) NOT NULL,
  `is_active`  tinyint(1)   DEFAULT 1,
  PRIMARY KEY (`id_compte`),
  UNIQUE KEY `uq_compte_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. TABLE : profile
--    Informations personnelles liées à un compte
-- ============================================================
CREATE TABLE `profile` (
  `id_profile` int(11)      NOT NULL AUTO_INCREMENT,
  `id_compte`  int(11)      NOT NULL,
  `nom`        varchar(50)  NOT NULL,
  `prenom`     varchar(50)  NOT NULL,
  `telephone`  varchar(20)  DEFAULT NULL,
  `adresse`    varchar(100) DEFAULT NULL,
  `role`       enum('admin','vendeur','coursier','client') NOT NULL,
  PRIMARY KEY (`id_profile`),
  CONSTRAINT `fk_profile_compte`
    FOREIGN KEY (`id_compte`) REFERENCES `compte` (`id_compte`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. TABLE : administrateur
-- ============================================================
CREATE TABLE `administrateur` (
  `id_admin`        int(11)      NOT NULL AUTO_INCREMENT,
  `nom_departement` varchar(100) DEFAULT NULL,
  `id_user`         int(11)      NOT NULL,
  PRIMARY KEY (`id_admin`),
  CONSTRAINT `fk_admin_user`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. TABLE : client
-- ============================================================
CREATE TABLE `client` (
  `id_client`   int(11) NOT NULL AUTO_INCREMENT,
  `type_client` enum('particulier','entreprise') DEFAULT 'particulier',
  `id_user`     int(11) NOT NULL,
  PRIMARY KEY (`id_client`),
  CONSTRAINT `fk_client_user`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. TABLE : vendeur
-- ============================================================
CREATE TABLE `vendeur` (
  `id_vendeur`        int(11)      NOT NULL AUTO_INCREMENT,
  `nom_entreprise`    varchar(100) DEFAULT NULL,
  `adresse_entreprise`varchar(150) DEFAULT NULL,
  `id_user`           int(11)      NOT NULL,
  PRIMARY KEY (`id_vendeur`),
  CONSTRAINT `fk_vendeur_user`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. TABLE : coursier
-- ============================================================
CREATE TABLE `coursier` (
  `id_coursier`       int(11)      NOT NULL AUTO_INCREMENT,
  `vehicule`          varchar(50)  DEFAULT NULL,
  `disponibilite`     tinyint(1)   DEFAULT 1,
  `latitude_actuelle` float(10,8)  DEFAULT NULL,
  `longitude_actuelle`float(11,8)  DEFAULT NULL,
  `id_user`           int(11)      NOT NULL,
  PRIMARY KEY (`id_coursier`),
  CONSTRAINT `fk_coursier_user`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. TABLE : colis
-- ============================================================
CREATE TABLE `colis` (
  `id_colis`      int(11)      NOT NULL AUTO_INCREMENT,
  `description`   varchar(255) DEFAULT NULL,
  `poids`         float(6,2)   DEFAULT NULL,
  `statut`        enum('attente','ramassé','en_route','livré','annulé') NOT NULL DEFAULT 'attente',
  `date_creation` timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_client`     int(11)      NOT NULL,
  `id_vendeur`    int(11)      NOT NULL,
  `id_coursier`   int(11)      DEFAULT NULL,
  PRIMARY KEY (`id_colis`),
  CONSTRAINT `fk_colis_client`
    FOREIGN KEY (`id_client`)   REFERENCES `client`   (`id_client`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_colis_vendeur`
    FOREIGN KEY (`id_vendeur`)  REFERENCES `vendeur`  (`id_vendeur`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_colis_coursier`
    FOREIGN KEY (`id_coursier`) REFERENCES `coursier` (`id_coursier`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. TABLE : suivi_colis
-- ============================================================
CREATE TABLE `suivi_colis` (
  `id_suivi`      int(11)      NOT NULL AUTO_INCREMENT,
  `id_colis`      int(11)      NOT NULL,
  `latitude`      float(10,8)  DEFAULT NULL,
  `longitude`     float(11,8)  DEFAULT NULL,
  `date_position` timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_suivi`),
  CONSTRAINT `fk_suivi_colis`
    FOREIGN KEY (`id_colis`) REFERENCES `colis` (`id_colis`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. TABLE : notifications
-- ============================================================
CREATE TABLE `notifications` (
  `id_notification` int(11)    NOT NULL AUTO_INCREMENT,
  `message`         text       DEFAULT NULL,
  `date_envoi`      timestamp  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lu`              tinyint(1) DEFAULT 0,
  `id_user`         int(11)    NOT NULL,
  PRIMARY KEY (`id_notification`),
  CONSTRAINT `fk_notif_user`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- RÉACTIVATION DES CLÉS ÉTRANGÈRES
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DONNÉES DE TEST (optionnel — à commenter en production)
-- ============================================================

-- Un admin
INSERT INTO `users` (nom, prenom, email, password, role)
VALUES ('Admin', 'Wassali', 'admin@wassali.tn', SHA2('admin1234', 256), 'admin');

INSERT INTO `administrateur` (nom_departement, id_user)
VALUES ('Direction générale', 1);

-- Un vendeur
INSERT INTO `users` (nom, prenom, email, password, telephone, adresse, role)
VALUES ('Boughattas', 'Yosra', 'yosra@wassali.tn', SHA2('vendeur1234', 256), '+216 20 000 001', 'Tunis', 'vendeur');

INSERT INTO `vendeur` (nom_entreprise, adresse_entreprise, id_user)
VALUES ('BG Shop', '12 Rue du Commerce, Tunis', 2);

-- Un client
INSERT INTO `users` (nom, prenom, email, password, telephone, adresse, role)
VALUES ('Ben Salah', 'Ali', 'ali@gmail.com', SHA2('client1234', 256), '+216 20 111 111', 'Sfax', 'client');

INSERT INTO `client` (type_client, id_user)
VALUES ('particulier', 3);

-- Un coursier
INSERT INTO `users` (nom, prenom, email, password, telephone, role)
VALUES ('Trabelsi', 'Sana', 'sana@wassali.tn', SHA2('coursier1234', 256), '+216 20 222 222', 'coursier');

INSERT INTO `coursier` (vehicule, disponibilite, id_user)
VALUES ('Moto', 1, 4);

-- Un colis test
INSERT INTO `colis` (description, poids, statut, id_client, id_vendeur, id_coursier)
VALUES ('Smartphone Samsung', 0.5, 'attente', 1, 1, NULL);

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================