"""
╔═══════════════════════════════════════════════════════════════════════╗
║                    WASSALI - BACKEND API v1.0                         ║
║                   Système de Livraison Tunisien                        ║
║                                                                       ║
║  Fonctionnalités :                                                    ║
║  - Gestion des Vendeurs                                              ║
║  - Gestion des Coursiers & Zones de Livraison                         ║
║  - Gestion des Colis & Commandes                                      ║
║  - Gestion de Compte Utilisateur                                      ║
║  - Authentification & Autorisation                                    ║
╚═══════════════════════════════════════════════════════════════════════╝
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import mysql.connector
from mysql.connector import Error
import json

# ═══════════════════════════════════════════════════════════════════════
# 1️⃣  INITIALISATION DE L'APPLICATION FASTAPI
# ═══════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="WASSALI API",
    description="API de gestion de livraison en Tunisie",
    version="1.0.0"
)

# 📡 Configuration CORS (Cross-Origin Resource Sharing)
# Permet au frontend Angular (localhost:4200) de communiquer avec le backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════
# 2️⃣  MODÈLES DE DONNÉES (PYDANTIC)
# ═══════════════════════════════════════════════════════════════════════

# 👤 Modèle pour l'authentification
class LoginSchema(BaseModel):
    """Modèle pour la connexion des utilisateurs"""
    email: str
    password: str

# 👤 Modèle de base pour les utilisateurs
class UserBase(BaseModel):
    """Champs communs à tous les utilisateurs"""
    nom: str
    email: str
    telephone: str

# 🏪 Modèle pour les Vendeurs
class VendeurCreate(UserBase):
    """Création d'un vendeur"""
    password: Optional[str] = None
    status: str = "actif"

class VendeurUpdate(BaseModel):
    """Mise à jour d'un vendeur"""
    nom: Optional[str] = None
    email: Optional[str] = None
    telephone: Optional[str] = None
    status: Optional[str] = None

# 🚚 Modèle pour les Coursiers
class CoursierCreate(UserBase):
    """Création d'un coursier"""
    password: Optional[str] = None
    zone: str
    status: str = "actif"

class CoursierUpdate(BaseModel):
    """Mise à jour d'un coursier"""
    nom: Optional[str] = None
    email: Optional[str] = None
    telephone: Optional[str] = None
    zone: Optional[str] = None
    status: Optional[str] = None

# 🗺️ Modèle pour les Zones de Livraison
class ZoneCreate(BaseModel):
    """Création d'une zone de livraison"""
    nom: str

class ZoneUpdate(BaseModel):
    """Mise à jour d'une zone"""
    nom: str

# 📦 Modèle pour les Colis/Commandes
class ColisCreate(BaseModel):
    """Création d'une commande/colis"""
    reference: str
    vendeur_id: int
    client_id: int
    date_estimation: str
    heure_estimation: str
    statut: str = "en_attente"

class ColisUpdate(BaseModel):
    """Mise à jour d'une commande"""
    statut: Optional[str] = None
    date_estimation: Optional[str] = None
    heure_estimation: Optional[str] = None

# 👤 Modèle pour la mise à jour de profil client
class ProfilUpdateSchema(BaseModel):
    """Mise à jour du profil utilisateur"""
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    adresse: Optional[str] = None

# ═══════════════════════════════════════════════════════════════════════
# 3️⃣  CONFIGURATION BASE DE DONNÉES
# ═══════════════════════════════════════════════════════════════════════

def get_db_connection():
    """
    Établit une connexion avec la base de données MySQL.
    
    Configurations :
    - Host : 127.0.0.1 (Local)
    - User : root
    - Database : wassali-backend
    """
    try:
        connection = mysql.connector.connect(
            host="127.0.0.1",
            user="root",
            password="",  # À remplir selon votre configuration
            database="wassali-backend"
        )
        if connection.is_connected():
            print("✅ Connexion à la base de données réussie")
            return connection
    except Error as e:
        print(f"❌ Erreur de connexion à la base de données : {e}")
        raise HTTPException(status_code=500, detail="Erreur de base de données")

# ═══════════════════════════════════════════════════════════════════════
# 4️⃣  FONCTIONS UTILITAIRES
# ═══════════════════════════════════════════════════════════════════════

def execute_query(query: str, params: tuple = None, fetch_one: bool = False, fetch_all: bool = False):
    """
    Exécute une requête SQL et retourne les résultats si applicable.
    
    Args:
        query : Requête SQL
        params : Paramètres pour la requête (tuple)
        fetch_one : Récupérer un seul résultat
        fetch_all : Récupérer tous les résultats
    
    Returns:
        Résultat de la requête ou booléen pour les opérations INSERT/UPDATE
    """
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        if fetch_one:
            result = cursor.fetchone()
            cursor.close()
            connection.close()
            return result
        elif fetch_all:
            result = cursor.fetchall()
            cursor.close()
            connection.close()
            return result
        else:
            connection.commit()
            cursor.close()
            connection.close()
            return True
    except Exception as e:
        print(f"❌ Erreur SQL : {e}")
        if connection:
            connection.rollback()
            connection.close()
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════
# 5️⃣  ENDPOINTS AUTHENTIFICATION
# ═══════════════════════════════════════════════════════════════════════

@app.post("/api/login")
async def login(credentials: LoginSchema):
    """
    🔐 Authentifie un utilisateur
    
    Cherche l'utilisateur dans la base de données et vérifie le mot de passe.
    Retourne les informations de l'utilisateur (ID, Nom, Email, Rôle, etc.)
    """
    print(f"🔐 Tentative de connexion : {credentials.email}")
    
    user = execute_query(
        "SELECT id_user, nom, prenom, email, telephone, adresse, role, is_active FROM users WHERE email = %s AND password = %s",
        (credentials.email, credentials.password),
        fetch_one=True
    )
    
    if user:
        print(f"✅ Connexion réussie pour {credentials.email}")
        return {
            "id": user['id_user'],
            "name": f"{user['prenom']} {user['nom']}".strip(),
            "nom": user['nom'],
            "prenom": user['prenom'],
            "email": user['email'],
            "phone": user['telephone'],
            "adresse": user['adresse'],
            "role": user['role'],
            "is_active": user['is_active']
        }
    else:
        print(f"❌ Identifiants invalides pour {credentials.email}")
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

# ═══════════════════════════════════════════════════════════════════════
# 6️⃣  ENDPOINTS VENDEURS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/vendeurs")
async def get_all_vendeurs():
    """
    📋 Récupère la liste de tous les vendeurs
    
    Retourne : ID, Nom, Email, Téléphone, Statut
    """
    print("📋 Récupération de tous les vendeurs...")
    
    vendeurs = execute_query(
        """SELECT id_user as id, nom, email, telephone as phone, 
                  (SELECT COUNT(*) FROM colis WHERE id_vendeur = id_user) as commandes,
                  CASE WHEN is_active = 1 THEN 'actif' ELSE 'suspendu' END as status
           FROM users WHERE role = 'vendeur'""",
        fetch_all=True
    )
    
    return vendeurs or []

@app.get("/api/vendeurs/{vendeur_id}")
async def get_vendeur(vendeur_id: int):
    """
    🔍 Récupère les détails d'un vendeur spécifique
    
    Param : vendeur_id (ID du vendeur)
    Retourne : Détails complets du vendeur
    """
    print(f"🔍 Récupération du vendeur {vendeur_id}...")
    
    vendeur = execute_query(
        """SELECT id_user as id, nom, email, telephone as phone, 
                  CASE WHEN is_active = 1 THEN 'actif' ELSE 'suspendu' END as status
           FROM users WHERE id_user = %s AND role = 'vendeur'""",
        (vendeur_id,),
        fetch_one=True
    )
    
    if vendeur:
        return vendeur
    else:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé")

@app.post("/api/vendeurs")
async def create_vendeur(vendeur: VendeurCreate):
    """
    ➕ Crée un nouveau vendeur
    
    Reçoit : Nom, Email, Téléphone, Statut
    Retourne : ID du vendeur créé
    """
    print(f"➕ Création d'un nouveau vendeur : {vendeur.nom}")
    
    try:
        is_active = 1 if vendeur.status == "actif" else 0
        
        execute_query(
            """INSERT INTO users (nom, email, telephone, password, role, is_active, created_at) 
               VALUES (%s, %s, %s, %s, %s, %s, NOW())""",
            (vendeur.nom, vendeur.email, vendeur.telephone, vendeur.password or "temp123", "vendeur", is_active)
        )
        
        print(f"✅ Vendeur créé avec succès : {vendeur.nom}")
        return {"status": "success", "message": "Vendeur créé avec succès", "nom": vendeur.nom}
    except Exception as e:
        print(f"❌ Erreur lors de la création du vendeur : {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/vendeurs/{vendeur_id}")
async def update_vendeur(vendeur_id: int, vendeur: VendeurUpdate):
    """
    ✏️ Modifie un vendeur existant
    
    Param : vendeur_id (ID du vendeur à modifier)
    Reçoit : Champs à mettre à jour (nom, email, téléphone, statut)
    """
    print(f"✏️ Modification du vendeur {vendeur_id}...")
    
    try:
        updates = []
        params = []
        
        if vendeur.nom:
            updates.append("nom = %s")
            params.append(vendeur.nom)
        if vendeur.email:
            updates.append("email = %s")
            params.append(vendeur.email)
        if vendeur.telephone:
            updates.append("telephone = %s")
            params.append(vendeur.telephone)
        if vendeur.status:
            is_active = 1 if vendeur.status == "actif" else 0
            updates.append("is_active = %s")
            params.append(is_active)
        
        if not updates:
            raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
        
        params.append(vendeur_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id_user = %s AND role = 'vendeur'"
        
        execute_query(query, tuple(params))
        
        print(f"✅ Vendeur {vendeur_id} modifié avec succès")
        return {"status": "success", "message": "Vendeur modifié avec succès"}
    except Exception as e:
        print(f"❌ Erreur lors de la modification : {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/vendeurs/{vendeur_id}")
async def delete_vendeur(vendeur_id: int):
    """
    🗑️ Supprime un vendeur
    
    Param : vendeur_id (ID du vendeur à supprimer)
    Note : Supprime également tous les colis associés
    """
    print(f"🗑️ Suppression du vendeur {vendeur_id}...")
    
    try:
        # Vérifier si le vendeur existe
        vendeur = execute_query(
            "SELECT nom FROM users WHERE id_user = %s AND role = 'vendeur'",
            (vendeur_id,),
            fetch_one=True
        )
        
        if not vendeur:
            raise HTTPException(status_code=404, detail="Vendeur non trouvé")
        
        # Supprimer les colis du vendeur
        execute_query("DELETE FROM colis WHERE id_vendeur = %s", (vendeur_id,))
        
        # Supprimer le vendeur
        execute_query("DELETE FROM users WHERE id_user = %s", (vendeur_id,))
        
        print(f"✅ Vendeur {vendeur_id} supprimé avec succès")
        return {"status": "success", "message": f"Vendeur '{vendeur['nom']}' supprimé avec succès"}
    except Exception as e:
        print(f"❌ Erreur lors de la suppression : {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════
# 7️⃣  ENDPOINTS COURSIERS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/coursiers")
async def get_all_coursiers():
    """
    📋 Récupère la liste de tous les coursiers
    
    Retourne : ID, Nom, Email, Téléphone, Zone assignée, Statut
    """
    print("📋 Récupération de tous les coursiers...")
    
    coursiers = execute_query(
        """SELECT u.id_user as id, u.nom, u.email, u.telephone as phone, 
                  COALESCE((SELECT nom FROM zones WHERE id_zone = c.zone_id), 'Non assigné') as zone,
                  CASE WHEN u.is_active = 1 THEN 'actif' ELSE 'inactif' END as status,
                  (SELECT COUNT(*) FROM colis WHERE id_coursier = u.id_user AND statut IN ('en_livraison', 'en_cours')) as livraisons_en_cours
           FROM users u 
           LEFT JOIN coursier c ON u.id_user = c.id_coursier
           WHERE u.role = 'coursier'""",
        fetch_all=True
    )
    
    return coursiers or []

@app.get("/api/coursiers/{coursier_id}")
async def get_coursier(coursier_id: int):
    """
    🔍 Récupère les détails d'un coursier spécifique
    
    Param : coursier_id (ID du coursier)
    """
    print(f"🔍 Récupération du coursier {coursier_id}...")
    
    coursier = execute_query(
        """SELECT u.id_user as id, u.nom, u.email, u.telephone as phone,
                  COALESCE((SELECT nom FROM zones WHERE id_zone = c.zone_id), 'Non assigné') as zone,
                  CASE WHEN u.is_active = 1 THEN 'actif' ELSE 'inactif' END as status
           FROM users u 
           LEFT JOIN coursier c ON u.id_user = c.id_coursier
           WHERE u.id_user = %s AND u.role = 'coursier'""",
        (coursier_id,),
        fetch_one=True
    )
    
    if coursier:
        return coursier
    else:
        raise HTTPException(status_code=404, detail="Coursier non trouvé")

@app.post("/api/coursiers")
async def create_coursier(coursier: CoursierCreate):
    """
    ➕ Crée un nouveau coursier
    
    Reçoit : Nom, Email, Téléphone, Zone assignée, Statut
    """
    print(f"➕ Création d'un nouveau coursier : {coursier.nom}")
    
    try:
        is_active = 1 if coursier.status == "actif" else 0
        
        execute_query(
            """INSERT INTO users (nom, email, telephone, password, role, is_active, created_at) 
               VALUES (%s, %s, %s, %s, %s, %s, NOW())""",
            (coursier.nom, coursier.email, coursier.telephone, coursier.password or "temp123", "coursier", is_active)
        )
        
        # Récupérer l'ID du coursier créé
        user = execute_query(
            "SELECT id_user FROM users WHERE email = %s",
            (coursier.email,),
            fetch_one=True
        )
        
        if user:
            # Récupérer l'ID de la zone
            zone = execute_query(
                "SELECT id_zone FROM zones WHERE nom = %s",
                (coursier.zone,),
                fetch_one=True
            )
            
            zone_id = zone['id_zone'] if zone else None
            
            # Insérer dans la table coursier
            execute_query(
                """INSERT INTO coursier (id_coursier, zone_id, created_at) 
                   VALUES (%s, %s, NOW())""",
                (user['id_user'], zone_id)
            )
        
        print(f"✅ Coursier créé avec succès : {coursier.nom}")
        return {"status": "success", "message": "Coursier créé avec succès", "nom": coursier.nom}
    except Exception as e:
        print(f"❌ Erreur lors de la création du coursier : {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/coursiers/{coursier_id}")
async def update_coursier(coursier_id: int, coursier: CoursierUpdate):
    """
    ✏️ Modifie un coursier existant
    
    Param : coursier_id (ID du coursier)
    Reçoit : Champs à mettre à jour
    """
    print(f"✏️ Modification du coursier {coursier_id}...")
    
    try:
        updates = []
        params = []
        
        if coursier.nom:
            updates.append("nom = %s")
            params.append(coursier.nom)
        if coursier.email:
            updates.append("email = %s")
            params.append(coursier.email)
        if coursier.telephone:
            updates.append("telephone = %s")
            params.append(coursier.telephone)
        if coursier.status:
            is_active = 1 if coursier.status == "actif" else 0
            updates.append("is_active = %s")
            params.append(is_active)
        
        if updates:
            params.append(coursier_id)
            query = f"UPDATE users SET {', '.join(updates)} WHERE id_user = %s AND role = 'coursier'"
            execute_query(query, tuple(params))
        
        # Mettre à jour la zone si fournie
        if coursier.zone:
            zone = execute_query(
                "SELECT id_zone FROM zones WHERE nom = %s",
                (coursier.zone,),
                fetch_one=True
            )
            
            if zone:
                execute_query(
                    "UPDATE coursier SET zone_id = %s WHERE id_coursier = %s",
                    (zone['id_zone'], coursier_id)
                )
        
        print(f"✅ Coursier {coursier_id} modifié avec succès")
        return {"status": "success", "message": "Coursier modifié avec succès"}
    except Exception as e:
        print(f"❌ Erreur lors de la modification : {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/coursiers/{coursier_id}")
async def delete_coursier(coursier_id: int):
    """
    🗑️ Supprime un coursier
    
    Param : coursier_id (ID du coursier à supprimer)
    """
    print(f"🗑️ Suppression du coursier {coursier_id}...")
    
    try:
        # Vérifier si le coursier existe
        coursier = execute_query(
            "SELECT nom FROM users WHERE id_user = %s AND role = 'coursier'",
            (coursier_id,),
            fetch_one=True
        )
        
        if not coursier:
            raise HTTPException(status_code=404, detail="Coursier non trouvé")
        
        # Supprimer les enregistrements dans la table coursier
        execute_query("DELETE FROM coursier WHERE id_coursier = %s", (coursier_id,))
        
        # Supprimer le coursier de la table users
        execute_query("DELETE FROM users WHERE id_user = %s", (coursier_id,))
        
        print(f"✅ Coursier {coursier_id} supprimé avec succès")
        return {"status": "success", "message": f"Coursier '{coursier['nom']}' supprimé avec succès"}
    except Exception as e:
        print(f"❌ Erreur lors de la suppression : {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════
# 8️⃣  ENDPOINTS ZONES DE LIVRAISON
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/zones")
async def get_all_zones():
    """
    📋 Récupère toutes les zones de livraison disponibles
    
    Retourne : ID Zone, Nom, Nombre de coursiers assignés
    """
    print("📋 Récupération de toutes les zones...")
    
    zones = execute_query(
        """SELECT z.id_zone as id, z.nom,
                  COUNT(c.id_coursier) as coursiers_assignes
           FROM zones z 
           LEFT JOIN coursier c ON z.id_zone = c.zone_id
           GROUP BY z.id_zone, z.nom""",
        fetch_all=True
    )
    
    return zones or []

@app.get("/api/zones/{zone_id}")
async def get_zone(zone_id: int):
    """
    🔍 Récupère les détails d'une zone spécifique
    
    Param : zone_id (ID de la zone)
    Retourne : Informations de la zone et coursiers assignés
    """
    print(f"🔍 Récupération de la zone {zone_id}...")
    
    zone = execute_query(
        """SELECT z.id_zone as id, z.nom,
                  COUNT(c.id_coursier) as coursiers_assignes
           FROM zones z 
           LEFT JOIN coursier c ON z.id_zone = c.zone_id
           WHERE z.id_zone = %s
           GROUP BY z.id_zone, z.nom""",
        (zone_id,),
        fetch_one=True
    )
    
    if zone:
        return zone
    else:
        raise HTTPException(status_code=404, detail="Zone non trouvée")

@app.post("/api/zones")
async def create_zone(zone: ZoneCreate):
    """
    ➕ Crée une nouvelle zone de livraison
    
    Reçoit : Nom de la zone
    """
    print(f"➕ Création d'une nouvelle zone : {zone.nom}")
    
    try:
        # Vérifier si la zone existe déjà
        existing = execute_query(
            "SELECT id_zone FROM zones WHERE nom = %s",
            (zone.nom,),
            fetch_one=True
        )
        
        if existing:
            raise HTTPException(status_code=400, detail="Cette zone existe déjà")
        
        execute_query(
            "INSERT INTO zones (nom, created_at) VALUES (%s, NOW())",
            (zone.nom,)
        )
        
        print(f"✅ Zone créée avec succès : {zone.nom}")
        return {"status": "success", "message": "Zone créée avec succès", "nom": zone.nom}
    except Exception as e:
        print(f"❌ Erreur lors de la création de la zone : {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/zones/{zone_id}")
async def update_zone(zone_id: int, zone: ZoneUpdate):
    """
    ✏️ Modifie une zone existante
    
    Param : zone_id (ID de la zone)
    Reçoit : Nouveau nom de la zone
    """
    print(f"✏️ Modification de la zone {zone_id}...")
    
    try:
        # Vérifier si la zone existe
        existing = execute_query(
            "SELECT id_zone FROM zones WHERE id_zone = %s",
            (zone_id,),
            fetch_one=True
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Zone non trouvée")
        
        execute_query(
            "UPDATE zones SET nom = %s WHERE id_zone = %s",
            (zone.nom, zone_id)
        )
        
        print(f"✅ Zone {zone_id} modifiée avec succès")
        return {"status": "success", "message": "Zone modifiée avec succès"}
    except Exception as e:
        print(f"❌ Erreur lors de la modification : {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/zones/{zone_id}")
async def delete_zone(zone_id: int):
    """
    🗑️ Supprime une zone de livraison
    
    Param : zone_id (ID de la zone à supprimer)
    Note : Impossible de supprimer si des coursiers sont assignés
    """
    print(f"🗑️ Suppression de la zone {zone_id}...")
    
    try:
        # Vérifier si des coursiers sont assignés à cette zone
        coursiers = execute_query(
            "SELECT COUNT(*) as count FROM coursier WHERE zone_id = %s",
            (zone_id,),
            fetch_one=True
        )
        
        if coursiers and coursiers['count'] > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Impossible de supprimer. {coursiers['count']} coursier(s) assigné(s) à cette zone"
            )
        
        # Vérifier si la zone existe
        zone = execute_query(
            "SELECT nom FROM zones WHERE id_zone = %s",
            (zone_id,),
            fetch_one=True
        )
        
        if not zone:
            raise HTTPException(status_code=404, detail="Zone non trouvée")
        
        execute_query("DELETE FROM zones WHERE id_zone = %s", (zone_id,))
        
        print(f"✅ Zone {zone_id} supprimée avec succès")
        return {"status": "success", "message": f"Zone '{zone['nom']}' supprimée avec succès"}
    except Exception as e:
        print(f"❌ Erreur lors de la suppression : {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════
# 9️⃣  ENDPOINTS COLIS / COMMANDES
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/colis")
async def get_all_colis():
    """
    📋 Récupère la liste de tous les colis
    
    Retourne : Référence, Vendeur, Client, Statut, Date estimation
    """
    print("📋 Récupération de tous les colis...")
    
    colis_list = execute_query(
        """SELECT c.id_colis as id, c.reference, 
                  (SELECT nom FROM users WHERE id_user = c.id_vendeur) as vendeur,
                  (SELECT nom FROM users WHERE id_user = c.id_client) as client,
                  c.date_estimation, c.heure_estimation, c.statut
           FROM colis c
           ORDER BY c.created_at DESC""",
        fetch_all=True
    )
    
    return colis_list or []

@app.get("/api/colis/{colis_id}")
async def get_colis(colis_id: int):
    """
    🔍 Récupère les détails d'un colis spécifique
    
    Param : colis_id (ID du colis)
    """
    print(f"🔍 Récupération du colis {colis_id}...")
    
    colis = execute_query(
        """SELECT c.id_colis as id, c.reference,
                  (SELECT nom FROM users WHERE id_user = c.id_vendeur) as vendeur,
                  (SELECT nom FROM users WHERE id_user = c.id_client) as client,
                  c.date_estimation, c.heure_estimation, c.statut, c.created_at
           FROM colis c
           WHERE c.id_colis = %s""",
        (colis_id,),
        fetch_one=True
    )
    
    if colis:
        return colis
    else:
        raise HTTPException(status_code=404, detail="Colis non trouvé")

@app.get("/api/colis/client/{client_id}")
async def get_colis_by_client(client_id: int):
    """
    📦 Récupère tous les colis d'un client spécifique
    
    Param : client_id (ID du client)
    """
    print(f"📦 Récupération des colis du client {client_id}...")
    
    colis_list = execute_query(
        """SELECT c.id_colis as id, c.reference,
                  (SELECT nom FROM users WHERE id_user = c.id_vendeur) as vendeur,
                  c.date_estimation, c.heure_estimation, c.statut
           FROM colis c
           WHERE c.id_client = %s
           ORDER BY c.created_at DESC""",
        (client_id,),
        fetch_all=True
    )
    
    return colis_list or []

@app.post("/api/colis")
async def create_colis(colis: ColisCreate):
    """
    ➕ Crée une nouvelle commande/colis
    
    Reçoit : Référence, ID Vendeur, ID Client, Date estimation, Heure estimation
    """
    print(f"➕ Création d'une nouvelle commande : {colis.reference}")
    
    try:
        execute_query(
            """INSERT INTO colis (reference, id_vendeur, id_client, date_estimation, 
                                 heure_estimation, statut, created_at) 
               VALUES (%s, %s, %s, %s, %s, %s, NOW())""",
            (colis.reference, colis.vendeur_id, colis.client_id, 
             colis.date_estimation, colis.heure_estimation, colis.statut)
        )
        
        print(f"✅ Commande créée avec succès : {colis.reference}")
        return {"status": "success", "message": "Commande créée avec succès", "reference": colis.reference}
    except Exception as e:
        print(f"❌ Erreur lors de la création de la commande : {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/colis/{colis_id}")
async def update_colis(colis_id: int, colis: ColisUpdate):
    """
    ✏️ Modifie un colis existant
    
    Param : colis_id (ID du colis)
    Reçoit : Statut, Date estimation, Heure estimation
    """
    print(f"✏️ Modification du colis {colis_id}...")
    
    try:
        updates = []
        params = []
        
        if colis.statut:
            updates.append("statut = %s")
            params.append(colis.statut)
        if colis.date_estimation:
            updates.append("date_estimation = %s")
            params.append(colis.date_estimation)
        if colis.heure_estimation:
            updates.append("heure_estimation = %s")
            params.append(colis.heure_estimation)
        
        if not updates:
            raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
        
        params.append(colis_id)
        query = f"UPDATE colis SET {', '.join(updates)} WHERE id_colis = %s"
        
        execute_query(query, tuple(params))
        
        print(f"✅ Colis {colis_id} modifié avec succès")
        return {"status": "success", "message": "Colis modifié avec succès"}
    except Exception as e:
        print(f"❌ Erreur lors de la modification : {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/colis/{colis_id}")
async def delete_colis(colis_id: int):
    """
    🗑️ Supprime un colis
    
    Param : colis_id (ID du colis à supprimer)
    """
    print(f"🗑️ Suppression du colis {colis_id}...")
    
    try:
        # Vérifier si le colis existe
        colis = execute_query(
            "SELECT reference FROM colis WHERE id_colis = %s",
            (colis_id,),
            fetch_one=True
        )
        
        if not colis:
            raise HTTPException(status_code=404, detail="Colis non trouvé")
        
        execute_query("DELETE FROM colis WHERE id_colis = %s", (colis_id,))
        
        print(f"✅ Colis {colis_id} supprimé avec succès")
        return {"status": "success", "message": f"Colis '{colis['reference']}' supprimé avec succès"}
    except Exception as e:
        print(f"❌ Erreur lors de la suppression : {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════
# 🔟  ENDPOINTS GESTION DE COMPTE UTILISATEUR
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/profil/{user_id}")
async def get_user_profile(user_id: int):
    """
    👤 Récupère le profil complet d'un utilisateur
    
    Param : user_id (ID de l'utilisateur)
    Retourne : Toutes les informations du profil
    """
    print(f"👤 Récupération du profil utilisateur {user_id}...")
    
    user = execute_query(
        """SELECT id_user as id, nom, prenom, email, telephone as phone, 
                 adresse, role, is_active
          FROM users WHERE id_user = %s""",
        (user_id,),
        fetch_one=True
    )
    
    if user:
        return {
            "id": user['id'],
            "name": f"{user['prenom']} {user['nom']}".strip(),
            "nom": user['nom'],
            "prenom": user['prenom'],
            "email": user['email'],
            "phone": user['phone'],
            "adresse": user['adresse'],
            "role": user['role']
        }
    else:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

@app.put("/api/profil/{user_id}")
async def update_user_profile(user_id: int, profil: ProfilUpdateSchema):
    """
    ✏️ Modifie le profil d'un utilisateur
    
    Param : user_id (ID de l'utilisateur)
    Reçoit : Nom, Email, Téléphone, Adresse
    """
    print(f"✏️ Mise à jour du profil utilisateur {user_id}...")
    
    try:
        updates = []
        params = []
        
        if profil.nom is not None:
            updates.append("nom = %s")
            params.append(profil.nom)
            
        if profil.prenom is not None:
            updates.append("prenom = %s")
            params.append(profil.prenom)
        
        if profil.email:
            updates.append("email = %s")
            params.append(profil.email)
        
        if profil.phone:
            updates.append("telephone = %s")
            params.append(profil.phone)
        
        if profil.adresse:
            updates.append("adresse = %s")
            params.append(profil.adresse)
        
        if not updates:
            raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
        
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id_user = %s"
        
        execute_query(query, tuple(params))
        
        print(f"✅ Profil utilisateur {user_id} modifié avec succès")
        return {"status": "success", "message": "Profil modifié avec succès"}
    except Exception as e:
        print(f"❌ Erreur lors de la modification du profil : {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════
# 🔟 ①  ENDPOINTS UTILITAIRES / SANTÉ
# ═══════════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    """
    🏠 Route racine - Bienvenue
    """
    return {
        "message": "Bienvenue dans l'API WASSALI",
        "version": "1.0.0",
        "endpoints": {
            "authentification": "/api/login",
            "vendeurs": "/api/vendeurs",
            "coursiers": "/api/coursiers",
            "zones": "/api/zones",
            "colis": "/api/colis",
            "profil": "/api/profil/{user_id}"
        }
    }

@app.get("/api/health")
async def health_check():
    """
    💚 Vérification de la santé de l'API
    """
    print("💚 Vérification de la santé de l'API...")
    
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        connection.close()
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"❌ Problème de santé : {e}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

@app.get("/api/stats")
async def get_stats():
    """
    📊 Statistiques globales de la plateforme
    """
    print("📊 Récupération des statistiques...")
    
    try:
        # Nombre total de vendeurs
        vendeurs = execute_query(
            "SELECT COUNT(*) as count FROM users WHERE role = 'vendeur'",
            fetch_one=True
        )
        
        # Nombre total de coursiers
        coursiers = execute_query(
            "SELECT COUNT(*) as count FROM users WHERE role = 'coursier'",
            fetch_one=True
        )
        
        # Nombre total de clients
        clients = execute_query(
            "SELECT COUNT(*) as count FROM users WHERE role = 'client'",
            fetch_one=True
        )
        
        # Total de colis
        colis_total = execute_query(
            "SELECT COUNT(*) as count FROM colis",
            fetch_one=True
        )
        
        # Colis livrés
        colis_livres = execute_query(
            "SELECT COUNT(*) as count FROM colis WHERE statut = 'livré'",
            fetch_one=True
        )
        
        return {
            "vendeurs": vendeurs['count'] if vendeurs else 0,
            "coursiers": coursiers['count'] if coursiers else 0,
            "clients": clients['count'] if clients else 0,
            "total_colis": colis_total['count'] if colis_total else 0,
            "colis_livres": colis_livres['count'] if colis_livres else 0,
            "taux_livraison": f"{(colis_livres['count'] / colis_total['count'] * 100) if colis_total['count'] > 0 else 0:.2f}%"
        }
    except Exception as e:
        print(f"❌ Erreur lors de la récupération des statistiques : {e}")
        return {"error": str(e)}

# ═══════════════════════════════════════════════════════════════════════
# 🚀 DÉMARRAGE DE L'APPLICATION
# ═══════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("""
    ╔═════════════════════════════════════════════════════════════╗
    ║                 🚀 WASSALI API v1.0                         ║
    ║                                                             ║
    ║  Démarrage du serveur FastAPI...                           ║
    ║  URL : http://localhost:8000                               ║
    ║  Documentation : http://localhost:8000/docs                ║
    ╚═════════════════════════════════════════════════════════════╝
    """)
    
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )