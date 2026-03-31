from connection import get_connection

conn = get_connection()
if conn:
    cursor = conn.cursor()
    cursor.execute("SELECT * from products limit 5")
    result = cursor.fetchall()
    for row in result:
        print(row)
   # print(result)
    cursor.close()
    conn.close()