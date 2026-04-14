from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import google.generativeai as genai
import json
import urllib.parse
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

@app.post("/api/generate-comic")
async def generate_comic(request: ComicRequest):
    if not api_key:
        print("WARNING: GEMINI_API_KEY is missing. Using fallback mock generation.")
        panels = []
        for i in range(request.panel_count):
            desc = f"Mock scene {i+1} for {request.prompt} in {request.style} style."
            encoded_prompt = urllib.parse.quote(desc)
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=512&height=512&seed={hash(desc) % 10000}&nologo=true&model=flux"
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
            # Generate Pollinations URL
            encoded_prompt = urllib.parse.quote(desc)
            # Add seed to prevent caching identical images if multiple similar calls made
            # Add width/height for standard squared comic output 
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=512&height=512&seed={hash(desc) % 10000}&nologo=true&model=flux"
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
