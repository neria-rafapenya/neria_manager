-- MySQL dump 10.13  Distrib 9.6.0, for macos26.2 (arm64)
--
-- Host: trolley.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_password_resets`
--

DROP TABLE IF EXISTS `admin_password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_password_resets` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tokenHash` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `expiresAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `usedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_password_resets`
--

LOCK TABLES `admin_password_resets` WRITE;
/*!40000 ALTER TABLE `admin_password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `username` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(160) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'admin',
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `passwordHash` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `mustChangePassword` tinyint(1) NOT NULL DEFAULT '1',
  `language` varchar(8) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'es',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES ('2305bd7e-3db3-4458-970c-4a7c010e6451','admin','Rafa','rafa@rafapenya.com','admin','active','2026-02-09 10:42:30','2026-02-15 22:15:47','b22a5bd17ccfe5903604e14a3870ff44247348528df9bf84d6424e5f71cc74cc',0,'en'),('706390f9-bd96-44cc-8122-17febed362bf','normal','Persona Normal','personanormal@persona.com','editor','active','2026-02-09 16:01:55','2026-02-09 16:14:55','b22a5bd17ccfe5903604e14a3870ff44247348528df9bf84d6424e5f71cc74cc',0,'es'),('77d0b51c-6e00-4884-bffc-a2d8a2c38c7e','andreu','Andreu Ciutat','andreu@softecnia.es','admin','active','2026-02-15 11:13:38','2026-02-15 11:13:38','3319be3a6fc443dcc7f95b8e23cfe25dcb25b2c42b67fdc4bb8774308071f545',1,'es');
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_keys`
--

DROP TABLE IF EXISTS `api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_keys` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `name` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `hashedKey` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_keys`
--

LOCK TABLES `api_keys` WRITE;
/*!40000 ALTER TABLE `api_keys` DISABLE KEYS */;
INSERT INTO `api_keys` VALUES ('40ff37e0-6196-4899-8abc-480dc0a8f441','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','Servicio Chatbot Ticketing','dd72c8b93fd032ff34aa642fa8d72287678261b3d347b8c28a99736215908957','active','2026-02-13 11:47:33'),('6171013e-09a1-11f1-81e5-5a0d05a37ed2','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','API Miralles Chatbot','45f7baff42935396192bbe240779143f7e659832938751b658939d4bc58f2aa4','active','2026-02-14 12:33:35'),('751eb828-dc57-411a-a051-98e84bd7ff2f',NULL,'cliente-acme','0588d9e0aa3117bc875d49ad1c43730801687e72520c11c2f9f7fc759c10658e','active','2026-02-08 18:21:11'),('76bb32df-46f8-4fee-a2ea-a17d35603024',NULL,'backoffice','ea10032e41868989ee5269c7f5dbff1de9a284b5204293ef2a7888c0837cd1ae','active','2026-02-08 12:28:46'),('a6e9689f-4268-4bf9-9cac-d39ffd95ae09','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','Servicio Chatbot SQL','36e4d108b2ba0c73e374190fdac723c83f96fdb93aa2e397ba0bdcf563fc04fb','active','2026-02-14 19:47:59'),('f9203178-c677-4227-aa8f-a9e9ab8a4a7d','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','Api produccion Miralles','1a9b4997d404d23ab0626f8c09dda7a401ef152d71d710803d606a813fdf0190','active','2026-02-12 19:17:43');
/*!40000 ALTER TABLE `api_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_events`
--

DROP TABLE IF EXISTS `audit_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_events` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `action` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `audit_events_chk_1` CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_events`
--

LOCK TABLES `audit_events` WRITE;
/*!40000 ALTER TABLE `audit_events` DISABLE KEYS */;
INSERT INTO `audit_events` VALUES ('03091140-5bba-4fb0-ba7d-e8ad5ee63359','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:41:51'),('1bdbe976-8a26-4e91-8dd6-d28bac576f75','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4o-mini\"}','2026-02-14 19:53:38'),('1f54b4f1-e2d1-4edb-8286-432fe58f7dc5','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:44:37'),('22a1bb38-127b-4bab-88e3-161bf265679a','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 20:20:34'),('22e783c5-cf14-4799-b9f1-35dac085ab13','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 20:03:46'),('2d175691-20f9-4764-88e8-7d4be33ae58c','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 20:11:59'),('34268ca9-a907-4729-9add-e8b51907f067','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:47:02'),('40375219-056d-433e-afcb-941c4bb6570b','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:39:51'),('40e6681a-9285-439c-8ba0-9c901975d1f7','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:32:51'),('52ea191c-50a8-400b-be36-945456de6ad6','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:39:37'),('53dd7e9f-aa7f-4ae0-af96-f2fd0223039f','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:44:02'),('55f95f8c-458a-4b04-9ac6-2f4ee26aae52','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:35:21'),('64cf46a7-6223-4191-ad3f-2baf7ac4a8ca','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:30:47'),('6bd2d934-4887-40d6-bdd3-ca532d66a62d','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 20:21:33'),('743fe100-53e3-41c3-b3c8-53a5b96f62a1','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 22:15:40'),('79e7fad6-f654-4bb9-b0ac-ada21fd7b5bf','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:35:55'),('8e463949-90b5-400d-81b3-6a66f3f43838','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4o-mini\"}','2026-02-13 17:08:54'),('9a3913eb-cf2c-4fca-9f6a-e96c3590b60a','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-12 19:36:48'),('a8bd7ba7-cc52-40bc-8f7c-bdd8b3f03cbc','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:37:04'),('ab66f0f7-190c-47f5-a2a9-571827e5a4d4','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:34:11'),('ba728084-e4dc-43ff-b60b-b2ba1a7023b5','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-17 17:01:50'),('bfb1f6d7-b9d5-4ab1-a3cc-32118b82d24f','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 20:23:38'),('c8ad4224-9001-4c1a-91be-e0e315c7c348','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 22:00:47'),('cbd76530-7e23-419c-824f-d581db05cf96','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:25:15'),('d8884456-199e-4036-995b-2b28d70c9bf9','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:32:44'),('df4345ed-3027-4fe4-bf95-cb069c3f150e','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 20:11:41'),('f6a409df-f8d1-4e6c-a17b-607eba8310c2','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','runtime.execute','accepted','{\"providerId\":\"500672f6-0365-4cae-a026-129f871875f9\",\"model\":\"gpt-4.1-mini\"}','2026-02-14 21:40:38');
/*!40000 ALTER TABLE `audit_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_conversations`
--

DROP TABLE IF EXISTS `chat_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_conversations` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `providerId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `model` varchar(128) COLLATE utf8mb4_general_ci NOT NULL,
  `serviceCode` varchar(64) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'chat_generic',
  `title` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `apiKeyId` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_conversations`
--

LOCK TABLES `chat_conversations` WRITE;
/*!40000 ALTER TABLE `chat_conversations` DISABLE KEYS */;
INSERT INTO `chat_conversations` VALUES ('24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql','hola amigo','e2d46057-0642-421d-9092-3b4daca64bd5','2026-02-14 20:03:45','2026-02-14 22:15:40'),('b2a9cf62-9899-4932-9534-7eb1d0d26e72','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d743b58b-ddbe-401c-806f-0c9209f05cf4','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat-sql','dameu ngolf','e2d46057-0642-421d-9092-3b4daca64bd5','2026-02-17 17:01:31','2026-02-17 17:01:50');
/*!40000 ALTER TABLE `chat_conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `conversationId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `role` varchar(16) COLLATE utf8mb4_general_ci NOT NULL,
  `content` text COLLATE utf8mb4_general_ci NOT NULL,
  `tokensIn` int NOT NULL DEFAULT '0',
  `tokensOut` int NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES ('03194a14-d77e-4f49-9cba-efee211fc654','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','busca un coche de 2009',0,0,'2026-02-14 20:38:13'),('09682578-756b-4c41-b74a-29d2fd076de9','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','sí, hazlo',0,0,'2026-02-14 21:32:49'),('12cf9e28-3e6c-4dc4-b89f-e5761924e7ab','b2a9cf62-9899-4932-9534-7eb1d0d26e72','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d743b58b-ddbe-401c-806f-0c9209f05cf4','system','Eres el asistente del servicio {{SERVICE_CODE}}. \nTu prioridad es responder con información verificada.\n\nSi una pregunta requiere datos actualizados o específicos, utiliza los ENDPOINTS disponibles.\nSi hay endpoints, consulta primero la fuente adecuada y responde con los datos obtenidos.\nSi no hay endpoints o no aportan datos, responde con la información disponible y avisa si falta contexto.\n\nLímites:\n- No respondas preguntas fuera del dominio del servicio.\n- No inventes datos ni completes con suposiciones.\n- Si la pregunta no se puede responder usando los endpoints o el contexto definido, di claramente: \n  “No puedo responder a eso porque no está en mi ámbito de datos.”\n\nNo des consejos legales, médicos o financieros. \nNo reveles claves, credenciales ni información sensible.\n\nÁmbito permitido: base de datos, SQL, tablas, consultas, esquema, coches, vehículos, productos\nRespuesta fuera de ámbito: No tengo información para responder a esa pregunta.\n\nCuando haya endpoints disponibles, NO pidas confirmación ni anuncies la búsqueda. Consulta y responde directamente con los datos.\nNo anuncies búsquedas ni pidas confirmación. Consulta los endpoints y responde directamente con los datos.',0,0,'2026-02-17 17:01:32'),('1c9ecea8-6709-46a6-a825-f08ef917c2c6','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','Voy a buscar coches Volkswagen del año 2018 disponibles para ti. Un momento por favor.',857,19,'2026-02-14 21:39:37'),('1f3ba49b-ee91-4763-8817-3e0973b25294','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','¿Quieres que busque coches Ford del año 2018? Confirmame para proceder con la búsqueda.',768,21,'2026-02-14 21:32:44'),('24945d8f-2ae0-4270-a4eb-6ba50fc60e88','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No tengo información para responder a esa pregunta.',0,0,'2026-02-14 21:20:58'),('24d27277-1d26-4748-9266-34b144f4388a','b2a9cf62-9899-4932-9534-7eb1d0d26e72','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d743b58b-ddbe-401c-806f-0c9209f05cf4','user','quiero un coche de 2019',0,0,'2026-02-17 17:01:42'),('286902e2-5dd7-4447-9d64-e6ee6fc2e8b5','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','Para buscar coches Ford del año 2018 disponibles, necesito consultar la base de datos de productos. Procedo con la búsqueda. Un momento por favor.',776,31,'2026-02-14 21:32:51'),('29a0971e-e002-48d1-945a-e6ba6c4a5c51','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','system','eres un chatbot amable',0,0,'2026-02-14 20:03:45'),('2d206026-2932-41c9-beea-f90c80a57c27','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','necesito un ford del 2019',0,0,'2026-02-14 21:27:53'),('3167dd23-dc9e-4c3d-928d-e9c7f387a729','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No he podido acceder a la fuente de datos ahora mismo. Revisa la configuración del endpoint.',0,0,'2026-02-14 22:03:47'),('33706f8b-e26f-4880-a63f-ba54ac97073c','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','quiero un volkswagen de 2019',0,0,'2026-02-14 21:41:51'),('34a55727-7ff7-41e0-8d88-d42e5f5be61e','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','quiero un coche de 2021',0,0,'2026-02-14 21:22:19'),('40499ed6-e75e-43fc-8c03-78bae843c0f8','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','hola amigo',0,0,'2026-02-14 20:03:45'),('4817a4fe-3a46-43d5-b603-22a36ad7a9e5','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','Skeletor es el principal villano en la serie de dibujos animados y franquicia de juguetes \"He-Man y los Amos del Universo\". Es el enemigo mortal de He-Man y gobierna desde la fortaleza conocida como la Fortaleza de la Soledad. Skeletor es conocido por su rostro calavérico y su poderosa magia oscura, y su objetivo principal es conquistar el castillo de Grayskull para obtener un poder supremo que le permita dominar el planeta Eternia.\n\n¿Quieres saber más detalles sobre Skeletor o sobre la serie en general?',690,116,'2026-02-14 20:21:33'),('4ac190d7-e4f9-4f01-8771-74fc1a4b4d96','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','un ford',0,0,'2026-02-14 21:25:27'),('4c227e0f-685a-481d-9747-9d51768c50bf','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','dime quien es espinete',0,0,'2026-02-14 20:27:52'),('4c6726fa-746f-40be-b0b2-d940cc26da2d','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','quiero un volkswagen de 2018',0,0,'2026-02-14 21:39:35'),('4c8d03a0-9de7-4990-85b5-035e04c3f72a','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No tengo información para responder a esa pregunta.',0,0,'2026-02-14 21:22:57'),('5340095c-c5fe-4ca5-bf47-af829819ee7b','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','necesito un cche de 2019',0,0,'2026-02-14 21:19:31'),('54c64418-3b9a-4673-bc4b-7e9f0ced3ef3','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','Estoy consultando coches Volkswagen del año 2020 disponibles para ti. Un momento.',849,17,'2026-02-14 21:37:04'),('56ad126c-be7e-4db2-a0b2-4661fe93108e','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','Felipe II fue un rey de España que reinó desde 1556 hasta 1598. Es una de las figuras más importantes de la historia española y europea. Durante su reinado, el Imperio Español alcanzó su máxima extensión, incluyendo territorios en América, Asia, Europa y África. \n\nFelipe II también es conocido por su fuerte defensa del catolicismo, su enfrentamiento con Inglaterra — incluyendo la famosa derrota de la Armada Invencible en 1588 — y por trasladar la capital de España a Madrid. Su gobierno estuvo marcado por la centralización del poder y una intensa actividad política y militar.\n\nSi quieres, puedo contarte más detalles sobre su vida y su época. ¿Te gustaría?',108,146,'2026-02-14 20:11:59'),('57897e5b-09ab-4bdf-91fb-c7423606fa1c','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','quien es skeletor',0,0,'2026-02-14 20:23:36'),('59841f0b-3e33-46b2-9f2f-00c8e85c07c8','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','dime quien. es Heman',0,0,'2026-02-14 20:20:32'),('5ab11f34-1046-4d7f-93d9-06fb93e7ac2f','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','dame un opel de 2020',0,0,'2026-02-14 22:03:47'),('5d8c7ec1-cb11-4296-8291-18dfd14c0cec','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','Voy a buscar vehículos Ford del año 2018 disponibles para ti. Un momento por favor.',797,19,'2026-02-14 21:34:11'),('630aef4d-c372-47c6-bf30-773282ff5995','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','quiero un volkswagen de 2019',0,0,'2026-02-14 22:14:52'),('6450c23d-19e7-42eb-b236-be15f305fe83','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No tengo información para responder a esa pregunta.',0,0,'2026-02-14 21:27:53'),('68486133-9f64-4ec9-b054-4f649cd315cc','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','Aquí tienes un Volkswagen Golf 2019 Azul disponible:\n\n- Marca: Volkswagen\n- Modelo: Golf\n- Año: 2019\n- Precio: 17,500.00\n- Kilometraje: 58,000 km\n- Combustible: diésel\n- Transmisión: manual\n- Puertas: 5\n- Plazas: 5\n- Color: azul\n- Categoría: Compacto (Coches urbanos de tamaño contenido, fáciles de aparcar)\n- Descripción: Compacto muy equilibrado en consumo, confort y prestaciones.\n- Enlace para ver más: https://tuweb.com/coches/vw-golf-2019-azul\n- Imagen: ![Imagen Volkswagen Golf 2019 Azul](https://cdn.motor1.com/images/mgl/0eKoem/s3/prueba-volkswagen-golf-etsi-50-aniversario.webp) \n\nSi quieres más detalles o comparar con otros modelos, dime.',2266,203,'2026-02-14 22:15:40'),('6c91a0aa-7c2a-4cb5-93d3-4103f119f21c','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','necesito un coche de 2018',0,0,'2026-02-14 21:20:58'),('72231596-7869-41bd-a547-795ba556bd5c','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','busca un frod de 2019',0,0,'2026-02-14 21:35:20'),('767654da-6ed5-4ec5-b1e4-b0881b74e032','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','bus un volkswagen de 2020',0,0,'2026-02-14 21:37:03'),('7822f8f2-82a6-4881-a6d5-76d112c5d5cb','b2a9cf62-9899-4932-9534-7eb1d0d26e72','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d743b58b-ddbe-401c-806f-0c9209f05cf4','user','dameu ngolf',0,0,'2026-02-17 17:01:32'),('8e2fd85c-9da7-46d2-9226-df5930b9e9a9','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','necesito un ford del 2019',0,0,'2026-02-14 21:30:46'),('948f8a11-da0f-4597-8900-ff0f031cc1dd','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','quiero un coche de 2009',0,0,'2026-02-14 20:37:31'),('94ee86e6-17a6-4761-8ef0-ed539b2f77ce','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No tengo información para responder a esa pregunta.',0,0,'2026-02-14 20:38:13'),('998985ba-d297-4e08-8022-4df6205e314e','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','¿Te refieres a He-Man? Si es así, He-Man es un personaje ficticio muy famoso de una serie de dibujos animados y una franquicia de juguetes creada en los años 80. Es el alter ego del príncipe Adam, quien obtiene su fuerza y poderes mágicos al decir la frase \"¡Por el poder de Grayskull!\". He-Man es conocido por su gran fuerza y valentía y protege el reino de Eternia de las fuerzas del mal lideradas por Skeletor.\n\n¿Querías saber sobre este personaje o te referías a otra persona llamada Heman? ¡Dime y te ayudo!',269,128,'2026-02-14 20:20:34'),('9f195e03-cb83-4da1-972e-c3eaca915319','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No tengo información para responder a esa pregunta.',0,0,'2026-02-14 21:25:27'),('9fbdaa6a-703c-46f3-b1ac-face64ad65fa','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','dameu n for de 2020',0,0,'2026-02-14 22:00:46'),('a2259e2d-85da-4801-bd9d-d117ba559876','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','¡Hola! ¿En qué puedo ayudarte hoy? 😊',17,11,'2026-02-14 20:03:46'),('a3bb3651-9c5a-45e5-9da8-c74fcd5e1695','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','quiero un ford del 2018',0,0,'2026-02-14 21:34:10'),('a7ccd6fe-21eb-4c34-a4da-ef97029f80d5','b2a9cf62-9899-4932-9534-7eb1d0d26e72','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d743b58b-ddbe-401c-806f-0c9209f05cf4','assistant','No he encontrado resultados para esa búsqueda. Puedes probar con otro año o criterio.',0,0,'2026-02-17 17:01:35'),('ab1a6e7e-9724-4f43-b619-8b76b7512f6c','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No puedo responder a eso porque no está en mi ámbito de datos.',861,14,'2026-02-14 21:44:37'),('ae14089d-9872-48d9-a4dd-1ac003037c74','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','opel del 2020',0,0,'2026-02-14 21:44:01'),('aec2eeff-6bfc-43de-98c1-dab7e8c11972','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','¡Muchas cosas! Puedo ayudarte a responder preguntas, ofrecer información sobre diversos temas, ayudarte a practicar idiomas, crear textos como historias o poemas, resolver problemas matemáticos, dar recomendaciones y mucho más. ¿Hay algo en particular que te gustaría que haga por ti?',40,53,'2026-02-14 20:11:41'),('b138f8e0-b4e5-4a37-b3c3-d2caabf2b166','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','Voy a buscar coches Opel del año 2020 disponibles para ti. Un momento por favor.',817,19,'2026-02-14 21:35:55'),('b1e82fde-0165-462b-b348-66995bb70049','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No tengo información para responder a esa pregunta.',0,0,'2026-02-14 20:27:52'),('b31b4d5e-a70c-4625-9594-041dd8f499e6','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','busca un opel de 2020',0,0,'2026-02-14 21:35:54'),('b32ae7c4-629a-45ee-8e05-1d695b9d2206','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No puedo responder a eso porque no está en mi ámbito de datos.',866,14,'2026-02-14 21:44:02'),('b4ba2a57-a29b-4f07-b5e2-8400e6e719eb','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No tengo información para responder a esa pregunta.',0,0,'2026-02-14 21:19:31'),('b5626dec-d312-41b4-bb31-da1ec2be908e','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','quiero un volkswagen de 2019',0,0,'2026-02-14 21:40:37'),('c2374bc6-ce07-4dbc-804b-fbd402012868','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','¿Quieres que busque un Ford del año 2020? Procedo con la búsqueda. Un momento por favor.',850,24,'2026-02-14 22:00:47'),('c8224567-e0ec-4afa-a8a0-f1e18e98a5ff','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No puedo responder a eso porque no está en mi ámbito de datos.',874,14,'2026-02-14 21:41:51'),('cc77479f-e99b-4f1b-b848-e610445732fa','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','dame un coche de 2019',0,0,'2026-02-14 21:22:57'),('cdd293c8-7c19-47dd-b3cf-0be52e3e6132','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','¿Quieres que busque coches disponibles del año 2023 para ti? Por favor, especifica si tienes alguna marca, modelo o características en particular que prefieras.',951,34,'2026-02-14 21:25:15'),('cfb5f218-17b3-4b1b-8a20-f866b5dacf42','b2a9cf62-9899-4932-9534-7eb1d0d26e72','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d743b58b-ddbe-401c-806f-0c9209f05cf4','assistant','Estos son algunos coches del año 2019 disponibles:\n\n1. Volkswagen Golf 2019 Azul\n   - Precio: 17,500.00 €\n   - Kilometraje: 58,000 km\n   - Combustible: diésel\n   - Transmisión: manual\n   - Puertas: 5\n   - Color: azul\n   - Categoría: Compacto\n   - [Más información](https://tuweb.com/coches/vw-golf-2019-azul)\n\n2. Seat León 2019 Rojo\n   - Precio: 16,500.00 €\n   - Kilometraje: 58,000 km\n   - Combustible: gasolina\n   - Transmisión: manual\n   - Puertas: 5\n   - Color: rojo\n   - Categoría: Compacto\n   - [Más información](https://tuweb.com/coches/seat-leon-2019-rojo)\n\n3. Ford Focus 2019 Plata\n   - Precio: 16,200.00 €\n   - Kilometraje: 60,000 km\n   - Combustible: diésel\n   - Transmisión: manual\n   - Puertas: 5\n   - Color: plata\n   - Categoría: Compacto\n   - [Más información](https://tuweb.com/coches/ford-focus-2019-plata)\n\n¿Quieres que busque algún modelo, color o precio específico?',1964,308,'2026-02-17 17:01:50'),('d067e704-0f5a-4b79-843c-057d68016c73','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','quien es skeletor',0,0,'2026-02-14 20:21:31'),('d1adc746-753c-4ab3-8f29-db1d785b07f0','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No tengo información para responder a esa pregunta.',0,0,'2026-02-14 21:22:19'),('d5fe2c21-89ed-427a-bccb-bd9fdd17833b','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','Voy a buscar coches Ford del año 2019 disponibles para ti. Un momento por favor.',783,19,'2026-02-14 21:30:47'),('dca3a381-2e2d-4318-8ae1-c113f2039da0','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No tengo información para responder a esa pregunta.',0,0,'2026-02-14 21:16:53'),('de64a8ae-c4b5-41ac-9cc0-7fce70a8dd2a','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No tengo información para responder a esa pregunta.',0,0,'2026-02-14 20:37:31'),('e15d43e7-3f06-441c-ba7f-445ba1878ea6','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','buscaa aun coche de 2009',0,0,'2026-02-14 21:16:53'),('e43dc083-c96a-4619-bfd6-a20a054366b6','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No he podido acceder a la fuente de datos ahora mismo. Revisa la configuración del endpoint.',0,0,'2026-02-14 22:14:52'),('e5def20e-f507-4c1b-b458-01599cb36fce','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','qué sabes hacer?',0,0,'2026-02-14 20:11:40'),('e69617b7-2f00-4edf-90d2-4c34360fc730','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','necesito un for del 2018',0,0,'2026-02-14 21:32:42'),('e900cb68-5d34-4c9f-89b2-086e383de4db','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','Skeletor es el villano principal de la serie de dibujos animados y franquicia de juguetes \"He-Man y los Amos del Universo\". Es un brujo malvado con rostro de calavera que busca conquistar el castillo de Grayskull para obtener poderes supremos y dominar el planeta Eternia. Es el enemigo mortal de He-Man, el héroe de la serie.\n\n¿Quieres que te cuente más sobre su historia o sus poderes?',823,94,'2026-02-14 20:23:38'),('ed89351f-5228-4de5-9cb4-5579bb2c0e6f','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','quiero un volkswagen de 2019',0,0,'2026-02-14 21:46:59'),('ed94208b-6649-4715-8dcc-9ca8b689ae2d','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','necesito un coche de 2023',0,0,'2026-02-14 21:25:13'),('ef41560c-18f9-41ac-8f92-799900eedaa5','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','Voy a buscar coches Volkswagen del año 2019 disponibles para ti. Un momento por favor.',864,19,'2026-02-14 21:40:38'),('f221101b-2593-417e-bec8-8c9ebda274e0','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','No puedo responder a eso porque no está en mi ámbito de datos.',845,14,'2026-02-14 21:47:02'),('f43b21ad-64e8-42e9-88f8-72e51c270420','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','Por favor, indícame si quieres que busque coches Volkswagen del año 2019 para proceder con la búsqueda.',842,24,'2026-02-14 21:39:51'),('f55053f6-565e-44a1-90d3-e3d332f33956','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','quiero un volkswagen de 2019',0,0,'2026-02-14 21:39:50'),('f5924c78-b44b-432f-a719-3afbbcbec05c','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','quiero un volkswagen de 2019',0,0,'2026-02-14 22:15:36'),('f5d43e3d-61c2-45ba-822e-426aec1ae07d','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','quien fue felipe II?',0,0,'2026-02-14 20:11:56'),('f9549ee9-9bf8-4a69-8567-2f8d8c2cef98','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','assistant','¿Quieres que busque un coche Ford del año 2019? Procedo con la búsqueda. Un momento por favor.',777,25,'2026-02-14 21:35:21'),('fdb802c1-8464-427c-a34b-fcc3b5d214da','24c0b291-f4c9-4a3b-b22a-d38546875506','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','user','opel del 2020',0,0,'2026-02-14 21:44:36');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_users`
--

DROP TABLE IF EXISTS `chat_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_users` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(160) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `passwordHash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_users`
--

LOCK TABLES `chat_users` WRITE;
/*!40000 ALTER TABLE `chat_users` DISABLE KEYS */;
INSERT INTO `chat_users` VALUES ('82ddfa1d-e882-41c9-87d9-c49d6d574232','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','fellipe@felipe.com','Felipe Chorizo','6aab2513a3d7ae85b552c72010df10005d4667a4d5a4f44e13a64273c17d5d5f','active','2026-02-14 11:34:37','2026-02-14 11:34:37'),('d743b58b-ddbe-401c-806f-0c9209f05cf4','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','maria@maria.com','Maria Lopez','702e69a0058cd96ddb404f6e323aa41425919140fc8bc4afbf8c600f576cff72','active','2026-02-17 15:53:24','2026-02-17 15:53:24'),('d94d55bf-4f6b-4f25-ac64-3267a94a51a2','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','miguel@domain.com','Miguel Lopez','6aab2513a3d7ae85b552c72010df10005d4667a4d5a4f44e13a64273c17d5d5f','active','2026-02-14 19:50:58','2026-02-14 19:50:58');
/*!40000 ALTER TABLE `chat_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `db_connections`
--

DROP TABLE IF EXISTS `db_connections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `db_connections` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `engine` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'mysql',
  `encryptedConfig` text COLLATE utf8mb4_general_ci NOT NULL,
  `allowedTables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `readOnly` tinyint(1) NOT NULL DEFAULT '1',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `db_connections_chk_1` CHECK (json_valid(`allowedTables`)),
  CONSTRAINT `db_connections_chk_2` CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `db_connections`
--

LOCK TABLES `db_connections` WRITE;
/*!40000 ALTER TABLE `db_connections` DISABLE KEYS */;
/*!40000 ALTER TABLE `db_connections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documentation_entries`
--

DROP TABLE IF EXISTS `documentation_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documentation_entries` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `menuSlug` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `category` varchar(64) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'general',
  `title` varchar(160) COLLATE utf8mb4_general_ci NOT NULL,
  `title_en` varchar(160) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `title_ca` varchar(160) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_general_ci NOT NULL,
  `content_en` text COLLATE utf8mb4_general_ci,
  `content_ca` text COLLATE utf8mb4_general_ci,
  `link` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `orderIndex` int NOT NULL DEFAULT '0',
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documentation_entries`
--

LOCK TABLES `documentation_entries` WRITE;
/*!40000 ALTER TABLE `documentation_entries` DISABLE KEYS */;
INSERT INTO `documentation_entries` VALUES ('0602f9ec-7794-4250-a368-e0d1816c979d','documentation','search','Busqueda textual','Text search','Cerca textual','El parametro q busca por titulo o contenido. Se usa en el input global y en la pagina de docs. Combinar con menuSlug y category para filtrar.','The q parameter searches by title or content. It is used in the global input and in the Docs page. Combine with menuSlug and category to filter.','El parametre q cerca per titol o contingut. Es utilitza al cercador global i a la pagina de docs. Combina amb menuSlug i category per filtrar.',NULL,2,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('0754a8ba-e941-4951-9960-12c4048a9923','policies','concepts','Politicas de consumo','Consumption policies','Politiques de consum','Las politicas definen limites por tenant: requests por minuto, tokens diarios, coste diario y redaccion. Se aplican antes de cada ejecucion runtime. Sin politica valida no se permite ejecutar.','Policies define limits per tenant: requests per minute, daily tokens, daily cost, and redaction. They apply before each runtime execution. Without a valid policy, execution is not allowed.','Les politiques defineixen limits per tenant: sollicituds per minut, tokens diaris, cost diari i redaccio. Es apliquen abans de cada execucio runtime. Sense una politica valida no es permet executar.',NULL,1,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('0c7e5141-4614-455c-aa0e-45fbe82f528b','settings','operations','Configuracion por entorno','Environment configuration','Configuracio per entorn','Mantener valores de entorno separados para dev y prod. Revisa CACHE_REDIS_ENABLED y QUEUE_REDIS_ENABLED si no hay Redis.','Keep separate environment values for dev and prod. Check CACHE_REDIS_ENABLED and QUEUE_REDIS_ENABLED if Redis is not available.','Mantingues valors de entorn separats per dev i prod. Revisa CACHE_REDIS_ENABLED i QUEUE_REDIS_ENABLED si no hi ha Redis.',NULL,4,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('15d2171b-16d4-4a8f-bbc8-c207056a0bba','providers','security','Credenciales cifradas','Encrypted credentials','Credencials xifrades','Las credenciales se cifran en reposo mediante AES-GCM. Solo se descifran en memoria cuando el adapter ejecuta la llamada. No se exponen en ninguna respuesta del API.','Credentials are encrypted at rest using AES-GCM. They are decrypted in memory only when the adapter executes the call. They are not exposed in any API response.','Les credencials es xifren en repos amb AES-GCM. Nomes es desxifren en memoria quan el adapter executa la crida. No es exposen en cap resposta de l API.',NULL,2,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('16891323-df83-4dd9-b221-12c24c9a33f3','audit','traza','Auditoría','Auditing','Auditoria','Registro de eventos sin almacenar prompts completos.','Event logging without storing full prompts.','Registre de esdeveniments sense emmagatzemar prompts complets.',NULL,1,1,'2026-02-08 16:36:37','2026-02-15 21:56:53'),('1f79c4e8-54e6-4487-a0c4-bf07d48efbaf','pricing','impact','Impacto en limites','Impact on limits','Impacte en limits','El coste calculado influye en maxCostPerDayUsd. Precios incorrectos pueden bloquear uso o permitir gastos excesivos. Revisa periodicamente.','The calculated cost affects maxCostPerDayUsd. Incorrect prices can block usage or allow excessive spend. Review periodically.','El cost calculat influeix en maxCostPerDayUsd. Preus incorrectes poden bloquejar el us o permetre despeses excessives. Revisa periodicament.',NULL,4,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('22061ce4-c7da-427c-9464-3187451f9980','documentation','concepts','Modelo de documentacion','Documentation model','Model de documentacio','Cada entrada se asocia a menuSlug y category. El panel lateral muestra entradas por seccion. orderIndex permite controlar el orden visible.','Each entry is associated with menuSlug and category. The side panel shows entries by section. orderIndex controls the visible order.','Cada entrada es associa a menuSlug i category. El panell lateral mostra entrades per seccio. orderIndex permet controlar el ordre visible.',NULL,1,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('26352f0f-073f-484d-89b2-29b99fd7855a','runtime','performance','Latencia y concurrencia','Latency and concurrency','Latencia i concurrencia','La latencia depende del proveedor externo. Usa colas si deseas aislar cargas y reintentos. Configura timeouts y observa el throughput en Observability.','Latency depends on the external provider. Use queues if you want to isolate load and retries. Configure timeouts and watch throughput in Observability.','La latencia depen del proveidor extern. Usa cues si vols aillar carrega i reintents. Configura timeouts i observa el throughput a Observability.',NULL,4,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('27b080ee-4f9a-4612-9394-b1bca1c3f174','notifications','email','Email','Email','Email','Configura SMTP en variables de entorno y define recipients en el canal. El contenido del email incluye severidad, limites y consumo actual.','Configure SMTP in environment variables and define recipients in the channel. The email content includes severity, limits, and current usage.','Configura SMTP a les variables de entorn i defineix recipients al canal. El contingut del email inclou severitat, limits i consum actual.',NULL,2,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('28d7874e-d3c1-4aa9-be7a-21e4f1c73912','settings','scheduler','Cron de alertas','Alerts cron','Cron de alertes','ALERTS_CRON define cada cuanto se evalua el consumo. ALERTS_MIN_INTERVAL_MINUTES evita reenvios constantes. Ajusta segun volumen.','ALERTS_CRON defines how often consumption is evaluated. ALERTS_MIN_INTERVAL_MINUTES prevents constant resends. Adjust by volume.','ALERTS_CRON defineix cada quant s avalua el consum. ALERTS_MIN_INTERVAL_MINUTES evita reenviaments constants. Ajusta segons volum.',NULL,3,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('2c7a88e9-7c6a-4d89-adcd-008d63ff831e','pricing','operations','Mantenimiento de tarifas','Pricing maintenance','Manteniment de tarifes','Actualiza tarifas cuando cambien los precios del proveedor. Deshabilita entradas obsoletas para evitar costeo incorrecto. Usa la UI o el endpoint /pricing.','Update rates when provider prices change. Disable obsolete entries to avoid incorrect costing. Use the UI or the /pricing endpoint.','Actualitza tarifes quan canviin els preus del proveidor. Deshabilita entrades obsoletes per evitar costejos incorrectes. Usa la UI o el endpoint /pricing.',NULL,3,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('33c88e3b-c397-4272-979b-2cce110795e0','webhooks','security','Firmas y autenticidad','Signatures and authenticity','Signatures i autenticitat','Si defines un secreto, el payload se firma con HMAC SHA256. El receptor puede validar la firma para asegurar integridad y autenticidad.','If you set a secret, the payload is signed with HMAC SHA256. The receiver can validate the signature to ensure integrity and authenticity.','Si defineixes un secret, el payload es signa amb HMAC SHA256. El receptor pot validar la signatura per assegurar integritat i autenticitat.',NULL,2,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('3456de5c-e5c7-404f-a6ff-4fa37441a348','tenants','troubleshooting','Diagnostico rapido','Quick diagnosis','Diagnosi rapida','Si un tenant no puede ejecutar runtime, verifica que exista politica activa, que el kill switch esté desactivado y que tenga al menos un provider habilitado.','If a tenant cannot run runtime, verify there is an active policy, the kill switch is off, and there is at least one enabled provider.','Si un tenant no pot executar runtime, verifica que existeixi politica activa, que el kill switch estigui desactivat i que tingui almenys un provider habilitat.',NULL,6,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('3fc31f70-a2da-4c34-a4d1-6b36cda42102','notifications','alertas','Canales de notificación','Notification channels','Canals de notificacio','Configura email o Slack para alertas de consumo.','Configure email or Slack for consumption alerts.','Configura email o Slack per a alertes de consum.',NULL,1,1,'2026-02-08 16:36:37','2026-02-15 21:56:53'),('409cecab-902d-4e90-9edf-d467bbdb37da','usage','alertas','Monitoreo de uso','Usage monitoring','Monitoratge de us','Consulta consumo y dispara alertas según políticas.','Check consumption and trigger alerts according to policies.','Consulta consum i dispara alertes segons politiques.',NULL,1,1,'2026-02-08 16:36:37','2026-02-15 21:56:53'),('452e0f62-b4e0-44d5-81d4-554227c4945f','observability','concepts','Observabilidad','Observability','Observabilitat','La observabilidad permite medir latencia, errores y throughput. Es clave para dimensionar proveedores y detectar degradacion.','Observability lets you measure latency, errors, and throughput. It is key to sizing providers and detecting degradation.','La observabilitat permet mesurar latencia, errors i throughput. Es clau per dimensionar proveidors i detectar degradacio.',NULL,1,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('46df6032-06a4-4802-bb74-a72c5d82e4cd','tenants','concepts','Que es un tenant','What is a tenant','Que es un tenant','Un tenant es una unidad logica que representa a un cliente o dominio de negocio. Cada tenant tiene proveedores, politicas y consumo aislados. Todas las operaciones runtime deben estar asociadas a un tenant valido.','A tenant is a logical unit representing a client or business domain. Each tenant has isolated providers, policies, and consumption. All runtime operations must be associated with a valid tenant.','Un tenant es una unitat logica que representa un client o domini de negoci. Cada tenant te proveidors, politiques i consum aillats. Totes les operacions runtime han estar associades a un tenant valid.',NULL,1,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('4e6b00d9-2b6a-4890-98c8-aa66db632efd','settings','kill','Kill switch global','Global kill switch','Kill switch global','Bloquea todas las ejecuciones runtime para todos los tenants. Usar solo en incidentes graves. Revertir cuando la causa este mitigada.','Blocks all runtime executions for all tenants. Use only in severe incidents. Revert when the cause is mitigated.','Bloqueja totes les execucions runtime per a tots els tenants. Usa-ho nomes en incidents greus. Reverteix quan la causa estigui mitigada.',NULL,2,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('54cb5788-1eb2-4277-a5fc-b6876747746f','policies','limits','Rate limiting','Rate limiting','Limitacio de taxa','maxRequestsPerMinute controla el numero de llamadas por minuto. Puede usar Redis o memoria. Exceder el limite retorna 429 y no se factura.','maxRequestsPerMinute controls the number of calls per minute. It can use Redis or memory. Exceeding the limit returns 429 and is not billed.','maxRequestsPerMinute controla el numero de crides per minut. Pot usar Redis o memoria. Superar el limit retorna 429 i no es factura.',NULL,2,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('550a569c-10f8-466b-b0a3-76185a700cfc','webhooks','events','Tipos de eventos','Event types','Tipus de esdeveniments','El evento base es audit.event. Puedes ampliar con otros eventos si agregas nuevos modulos. Usa el campo events para filtrar por tipo o * para todos.','The base event is audit.event. You can extend it with other events if you add new modules. Use the events field to filter by type or * for all.','El esdeveniment base es audit.event. Pots ampliar amb altres esdeveniments si afegeixes nous moduls. Usa el camp events per filtrar per tipus o * per a tots.',NULL,4,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('55eb73cd-cc2c-48e1-9d76-7a4e76bad50d','notifications','operations','Buenas practicas','Best practices','Bones practiques','Define canales globales para equipo central y canales por tenant para equipos dedicados. Ajusta el cron para evitar ruido innecesario.','Define global channels for the central team and per-tenant channels for dedicated teams. Adjust the cron to avoid unnecessary noise.','Defineix canals globals per a equip central i canals per tenant per a equips dedicats. Ajusta el cron per evitar soroll innecessari.',NULL,4,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('5e67f051-3aca-4f98-afbd-2adb46f5c840','policies','limits','Tokens y coste diario','Tokens and daily cost','Tokens i cost diari','maxTokensPerDay y maxCostPerDayUsd se calculan con usage_events y pricing_models. Si se supera, la ejecucion se bloquea. Es clave para control financiero.','maxTokensPerDay and maxCostPerDayUsd are calculated from usage_events and pricing_models. If exceeded, execution is blocked. This is key for financial control.','maxTokensPerDay i maxCostPerDayUsd es calculen amb usage_events i pricing_models. Si se supera, la execucio es bloqueja. Es clau per al control financer.',NULL,3,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('5e73dc62-dd54-475d-8b8e-eb0ac66ebc7d','runtime','errors','Errores y respuestas','Errors and responses','Errors i respostes','Errores de autenticacion retornan 401. Limites superados retornan 429 o 403 segun el caso. Fallos de proveedor retornan 502 con mensaje resumido. No se devuelven credenciales ni payloads sensibles.','Authentication errors return 401. Exceeded limits return 429 or 403 depending on the case. Provider failures return 502 with a summarized message. Credentials and sensitive payloads are not returned.','Errors de autenticacio retornen 401. Limits superats retornen 429 o 403 segons el cas. Falles de proveidor retornen 502 amb missatge resumit. No es retornen credencials ni payloads sensibles.',NULL,3,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('5f1cf793-44b9-4fe6-bf54-9acda5d3fcc9','audit','integration','Exportacion de eventos','Event export','Exportacio de esdeveniments','Los eventos pueden enviarse a webhooks y SQS. Esto habilita integracion con SIEM, data lake o pipelines de cumplimiento. El envio no bloquea el flujo principal.','Events can be sent to webhooks and SQS. This enables integration with SIEM, data lake, or compliance pipelines. Sending does not block the main flow.','Els esdeveniments es poden enviar a webhooks i SQS. Aixo habilita integracio amb SIEM, data lake o pipelines de compliment. El enviament no bloqueja el flux principal.',NULL,3,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('65959567-1231-468f-8da7-fb2ec70cab70','policies','data','Redaccion de datos','Data redaction','Redaccio de dades','Cuando redactionEnabled esta activo, se aplica el modulo de redaccion antes de llamar al proveedor. Esto reduce la exposicion de datos sensibles en prompts.','When redactionEnabled is active, the redaction module runs before calling the provider. This reduces exposure of sensitive data in prompts.','Quan redactionEnabled esta actiu, el modul de redaccio s aplica abans de cridar al proveidor. Aixo redueix la exposicio de dades sensibles als prompts.',NULL,4,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('6766741f-3160-4748-99de-1f4dc7f7b6e1','runtime','concepts','Endpoint unico de ejecucion','Single execution endpoint','Endpoint unic de execucio','El endpoint /runtime/execute es la unica puerta de acceso a IA. Centraliza autenticacion, politicas, redaccion, costeo y auditoria. Otros modulos deben consumir solo este endpoint.','The /runtime/execute endpoint is the only gateway to AI. It centralizes authentication, policies, redaction, costing, and auditing. Other modules must consume only this endpoint.','El endpoint /runtime/execute es la unica porta de acces a la IA. Centralitza autenticacio, politiques, redaccio, cost i auditoria. Altres moduls han de consumir nomes aquest endpoint.',NULL,1,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('6acbc400-f5bd-455b-aef4-d9731bbbce08','documentation','gestión','Documentación interna','Internal documentation','Documentacio interna','Crea y organiza entradas por menú, categoría y orden.','Create and organize entries by menu, category, and order.','Crea i organitza entrades per menu, categoria i ordre.',NULL,1,1,'2026-02-08 16:36:37','2026-02-15 21:56:53'),('6adc15c3-d8da-4531-8814-0640f60b9188','settings','concepts','Ajustes globales','Global settings','Ajustos globals','Settings controla funciones globales: kill switch, cron de alertas y parametros operativos. Son cambios de alto impacto y deben auditarse.','Settings controls global functions: kill switch, alerts cron, and operational parameters. These are high-impact changes and must be audited.','Settings controla funcions globals: kill switch, cron de alertes i parametres operatius. Son canvis de alt impacte i han de ser auditats.',NULL,1,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('7dea657e-380c-4379-9635-e6df02ffa33b','webhooks','export','Webhooks','Webhooks','Webhooks','Envía eventos a tus sistemas para auditoría externa.','Send events to your systems for external auditing.','Envia esdeveniments als teus sistemes per a auditoria externa.',NULL,1,1,'2026-02-08 16:36:37','2026-02-15 21:56:53'),('80de6326-607a-46c1-89bd-ba4df53d598e','runtime','workflow','Orden de validaciones','Order of validations','Ordre de validacions','El flujo recomendado es: autenticar, validar kill switch global y por tenant, aplicar rate limit, validar limites de tokens y coste, redaccion, llamada al adapter, registrar audit y usage. Si alguna validacion falla, se corta la ejecucion.','The recommended flow is: authenticate, validate global and tenant kill switch, apply rate limit, validate token and cost limits, redaction, adapter call, register audit and usage. If any validation fails, execution stops.','El flux recomanat es: autenticar, validar kill switch global i per tenant, aplicar rate limit, validar limits de tokens i cost, redaccio, crida al adapter, registrar audit i usage. Si alguna validacio falla, es talla la execucio.',NULL,2,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('83677bfc-810e-49dd-a921-204734ba0844','providers','adapters','Adapters soportados','Supported adapters','Adapters suportats','Se incluyen adapters para openai, azure-openai, aws-bedrock, vertex-ai y mock. Cada adapter normaliza la llamada a un contrato comun. Esto permite cambiar de proveedor sin modificar el resto del sistema.','Adapters are included for openai, azure-openai, aws-bedrock, vertex-ai, and mock. Each adapter normalizes the call to a common contract. This allows switching providers without changing the rest of the system.','S inclouen adapters per openai, azure-openai, aws-bedrock, vertex-ai i mock. Cada adapter normalitza la crida a un contracte comu. Aixo permet canviar de proveidor sense modificar la resta del sistema.',NULL,3,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('90c05e7e-cc00-4e6e-ab9e-b9401a86d718','tenants','gestión','Crear y operar tenants','Create and operate tenants','Crear i operar tenants','Cada tenant representa un cliente con políticas y límites propios.','Each tenant represents a client with its own policies and limits.','Cada tenant representa un client amb politiques i limits propis.',NULL,1,1,'2026-02-08 16:36:37','2026-02-15 21:56:53'),('94ba10ba-ca65-4ef5-bb36-3afe66493d97','tenants','workflow','Ciclo de vida del tenant','Tenant lifecycle','Cicle de vida del tenant','Crea el tenant, define la politica base, registra proveedores y valida el runtime. Ajusta limites a medida que el uso crece. Ante incidentes, activa el kill switch y revisa auditoria.','Create the tenant, define the base policy, register providers, and validate runtime. Adjust limits as usage grows. In incidents, activate the kill switch and review audit.','Crea el tenant, defineix la politica base, registra proveidors i valida el runtime. Ajusta limits a mesura que el us creix. En incidents, activa el kill switch i revisa auditoria.',NULL,2,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('9530b72a-9f67-4feb-826b-c71a50a26b1a','documentation','workflow','Gestion operativa','Operational management','Gestio operativa','Actualiza la documentacion al cambiar politicas, proveedores o procesos. Usa la UI de Docs para mantener contenido vivo y consistente.','Update documentation when policies, providers, or processes change. Use the Docs UI to keep content alive and consistent.','Actualitza la documentacio en canviar politiques, proveidors o processos. Usa la UI de Docs per mantenir contingut viu i consistent.',NULL,4,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('9a049167-57c0-4ae5-a1bd-fc69f20f13f9','usage','alerts','Alertas automaticas','Automatic alerts','Alertes automatiques','El scheduler evalua consumo segun cron y genera alertas si se exceden limites. Los canales habilitados reciben notificaciones. Ajusta cron y minIntervalMinutes para evitar spam.','The scheduler evaluates consumption by cron and generates alerts if limits are exceeded. Enabled channels receive notifications. Adjust cron and minIntervalMinutes to avoid spam.','El scheduler avalua el consum segons cron i genera alertes si es superen limits. Els canals habilitats reben notificacions. Ajusta cron i minIntervalMinutes per evitar spam.',NULL,2,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('9a1b6aa8-8fb7-4592-9d73-87d807b83ef5','usage','concepts','Eventos de uso','Usage events','Esdeveniments de us','Cada ejecucion genera un usage_event con tokens de entrada y salida, modelo y coste. Esta tabla es la base para resumenes, limites y alertas.','Each execution generates a usage_event with input and output tokens, model, and cost. This table is the basis for summaries, limits, and alerts.','Cada execucio genera un usage_event amb tokens de entrada i sortida, model i cost. Aquesta taula es la base per a resums, limits i alertes.',NULL,1,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('9d37ca82-be04-4cf8-b305-26765a3842ae','providers','troubleshooting','Errores comunes','Common errors','Errors comuns','Revisa credenciales, region y limites del proveedor. Errores 401 suelen indicar credenciales invalidas; errores 429 indican limite del proveedor. Usa Audit para rastrear el origen.','Check credentials, region, and provider limits. 401 errors usually mean invalid credentials; 429 errors indicate provider limits. Use Audit to trace the origin.','Revisa credencials, regio i limits del proveidor. Errors 401 solen indicar credencials invalides; errors 429 indiquen limit del proveidor. Usa Audit per rastrejar el origen.',NULL,4,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('9e9f688a-30f4-4510-943e-7e65e9fb87bc','documentation','api','Endpoints disponibles','Available endpoints','Endpoints disponibles','GET /docs, GET /docs/:id, POST /docs, PATCH /docs/:id, DELETE /docs/:id. Todos requieren autenticacion por API key o JWT.','GET /docs, GET /docs/:id, POST /docs, PATCH /docs/:id, DELETE /docs/:id. All require API key or JWT authentication.','GET /docs, GET /docs/:id, POST /docs, PATCH /docs/:id, DELETE /docs/:id. Tots requereixen autenticacio per API key o JWT.',NULL,3,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('a247c63e-b3e5-4cd7-a853-24f63a09c02e','webhooks','delivery','Entrega y reintentos','Delivery and retries','Entrega i reintents','Con colas habilitadas, el envio se gestiona en background. Sin colas, el envio es directo y cualquier fallo se registra como error. La app principal no se bloquea.','With queues enabled, delivery is handled in the background. Without queues, delivery is direct and any failure is recorded as an error. The main app is not blocked.','Amb cues habilitades, el enviament es gestiona en background. Sense cues, el enviament es directe i qualsevol fallada es registra com a error. La app principal no es bloqueja.',NULL,3,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('a6a239a0-6035-40d7-a9f8-7ddbc522fc5d','providers','concepts','Registro de proveedores','Provider registry','Registre de proveidors','Los providers representan conexiones con LLMs externos. Cada provider tiene tipo, displayName, credenciales cifradas y configuracion adicional. El runtime usa providerId para decidir a quien llamar.','Providers represent connections to external LLMs. Each provider has type, displayName, encrypted credentials, and additional configuration. Runtime uses providerId to decide who to call.','Els providers representen connexions amb LLMs externs. Cada provider te tipus, displayName, credencials xifrades i configuracio addicional. El runtime usa providerId per decidir a qui cridar.',NULL,1,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('a80bcb4d-3c54-44be-9de2-1f0c103e4d9e','pricing','concepts','Pricing por modelo','Pricing by model','Pricing per model','Cada entrada define coste por 1k tokens de entrada y salida para un modelo. El providerType normaliza variantes como azure-openai o aws-bedrock.','Each entry defines cost per 1k input and output tokens for a model. providerType normalizes variants such as azure-openai or aws-bedrock.','Cada entrada defineix cost per 1k tokens de entrada i sortida per a un model. El providerType normalitza variants com azure-openai o aws-bedrock.',NULL,1,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('aa6fdbce-69d1-421b-861d-b9ca3b92a44a','audit','concepts','Audit trail','Audit trail','Traca de auditoria','audit_events registra acciones clave con estado y metadatos. Es el registro principal de cumplimiento y seguridad. Permite trazar cada llamada sin almacenar prompts completos.','audit_events records key actions with status and metadata. It is the main compliance and security log. It allows tracing each call without storing full prompts.','audit_events registra accions clau amb estat i metadades. Es el registre principal de compliment i seguretat. Permet tracar cada crida sense emmagatzemar prompts complets.',NULL,1,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('ad40a9bf-e3c3-4422-ab07-d692023500f8','pricing','resolution','Resolucion de precios','Price resolution','Resolucio de preus','El runtime busca primero coincidencia exacta por modelo. Si no existe, usa la entrada comodin con model = *. Esto evita fallos cuando el proveedor retorna modelos nuevos.','Runtime first looks for an exact match by model. If none exists, it uses the wildcard entry with model = *. This avoids failures when the provider returns new models.','El runtime busca primer coincidencia exacta per model. Si no existeix, usa la entrada comodin amb model = *. Aixo evita fallades quan el proveidor retorna models nous.',NULL,2,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('b0143ccb-d125-4ac0-a5a8-1e0f16e32b26','notifications','slack','Slack','Slack','Slack','Configura webhookUrl en el canal. El mensaje incluye tenant, tipo de alerta y valores que superaron el limite.','Configure webhookUrl in the channel. The message includes tenant, alert type, and values that exceeded the limit.','Configura webhookUrl al canal. El missatge inclou tenant, tipus de alerta i valors que han superat el limit.',NULL,3,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('b1137492-21d8-4822-9b16-e6760b3b4f4c','webhooks','concepts','Webhooks de auditoria','Audit webhooks','Webhooks de auditoria','Los webhooks envian eventos a sistemas externos. Puedes filtrar por tipo de evento y por tenant. Son utiles para integraciones con plataformas internas.','Webhooks send events to external systems. You can filter by event type and by tenant. They are useful for integrations with internal platforms.','Els webhooks envien esdeveniments a sistemes externs. Pots filtrar per tipus de esdeveniment i per tenant. Son utils per a integracions amb plataformes internes.',NULL,1,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('b44c8e9f-85d2-41f3-917a-4657a4985277','overview','workflow','Flujo de trabajo recomendado','Recommended workflow','Flux de treball recomanat','Revisa el overview al inicio de cada jornada. Si hay alertas, entra a Usage para detalle y a Audit para trazas. Si detectas riesgo, valida politicas, proveedores y kill switch.','Review the overview at the start of each day. If there are alerts, go to Usage for details and to Audit for traces. If you detect risk, validate policies, providers, and kill switch.','Revisa el overview al inici de cada jornada. Si hi ha alertes, entra a Usage per al detall i a Audit per a traces. Si detectes risc, valida politiques, proveidors i kill switch.',NULL,3,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('bb5c341c-0900-11f1-81e5-5a0d05a37ed2','tenant-services','configuracion','Prompt global del servicio','Global service prompt','Prompt global del servei','Define el comportamiento base del asistente: tono, reglas y contexto. Mantén instrucciones claras y evita incluir datos sensibles o credenciales.','Define the assistant base behavior: tone, rules, and context. Keep instructions clear and avoid including sensitive data or credentials.','Defineix el comportament base de l assistent: to, regles i context. Manten instruccions clares i evita incloure dades sensibles o credencials.',NULL,1,1,'2026-02-13 17:23:37','2026-02-15 21:56:53'),('bb5c724c-0900-11f1-81e5-5a0d05a37ed2','tenant-services','endpoints','Endpoints obligatorios','Required endpoints','Endpoints obligatoris','Si el servicio tiene endpoints habilitados, es obligatorio crear al menos un endpoint. Define método, path y (opcionalmente) base URL y headers.','If the service has endpoints enabled, it is mandatory to create at least one endpoint. Define method, path, and optionally base URL and headers.','Si el servei te endpoints habilitats, es obligatori crear almenys un endpoint. Defineix metode, path i opcionalment base URL i headers.',NULL,1,1,'2026-02-13 17:23:37','2026-02-15 21:56:53'),('bb5d1652-0900-11f1-81e5-5a0d05a37ed2','tenant-services','usuarios','Usuarios asignados al servicio','Users assigned to the service','Usuaris assignats al servei','Aquí se vinculan los usuarios de chat que podrán usar este servicio. Asigna usuarios existentes y gestiona su estado desde esta sección.','Chat users who can use this service are linked here. Assign existing users and manage their status from this section.','Aqui es vinculen els usuaris de xat que podran usar aquest servei. Assigna usuaris existents i gestiona el seu estat des de aquesta seccio.',NULL,1,1,'2026-02-13 17:23:37','2026-02-15 21:56:53'),('bb5d16ca-0900-11f1-81e5-5a0d05a37ed2','tenant-services','runtime','Prueba runtime del servicio','Service runtime test','Prova runtime del servei','Ejecuta una prueba manual usando el provider/modelo configurado. Requiere API key activa del tenant.','Run a manual test using the configured provider or model. Requires an active tenant API key.','Executa una prova manual usant el provider o model configurat. Requereix API key activa del tenant.',NULL,1,1,'2026-02-13 17:23:37','2026-02-15 21:56:53'),('bf0d6af1-9a9d-4da8-82a1-b100c5886db7','notifications','concepts','Canales de alertas','Alert channels','Canals de alertes','Los canales definen destinos para alertas automaticas. Pueden ser globales o por tenant. Se habilitan o deshabilitan sin borrar configuracion.','Channels define destinations for automatic alerts. They can be global or per tenant. They can be enabled or disabled without deleting configuration.','Els canals defineixen destinacions per alertes automatiques. Poden ser globals o per tenant. Es habiliten o deshabiliten sense esborrar configuracio.',NULL,1,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('bf743da7-d23c-4158-8c82-796d50859410','tenants','operaciones','Buenas practicas de administracion','Administration best practices','Bones practiques de administracio','Mantén nombres claros, registra un owner y revisa periodicamente politicas y proveedores asociados. Evita crear tenants duplicados por cliente.','Keep clear names, register an owner, and periodically review associated policies and providers. Avoid creating duplicate tenants per client.','Manten noms clars, registra un owner i revisa periodicament politiques i proveidors associats. Evita crear tenants duplicats per client.',NULL,5,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('c15dffe5-e2ec-4530-82f2-cbc43275aaf6','overview','intro','Qué muestra el overview','What the overview shows','Que mostra el overview','Resumen rápido de consumo, alertas y proveedores activos.','Quick summary of consumption, alerts, and active providers.','Resum rapid de consum, alertes i proveidors actius.',NULL,1,1,'2026-02-08 16:36:37','2026-02-15 21:56:53'),('c664a642-d9d7-4956-aa17-c49eace1dd76','tenants','data','Datos almacenados','Stored data','Dades emmagatzemades','Se guarda solo metadata del tenant: nombre, estado y banderas de control. No se almacenan prompts ni respuestas completas. El objetivo es minimizar datos sensibles.','Only tenant metadata is stored: name, status, and control flags. Prompts and full responses are not stored. The goal is to minimize sensitive data.','Es guarda nomes metadata del tenant: nom, estat i banderes de control. No es emmagatzemen prompts ni respostes completes. El objectiu es minimitzar dades sensibles.',NULL,4,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('cc58a316-e113-4cd6-8b09-01279d2453c9','usage','summary','Resumen diario','Daily summary','Resum diari','El resumen agrega tokens y coste por tenant en el dia actual. Se calcula en tiempo real, no se guarda duplicado. Es util para dashboards y reportes operativos.','The summary aggregates tokens and cost per tenant for the current day. It is computed in real time and not stored twice. Useful for dashboards and operational reports.','El resum agrega tokens i cost per tenant del dia actual. Es calcula en temps real, no es guarda duplicat. Es util per a dashboards i informes operatius.',NULL,3,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('d7e89a66-4959-41fe-9e04-f1e28f063f3c','observability','metrics','Metricas recomendadas','Recommended metrics','Metriques recomanades','Latencia de runtime, errores por proveedor, coste diario por tenant, tasa de redaccion, profundidad de colas y fallos de webhooks.','Runtime latency, errors by provider, daily cost per tenant, redaction rate, queue depth, and webhook failures.','Latencia de runtime, errors per proveidor, cost diari per tenant, taxa de redaccio, profunditat de cues i falles de webhooks.',NULL,2,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('da476dda-8666-4677-ab07-874431edc1c1','observability','traces','Trazas distribuidas','Distributed traces','Trazes distribuides','Integra OpenTelemetry para trazas de llamadas a proveedores. Esto ayuda a identificar cuellos de botella y fallos intermitentes.','Integrate OpenTelemetry for traces of calls to providers. This helps identify bottlenecks and intermittent failures.','Integra OpenTelemetry per a traces de crides a proveidors. Aixo ajuda a identificar colls de ampolla i fallades intermitents.',NULL,4,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('e0c75e6a-f471-46d8-9e41-e56bcbabf1fe','usage','workflow','Investigacion de gastos','Spend investigation','Investigacio de despeses','Si hay incremento anormal, revisa Pricing para confirmar tarifas. Luego revisa Providers y Audit para identificar origen. Considera activar kill switch temporal.','If there is an abnormal increase, review Pricing to confirm rates. Then review Providers and Audit to identify the source. Consider activating a temporary kill switch.','Si hi ha increment anormal, revisa Pricing per confirmar tarifes. Despres revisa Providers i Audit per identificar origen. Considera activar kill switch temporal.',NULL,4,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('e3855d6d-f23c-4303-8816-d606d5aaaab6','overview','limits','Limitaciones de la vista','View limitations','Limitacions de la vista','El overview no muestra prompts ni respuestas, solo metadatos. No es una consola de configuracion; para ajustes usa Tenants, Policies y Settings. La informacion es agregada, no reemplaza auditoria detallada.','The overview does not show prompts or responses, only metadata. It is not a configuration console; for adjustments use Tenants, Policies, and Settings. The information is aggregated and does not replace detailed auditing.','El overview no mostra prompts ni respostes, nomes metadades. No es una consola de configuracio; per a ajustos usa Tenants, Policies i Settings. La informacio es agregada, no reemplaça auditoria detallada.',NULL,4,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('e538dcda-f30f-4497-bbea-efb55c6880f6','audit','privacy','Privacidad y retencion','Privacy and retention','Privacitat i retencio','No se guardan prompts ni respuestas completas. Define politicas de retencion si exportas eventos fuera del sistema. Esto facilita compliance con normativas.','Prompts and full responses are not stored. Define retention policies if you export events outside the system. This helps compliance with regulations.','No es guarden prompts ni respostes completes. Defineix politiques de retencio si exportes esdeveniments fora del sistema. Aixo facilita compliment normatiu.',NULL,4,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('e5cdf37a-6d4e-4fcf-a29f-26ab85abdffb','tenants','security','Kill switch por tenant','Tenant kill switch','Kill switch per tenant','El kill switch del tenant bloquea todas las ejecuciones para ese tenant sin afectar a otros. Es la medida de contencion recomendada frente a abuso o coste inesperado. Se puede reactivar cuando el riesgo pase.','The tenant kill switch blocks all executions for that tenant without affecting others. It is the recommended containment measure against abuse or unexpected cost. It can be reactivated when the risk passes.','El kill switch del tenant bloqueja totes les execucions per a aquest tenant sense afectar altres. Es la mesura de contencio recomanada davant abus o cost inesperat. Es pot reactivar quan el risc passi.',NULL,3,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('eab731b4-43f1-462b-bf2e-d0c74177b6e2','runtime','ejecución','Endpoint único','Single endpoint','Endpoint unic','Todas las llamadas pasan por /runtime/execute con garantías aplicadas.','All calls go through /runtime/execute with applied guarantees.','Totes les crides passen per /runtime/execute amb garanties aplicades.',NULL,1,1,'2026-02-08 16:36:37','2026-02-15 21:56:53'),('ebbe8f66-e62b-4faf-8cf1-13954a8d813f','overview','data','Fuentes de informacion','Information sources','Fonts de informacio','Los datos del overview provienen de usage_events, audit_events y pricing_models. El consumo se calcula por dia y se asocia al tenant activo. Las alertas dependen de los limites de politicas y del scheduler.','Overview data comes from usage_events, audit_events, and pricing_models. Consumption is calculated per day and associated with the active tenant. Alerts depend on policy limits and the scheduler.','Les dades del overview provenen de usage_events, audit_events i pricing_models. El consum es calcula per dia i s associa al tenant actiu. Les alertes depenen dels limits de politiques i del scheduler.',NULL,2,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('f41544c5-12e7-4efc-95b8-34dba54c6caa','observability','logs','Logs','Logs','Logs','Los logs deben incluir correlationId, tenantId y providerId. Evita registrar prompts completos. Usa niveles de log y agrega a un sistema central.','Logs should include correlationId, tenantId, and providerId. Avoid logging full prompts. Use log levels and aggregate to a central system.','Els logs han incloure correlationId, tenantId i providerId. Evita registrar prompts complets. Usa nivells de log i agrega a un sistema central.',NULL,3,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('fc6e798f-e010-405d-8178-2fdb4d33921f','audit','data','Metadatos auditables','Auditable metadata','Metadades auditables','Incluye tenantId, accion, estado y metadata contextual. Se recomienda no incluir contenido sensible en metadata. Usa identificadores y referencias en lugar de payloads completos.','Include tenantId, action, status, and contextual metadata. It is recommended not to include sensitive content in metadata. Use identifiers and references instead of full payloads.','Inclou tenantId, accio, estat i metadata contextual. Es recomana no incloure contingut sensible en metadata. Usa identificadors i referencies en lloc de payloads complets.',NULL,2,1,'2026-02-08 16:36:15','2026-02-15 21:56:53'),('fc843ade-a35d-4a7b-ab4a-8495f13b8487','overview','concepts','Proposito del overview','Purpose of the overview','Proposit del overview','El overview es la vista de control rapido para operaciones. Reune indicadores de uso, alertas y actividad reciente sin ejecutar acciones. Su objetivo es permitir decisiones rapidas sobre limites, proveedores y seguridad.','The overview is the quick control view for operations. It brings together usage indicators, alerts, and recent activity without executing actions. Its goal is to enable quick decisions about limits, providers, and security.','El overview es la vista de control rapid per a operacions. Reuneix indicadors de us, alertes i activitat recent sense executar accions. El seu objectiu es permetre decisions rapids sobre limits, proveidors i seguretat.',NULL,1,1,'2026-02-08 16:36:15','2026-02-15 21:56:53');
/*!40000 ALTER TABLE `documentation_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` bigint NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,260207000000,'InitSchema20260207000000'),(2,260208000100,'AddTenantServices20260208000100'),(3,260208000200,'AddTenantPricings20260208000200'),(4,260208000300,'AddChatTables20260208000300'),(5,260208000400,'AddAdminUsers20260208000400'),(6,260208000500,'AddAdminUserPassword20260208000500'),(7,260208000600,'AddAdminUserMustChange20260208000600'),(8,260208000700,'AddAdminPasswordResets20260208000700'),(9,260209000100,'AddSubscriptions20260209000100'),(10,260209000200,'AddSubscriptionHistory20260209000200'),(11,260209000300,'AddBillingEmailAndPaymentRequests20260209000300'),(12,260209000400,'AddTenantProfileFields20260209000400'),(13,260209000500,'AddTenantPortalAuth20260209000500'),(14,260209001100,'AddSubscriptionPendingRemoval20260209001100');
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_channels`
--

DROP TABLE IF EXISTS `notification_channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_channels` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `type` varchar(16) COLLATE utf8mb4_general_ci NOT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `encryptedSecret` text COLLATE utf8mb4_general_ci,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `notification_channels_chk_1` CHECK (json_valid(`config`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_channels`
--

LOCK TABLES `notification_channels` WRITE;
/*!40000 ALTER TABLE `notification_channels` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_channels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ocr_documents`
--

DROP TABLE IF EXISTS `ocr_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ocr_documents` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_general_ci NOT NULL,
  `source` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `encryptedContent` text COLLATE utf8mb4_general_ci NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `ocr_documents_chk_1` CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ocr_documents`
--

LOCK TABLES `ocr_documents` WRITE;
/*!40000 ALTER TABLE `ocr_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `ocr_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `policies`
--

DROP TABLE IF EXISTS `policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `policies` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `maxRequestsPerMinute` int NOT NULL DEFAULT '60',
  `maxTokensPerDay` int NOT NULL DEFAULT '200000',
  `maxCostPerDayUsd` decimal(10,4) NOT NULL DEFAULT '0.0000',
  `redactionEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `policies_chk_1` CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `policies`
--

LOCK TABLES `policies` WRITE;
/*!40000 ALTER TABLE `policies` DISABLE KEYS */;
INSERT INTO `policies` VALUES ('e7fb096e-c466-4205-9465-0948a77f1e70','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16',60,200000,50.0000,1,'{}','2026-02-12 17:31:26','2026-02-12 17:31:26');
/*!40000 ALTER TABLE `policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pricing_models`
--

DROP TABLE IF EXISTS `pricing_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pricing_models` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `providerType` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `model` varchar(128) COLLATE utf8mb4_general_ci NOT NULL,
  `inputCostPer1k` decimal(10,6) NOT NULL,
  `outputCostPer1k` decimal(10,6) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pricing_models`
--

LOCK TABLES `pricing_models` WRITE;
/*!40000 ALTER TABLE `pricing_models` DISABLE KEYS */;
INSERT INTO `pricing_models` VALUES ('3590734f-970c-47c9-9a09-e86b587c2d72','openai','gpt-4o-mini',0.000150,0.000600,1,'2026-02-08 18:02:43','2026-02-10 14:14:41'),('670322fc-0d38-4244-9c8f-431a60d37753','openai','gpt-4.1-mini',0.000400,0.001600,1,'2026-02-08 12:28:45','2026-02-10 14:14:41'),('69858f3b-3e4c-4243-9720-e9b4c118fc94','vertex-ai','gemini-2.0-flash-lite',0.000075,0.000300,1,'2026-02-08 12:28:45','2026-02-10 14:14:41'),('b44791bf-db49-4676-a274-221349b4495b','aws-bedrock','claude-3.5-sonnet',0.006000,0.030000,1,'2026-02-08 12:28:45','2026-02-15 17:04:37'),('e5e248ea-35e7-4332-bfa4-b69308f7cb9e','vertex-ai','gemini-2.0-flash',0.000150,0.000600,1,'2026-02-08 12:28:45','2026-02-10 14:14:41');
/*!40000 ALTER TABLE `pricing_models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `providers`
--

DROP TABLE IF EXISTS `providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `providers` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `type` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `displayName` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `encryptedCredentials` text COLLATE utf8mb4_general_ci NOT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `providers_chk_1` CHECK (json_valid(`config`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `providers`
--

LOCK TABLES `providers` WRITE;
/*!40000 ALTER TABLE `providers` DISABLE KEYS */;
INSERT INTO `providers` VALUES ('500672f6-0365-4cae-a026-129f871875f9','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','openai','Openai de miralles','LIyqI8PrXsA07Naefh5VkfqWnPrMK+iS2Pu+DDVJD4jdOG5cxczli3wzzhK9IvzfRB9FhB5NcRMvMVlh8QZwa2024UFiinrIz51OIHMox6sRitv/rwU4fkZyG+h48DtAT5iONVXcDVWk8Mjt0v863Txd20QI7q/0DBaSQo5TePD7XQt/oSPTK8zjvpq3VjSCC6bbB/39eke/Id4iP3WaqbJ6xhRGZXxx2IILMsarTmO71yF4Y65a+QxZ6/KkZ9cl8u2Zr6csA432SNYkPCSHzvEaljSLvNqPeRqrD+ONE5x3wRj55n8GrqIWi7spOAFwKIF3eKATtOuqrhAuLI4ym/Jshibeckk8VI/xxBXdOgiHFaX6','{}',1,'2026-02-12 13:36:08','2026-02-12 13:36:08');
/*!40000 ALTER TABLE `providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_catalog`
--

DROP TABLE IF EXISTS `service_catalog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_catalog` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `nameEs` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `descriptionEs` text COLLATE utf8mb4_general_ci,
  `nameEn` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `descriptionEn` text COLLATE utf8mb4_general_ci,
  `endpointsEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `priceMonthlyEur` decimal(10,2) NOT NULL,
  `priceAnnualEur` decimal(10,2) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `apiBaseUrl` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_service_catalog_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_catalog`
--

LOCK TABLES `service_catalog` WRITE;
/*!40000 ALTER TABLE `service_catalog` DISABLE KEYS */;
INSERT INTO `service_catalog` VALUES ('059452a9-cb8a-4c7d-9c93-bc86bb022688','autoevalucion','Sistema de Autoevaluación Inteligente',NULL,'Sistema de Autoevaluación Inteligente es una plataforma basada en IA que permite a usuarios u organizaciones evaluar su situación frente a criterios, normativas o estándares específicos mediante cuestionarios dinámicos y análisis automatizado.\nEl sistema interpreta las respuestas, detecta inconsistencias, calcula niveles de cumplimiento o madurez y genera informes personalizados con recomendaciones de mejora.\n\nDiagnóstico estructurado\nIdentificación de brechas\nRecomendaciones accionables\nInforme automático descargable\nEvolución histórica comparativa\n\nCasos de uso:\n\nCumplimiento normativo\nEvaluación de madurez digital\nAutoevaluación académica\nRiesgos laborales\nEvaluación ESG',NULL,NULL,NULL,1,55.00,54.97,1,'2026-02-17 18:20:01','2026-02-17 18:20:44',NULL),('32834f36-7ba8-4c65-ad79-99096151a951','gestion-citas','Sistema de Gestión Inteligente de Citas',NULL,'Plataforma digital que permite la gestión y reserva de citas sin necesidad de registro tradicional, utilizando identificación ligera mediante código temporal y automatización inteligente.\nEl sistema integra validación segura, consulta de disponibilidad en tiempo real y confirmación automatizada, garantizando simplicidad de uso y cumplimiento de privacidad.',NULL,NULL,NULL,1,22222.00,22222.00,1,'2026-02-17 18:11:40','2026-02-17 18:11:40',NULL),('8f5ebd89-d3d7-42bb-8628-e2797246785a','chatbot-ticketing','Chatbot Ticketing',NULL,'chat bot para administracion de tickets',NULL,NULL,NULL,1,12.00,240.00,1,'2026-02-13 10:56:25','2026-02-13 10:56:25',NULL),('c3140aac-b37a-4ae6-86a6-3ea29f9b88e9','simulado-preevaluacion','Motor de Reglas Simulado para Pre-Evaluación',NULL,'Herramienta basada en IA que analiza información proporcionada por el usuario para ofrecer una estimación orientativa sobre su elegibilidad para determinados productos o servicios.\nFunciona mediante reglas y criterios predefinidos, sin acceder a bases de datos sensibles ni realizar evaluaciones oficiales, proporcionando una guía preliminar que ayuda al usuario a entender sus opciones antes de iniciar un proceso formal.',NULL,NULL,NULL,1,54.99,55.00,1,'2026-02-17 18:14:32','2026-02-17 18:14:32',NULL),('d08de0de-d77e-4f62-84b4-ac694a8f47b1','simulador-financiero','Simulador Inteligente de Productos Financieros',NULL,'Herramienta digital basada en IA que permite a los usuarios analizar, comparar y comprender diferentes productos financieros —como préstamos, hipotecas o planes de ahorro— mediante simulaciones personalizadas y explicaciones claras.\nEl sistema facilita la toma de decisiones informadas sin necesidad de acceder a datos bancarios sensibles, ofreciendo escenarios adaptados a las preferencias y objetivos del usuario.',NULL,NULL,NULL,1,333.00,333.00,1,'2026-02-17 18:12:50','2026-02-17 18:12:50',NULL),('e6a832a0-48eb-4b12-81b6-0adae6d4ac14','asistente-operativo','Asistente de Soporte Operativo',NULL,'Herramienta basada en IA diseñada para ayudar a empleados y equipos internos a resolver dudas, consultar procedimientos y generar respuestas estándar de forma rápida y eficiente.\nFunciona exclusivamente con documentación y conocimiento corporativo previamente validado, sin acceder a datos personales o información sensible, garantizando seguridad y cumplimiento normativo.',NULL,NULL,NULL,1,43.99,44.00,1,'2026-02-17 18:13:47','2026-02-17 18:13:47',NULL),('e7cc7b45-e57b-4174-8ecf-98a8260eab14','sistema-encuestas','Sistema de Encuestas Inteligentes',NULL,'Herramienta de análisis basada en IA que permite recopilar y procesar respuestas estructuradas y abiertas, transformándolas en insights accionables mediante análisis semántico, detección de patrones y generación automática de informes ejecutivos.\n\n\nAnálisis automático de respuestas abiertas\nDetección de sentimiento\nIdentificación de temas recurrentes\nAgrupación inteligente de comentarios\nInformes visuales y resúmenes ejecutivos\n\nCasos de uso:\n\nEncuestas de satisfacción\nClima laboral\nEvaluación de servicios públicos\nFeedback de clientes\nEstudios académicos',NULL,NULL,NULL,1,77.00,77.00,1,'2026-02-17 18:21:38','2026-02-17 18:21:38',NULL),('f0521b0f-d79b-4cce-bbaf-17dd64eda8a4','correos-tickets','Automatización Inteligente de Correos y Tickets',NULL,'Sistema basado en IA que lee, interpreta y gestiona automáticamente correos electrónicos o mensajes entrantes, transformándolos en acciones operativas dentro de la empresa.\n\nEn lugar de que una persona revise cada email manualmente, el sistema:\n - Detecta la intención (reclamación, solicitud, incidencia, baja, información, etc.)\n- Extrae los datos relevantes (número de pedido, cliente, asunto, urgencia…)\n- Clasifica el mensaje\n- Ejecuta una acción automática:',NULL,NULL,NULL,1,111111.00,111110.98,1,'2026-02-17 18:08:50','2026-02-17 18:08:50',NULL),('f1eb0142-05be-11f1-9145-5a0d05a37ed3','chat_generic','Chatbot genérico',NULL,'Servicio conversacional general para FAQ y soporte.',NULL,NULL,NULL,1,49.00,499.00,1,'2026-02-09 13:55:08','2026-02-09 13:55:08',NULL),('f1eb1bbe-05be-11f1-9145-5a0d05a37ed3','chat-ocr','Smart Document Processing (OCR + IA semántica)',NULL,'Servicio con OCR y consulta sobre documentos.',NULL,NULL,NULL,1,79.00,799.00,1,'2026-02-09 13:55:08','2026-02-17 18:16:06',NULL),('f1eb1c18-05be-11f1-9145-5a0d05a37ed3','chat-sql','Chatbot SQL',NULL,'Servicio para consultas sobre bases de datos.',NULL,NULL,NULL,1,99.00,999.00,1,'2026-02-09 13:55:08','2026-02-17 16:34:56',NULL);
/*!40000 ALTER TABLE `service_catalog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_history`
--

DROP TABLE IF EXISTS `subscription_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_history` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `subscriptionId` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `period` varchar(16) COLLATE utf8mb4_general_ci NOT NULL,
  `basePriceEur` decimal(10,2) NOT NULL,
  `servicesPriceEur` decimal(10,2) NOT NULL,
  `totalBilledEur` decimal(10,2) NOT NULL,
  `startedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `endedAt` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_history`
--

LOCK TABLES `subscription_history` WRITE;
/*!40000 ALTER TABLE `subscription_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_payment_requests`
--

DROP TABLE IF EXISTS `subscription_payment_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_payment_requests` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `subscriptionId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(180) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `provider` varchar(16) COLLATE utf8mb4_general_ci NOT NULL,
  `tokenHash` varchar(128) COLLATE utf8mb4_general_ci NOT NULL,
  `amountEur` decimal(10,2) NOT NULL,
  `expiresAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `providerRef` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `completedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_token` (`tokenHash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_payment_requests`
--

LOCK TABLES `subscription_payment_requests` WRITE;
/*!40000 ALTER TABLE `subscription_payment_requests` DISABLE KEYS */;
INSERT INTO `subscription_payment_requests` VALUES ('985f46ac-3c71-47ce-8034-8daac05c2bdc','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','a224ebc1-23c4-4781-9768-2f369c993368','kadetito@gmail.com','pending','mock','DV00/SMyQjWL7ceKPiUqH3wmQFGJOmQi++P+Nq4c7aY=',150.00,'2026-02-14 22:44:53',NULL,NULL,'2026-02-12 22:44:53','2026-02-12 22:44:53');
/*!40000 ALTER TABLE `subscription_payment_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_services`
--

DROP TABLE IF EXISTS `subscription_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_services` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `subscriptionId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `serviceCode` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `activateAt` timestamp NULL DEFAULT NULL,
  `priceEur` decimal(10,2) NOT NULL DEFAULT '0.00',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deactivateAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subscription_service` (`subscriptionId`,`serviceCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_services`
--

LOCK TABLES `subscription_services` WRITE;
/*!40000 ALTER TABLE `subscription_services` DISABLE KEYS */;
INSERT INTO `subscription_services` VALUES ('31424166-30d1-43bf-b0c1-4e3c9e33dde8','a224ebc1-23c4-4781-9768-2f369c993368','chat-sql','active','2026-02-14 19:59:42',99.00,'2026-02-14 19:47:49','2026-02-17 16:41:28',NULL);
/*!40000 ALTER TABLE `subscription_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `period` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'monthly',
  `basePriceEur` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'EUR',
  `currentPeriodStart` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `currentPeriodEnd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cancelAtPeriodEnd` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subscription_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
INSERT INTO `subscriptions` VALUES ('a224ebc1-23c4-4781-9768-2f369c993368','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','active','monthly',150.00,'EUR','2026-02-12 22:44:53','2026-03-12 22:44:53',0,'2026-02-12 22:44:53','2026-02-15 18:48:33');
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `key` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`),
  CONSTRAINT `system_settings_chk_1` CHECK (json_valid(`value`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES ('global_kill_switch','{\"enabled\":false}','2026-02-08 16:46:47');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_invoice_items`
--

DROP TABLE IF EXISTS `tenant_invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_invoice_items` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `invoiceId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `serviceCode` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `priceEur` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_items_invoice` (`invoiceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_invoice_items`
--

LOCK TABLES `tenant_invoice_items` WRITE;
/*!40000 ALTER TABLE `tenant_invoice_items` DISABLE KEYS */;
INSERT INTO `tenant_invoice_items` VALUES ('213f5b64-b752-4411-9232-15d254fb69ac','7cf1c860-ef52-41b7-8298-48f0aeb7b237','chat_sql','Servicio chat_sql',99.00,'active','2026-02-14 19:47:49');
/*!40000 ALTER TABLE `tenant_invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_invoices`
--

DROP TABLE IF EXISTS `tenant_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_invoices` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `subscriptionId` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `paymentRequestId` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `period` varchar(16) COLLATE utf8mb4_general_ci NOT NULL,
  `basePriceEur` decimal(10,2) NOT NULL DEFAULT '0.00',
  `servicesPriceEur` decimal(10,2) NOT NULL DEFAULT '0.00',
  `totalEur` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'EUR',
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `issuedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paidAt` timestamp NULL DEFAULT NULL,
  `periodStart` timestamp NULL DEFAULT NULL,
  `periodEnd` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_invoices_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_invoices`
--

LOCK TABLES `tenant_invoices` WRITE;
/*!40000 ALTER TABLE `tenant_invoices` DISABLE KEYS */;
INSERT INTO `tenant_invoices` VALUES ('7cf1c860-ef52-41b7-8298-48f0aeb7b237','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','a224ebc1-23c4-4781-9768-2f369c993368','985f46ac-3c71-47ce-8034-8daac05c2bdc','monthly',150.00,99.00,249.00,'EUR','paid','2026-02-12 22:44:53','2026-02-12 22:47:53','2026-02-12 22:44:53','2026-03-12 22:44:53','2026-02-12 22:44:53');
/*!40000 ALTER TABLE `tenant_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_login_logs`
--

DROP TABLE IF EXISTS `tenant_login_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_login_logs` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `serviceCode` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `apiKeyId` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `userId` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(160) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  `error` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ipAddress` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `userAgent` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_login_logs_tenant` (`tenantId`),
  KEY `idx_tenant_login_logs_service` (`serviceCode`),
  KEY `idx_tenant_login_logs_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_login_logs`
--

LOCK TABLES `tenant_login_logs` WRITE;
/*!40000 ALTER TABLE `tenant_login_logs` DISABLE KEYS */;
INSERT INTO `tenant_login_logs` VALUES ('23dea942-fada-4202-89c0-def8da77d9ef','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat-sql','e2d46057-0642-421d-9092-3b4daca64bd5','d743b58b-ddbe-401c-806f-0c9209f05cf4','maria@maria.com','success',NULL,'83.43.164.9','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 16:59:21'),('3c2dd100-492a-48a4-b3b9-46bb08cad5a8','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat-sql','e2d46057-0642-421d-9092-3b4daca64bd5',NULL,'miguel@domain.com','failed','Invalid credentials','83.43.164.9','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 16:43:53'),('470807a8-b294-42b4-a991-63906293c57c','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat_sql','e2d46057-0642-421d-9092-3b4daca64bd5','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','miguel@domain.com','success',NULL,'0:0:0:0:0:0:0:1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-14 20:03:31'),('47cc7b04-93fe-4c8f-a5c7-707874c888b7','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chatbot-ticketing','719380ad-49e4-48a4-8ffa-738a9f67fcf7','82ddfa1d-e882-41c9-87d9-c49d6d574232','fellipe@felipe.com','success',NULL,'0:0:0:0:0:0:0:1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-14 18:34:38'),('5cca9636-ab6a-406f-85bb-d47e05f49589','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat_sql','e2d46057-0642-421d-9092-3b4daca64bd5',NULL,'miguel@domain.com','failed','Invalid credentials','83.43.164.9','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 16:13:20'),('6eb33044-7c47-42ba-af78-49a6b7115d57','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat_sql','e2d46057-0642-421d-9092-3b4daca64bd5',NULL,'miguel@domain.com','failed','Invalid credentials','83.43.164.9','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 16:19:56'),('70473577-b559-49dd-96c7-da73b3b8728f','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat_sql','e2d46057-0642-421d-9092-3b4daca64bd5',NULL,'miguel@domain.com','failed','Invalid credentials','83.43.164.9','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 16:22:32'),('71dd463a-5efa-46f9-87f9-6398d3d13b3c','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat_sql','e2d46057-0642-421d-9092-3b4daca64bd5',NULL,NULL,'failed','Invalid credentials','83.43.164.9','curl/8.7.1','2026-02-17 16:00:54'),('7458310c-ddb9-4e2b-8ed3-a9ae6d519533','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat_sql','e2d46057-0642-421d-9092-3b4daca64bd5',NULL,'miguel@domain.com','failed','Invalid credentials','83.43.164.9','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 16:18:04'),('7f01a62f-3915-46e9-95a2-0389e73b3531','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat_sql','e2d46057-0642-421d-9092-3b4daca64bd5','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','miguel@domain.com','success',NULL,'0:0:0:0:0:0:0:1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-14 21:16:29'),('89fdb928-8cc7-48a7-b629-7b12bd5a5d77','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat_sql','e2d46057-0642-421d-9092-3b4daca64bd5',NULL,'miguel@domain.com','failed','Invalid credentials','83.43.164.9','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 16:19:48'),('8b2648c6-5646-436f-9f0a-1ce389944701','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat-sql','e2d46057-0642-421d-9092-3b4daca64bd5','d743b58b-ddbe-401c-806f-0c9209f05cf4','maria@maria.com','success',NULL,'83.43.164.9','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 16:45:06'),('b31f5abb-f45e-47f9-9e1b-a5ae32af513b','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chatbot-ticketing','719380ad-49e4-48a4-8ffa-738a9f67fcf7','82ddfa1d-e882-41c9-87d9-c49d6d574232','fellipe@felipe.com','success',NULL,'0:0:0:0:0:0:0:1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-14 16:43:43'),('b43983d4-ff42-498d-8092-9f18ffd97ba9','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat-sql','e2d46057-0642-421d-9092-3b4daca64bd5','d743b58b-ddbe-401c-806f-0c9209f05cf4','maria@maria.com','success',NULL,'83.43.164.9','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 16:49:22'),('bf31e6bf-3fa7-46d7-99c4-3b67a11a2288','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat_sql','e2d46057-0642-421d-9092-3b4daca64bd5',NULL,NULL,'failed','Invalid credentials','83.43.164.9','curl/8.7.1','2026-02-17 16:28:32'),('cfd28bc5-8c65-4b14-adf5-5a35029d90bb','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat-sql','e2d46057-0642-421d-9092-3b4daca64bd5','d743b58b-ddbe-401c-806f-0c9209f05cf4','maria@maria.com','success',NULL,'83.43.164.9','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 17:24:26'),('d25fd90f-8ac5-4149-9d1c-56cc8be82f98','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat_sql','e2d46057-0642-421d-9092-3b4daca64bd5',NULL,'miguel@domain.com','failed','Invalid credentials','83.43.164.9','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 16:17:56'),('dc274c82-242f-4137-a5c8-23f116b9b395','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat-sql','e2d46057-0642-421d-9092-3b4daca64bd5','d743b58b-ddbe-401c-806f-0c9209f05cf4','maria@maria.com','success',NULL,'83.43.164.9','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 16:44:19'),('e84acc41-cab3-4ab6-a81b-6943214145fc','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chatbot-ticketing','719380ad-49e4-48a4-8ffa-738a9f67fcf7','82ddfa1d-e882-41c9-87d9-c49d6d574232','fellipe@felipe.com','success',NULL,'0:0:0:0:0:0:0:1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-14 13:48:58'),('f9fe5452-c6e0-4195-85c4-9205fc8c8890','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat_sql','e2d46057-0642-421d-9092-3b4daca64bd5',NULL,'miguel@domain.com','failed','Invalid credentials','83.43.164.9','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','2026-02-17 16:13:43');
/*!40000 ALTER TABLE `tenant_login_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_pricings`
--

DROP TABLE IF EXISTS `tenant_pricings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_pricings` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `pricingId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_pricing` (`tenantId`,`pricingId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_pricings`
--

LOCK TABLES `tenant_pricings` WRITE;
/*!40000 ALTER TABLE `tenant_pricings` DISABLE KEYS */;
INSERT INTO `tenant_pricings` VALUES ('00f0609d-9b6e-41e9-8b6a-cab6c5d13a7f','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','670322fc-0d38-4244-9c8f-431a60d37753','2026-02-12 18:52:59'),('fbbadf67-0317-4d94-8a42-b31d96a39d3e','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','3590734f-970c-47c9-9a09-e86b587c2d72','2026-02-12 18:52:59');
/*!40000 ALTER TABLE `tenant_pricings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_service_api_keys`
--

DROP TABLE IF EXISTS `tenant_service_api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_service_api_keys` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `serviceCode` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `hashedKey` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `encryptedKey` text COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_service_api_keys_service` (`tenantId`,`serviceCode`),
  KEY `idx_tenant_service_api_keys_hash` (`hashedKey`),
  KEY `idx_tenant_service_api_keys_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_service_api_keys`
--

LOCK TABLES `tenant_service_api_keys` WRITE;
/*!40000 ALTER TABLE `tenant_service_api_keys` DISABLE KEYS */;
INSERT INTO `tenant_service_api_keys` VALUES ('e2d46057-0642-421d-9092-3b4daca64bd5','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat-sql','0be9ecb5b9207a98040766fb4aeb54d0a891e1a34ad5ce2908aafdeb897e761f','uUD91xKUzXY+f6dPSPCnlis+h6TgLpuS5DSdkKGV5DXIUjYDhirGLFQe8ZUqEjjbmnKKl64lrc14kwyjkzOccJrkXkeFo606iyKiiQu9LDt0iAW+GiE1l8eFHPA=','active','2026-02-14 19:47:49');
/*!40000 ALTER TABLE `tenant_service_api_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_service_configs`
--

DROP TABLE IF EXISTS `tenant_service_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_service_configs` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `serviceCode` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `systemPrompt` text COLLATE utf8mb4_general_ci,
  `providerId` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `pricingId` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `policyId` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `apiBaseUrl` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_service_config` (`tenantId`,`serviceCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_service_configs`
--

LOCK TABLES `tenant_service_configs` WRITE;
/*!40000 ALTER TABLE `tenant_service_configs` DISABLE KEYS */;
INSERT INTO `tenant_service_configs` VALUES ('4204bebb-fea3-4dfc-aec6-6d39f6f3b102','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat-sql','active','Eres el asistente del servicio {{SERVICE_CODE}}. \nTu prioridad es responder con información verificada.\n\nSi una pregunta requiere datos actualizados o específicos, utiliza los ENDPOINTS disponibles.\nSi hay endpoints, consulta primero la fuente adecuada y responde con los datos obtenidos.\nSi no hay endpoints o no aportan datos, responde con la información disponible y avisa si falta contexto.\n\nLímites:\n- No respondas preguntas fuera del dominio del servicio.\n- No inventes datos ni completes con suposiciones.\n- Si la pregunta no se puede responder usando los endpoints o el contexto definido, di claramente: \n  “No puedo responder a eso porque no está en mi ámbito de datos.”\n\nNo des consejos legales, médicos o financieros. \nNo reveles claves, credenciales ni información sensible.\n\nÁmbito permitido: base de datos, SQL, tablas, consultas, esquema, coches, vehículos, productos\nRespuesta fuera de ámbito: No tengo información para responder a esa pregunta.\n\nCuando haya endpoints disponibles, NO pidas confirmación ni anuncies la búsqueda. Consulta y responde directamente con los datos.\nNo anuncies búsquedas ni pidas confirmación. Consulta los endpoints y responde directamente con los datos.','500672f6-0365-4cae-a026-129f871875f9','5917a6e8-1ebb-47ac-a3b7-9ff23452a285','e7fb096e-c466-4205-9465-0948a77f1e70','2026-02-14 19:47:49','2026-02-17 16:42:35','https://ia-backend-develop.up.railway.app');
/*!40000 ALTER TABLE `tenant_service_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_service_endpoints`
--

DROP TABLE IF EXISTS `tenant_service_endpoints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_service_endpoints` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `serviceCode` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `slug` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `method` varchar(12) COLLATE utf8mb4_general_ci NOT NULL,
  `path` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `baseUrl` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `headers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `responsePath` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_service_endpoint` (`tenantId`,`serviceCode`,`slug`),
  CONSTRAINT `tenant_service_endpoints_chk_1` CHECK (json_valid(`headers`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_service_endpoints`
--

LOCK TABLES `tenant_service_endpoints` WRITE;
/*!40000 ALTER TABLE `tenant_service_endpoints` DISABLE KEYS */;
INSERT INTO `tenant_service_endpoints` VALUES ('79788aa0-3485-4ca3-9e21-29a1052d5fe4','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat-sql','products','GET','/products',NULL,'{\"Authorization\":\"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNjMwNDQ4YS0yYjM4LTQ4YWYtOGMzNi0zOTNmZDAwY2Y1YWQiLCJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsImlhdCI6MTc2NTM5NzMwNywiZXhwIjoxNzY1NDAwOTA3fQ.gLjru3oEfe2SB6ebcBT7RE8SSxFfyJkk7l1aVOF3aoo\"}',1,'2026-02-14 20:37:08','2026-02-17 16:42:57','list');
/*!40000 ALTER TABLE `tenant_service_endpoints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_service_users`
--

DROP TABLE IF EXISTS `tenant_service_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_service_users` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `serviceCode` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_service_user` (`tenantId`,`serviceCode`,`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_service_users`
--

LOCK TABLES `tenant_service_users` WRITE;
/*!40000 ALTER TABLE `tenant_service_users` DISABLE KEYS */;
INSERT INTO `tenant_service_users` VALUES ('3ec8fdfb-c52e-44b5-9898-666c8ca78954','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat-sql','d743b58b-ddbe-401c-806f-0c9209f05cf4','active','2026-02-17 15:53:25','2026-02-17 16:43:17'),('d836b264-e836-4ede-acef-e98fed36a460','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','chat-sql','d94d55bf-4f6b-4f25-ac64-3267a94a51a2','active','2026-02-14 19:50:58','2026-02-17 16:43:23');
/*!40000 ALTER TABLE `tenant_service_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_services`
--

DROP TABLE IF EXISTS `tenant_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_services` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `genericEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `ocrEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `sqlEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_services_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_services`
--

LOCK TABLES `tenant_services` WRITE;
/*!40000 ALTER TABLE `tenant_services` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenant_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `killSwitch` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `billingEmail` varchar(180) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `companyName` varchar(180) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `contactName` varchar(180) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(40) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `addressLine1` varchar(180) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `addressLine2` varchar(180) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `city` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `postalCode` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `country` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `billingAddressLine1` varchar(180) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `billingAddressLine2` varchar(180) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `billingCity` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `billingPostalCode` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `billingCountry` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `taxId` varchar(40) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `website` varchar(180) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `authUsername` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `authPasswordHash` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `authMustChangePassword` tinyint(1) NOT NULL DEFAULT '0',
  `language` varchar(8) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'es',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenants_auth_username` (`authUsername`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES ('f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','Demo Tenant Client. SA','active',0,'2026-02-12 12:21:40','2026-02-15 22:14:57','info@softecnia.es','Webentorn','Rafael Peña Vargas','622022812','C/ Velazquez 2 1-7',NULL,'Torredembarra','43830','España','C/ Velazquez 2 1-7',NULL,'Tarragona','43830','España','43735032A','http://www.webentorn.com','demo','8b13d62235f32c2dbf377e5f1f71f22a26a359a72f131139f02f0b09b223db70',1,'es');
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usage_events`
--

DROP TABLE IF EXISTS `usage_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usage_events` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `providerId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `model` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `serviceCode` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tokensIn` int NOT NULL,
  `tokensOut` int NOT NULL,
  `costUsd` decimal(10,6) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usage_events`
--

LOCK TABLES `usage_events` WRITE;
/*!40000 ALTER TABLE `usage_events` DISABLE KEYS */;
INSERT INTO `usage_events` VALUES ('0494ed28-a7b1-4260-9f1c-c9ae5be9e55e','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini',NULL,8,10,0.000019,'2026-02-12 19:17:56'),('0ae0606d-ce4b-4edb-a642-39d79f7ff78e','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini',NULL,8,10,0.000019,'2026-02-12 19:21:48'),('166d310e-e8f7-4a07-a275-8c8363eded67','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',797,19,0.000131,'2026-02-14 21:34:11'),('1dfeb470-bbec-4e6f-ae86-4051fae00e22','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',817,19,0.000134,'2026-02-14 21:35:55'),('222c189e-7af1-4ea6-91d2-32f3a0d3675b','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat-sql',1964,308,0.000000,'2026-02-17 17:01:50'),('2e2e1799-050e-496f-b9b0-31f6fa9e2db4','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',2266,203,0.000462,'2026-02-14 22:15:40'),('32fd4b37-e059-4202-9ad2-0fae30352191','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',874,14,0.000139,'2026-02-14 21:41:51'),('337be8f2-a305-43d8-84b5-b3be9e3c3712','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',690,116,0.000173,'2026-02-14 20:21:33'),('3396f2b0-4c67-4723-97bf-e9d6b5d2de13','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',40,53,0.000038,'2026-02-14 20:11:41'),('4d4d3ae8-5226-41b8-b941-dd4e3ab3dc58','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',861,14,0.000138,'2026-02-14 21:44:37'),('51a69df0-596e-40a1-85dd-63f4a69baf1f','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',845,14,0.000135,'2026-02-14 21:47:02'),('54384c67-906f-4a89-b8a3-75a39f419058','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',857,19,0.000140,'2026-02-14 21:39:37'),('57b16a4b-2701-4309-8a20-66b20b2c60b2','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',850,24,0.000142,'2026-02-14 22:00:47'),('627dfb55-9619-4c11-aa21-09b9a0f57276','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',951,34,0.000163,'2026-02-14 21:25:15'),('70b2d98f-8f2e-4de4-ba02-bb8076e36fcf','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',864,19,0.000141,'2026-02-14 21:40:38'),('811cf8e4-e051-4f25-964e-13b46607e1ef','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',783,19,0.000129,'2026-02-14 21:30:47'),('8d626eef-0585-4a3c-997f-216339df2713','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',849,17,0.000138,'2026-02-14 21:37:04'),('8fa485b8-667a-4ae8-aeba-9d9e72eb494a','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini',NULL,8,10,0.000019,'2026-02-12 19:36:48'),('a065240b-32d2-4074-bcc5-bbe257a94cb4','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',768,21,0.000128,'2026-02-14 21:32:44'),('a2e02249-977e-4522-be94-89cc015d090a','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',108,146,0.000104,'2026-02-14 20:11:58'),('b2c3cf42-88ee-4ae6-93ce-adb1c1933504','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',269,128,0.000117,'2026-02-14 20:20:34'),('b56df07c-9eb2-4a42-a32b-7c95c48725b5','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',17,11,0.000009,'2026-02-14 20:03:46'),('b7d10de3-002f-4838-aff0-432c70637505','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',866,14,0.000138,'2026-02-14 21:44:02'),('b8542c92-a2bc-44e6-a98f-9e51b7d434ca','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',842,24,0.000141,'2026-02-14 21:39:51'),('bf3aae10-db42-4ea6-843c-7add664ca72b','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',823,94,0.000180,'2026-02-14 20:23:38'),('bf938ac2-24ad-4678-9924-6082a8e919d3','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',776,31,0.000135,'2026-02-14 21:32:51'),('d755464d-72de-4fd0-a74b-983afd993d3a','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4.1-mini','chat_sql',777,25,0.000132,'2026-02-14 21:35:21'),('fa9e4b9d-cd94-4f93-9431-9f27772d3663','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4o-mini','chatbot-ticketing',8,9,0.000007,'2026-02-13 17:08:54'),('fdb735bb-a3c8-4e9f-a817-7b2d978cdc59','f5f115c3-7f0c-4468-9611-ab4c7ac2ed16','500672f6-0365-4cae-a026-129f871875f9','gpt-4o-mini','chat_sql',8,9,0.000007,'2026-02-14 19:53:38');
/*!40000 ALTER TABLE `usage_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhooks`
--

DROP TABLE IF EXISTS `webhooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhooks` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `url` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `events` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `encryptedSecret` text COLLATE utf8mb4_general_ci,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `webhooks_chk_1` CHECK (json_valid(`events`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhooks`
--

LOCK TABLES `webhooks` WRITE;
/*!40000 ALTER TABLE `webhooks` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhooks` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-17 19:28:54
