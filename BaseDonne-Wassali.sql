CREATE DATABASE  IF NOT EXISTS `wassali-backend` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `wassali-backend`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: wassali-backend
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `client`
--

DROP TABLE IF EXISTS `client`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client` (
  `id_client` int(11) NOT NULL,
  `type_client` enum('particulier','entreprise') DEFAULT 'particulier',
  PRIMARY KEY (`id_client`),
  CONSTRAINT `fk_client_user` FOREIGN KEY (`id_client`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client`
--

LOCK TABLES `client` WRITE;
/*!40000 ALTER TABLE `client` DISABLE KEYS */;
/*!40000 ALTER TABLE `client` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `colis`
--

DROP TABLE IF EXISTS `colis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colis` (
  `id_colis` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(255) DEFAULT NULL,
  `poids` float(6,2) DEFAULT NULL,
  `statut` enum('attente','ramassé','en_route','livré','annulé') DEFAULT 'attente',
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_livraison_estimee` datetime DEFAULT NULL,
  `id_client` int(11) NOT NULL,
  `id_vendeur` int(11) NOT NULL,
  `id_coursier` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_colis`),
  KEY `fk_colis_client` (`id_client`),
  KEY `fk_colis_vendeur` (`id_vendeur`),
  KEY `fk_colis_coursier` (`id_coursier`),
  CONSTRAINT `fk_colis_client` FOREIGN KEY (`id_client`) REFERENCES `client` (`id_client`),
  CONSTRAINT `fk_colis_coursier` FOREIGN KEY (`id_coursier`) REFERENCES `coursier` (`id_coursier`),
  CONSTRAINT `fk_colis_vendeur` FOREIGN KEY (`id_vendeur`) REFERENCES `vendeur` (`id_vendeur`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colis`
--

LOCK TABLES `colis` WRITE;
/*!40000 ALTER TABLE `colis` DISABLE KEYS */;
/*!40000 ALTER TABLE `colis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coursier`
--

DROP TABLE IF EXISTS `coursier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coursier` (
  `id_coursier` int(11) NOT NULL,
  `vehicule` varchar(50) DEFAULT NULL,
  `disponibilite` tinyint(1) DEFAULT 1,
  `latitude_actuelle` float(10,8) DEFAULT NULL,
  `longitude_actuelle` float(11,8) DEFAULT NULL,
  PRIMARY KEY (`id_coursier`),
  CONSTRAINT `fk_coursier_user` FOREIGN KEY (`id_coursier`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coursier`
--

LOCK TABLES `coursier` WRITE;
/*!40000 ALTER TABLE `coursier` DISABLE KEYS */;
/*!40000 ALTER TABLE `coursier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id_notification` int(11) NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `date_envoi` timestamp NOT NULL DEFAULT current_timestamp(),
  `lu` tinyint(1) DEFAULT 0,
  `id_user` int(11) NOT NULL,
  PRIMARY KEY (`id_notification`),
  KEY `fk_notif_user` (`id_user`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suivi_colis`
--

DROP TABLE IF EXISTS `suivi_colis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suivi_colis` (
  `id_suivi` int(11) NOT NULL AUTO_INCREMENT,
  `id_colis` int(11) NOT NULL,
  `latitude` float(10,8) NOT NULL,
  `longitude` float(11,8) NOT NULL,
  `date_position` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_suivi`),
  KEY `fk_suivi_colis` (`id_colis`),
  CONSTRAINT `fk_suivi_colis` FOREIGN KEY (`id_colis`) REFERENCES `colis` (`id_colis`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suivi_colis`
--

LOCK TABLES `suivi_colis` WRITE;
/*!40000 ALTER TABLE `suivi_colis` DISABLE KEYS */;
/*!40000 ALTER TABLE `suivi_colis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id_user` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(50) NOT NULL,
  `prenom` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `adresse` varchar(100) DEFAULT NULL,
  `role` enum('admin','vendeur','coursier','client') NOT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendeur`
--

DROP TABLE IF EXISTS `vendeur`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendeur` (
  `id_vendeur` int(11) NOT NULL,
  `nom_entreprise` varchar(100) DEFAULT NULL,
  `adresse_entreprise` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id_vendeur`),
  CONSTRAINT `fk_vendeur_user` FOREIGN KEY (`id_vendeur`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendeur`
--

LOCK TABLES `vendeur` WRITE;
/*!40000 ALTER TABLE `vendeur` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendeur` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-07 11:35:17
