from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
from typing import Optional, List

app = FastAPI()

# 1. Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Modèles de données
class LoginSchema(BaseModel):
    email: str
    password: str

class UserBase(BaseModel):
    nom: str
    prenom: str
    email: str
    password: str
    telephone: str
    adresse: str

class ClientSchema(UserBase):
    type_client: str = "particulier"

# ── Modèles Dashboard Vendeur ──────────────────────────────
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
        user="root",
        password="",
        database="wassali-backend"
    )

# --- LOGIQUE D'INSCRIPTION SYNCHRONISÉE ---
def handle_registration(user_data, role_name, extra_fields):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # ÉTAPE 1 : Insertion dans 'users' (Infos générales + Profil + Login)
        # CORRECTION : On utilise 'password' pour correspondre à ton SQL
        sql_user = "INSERT INTO users (nom, prenom, email, password, telephone, adresse, role, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        val_user = (user_data.nom, user_data.prenom, user_data.email, user_data.password, user_data.telephone, user_data.adresse, role_name, 1)
        cursor.execute(sql_user, val_user)
        new_id = cursor.lastrowid 

        # ÉTAPE 2 : Insertion dans la table spécifique (client/vendeur/coursier)
        # On lie via id_user comme défini dans ton SQL
        extra_fields["id_user"] = new_id
        columns = ", ".join(extra_fields.keys())
        placeholders = ", ".join(["%s"] * len(extra_fields))
        sql_spec = f"INSERT INTO {role_name} ({columns}) VALUES ({placeholders})"
        cursor.execute(sql_spec, tuple(extra_fields.values()))

        conn.commit()
        return {"status": "success", "id_user": new_id}

    except Exception as e:
        if conn: conn.rollback()
        print(f"🚨 ERREUR SQL : {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

# --- LOGIN : AUTHENTIFICATION ---
@app.post("/api/login")
async def login(data: LoginSchema):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # CORRECTION : Tout est dans la table 'users' directement
        query = "SELECT id_user, role FROM users WHERE email = %s AND password = %s"
        cursor.execute(query, (data.email, data.password))
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
        
        return {
            "status": "success",
            "role": user['role'],
            "id_user": user['id_user']
        }
    finally:
        conn.close()

# --- AUTRES ROUTES ---
@app.post("/api/register-client")
async def register_client(data: ClientSchema):
    return handle_registration(data, "client", {"type_client": data.type_client})

@app.get("/api/admin/accounts")
def get_all_accounts():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # CORRECTION : Sélection directe depuis 'users' puisque tu n'as pas séparé les tables
    query = "SELECT id_user, nom, prenom, email, role, is_active FROM users"
    cursor.execute(query)
    res = cursor.fetchall()
    conn.close()
    return res

# ============================================================
#  DASHBOARD VENDEUR — Routes
# ============================================================

# GET  /api/vendeur/{id_vendeur}/colis
#   Retourne les colis du vendeur avec le nom du client (JOIN)
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
            LEFT JOIN client cl  ON c.id_client  = cl.id_client
            LEFT JOIN users  u   ON cl.id_user    = u.id_user
            WHERE c.id_vendeur = %s
            ORDER BY c.date_creation DESC
        """
        cursor.execute(query, (id_vendeur,))
        return cursor.fetchall()
    finally:
        conn.close()

# POST /api/colis/ajouter
#   Crée un nouveau colis lié à un vendeur et un client existants
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
            LEFT JOIN client cl ON c.id_client = cl.id_client
            LEFT JOIN users  u  ON cl.id_user  = u.id_user
            WHERE c.id_colis = %s
        """, (new_id,))
        return cursor.fetchone()
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# DELETE /api/colis/{id_colis}
#   Supprime définitivement un colis de la base de données
@app.delete("/api/colis/{id_colis}")
def supprimer_colis(id_colis: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_colis FROM colis WHERE id_colis = %s", (id_colis,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Colis introuvable")
        
        # Supprimer le colis (les suivis associés seront supprimés par ON DELETE CASCADE)
        cursor.execute("DELETE FROM colis WHERE id_colis = %s", (id_colis,))
        conn.commit()
        return {"message": "Colis supprimé avec succès"}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

# PUT /api/colis/{id_colis}/statut
#   Change le statut d'un colis (depuis le modal Détails du vendeur)
@app.put("/api/colis/{id_colis}/statut")
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

# GET /api/colis/{id_colis}
#   Détails complets d'un colis (pour le bouton Détails)
@app.get("/api/colis/{id_colis}")
def get_colis_details(id_colis: int):
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
            LEFT JOIN client  cl  ON c.id_client   = cl.id_client
            LEFT JOIN users   u   ON cl.id_user     = u.id_user
            LEFT JOIN coursier cr ON c.id_coursier  = cr.id_coursier
            LEFT JOIN users   uc  ON cr.id_user     = uc.id_user
            WHERE c.id_colis = %s
        """, (id_colis,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Colis introuvable")
        return row
    finally:
        conn.close()

# ── Clients ────────────────────────────────────────────────

# GET /api/clients
#   Retourne tous les clients (pour le select du modal "Nouveau Colis")
@app.get("/api/clients")
def get_clients():
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
            JOIN users u ON cl.id_user = u.id_user
            ORDER BY u.nom ASC
        """)
        return cursor.fetchall()
    finally:
        conn.close()

# POST /api/clients/ajouter
#   Crée un nouvel utilisateur (role=client) + entrée dans la table client
@app.post("/api/clients/ajouter")
def ajouter_client(data: ClientSimpleSchema):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Vérifier que l'email n'existe pas déjà
        cursor.execute("SELECT id_user FROM users WHERE email = %s", (data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Un utilisateur avec cet email existe déjà")

        # Insérer dans users
        cursor.execute("""
            INSERT INTO users (nom, prenom, email, password, telephone, adresse, role, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, 'client', 1)
        """, (
            data.nom,
            data.prenom if data.prenom else "",
            data.email,
            "changeme",        # mot de passe temporaire
            data.telephone or "",
            data.adresse or ""
        ))
        new_user_id = cursor.lastrowid

        # Insérer dans client
        cursor.execute(
            "INSERT INTO client (type_client, id_user) VALUES ('particulier', %s)",
            (new_user_id,)
        )
        new_client_id = cursor.lastrowid

        conn.commit()
        return {
            "id": new_client_id,
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

# DELETE /api/clients/{id_client}
#   Supprime un client (et son utilisateur associé)
@app.delete("/api/clients/{id_client}")
def supprimer_client(id_client: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Trouver l'id_user associé
        cursor.execute("SELECT id_user FROM client WHERE id_client = %s", (id_client,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Client introuvable")
        
        id_user = row["id_user"]
        
        # 1. Supprimer tous les colis du client
        # (Les suivis_colis seront supprimés par ON DELETE CASCADE dans la DB)
        cursor.execute("DELETE FROM colis WHERE id_client = %s", (id_client,))
        
        # 2. Supprimer le client (la table client)
        cursor.execute("DELETE FROM client WHERE id_client = %s", (id_client,))
        
        # 3. Supprimer l'utilisateur associé
        # (Les notifications seront supprimées par ON DELETE CASCADE dans la DB)
        cursor.execute("DELETE FROM users WHERE id_user = %s", (id_user,))
        
        conn.commit()
        return {"message": "Client et ses colis supprimés avec succès"}
    except Exception as e:
        if conn: conn.rollback()
        # Si erreur de clé étrangère, on renvoie un message plus clair
        error_msg = str(e)
        if "Foreign key constraint" in error_msg or "1451" in error_msg:
            raise HTTPException(status_code=400, detail="Impossible de supprimer ce client car il possède des colis enregistrés.")
        raise HTTPException(status_code=500, detail=error_msg)
    finally:
        if conn: conn.close()

# ── Profil vendeur ─────────────────────────────────────────

# GET /api/vendeur/{id_vendeur}/profil
#   Retourne le profil du vendeur (nom, email, entreprise…)
@app.get("/api/vendeur/{id_vendeur}/profil")
def get_vendeur_profil(id_vendeur: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                u.id_user, u.nom, u.prenom, u.email, u.telephone, u.adresse,
                v.nom_entreprise, v.adresse_entreprise
            FROM vendeur v
            JOIN users u ON v.id_user = u.id_user
            WHERE v.id_vendeur = %s
        """, (id_vendeur,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Vendeur introuvable")
        return row
    finally:
        conn.close()

# PUT /api/vendeur/{id_vendeur}/profil
#   Met à jour le nom et l'email du vendeur
@app.put("/api/vendeur/{id_vendeur}/profil")
def update_vendeur_profil(id_vendeur: int, data: ProfilVendeurSchema):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Récupérer l'id_user du vendeur
        cursor.execute("SELECT id_user FROM vendeur WHERE id_vendeur = %s", (id_vendeur,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Vendeur introuvable")

        # Vérifier unicité email si changé
        cursor.execute(
            "SELECT id_user FROM users WHERE email = %s AND id_user != %s",
            (data.email, row["id_user"])
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Cet email est déjà utilisé")

        cursor.execute(
            "UPDATE users SET nom = %s, email = %s WHERE id_user = %s",
            (data.nom, data.email, row["id_user"])
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