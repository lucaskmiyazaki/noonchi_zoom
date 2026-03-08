from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import time
import jwt
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173"]}})

ZOOM_VIDEO_SDK_KEY = os.getenv("ZOOM_VIDEO_SDK_KEY")
ZOOM_VIDEO_SDK_SECRET = os.getenv("ZOOM_VIDEO_SDK_SECRET")


def mask(value, start=4, end=4):
    if not value:
        return None
    if len(value) <= start + end:
        return value
    return value[:start] + "..." + value[-end:]


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "key_loaded": bool(ZOOM_VIDEO_SDK_KEY),
        "secret_loaded": bool(ZOOM_VIDEO_SDK_SECRET),
        "key_preview": mask(ZOOM_VIDEO_SDK_KEY),
        "secret_preview": mask(ZOOM_VIDEO_SDK_SECRET),
        "key_len": len(ZOOM_VIDEO_SDK_KEY or ""),
        "secret_len": len(ZOOM_VIDEO_SDK_SECRET or ""),
    })


@app.route("/debug-env", methods=["GET"])
def debug_env():
    return jsonify({
        "key_loaded": bool(ZOOM_VIDEO_SDK_KEY),
        "secret_loaded": bool(ZOOM_VIDEO_SDK_SECRET),
        "key_preview": mask(ZOOM_VIDEO_SDK_KEY),
        "secret_preview": mask(ZOOM_VIDEO_SDK_SECRET),
        "key_has_spaces": (ZOOM_VIDEO_SDK_KEY != (ZOOM_VIDEO_SDK_KEY or "").strip()),
        "secret_has_spaces": (ZOOM_VIDEO_SDK_SECRET != (ZOOM_VIDEO_SDK_SECRET or "").strip()),
        "key_len": len(ZOOM_VIDEO_SDK_KEY or ""),
        "secret_len": len(ZOOM_VIDEO_SDK_SECRET or ""),
    })


@app.route("/signature", methods=["POST"])
def signature():
    if not ZOOM_VIDEO_SDK_KEY or not ZOOM_VIDEO_SDK_SECRET:
        return jsonify({
            "error": "Missing ZOOM_VIDEO_SDK_KEY or ZOOM_VIDEO_SDK_SECRET"
        }), 500

    data = request.get_json(silent=True) or {}
    session_name = data.get("sessionName")
    role = int(data.get("role", 1))
    user_identity = data.get("userIdentity", f"user-{int(time.time())}")

    if not session_name:
        return jsonify({"error": "sessionName is required"}), 400

    iat = int(time.time())
    exp = iat + 60 * 60 * 2

    payload = {
        "app_key": ZOOM_VIDEO_SDK_KEY.strip(),
        "tpc": session_name,
        "role_type": role,
        "user_identity": user_identity,
        "iat": iat,
        "exp": exp,
        "version": 1
    }

    token = jwt.encode(
        payload,
        ZOOM_VIDEO_SDK_SECRET.strip(),
        algorithm="HS256"
    )

    # decode locally without verifying signature, just to inspect what we created
    decoded_no_verify = jwt.decode(token, options={"verify_signature": False})

    print("\n=== ZOOM DEBUG ===")
    print("session_name:", repr(session_name))
    print("role:", role, type(role))
    print("user_identity:", repr(user_identity))
    print("key_preview:", mask(ZOOM_VIDEO_SDK_KEY))
    print("secret_preview:", mask(ZOOM_VIDEO_SDK_SECRET))
    print("payload:", decoded_no_verify)
    print("==================\n")

    return jsonify({
        "signature": token,
        "debug": {
            "session_name": session_name,
            "role": role,
            "user_identity": user_identity,
            "key_preview": mask(ZOOM_VIDEO_SDK_KEY),
            "secret_preview": mask(ZOOM_VIDEO_SDK_SECRET),
            "payload": decoded_no_verify
        }
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000, debug=True)