import os
import datetime
import pytz
    
def getCurrentDateTime(isDebug: bool):
    jst_timezone = pytz.timezone('Asia/Tokyo')
    current_jst_time = datetime.datetime.now(jst_timezone)
    datetime_format = '%Y/%m/%d %H:%M:%S' if isDebug else '%Y-%m-%dT%H:%M:%S.%f'
    return current_jst_time.strftime(datetime_format)