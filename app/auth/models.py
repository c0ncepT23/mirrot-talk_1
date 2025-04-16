# app/auth/models.py
from pydantic import BaseModel, EmailStr
from datetime import datetime

class User(BaseModel):
    email: EmailStr
    created_at: datetime = datetime.now()
    last_login: datetime = datetime.now()