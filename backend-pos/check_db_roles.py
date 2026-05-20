from config.supabase_client import db

def check_roles():
    print("Checking user_roles table...")
    res = db.table('user_roles').select('*').execute()
    print("Current roles in DB:")
    for row in res.data:
        print(row)

if __name__ == "__main__":
    check_roles()
