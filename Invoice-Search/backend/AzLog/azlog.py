import os
import logging
from opencensus.ext.azure.log_exporter import AzureLogHandler
from helper.helper import getCurrentDateTime

log_level = {
    "INFO": logging.INFO,
    "DEBUG": logging.DEBUG,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL
}

# Send Custom Trace Log
async def sendCustomTraceLog(message: str, user_id: str, level: str, fileName: str, isDebug: bool):
    logger = logging.getLogger(__name__)
    logger.addHandler(AzureLogHandler(connection_string=os.environ.get("CUSTOMCONNSTR_APPLICATIONINSIGHTS_CONNECTION_STRING")))
    logger.setLevel(log_level[level])
    log_message = f"[{level}][{getCurrentDateTime(isDebug)}][{fileName}][{user_id}][{message}]"
    
    if level == "INFO":
        logger.info(log_message)
    elif level == "DEBUG":
        logger.debug(log_message)
    elif level == "WARNING":
        logger.warning(log_message)
    elif level == "ERROR":
        logger.error(log_message)
    elif level == "CRITICAL":
        logger.critical(log_message)