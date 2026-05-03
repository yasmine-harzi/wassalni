from fastapi import FastAPI, HTTPException # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from pydantic import BaseModel # type: ignore
import mysql.connector # type: ignore
from typing import Optional, List
from datetime import datetime

# ═══════════════════════════════════════════════════════════════════════
# 1. INITIALISATION DE L'APPLICATION FASTAPI
# ═══════════════════════════════════════════════════════════════════════

app = FastAPI()

# Configuration CORS pour Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════
# 2. MODÈLES DE DONNÉES (PYDANTIC) - AUTHENTIFICATION & COMPTES
# ═══════════════════════════════════════════════════════════════════════

class UserBase(BaseModel):
    nom: str
    prenom: str
    email: str
    password: str
    telephone: Optional[str] = None
    adresse: Optional[str] = None

# Modèle pour l'inscription Client
class ClientSchema(UserBase):
    type_client: str = "particulier"

# Modèle pour l'inscription Vendeur
class VendeurSchema(UserBase):
    nom_entreprise: str
    adresse_entreprise: str

# Modèle pour l'inscription Coursier
class CoursierSchema(UserBase):
    vehicule: str
    permis: Optional[str] = None   
    zone_livraison: Optional[str] = None
    latitude_actuelle: Optional[float] = 0.0
    longitude_actuelle: Optional[float] = 0.0

# ═══════════════════════════════════════════════════════════════════════
# 3. MODÈLES DE DONNÉES - DASHBOARD VENDEUR & COLIS
# ═══════════════════════════════════════════════════════════════════════

class ColisSchema(BaseModel):
    description: str
    poids: float
    id_vendeur: int
    id_client: int

class ClientSimpleSchema(BaseModel):
    nom: str
    prenom: str = ""
    email: str
    telephone: Optional[str] = None
    adresse: Optional[str] = None

class ProfilVendeurSchema(BaseModel):
    nom: str
    email: str

class StatutSchema(BaseModel):
    statut: str

# ═══════════════════════════════════════════════════════════════════════
# 4. MODÈLES DE DONNÉES - DASHBOARD COURSIER & SUIVI
# ═══════════════════════════════════════════════════════════════════════

class StatutUpdate(BaseModel):
    statut: str   # attente | ramassé | en_route | livré | annulé

class AccepterColis(BaseModel):
    id_coursier: int

class PositionUpdate(BaseModel):
    latitude_actuelle: float
    longitude_actuelle: float

class DispoUpdate(BaseModel):
    disponibilite: bool

class SuiviCreate(BaseModel):
    latitude: float
    longitude: float

# ═══════════════════════════════════════════════════════════════════════
# 5. MODÈLES DE DONNÉES - DASHBOARD ADMIN (NEW)
# ═══════════════════════════════════════════════════════════════════════

class ZoneCreate(BaseModel):
    nom: str

class ProfilUpdateSchema(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    adresse: Optional[str] = None

# ═══════════════════════════════════════════════════════════════════════
# 6. CONFIGURATION & CONNEXION BASE DE DONNÉES
# ═══════════════════════════════════════════════════════════════════════

def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        port=3307,
        user="root",
        password="",
        database="wassali-backend"
    )

def get_db():
    return get_db_connection()

def serialize(row: dict) -> dict:
    """Convertit datetime en string pour JSON"""
    if not row: return row
    for k, v in row.items():
        if isinstance(v, datetime):
            row[k] = v.isoformat()
    return row

# ═══════════════════════════════════════════════════════════════════════
# 7. LOGIQUE D'INSCRIPTION (HELPER)
# ═══════════════════════════════════════════════════════════════════════

def handle_registration(user_data, role_table, extra_fields):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # ÉTAPE 1 : Insertion User
        sql_user = "INSERT INTO users (nom, prenom, email, password, telephone, adresse, role, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        val_user = (user_data.nom, user_data.prenom, user_data.email, user_data.password, user_data.telephone, user_data.adresse, role_table, 1)
        cursor.execute(sql_user, val_user)
        
        new_user_id = cursor.lastrowid 

        # ÉTAPE 2 : Insertion spécifique (Client, Vendeur, Coursier)
        pk_name = f"id_{role_table}"
        extra_fields[pk_name] = new_user_id
        
        columns = ", ".join(extra_fields.keys())
        placeholders = ", ".join(["%s"] * len(extra_fields))
        values = tuple(extra_fields.values())
        
        sql_specific = f"INSERT INTO {role_table} ({columns}) VALUES ({placeholders})"
        cursor.execute(sql_specific, values)

        conn.commit()
        return {
            "status": "success",
            "id_user": new_user_id,
            "role": role_table
        }
    except Exception as e:
        if conn: conn.rollback()
        print(f"\n🚨 ERREUR SQL : {str(e)}\n") 
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════
# 8. ROUTES D'AUTHENTIFICATION & INSCRIPTION
# ═══════════════════════════════════════════════════════════════════════

@app.post("/api/register-client")
async def register_client(data: ClientSchema):
    """Inscription Client"""
    return handle_registration(data, "client", {"type_client": data.type_client})

@app.post("/api/register-vendeur")
async def register_vendeur(data: VendeurSchema):
    """Inscription Vendeur"""
    return handle_registration(data, "vendeur", {
        "nom_entreprise": data.nom_entreprise, 
        "adresse_entreprise": data.adresse_entreprise
    })

@app.post("/api/register-livreur")
async def register_livreur(data: CoursierSchema):
    """Inscription Coursier / Livreur"""
    return handle_registration(data, "coursier", {
        "vehicule": data.vehicule, 
        "permis": data.permis,
        "zone_livraison": data.zone_livraison,
        "disponibilite": 1,
        "latitude_actuelle": data.latitude_actuelle,
        "longitude_actuelle": data.longitude_actuelle
    })

@app.post("/api/login")
async def login(credentials: dict):
    """Connexion globale (Client, Vendeur, Coursier)"""
    email = credentials.get("email")
    password = credentials.get("password")
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s AND password = %s", (email, password))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        if not user:
            raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
        return {
            "status": "success",
            "id": user["id_user"], # Added 'id' for compatibility
            "id_user": user["id_user"],
            "role": user["role"],
            "nom": user["nom"],
            "prenom": user["prenom"],
            "email": user["email"],
            "phone": user["telephone"],
            "adresse": user["adresse"]
        }
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════
# 9. SECTION DASHBOARD COURSIER & LOGISTIQUE
# ═══════════════════════════════════════════════════════════════════════

# ROUTES COURSIER — profil & disponibilité
# ══════════════════════════════════════════════════════════

@app.get("/api/coursier/{id_coursier}")
async def get_coursier(id_coursier: int):
    """Profil complet du coursier (JOIN users + coursier)"""
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT u.id_user, u.nom, u.prenom, u.email, u.telephone, u.adresse,
                   c.vehicule, c.disponibilite, c.latitude_actuelle, c.longitude_actuelle
            FROM users u
            INNER JOIN coursier c ON u.id_user = c.id_coursier
            WHERE c.id_coursier = %s
        """, (id_coursier,))
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="Coursier introuvable")
        return serialize(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/coursier/{id_coursier}/disponibilite")
async def toggle_disponibilite(id_coursier: int, data: DispoUpdate):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "UPDATE coursier SET disponibilite = %s WHERE id_coursier = %s",
            (int(data.disponibilite), id_coursier)
        )
        conn.commit()
        cur.close(); conn.close()
        return {"disponibilite": data.disponibilite}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/coursier/{id_coursier}/position")
async def update_position(id_coursier: int, data: PositionUpdate):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "UPDATE coursier SET latitude_actuelle=%s, longitude_actuelle=%s WHERE id_coursier=%s",
            (data.latitude_actuelle, data.longitude_actuelle, id_coursier)
        )
        conn.commit()
        cur.close(); conn.close()
        return {"message": "Position mise à jour"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════
# ROUTES COLIS
# ══════════════════════════════════════════════════════════

@app.get("/api/coursier/{id_coursier}/colis")
async def get_mes_colis(id_coursier: int):
    """Tous les colis assignés à ce coursier"""
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT c.*, 
                   u_client.nom as client_nom, u_client.telephone as client_tel
            FROM colis c
            LEFT JOIN client cl ON c.id_client = cl.id_client
            LEFT JOIN users u_client ON cl.id_client = u_client.id_user
            WHERE c.id_coursier = %s
            ORDER BY c.date_creation DESC
        """, (id_coursier,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        return [serialize(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/colis/disponibles")
async def get_colis_disponibles():
    """Colis en attente sans coursier assigné"""
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT c.*,
                   u_client.nom as client_nom, u_client.adresse as client_adresse
            FROM colis c
            LEFT JOIN client cl ON c.id_client = cl.id_client
            LEFT JOIN users u_client ON cl.id_client = u_client.id_user
            WHERE c.statut = 'attente' AND c.id_coursier IS NULL
            ORDER BY c.date_creation ASC
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()
        return [serialize(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/colis/{id_colis}/accepter")
async def accepter_colis(id_colis: int, data: AccepterColis):
    """Le coursier accepte un colis disponible → statut = ramassé"""
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)

        # Vérifier que le colis est encore disponible
        cur.execute("SELECT * FROM colis WHERE id_colis = %s", (id_colis,))
        colis = cur.fetchone()
        if not colis:
            raise HTTPException(status_code=404, detail="Colis introuvable")
        if colis["statut"] != "attente" or colis["id_coursier"] is not None:
            raise HTTPException(status_code=400, detail="Colis déjà assigné")

        # Assigner le coursier + changer statut
        cur.execute(
            "UPDATE colis SET id_coursier=%s, statut='ramassé' WHERE id_colis=%s",
            (data.id_coursier, id_colis)
        )

        # Notification automatique
        cur.execute(
            "INSERT INTO notifications (message, id_user) VALUES (%s, %s)",
            (f"Vous avez accepté le colis #{id_colis}", data.id_coursier)
        )

        conn.commit()
        cur.close(); conn.close()
        return {"message": "Colis accepté", "statut": "ramassé"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/colis/{id_colis}/statut")
async def update_statut_colis(id_colis: int, data: StatutUpdate):
    """Mettre à jour le statut d'un colis"""
    valides = ["attente", "ramassé", "en_route", "livré", "annulé"]
    if data.statut not in valides:
        raise HTTPException(status_code=400, detail=f"Statut invalide. Valeurs: {valides}")
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT id_coursier FROM colis WHERE id_colis = %s", (id_colis,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Colis introuvable")

        if data.statut == "annulé":
            # Si le coursier annule, on remet le colis en 'attente' et on dé-assigne le coursier
            cur.execute("UPDATE colis SET statut='attente', id_coursier=NULL WHERE id_colis=%s", (id_colis,))
            msg = f"Le coursier a annulé la prise en charge du colis #{id_colis}. Il est de nouveau disponible."
        else:
            cur.execute("UPDATE colis SET statut=%s WHERE id_colis=%s", (data.statut, id_colis))
            msg = f"Colis #{id_colis} marqué comme '{data.statut}'"

        # Notification
        if row["id_coursier"]:
            cur.execute(
                "INSERT INTO notifications (message, id_user) VALUES (%s, %s)",
                (msg, row["id_coursier"])
            )

        conn.commit()
        cur.close(); conn.close()
        return {"message": "Statut mis à jour", "statut": data.statut}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════
# ROUTES SUIVI GPS
# ══════════════════════════════════════════════════════════

@app.get("/api/colis/{id_colis}/suivi")
async def get_suivi(id_colis: int):
    """Historique GPS d'un colis"""
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT * FROM suivi_colis WHERE id_colis=%s ORDER BY date_position DESC",
            (id_colis,)
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        return [serialize(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/colis/{id_colis}/suivi")
async def add_position(id_colis: int, data: SuiviCreate):
    """Ajouter une position GPS pour un colis"""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO suivi_colis (id_colis, latitude, longitude) VALUES (%s, %s, %s)",
            (id_colis, data.latitude, data.longitude)
        )
        conn.commit()
        cur.close(); conn.close()
        return {"message": "Position enregistrée"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════
# ROUTES NOTIFICATIONS
# ══════════════════════════════════════════════════════════

@app.get("/api/notifications/{id_user}")
async def get_notifications(id_user: int):
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT * FROM notifications WHERE id_user=%s ORDER BY date_envoi DESC LIMIT 50",
            (id_user,)
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        return [serialize(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/notifications/{id_notification}/lire")
async def marquer_lu(id_notification: int):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE notifications SET lu=1 WHERE id_notification=%s", (id_notification,))
        conn.commit()
        cur.close(); conn.close()
        return {"message": "Notification lue"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/notifications/{id_user}/tout-lire")
async def tout_lire(id_user: int):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE notifications SET lu=1 WHERE id_user=%s AND lu=0", (id_user,))
        conn.commit()
        cur.close(); conn.close()
        return {"message": "Toutes les notifications lues"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════
# 10. SECTION DASHBOARD VENDEUR
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/vendeur/{id_vendeur}/colis")
def get_vendeur_colis(id_vendeur: int):
    """Colis du vendeur (Dashboard Vendeur)"""
    conn = get_db_connection(); cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT c.id_colis AS id, c.description, c.poids, c.statut, c.date_creation,
                   c.id_client, c.id_coursier, CONCAT(u.prenom, ' ', u.nom) AS nomClient
            FROM colis c
            LEFT JOIN users u ON c.id_client = u.id_user
            WHERE c.id_vendeur = %s
            ORDER BY c.date_creation DESC
        """
        cursor.execute(query, (id_vendeur,))
        rows = cursor.fetchall()
        return [serialize(r) for r in rows]
    finally: conn.close()

@app.post("/api/colis/ajouter")
def ajouter_colis(colis: ColisSchema):
    """Ajouter un colis (Dashboard Vendeur)"""
    conn = get_db_connection(); cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_client FROM client WHERE id_client = %s", (colis.id_client,))
        if not cursor.fetchone(): raise HTTPException(status_code=404, detail="Client introuvable")
        query = "INSERT INTO colis (description, poids, id_vendeur, id_client, statut) VALUES (%s, %s, %s, %s, 'attente')"
        cursor.execute(query, (colis.description, colis.poids, colis.id_vendeur, colis.id_client))
        conn.commit()
        return {"message": "Colis ajouté"}
    finally: conn.close()

@app.get("/api/clients-vendeur")
def get_clients_vendeur():
    """Liste des clients pour le vendeur (Dashboard Vendeur)"""
    conn = get_db_connection(); cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT cl.id_client AS id, CONCAT(u.prenom, ' ', u.nom) AS nom, u.email, u.telephone, u.adresse
            FROM client cl JOIN users u ON cl.id_client = u.id_user ORDER BY u.nom ASC
        """)
        return cursor.fetchall()
    finally: conn.close()

# ═══════════════════════════════════════════════════════════════════════
# 11. SECTION DASHBOARD CLIENT (NEW MERGED LOGIC)
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/colis/client/{client_id}")
async def get_colis_by_client(client_id: int):
    """Colis d'un client spécifique (Dashboard Client)"""
    try:
        conn = get_db(); cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT id_colis as id, description as reference, statut, 
                   (SELECT CONCAT(prenom, ' ', nom) FROM users WHERE id_user = id_vendeur) as vendeur,
                   date_creation as date_estimation
            FROM colis WHERE id_client = %s
            ORDER BY date_creation DESC
        """, (client_id,))
        rows = cur.fetchall(); cur.close(); conn.close()
        return [serialize(r) for r in rows]
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profil/{user_id}")
async def get_user_profile(user_id: int):
    """Profil complet d'un utilisateur (Dashboard Client / Admin)"""
    try:
        conn = get_db(); cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id_user as id, nom, prenom, email, telephone as phone, adresse, role FROM users WHERE id_user = %s", (user_id,))
        row = cur.fetchone(); cur.close(); conn.close()
        if not row: raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        return row
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/profil/{user_id}")
async def update_user_profile(user_id: int, profil: ProfilUpdateSchema):
    """Mise à jour du profil (Dashboard Client)"""
    try:
        conn = get_db(); cur = conn.cursor()
        updates = []
        params = []
        if profil.nom: updates.append("nom = %s"); params.append(profil.nom)
        if profil.prenom: updates.append("prenom = %s"); params.append(profil.prenom)
        if profil.email: updates.append("email = %s"); params.append(profil.email)
        if profil.phone: updates.append("telephone = %s"); params.append(profil.phone)
        if profil.adresse: updates.append("adresse = %s"); params.append(profil.adresse)
        if not updates: raise HTTPException(status_code=400, detail="Aucun champ à modifier")
        params.append(user_id)
        cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id_user = %s", tuple(params))
        conn.commit(); cur.close(); conn.close()
        return {"status": "success"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════
# 12. SECTION DASHBOARD ADMIN (NEW MERGED LOGIC)
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/vendeurs")
async def get_all_vendeurs_admin():
    """Liste de tous les vendeurs (Dashboard Admin)"""
    try:
        conn = get_db(); cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id_user as id, nom, email, telephone as phone, CASE WHEN is_active=1 THEN 'actif' ELSE 'suspendu' END as status FROM users WHERE role='vendeur'")
        rows = cur.fetchall(); cur.close(); conn.close()
        return rows
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/coursiers")
async def get_all_coursiers_admin():
    """Liste de tous les coursiers (Dashboard Admin)"""
    try:
        conn = get_db(); cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT u.id_user as id, u.nom, u.email, u.telephone as phone, 
                   c.zone_livraison as zone, CASE WHEN u.is_active=1 THEN 'actif' ELSE 'inactif' END as status
            FROM users u LEFT JOIN coursier c ON u.id_user = c.id_coursier
            WHERE u.role='coursier'
        """)
        rows = cur.fetchall(); cur.close(); conn.close()
        return rows
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/zones")
async def get_all_zones_admin():
    """Liste des zones (Dashboard Admin)"""
    try:
        conn = get_db(); cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id_zone as id, nom FROM zones")
        rows = cur.fetchall(); cur.close(); conn.close()
        return rows
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/zones")
async def create_zone_admin(zone: ZoneCreate):
    """Créer une zone (Dashboard Admin)"""
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("INSERT INTO zones (nom) VALUES (%s)", (zone.nom,))
        conn.commit(); cur.close(); conn.close()
        return {"status": "success"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════
# 13. DÉMARRAGE DU SERVEUR
# ═══════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
