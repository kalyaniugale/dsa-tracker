import time, json, requests

BASE = "http://127.0.0.1:8000/api/users"

uname = f"alice_{int(time.time())%100000}"
pwd = "StrongPass123!"
email = f"{uname}@example.com"

def pp(title, resp):
    print(f"\n=== {title} [{resp.status_code}] ===")
    try:
        print(json.dumps(resp.json(), indent=2))
    except Exception:
        print(resp.text)

# 1) register
r = requests.post(f"{BASE}/auth/register/", json={"username": uname, "email": email, "password": pwd})
pp("register", r)

# 2) login
r = requests.post(f"{BASE}/auth/token/", json={"username": uname, "password": pwd})
pp("login", r)
tokens = r.json()
access = tokens.get("access")

# headers
headers = {"Authorization": f"Bearer {access}"}

# 3) /me
r = requests.get(f"{BASE}/me/", headers=headers)
pp("/me", r)

# 4) update
r = requests.patch(f"{BASE}/me/update/", headers={**headers, "Content-Type": "application/json"},
                   json={"first_name":"Alice","last_name":"Wonder"})
pp("update", r)

# 5) change password
r = requests.post(f"{BASE}/me/password/", headers={**headers, "Content-Type": "application/json"},
                  json={"old_password": pwd, "new_password": "NewStrongPass123!"})
pp("password change", r)

# 6) login again with new password
r = requests.post(f"{BASE}/auth/token/", json={"username": uname, "password": "NewStrongPass123!"})
pp("login with new password", r)
