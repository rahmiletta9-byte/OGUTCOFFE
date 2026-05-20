from config.supabase_client import db

def fix_roles():
    print("Listing all users from auth.users...")
    # Using auth.admin to list users (requires service_role key)
    users_res = db.auth.admin.list_users()
    
    users = users_res
    print(f"Found {len(users)} users.")

    # Get current user_roles
    roles_res = db.table('user_roles').select('*').execute()
    existing_roles = {r['user_id']: r['role'] for r in roles_res.data}

    for user in users:
        email = user.email
        uid = user.id
        print(f"User: {email} ({uid})")
        
        if uid in existing_roles:
            print(f"  -> Already has role: {existing_roles[uid]}")
        else:
            # Map by email prefix or keyword
            new_role = None
            if 'admin' in email.lower():
                new_role = 'admin'
            elif 'kasir' in email.lower() or 'cashier' in email.lower():
                new_role = 'kasir'
            elif 'bahan' in email.lower() or 'stock' in email.lower():
                new_role = 'manajemen_bahan'
            
            if new_role:
                print(f"  -> Missing role! Assigning '{new_role}'...")
                db.table('user_roles').insert({'user_id': uid, 'role': new_role}).execute()
                print("  -> Assigned.")
            else:
                print("  -> Missing role but couldn't determine default. Skipping.")

if __name__ == "__main__":
    try:
        fix_roles()
    except Exception as e:
        print(f"Error: {e}")
