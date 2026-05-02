from fastapi import FastAPI, HTTPException # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from pydantic import BaseModel # type: ignore
import mysql.connector # type: ignore
from typing import Optional, List

app = FastAPI()

# 1. Configuration CORS pour Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Modèles de données (Pydantic)
class UserBase(BaseModel):
    nom: str
    prenom: str
    email: str
    password: str
    telephone: Optional[str] = None
    adresse: Optional[str] = None

class ClientSchema(UserBase):
    type_client: str = "particulier"

class VendeurSchema(UserBase):
    nom_entreprise: str
    adresse_entreprise: str

class CoursierSchema(UserBase):
    vehicule: str
    permis: Optional[str] = None   
    zone_livraison: Optional[str] = None
    latitude_actuelle: Optional[float] = 0.0
    longitude_actuelle: Optional[float] = 0.0

# ── Modèles Dashboard Vendeur (Merged from Amir) ───────────
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

# 3. Connexion DB
def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        port=3307,
        user="root",
        password="",
        database="wassali-backend"
    )

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
        # On utilise le nom de colonne correct pour la foreign key (id_client, id_vendeur ou id_coursier)
        pk_name = f"id_{role_table}"
        extra_fields[pk_name] = new_user_id
        
        # SI TA TABLE CLIENT A UNE COLONNE 'id_client' QUI N'EST PAS AUTO-INCREMENT :
        # Il faut soit la mettre en Auto-Increment dans MySQL, soit ne pas la mentionner ici.
        
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
        # --- REGARDE CETTE LIGNE DANS TON TERMINAL PYTHON ---
        print(f"\n🚨 ERREUR SQL RÉELLE : {str(e)}\n") 
        # ---------------------------------------------------
        raise HTTPException(status_code=500, detail=str(e))

# --- ROUTES POST ---

@app.post("/api/register-client")
async def register_client(data: ClientSchema):
    return handle_registration(data, "client", {"type_client": data.type_client})

@app.post("/api/register-vendeur")
async def register_vendeur(data: VendeurSchema):
    return handle_registration(data, "vendeur", {
        "nom_entreprise": data.nom_entreprise, 
        "adresse_entreprise": data.adresse_entreprise
    })

@app.post("/api/register-livreur")
async def register_livreur(data: CoursierSchema):
    return handle_registration(data, "coursier", {
        "vehicule": data.vehicule, 
        "permis": data.permis,              # <--- AJOUTÉ
        "zone_livraison": data.zone_livraison, # <--- AJOUTÉ
        "disponibilite": 1,
        "latitude_actuelle": data.latitude_actuelle,
        "longitude_actuelle": data.longitude_actuelle
    })

@app.post("/api/login")
async def login(credentials: dict):
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
        
        # On retourne les infos de base (dans un vrai projet, on utiliserait un JWT token)
        return {
            "status": "success",
            "id_user": user["id_user"],
            "role": user["role"],
            "nom": user["nom"],
            "prenom": user["prenom"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- ROUTES GET (COMPATIBLES AVEC TON APP.TS) ---

def get_all_by_role(role: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Jointure entre 'user' et la table spécifique pour avoir le nom, email, etc.
        query = f"""
            SELECT u.*, r.* FROM users u 
            INNER JOIN {role} r ON u.id_user = r.id_{role}
        """
        cursor.execute(query)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return results
    except Exception as e:
        print(f"DEBUG GET ERROR: {str(e)}")
        return []

@app.get("/client")
async def get_client():
    return get_all_by_role("client")

@app.get("/vendeur")
async def get_vendeur():
    return get_all_by_role("vendeur")

@app.get("/coursier")
async def get_coursiers():
    return get_all_by_role("coursier")
    # ─────────────────────────────────────────────────────────
# AJOUTER CES ROUTES À TON main.py EXISTANT
# Base: table colis, coursier, notifications, suivi_colis
# Pas d'auth — l'id_coursier est passé directement dans l'URL
# ─────────────────────────────────────────────────────────

from datetime import datetime

# ─── Modèles ─────────────────────────────────────────────
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

# ─── Helper DB ────────────────────────────────────────────
def get_db():
    return get_db_connection()

def serialize(row: dict) -> dict:
    """Convertit datetime en string pour JSON"""
    for k, v in row.items():
        if isinstance(v, datetime):
            row[k] = v.isoformat()
    return row


# ══════════════════════════════════════════════════════════
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


# ============================================================
#  DASHBOARD VENDEUR — Routes (Merged from Amir)
# ============================================================

@app.get("/api/vendeur/{id_vendeur}/colis")
def get_vendeur_colis(id_vendeur: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT
                c.id_colis   AS id,
                c.description,
                c.poids,
                c.statut,
                c.date_creation,
                c.id_client,
                c.id_coursier,
                CONCAT(u.prenom, ' ', u.nom) AS nomClient
            FROM colis c
            LEFT JOIN users u ON c.id_client = u.id_user
            WHERE c.id_vendeur = %s
            ORDER BY c.date_creation DESC
        """
        cursor.execute(query, (id_vendeur,))
        rows = cursor.fetchall()
        return [serialize(r) for r in rows]
    finally:
        conn.close()

@app.post("/api/colis/ajouter")
def ajouter_colis(colis: ColisSchema):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Vérifier que le client existe
        cursor.execute("SELECT id_client FROM client WHERE id_client = %s", (colis.id_client,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client introuvable")

        query = """
            INSERT INTO colis (description, poids, id_vendeur, id_client, statut)
            VALUES (%s, %s, %s, %s, 'attente')
        """
        cursor.execute(query, (colis.description, colis.poids, colis.id_vendeur, colis.id_client))
        conn.commit()
        new_id = cursor.lastrowid

        # Retourner le colis créé avec le nom du client
        cursor.execute("""
            SELECT c.id_colis AS id, c.description, c.poids, c.statut, c.date_creation,
                   c.id_client, CONCAT(u.prenom, ' ', u.nom) AS nomClient
            FROM colis c
            LEFT JOIN users u ON c.id_client = u.id_user
            WHERE c.id_colis = %s
        """, (new_id,))
        return serialize(cursor.fetchone())
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/api/colis/{id_colis}")
def supprimer_colis(id_colis: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_colis FROM colis WHERE id_colis = %s", (id_colis,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Colis introuvable")
        
        cursor.execute("DELETE FROM colis WHERE id_colis = %s", (id_colis,))
        conn.commit()
        return {"message": "Colis supprimé avec succès"}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.put("/api/colis/{id_colis}/statut-vendeur")
def changer_statut_colis(id_colis: int, data: StatutSchema):
    statuts_valides = {"attente", "ramassé", "en_route", "livré", "annulé"}
    if data.statut not in statuts_valides:
        raise HTTPException(status_code=400, detail=f"Statut invalide : {data.statut}")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_colis FROM colis WHERE id_colis = %s", (id_colis,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Colis introuvable")

        cursor.execute("UPDATE colis SET statut = %s WHERE id_colis = %s", (data.statut, id_colis))
        conn.commit()
        return {"message": "Statut mis à jour", "statut": data.statut}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/colis-vendeur/{id_colis}")
def get_colis_details_vendeur(id_colis: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                c.id_colis   AS id,
                c.description,
                c.poids,
                c.statut,
                c.date_creation,
                c.id_client,
                c.id_coursier,
                CONCAT(u.prenom, ' ', u.nom)  AS nomClient,
                u.telephone                    AS telephoneClient,
                u.adresse                      AS adresseClient,
                CONCAT(uc.prenom, ' ', uc.nom) AS nomCoursier
            FROM colis c
            LEFT JOIN users u  ON c.id_client   = u.id_user
            LEFT JOIN users uc ON c.id_coursier  = uc.id_user
            WHERE c.id_colis = %s
        """, (id_colis,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Colis introuvable")
        return serialize(row)
    finally:
        conn.close()

@app.get("/api/clients-vendeur")
def get_clients_vendeur():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                cl.id_client  AS id,
                CONCAT(u.prenom, ' ', u.nom) AS nom,
                u.email,
                u.telephone,
                u.adresse
            FROM client cl
            JOIN users u ON cl.id_client = u.id_user
            ORDER BY u.nom ASC
        """)
        return cursor.fetchall()
    finally:
        conn.close()

@app.post("/api/clients-vendeur/ajouter")
def ajouter_client_vendeur(data: ClientSimpleSchema):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id_user FROM users WHERE email = %s", (data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Un utilisateur avec cet email existe déjà")

        cursor.execute("""
            INSERT INTO users (nom, prenom, email, password, telephone, adresse, role, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, 'client', 1)
        """, (
            data.nom,
            data.prenom if data.prenom else "",
            data.email,
            "changeme",
            data.telephone or "",
            data.adresse or ""
        ))
        new_user_id = cursor.lastrowid

        cursor.execute(
            "INSERT INTO client (type_client, id_client) VALUES ('particulier', %s)",
            (new_user_id,)
        )
        
        conn.commit()
        return {
            "id": new_user_id,
            "nom": f"{data.prenom} {data.nom}".strip(),
            "email": data.email,
            "telephone": data.telephone,
            "adresse": data.adresse
        }
    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.delete("/api/clients-vendeur/{id_client}")
def supprimer_client_vendeur(id_client: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_client FROM client WHERE id_client = %s", (id_client,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Client introuvable")
        
        cursor.execute("DELETE FROM colis WHERE id_client = %s", (id_client,))
        cursor.execute("DELETE FROM client WHERE id_client = %s", (id_client,))
        cursor.execute("DELETE FROM users WHERE id_user = %s", (id_client,))
        
        conn.commit()
        return {"message": "Client et ses colis supprimés avec succès"}
    except Exception as e:
        if conn: conn.rollback()
        error_msg = str(e)
        if "Foreign key constraint" in error_msg or "1451" in error_msg:
            raise HTTPException(status_code=400, detail="Impossible de supprimer ce client car il possède des colis enregistrés.")
        raise HTTPException(status_code=500, detail=error_msg)
    finally:
        if conn: conn.close()

@app.get("/api/vendeur-profil/{id_vendeur}")
def get_vendeur_profil_dashboard(id_vendeur: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                u.id_user, u.nom, u.prenom, u.email, u.telephone, u.adresse,
                v.nom_entreprise, v.adresse_entreprise
            FROM vendeur v
            JOIN users u ON v.id_vendeur = u.id_user
            WHERE v.id_vendeur = %s
        """, (id_vendeur,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Vendeur introuvable")
        return serialize(row)
    finally:
        conn.close()

@app.put("/api/vendeur-profil/{id_vendeur}")
def update_vendeur_profil_dashboard(id_vendeur: int, data: ProfilVendeurSchema):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_vendeur FROM vendeur WHERE id_vendeur = %s", (id_vendeur,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Vendeur introuvable")

        cursor.execute(
            "SELECT id_user FROM users WHERE email = %s AND id_user != %s",
            (data.email, id_vendeur)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Cet email est déjà utilisé")

        cursor.execute(
            "UPDATE users SET nom = %s, email = %s WHERE id_user = %s",
            (data.nom, data.email, id_vendeur)
        )
        conn.commit()
        return {"message": "Profil mis à jour avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

