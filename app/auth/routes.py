# app/auth/routes.py
from fastapi import APIRouter, Depends, HTTPException, status, Form, Cookie, Response
from fastapi.security import OAuth2PasswordRequestForm
import jwt
from datetime import datetime, timedelta
import secrets
from typing import Optional

from app.auth.models import User
from app.db.firestore import db

router = APIRouter()

SECRET_KEY = "your-secret-key"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login")
async def login(email: str = Form(...), response: Response = None):
    # Look up user, create if doesn't exist
    user_ref = db.collection('users').document(email)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        # Create new user
        new_user = User(email=email)
        user_ref.set(new_user.dict())
    else:
        # Update last login
        user_ref.update({"last_login": datetime.now()})
    
    # Create access token
    access_token = create_access_token(
        data={"sub": email}
    )
    
    # Set cookie
    if response:
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax"
        )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}

def get_current_user(token: Optional[str] = Cookie(None, alias="access_token")):
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except jwt.PyJWTError:
        return None
    
    user_ref = db.collection('users').document(email)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        return None
        
    return user_doc.to_dict()