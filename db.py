import oracledb

def get_connection():
    return oracledb.connect(
        user="system",
        password="020805",
        dsn = "localhost:1521/XEPDB1"
    )
