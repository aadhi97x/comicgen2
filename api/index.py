from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import os
import google.generativeai as genai
import json
import urllib.parse
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Comic Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Login Schemas
class LoginRequest(BaseModel):
    email: str
    password: str

# Comic Schemas
class ComicRequest(BaseModel):
    prompt: str
    style: str
    panel_count: int

# Initialize Gemini
api_key = os.getenv("GEMINI_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)

@app.post("/api/login")
async def login(request: LoginRequest):
    # Mock login logic
    if "@" not in request.email or not request.password:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return {"token": "comic_mock_token_12345"}

@app.get("/api/generate-image")
async def generate_image(prompt: str):
    """Proxy endpoint: securely fetches an image from Hugging Face and streams it back."""
    hf_key = os.getenv("HUGGINGFACE_API_KEY", "")
    if not hf_key:
        raise HTTPException(status_code=503, detail="HUGGINGFACE_API_KEY not configured.")

    # FLUX.1-schnell is fast, high quality, and free on Hugging Face
    HF_MODEL = "black-forest-labs/FLUX.1-schnell"
    HF_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

    headers = {"Authorization": f"Bearer {hf_key}"}
    payload = {
        "inputs": prompt,
        "parameters": {
            "num_inference_steps": 4,  # schnell is optimized for 4 steps
            "width": 512,
            "height": 512,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(HF_URL, headers=headers, json=payload)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=f"HF API error: {r.text[:200]}")
        return Response(content=r.content, media_type="image/jpeg")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Image generation timed out.")

@app.post("/api/generate-comic")
async def generate_comic(request: ComicRequest):
    if not api_key:
        print("WARNING: GEMINI_API_KEY is missing. Using fallback mock generation.")
        panels = []
        for i in range(request.panel_count):
            desc = f"Mock scene {i+1} for {request.prompt} in {request.style} style."
            encoded_prompt = urllib.parse.quote(desc)
            image_url = f"/api/generate-image?prompt={encoded_prompt}"
            panels.append({"description": desc, "image_url": image_url})
        return {"panels": panels}
        
    system_prompt = f"""You are an expert comic book director. 
    The user will give you a story idea. You need to write EXACTLY {request.panel_count} scene descriptions.
    The style chosen is {request.style}.
    Output MUST be a valid JSON map containing a single key "panels" with a list of strings.
    Example format:
    {{
      "panels": [
         "Close up shot of a character in {request.style} style doing X...",
         "Wide shot in {request.style} style showing Y...",
         ...
      ]
    }}
    Be highly descriptive about lighting, action, and environment because these will be sent to an image generation model.
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(
            contents=[system_prompt, request.prompt],
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        # Parse the JSON response
        data = json.loads(response.text)
        descriptions = data.get("panels", [])
        
        # Fallback if the output panel count is wrong
        if not descriptions:
            raise ValueError("No panels returned.")
            
        panels = []
        for desc in descriptions[:request.panel_count]:
            # Point to our own secure proxy instead of Pollinations
            encoded_prompt = urllib.parse.quote(desc)
            image_url = f"/api/generate-image?prompt={encoded_prompt}"
            panels.append({
                "description": desc,
                "image_url": image_url
            })
            
        return {"panels": panels}
        
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
