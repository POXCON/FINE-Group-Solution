import os
import uvicorn
from typing import Optional
from pydantic import BaseModel

# FastAPI imports
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# Component imports
from invoiceSearch.invoiceSearchWebAPI import invoiceSearchWebAPI
from AzLog.azlog import sendCustomTraceLog

# # GET LOCAL ENVIRONMENT VARIABLE
# # Uncomment for local development
# from dotenv import load_dotenv
# load_dotenv()

# Request Body Models
class SearchRequest(BaseModel):
    userId: Optional[str] = None
    invoiceNum: list[str]
    isDebug: bool
    
class LogRequest(BaseModel):
    message: str
    userId: str
    level: str
    fileName: str
    isDebug: bool


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

@app.get("/")
async def root():
    return {"message": "Hello World From Fast API"}

@app.exception_handler(RequestValidationError)
async def handler(request:Request, exc:RequestValidationError):
    print(exc)
    return JSONResponse(content={}, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

# Invoice Search
@app.post("/api/invoicesearch_webapi")
async def requestInvoiceSearchWebAPI(request_body: SearchRequest):
    return await invoiceSearchWebAPI(request_body.userId, request_body.invoiceNum, request_body.isDebug)

# Send Log
@app.post("/api/sendlog")
async def requestSendLog(request_body: LogRequest):
    await sendCustomTraceLog(request_body.message, request_body.userId, request_body.level, request_body.fileName, request_body.isDebug)

if __name__ == "__main__":
    debug_mode = os.getenv("DEBUG", False).lower() == True  
    log_level = "debug" if debug_mode else "info"
    uvicorn.run(app, host="0.0.0.0", port=8000, debug=debug_mode, log_level=log_level)  
