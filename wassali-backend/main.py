from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
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
    telephone: str
    adresse: str

class ClientSchema(UserBase):
    type_client: str = "particulier"

class VendeurSchema(UserBase):
    nom_entreprise: str
    adresse_entreprise: str

class CoursierSchema(UserBase):
    vehicule: str
    latitude_actuelle: Optional[float] = 0.0
    longitude_actuelle: Optional[float] = 0.0

# 3. Connexion DB
def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
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
        # /!\ ATTENTION : On ajoute id_user pour faire le lien
        extra_fields["id_user"] = new_user_id
        
        # SI TA TABLE CLIENT A UNE COLONNE 'id_client' QUI N'EST PAS AUTO-INCREMENT :
        # Il faut soit la mettre en Auto-Increment dans MySQL, soit ne pas la mentionner ici.
        
        columns = ", ".join(extra_fields.keys())
        placeholders = ", ".join(["%s"] * len(extra_fields))
        values = tuple(extra_fields.values())
        
        sql_specific = f"INSERT INTO {role_table} ({columns}) VALUES ({placeholders})"
        cursor.execute(sql_specific, values)

        conn.commit()
        return {"status": "success"}

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

@app.post("/api/register-coursier")
async def register_coursier(data: CoursierSchema):
    return handle_registration(data, "coursier", {
        "vehicule": data.vehicule, 
        "disponibilite": 1,
        "latitude_actuelle": data.latitude_actuelle,
        "longitude_actuelle": data.longitude_actuelle
    })

# --- ROUTES GET (COMPATIBLES AVEC TON APP.TS) ---

def get_all_by_role(role: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Jointure entre 'user' et la table spécifique pour avoir le nom, email, etc.
        query = f"""
            SELECT u.*, r.* FROM users u 
            INNER JOIN {role} r ON u.id_user = r.id_user
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
async def get_clients():
    return get_all_by_role("client")

@app.get("/vendeur")
async def get_vendeurs():
    return get_all_by_role("vendeur")

@app.get("/coursier")
async def get_coursiers():
    return get_all_by_role("coursier")