# import
from datetime import datetime
from typing import Optional
import mysql.connector
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
app = FastAPI(title="Wassali API")
#links
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#initialiation ll classest
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
    latitude_actuelle: Optional[float] = 0.0
    longitude_actuelle: Optional[float] = 0.0


class StatutUpdate(BaseModel):
    statut: str   # attente /   ramassé /en route / livré/ annulé


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

#connect el data base
def get_db():
    return mysql.connector.connect(
        host="127.0.0.1",
        port=3307,
        user="root",
        password="",
        database="wassali-backend",
    )


def serialize(row: dict) -> dict:
    return {k: (v.isoformat() if isinstance(v, datetime) else v) for k, v in row.items()}


def get_all_by_role(role: str):
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute(f""" SELECT u.*, r.* FROM users u INNER JOIN {role} r ON u.id_user = r.id_{role} """)
        results = cur.fetchall()
        cur.close()
        conn.close()
        return results
    except Exception as e:
        print(f"[GET ERROR — {role}] {e}")
        return []
#register
def register_user(user_data: UserBase, role: str, extra_fields: dict):
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute(
            "INSERT INTO users (nom, prenom, email, password, telephone, adresse, role, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (user_data.nom, user_data.prenom, user_data.email, user_data.password,
             user_data.telephone, user_data.adresse, role, 1),
        )
        new_user_id = cur.lastrowid

        extra_fields[f"id_{role}"] = new_user_id
        columns = ", ".join(extra_fields.keys())
        placeholders = ", ".join(["%s"] * len(extra_fields))
        cur.execute(
            f"INSERT INTO {role} ({columns}) VALUES ({placeholders})",
            tuple(extra_fields.values()),
        )

        conn.commit()
        return {"status": "success", "id_user": new_user_id, "role": role}

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[REGISTER ERROR — {role}] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/login")
async def login(credentials: dict):
    email = credentials.get("email")
    password = credentials.get("password")

    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT * FROM users WHERE email = %s AND password = %s",
            (email, password),
        )
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user:
            raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

        return {
            "status": "success",
            "id_user": user["id_user"],
            "role": user["role"],
            "nom": user["nom"],
            "prenom": user["prenom"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/register-client")
async def register_client(data: ClientSchema):
    return register_user(data, "client", {"type_client": data.type_client})


@app.post("/api/register-vendeur")
async def register_vendeur(data: VendeurSchema):
    return register_user(data, "vendeur", {
        "nom_entreprise": data.nom_entreprise,
        "adresse_entreprise": data.adresse_entreprise,
    })


@app.post("/api/register-coursier")
async def register_coursier(data: CoursierSchema):
    return register_user(data, "coursier", {
        "vehicule": data.vehicule,
        "permis": data.permis,
        "disponibilite": 1,
        "latitude_actuelle": data.latitude_actuelle,
        "longitude_actuelle": data.longitude_actuelle,
    })


@app.get("/client")
async def get_clients():
    return get_all_by_role("client")


@app.get("/vendeur")
async def get_vendeurs():
    return get_all_by_role("vendeur")


@app.get("/coursier")
async def get_coursiers():
    return get_all_by_role("coursier")


@app.get("/api/coursier/{id_coursier}")
async def get_coursier(id_coursier: int):
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
        cur.close()
        conn.close()

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
            (int(data.disponibilite), id_coursier),
        )
        conn.commit()
        cur.close()
        conn.close()
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
            (data.latitude_actuelle, data.longitude_actuelle, id_coursier),
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"message": "Position mise à jour"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



STATUTS_VALIDES = ["attente", "ramassé", "en_route", "livré", "annulé"]


@app.get("/api/coursier/{id_coursier}/colis")
async def get_mes_colis(id_coursier: int):
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute(""" SELECT c.*, u_client.nom AS client_nom, u_client.telephone AS client_tel FROM colis c LEFT JOIN client cl ON c.id_client = cl.id_client LEFT JOIN users u_client ON cl.id_client = u_client.id_user WHERE c.id_coursier = %s ORDER BY c.date_creation DESC """, (id_coursier,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [serialize(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/colis/disponibles")
async def get_colis_disponibles():
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT c.*,
                   u_client.nom AS client_nom,
                   u_client.adresse AS client_adresse
            FROM colis c
            LEFT JOIN client cl ON c.id_client = cl.id_client
            LEFT JOIN users u_client ON cl.id_client = u_client.id_user
            WHERE c.statut = 'attente' AND c.id_coursier IS NULL
            ORDER BY c.date_creation ASC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [serialize(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/colis/{id_colis}/accepter")
async def accepter_colis(id_colis: int, data: AccepterColis):
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT * FROM colis WHERE id_colis = %s", (id_colis,))
        colis = cur.fetchone()
        if not colis:
            raise HTTPException(status_code=404, detail="Colis introuvable")
        if colis["statut"] != "attente" or colis["id_coursier"] is not None:
            raise HTTPException(status_code=400, detail="Colis déjà assigné")

        cur.execute(
            "UPDATE colis SET id_coursier=%s, statut='ramassé' WHERE id_colis=%s",
            (data.id_coursier, id_colis),
        )

        cur.execute(
            "INSERT INTO notifications (message, id_user) VALUES (%s, %s)",
            (f"Vous avez accepté le colis #{id_colis}", data.id_coursier),
        )

        conn.commit()
        cur.close()
        conn.close()
        return {"message": "Colis accepté", "statut": "ramassé"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/colis/{id_colis}/statut")
async def update_statut_colis(id_colis: int, data: StatutUpdate):
    if data.statut not in STATUTS_VALIDES:
        raise HTTPException(
            status_code=400,
            detail=f"Statut invalide. Valeurs acceptées : {STATUTS_VALIDES}",
        )
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT id_coursier FROM colis WHERE id_colis = %s", (id_colis,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Colis introuvable")

        if data.statut == "annulé":
            cur.execute("UPDATE colis SET statut='attente', id_coursier=NULL WHERE id_colis=%s", (id_colis,))
        else:
            cur.execute("UPDATE colis SET statut=%s WHERE id_colis=%s", (data.statut, id_colis))

        if row["id_coursier"] and data.statut in ("livré", "annulé"):
            msg = f"Colis #{id_colis} marqué comme '{data.statut}'"
            if data.statut == "annulé":
                msg = f"Vous avez annulé le colis #{id_colis}. Il est de nouveau disponible."
            
            cur.execute(
                "INSERT INTO notifications (message, id_user) VALUES (%s, %s)",
                (msg, row["id_coursier"]),
            )

        conn.commit()
        cur.close()
        conn.close()
        # On retourne le statut réel (si annulé -> attente)
        final_statut = "attente" if data.statut == "annulé" else data.statut
        return {"message": "Statut mis à jour", "statut": final_statut}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/colis/{id_colis}/suivi")
async def get_suivi(id_colis: int):
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT * FROM suivi_colis WHERE id_colis=%s ORDER BY date_position DESC",
            (id_colis,),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [serialize(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/colis/{id_colis}/suivi")
async def add_position(id_colis: int, data: SuiviCreate):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO suivi_colis (id_colis, latitude, longitude) VALUES (%s, %s, %s)",
            (id_colis, data.latitude, data.longitude),
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"message": "Position enregistrée"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/notifications/{id_user}")
async def get_notifications(id_user: int):
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT * FROM notifications WHERE id_user=%s ORDER BY date_envoi DESC LIMIT 50",
            (id_user,),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [serialize(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/notifications/{id_notification}/lire")
async def marquer_lu(id_notification: int):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "UPDATE notifications SET lu=1 WHERE id_notification=%s",
            (id_notification,),
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"message": "Notification lue"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/notifications/{id_user}/tout-lire")
async def tout_lire(id_user: int):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "UPDATE notifications SET lu=1 WHERE id_user=%s AND lu=0",
            (id_user,),
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"message": "Toutes les notifications lues"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))