from flask import Flask, request, jsonify
from flask_cors import CORS
import gspread
import os
import json
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# ================== CONFIG ==================
scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive"
]

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
json_path = os.getenv("GOOGLE_CREDENTIALS_PATH")

if not json_path or not os.path.exists(json_path):
    raise Exception("Missing GOOGLE_CREDENTIALS_PATH")

with open(json_path) as f:
    creds_dict = json.load(f)

creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
client = gspread.authorize(creds)

SHEET_ID = "1-R-D15DgJJMW9RZuQ0x9F6HDjNRJJVFlohFh9J86Fmg"
sheet = client.open_by_key(SHEET_ID).worksheet("Sheet1 web")

# ================== HELPERS ==================


def serial_exists(serial_number: str) -> bool:
    serials = sheet.col_values(1)  # Column A
    return serial_number in serials


def get_row_index_by_serial(serial_number: str):
    serials = sheet.col_values(1)
    if serial_number not in serials:
        return None
    return serials.index(serial_number) + 1  # 1-based index

# ================== GET ==================


@app.route("/participants", methods=["GET"])
def get_participants():
    rows = sheet.get_all_values()[1:]  # Skip header

    result = []
    for r in rows:
        if not any(r):  # Skip fully empty rows
            continue

        result.append({
            "serialNumber": r[0] if len(r) > 0 else "",
            "name": r[1] if len(r) > 1 else "",
            "programEvents": r[2] if len(r) > 2 else "",
            "issueDate": r[3] if len(r) > 3 else "",
            "position": r[4] if len(r) > 4 else "",
            "programPhotoLink": r[5] if len(r) > 5 else "",
            "certificateUrl": r[6] if len(r) > 6 else "",
        })

    return jsonify(result), 200

# ================== ADD ==================


@app.route("/participants", methods=["POST"])
def add_participant():
    data = request.json or {}

    serial_number = data.get("serialNumber")
    if not serial_number:
        return jsonify({"error": "Serial number required"}), 400

    if serial_exists(serial_number):
        return jsonify({"error": "Serial number already exists"}), 409

    new_row = [
        serial_number,
        data.get("name", ""),
        data.get("programEvents", ""),
        data.get("issueDate", ""),
        data.get("position", ""),
        data.get("programPhotoLink", ""),
        data.get("certificateUrl", "")
    ]

    sheet.append_row(new_row, value_input_option="USER_ENTERED")
    return jsonify({"message": "Participant added successfully"}), 201

# ================== UPDATE ==================


@app.route("/participants/<serial_number>", methods=["PUT"])
def update_participant(serial_number):
    data = request.json or {}

    if data.get("password") != ADMIN_PASSWORD:
        return jsonify({"error": "Unauthorized"}), 401

    row_index = get_row_index_by_serial(serial_number)
    if row_index is None:
        return jsonify({"error": "Participant not found"}), 404

    updated_row = [
        serial_number,                     # 🔒 LOCKED
        data.get("name", ""),
        data.get("programEvents", ""),
        data.get("issueDate", ""),
        data.get("position", ""),
        data.get("programPhotoLink", ""),
        data.get("certificateUrl", "")
    ]

    # Ensure row physically exists
    last_row = len(sheet.get_all_values())
    if row_index > last_row:
        sheet.insert_row([""] * 7, row_index)

    sheet.update(
        f"A{row_index}:G{row_index}",
        [updated_row],
        value_input_option="USER_ENTERED"
    )

    return jsonify({"message": "Participant updated successfully"}), 200

# ================== DELETE ==================


@app.route("/participants/<serial_number>", methods=["DELETE"])
def delete_participant(serial_number):
    data = request.json or {}

    if data.get("password") != ADMIN_PASSWORD:
        return jsonify({"error": "Unauthorized"}), 401

    row_index = get_row_index_by_serial(serial_number)
    if row_index is None:
        return jsonify({"error": "Participant not found"}), 404

    sheet.delete_rows(row_index)
    return jsonify({"message": "Participant deleted"}), 200

# ================== PASSWORD CHECK ==================


@app.route("/verify-password", methods=["POST"])
def verify_password():
    data = request.json or {}
    if data.get("password") == ADMIN_PASSWORD:
        return jsonify({"status": "ok"}), 200
    return jsonify({"status": "unauthorized"}), 401

# ================== RUN ==================


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
