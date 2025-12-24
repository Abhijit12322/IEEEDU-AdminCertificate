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


def get_all_records():
    return sheet.get_all_records()


def serial_exists(serial):
    records = get_all_records()
    return any(r.get("Serial Number") == serial for r in records)

# ================== GET ==================


@app.route("/participants", methods=["GET"])
def get_participants():
    records = get_all_records()
    return jsonify([
        {
            "serialNumber": r.get("Serial_Number", ""),
            "name": r.get("Name", ""),
            "programEvents": r.get("Program", ""),
            "issueDate": r.get("Issue_Date", ""),
            "position": r.get("Position", ""),
            "programPhotoLink": r.get("Program_Photo_Link", ""),
            "certificateUrl": r.get("Certificate_URL", "")
        }
        for r in records
    ])

# ================== ADD ==================


@app.route("/participants", methods=["POST"])
def add_participant():
    data = request.json or {}

    if serial_exists(data["serialNumber"]):
        return jsonify({
            "error": "Serial number already exists"
        }), 409

    row = [
        data["serialNumber"],
        data["name"],
        data["programEvents"],
        data["issueDate"],
        data["position"],
        data["programPhotoLink"],
        data["certificateUrl"]
    ]

    sheet.append_row(row, value_input_option="USER_ENTERED")
    return jsonify({"message": "Participant added successfully"}), 201

# ================== UPDATE ==================


@app.route("/participants/<serial_number>", methods=["PUT"])
def update_participant(serial_number):
    req = request.json or {}
    password = req.get("password")

    if password != ADMIN_PASSWORD:
        return jsonify({"error": "Unauthorized"}), 401

    records = get_all_records()

    row_index = None
    for i, row in enumerate(records, start=2):
        if row.get("Serial Number") == serial_number:
            row_index = i
            break

    if not row_index:
        return jsonify({"error": "Participant not found"}), 404

    new_serial = req["serialNumber"]

    # 🔒 SERIAL UNIQUENESS CHECK
    for row in records:
        if (
            row.get("Serial Number") == new_serial
            and new_serial != serial_number
        ):
            return jsonify({
                "error": "Serial number already exists"
            }), 409

    sheet.update(
        f"A{row_index}:G{row_index}",
        [[
            new_serial,
            req["name"],
            req["programEvents"],
            req["issueDate"],
            req["position"],
            req["programPhotoLink"],
            req["certificateUrl"]
        ]],
        value_input_option="USER_ENTERED"
    )

    return jsonify({"message": "Participant updated successfully"}), 200

# ================== DELETE ==================


@app.route("/participants/<serial_number>", methods=["DELETE"])
def delete_participant(serial_number):
    req = request.json or {}
    password = req.get("password")

    if password != ADMIN_PASSWORD:
        return jsonify({"error": "Unauthorized"}), 401

    records = get_all_records()

    for i, row in enumerate(records, start=2):
        if row.get("Serial Number") == serial_number:
            sheet.delete_rows(i)
            return jsonify({"message": "Participant deleted"}), 200

    return jsonify({"error": "Participant not found"}), 404

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
