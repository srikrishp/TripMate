import requests

# Login
login = requests.post(
    "http://127.0.0.1:8000/api/auth/login",
    params={
        "email": "test@tripmate.com",
        "password": "Test@12345"
    }
)

print("LOGIN:", login.status_code)
print(login.json())

token = login.json()["access_token"]

# Protected endpoint
me = requests.get(
    "http://127.0.0.1:8000/api/users/me",
    headers={
        "Authorization": f"Bearer {token}"
    }
)

print("\nME:", me.status_code)
print(me.json())