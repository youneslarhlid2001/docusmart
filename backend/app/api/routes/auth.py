from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Utilisateurs hardcodés pour le hackathon
USERS: dict[str, dict] = {
    "admin": {"password": "admin123", "role": "ADMIN", "name": "Administrateur"},
    "analyst": {"password": "analyst123", "role": "ANALYST", "name": "Analyste"},
    "viewer": {"password": "viewer123", "role": "VIEWER", "name": "Lecteur"},
}


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    id: str
    name: str
    role: str


@router.post("/auth/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    user = USERS.get(body.username)
    if not user or user["password"] != body.password:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    return LoginResponse(id=body.username, name=user["name"], role=user["role"])
