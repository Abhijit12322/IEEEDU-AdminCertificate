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

# === Google Sheet Setup ===
scope = ["https://spreadsheets.google.com/feeds",
         "https://www.googleapis.com/auth/drive"]

json_path = os.getenv("GOOGLE_CREDENTIALS_PATH")

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

if not json_path or not os.path.exists(json_path):
    raise Exception(
        "Missing or invalid GOOGLE_CREDENTIALS_PATH environment variable or file path.")

with open(json_path, "r") as f:
    creds_dict = json.load(f)

creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
client = gspread.authorize(creds)

SHEET_ID = "1-R-D15DgJJMW9RZuQ0x9F6HDjNRJJVFlohFh9J86Fmg"
sheet = client.open_by_key(SHEET_ID).worksheet("Sheet1 web")

# === Read All Participants ===


@app.route("/participants", methods=["GET"])
def get_participants():
    records = sheet.get_all_records()
    cleaned = []
    for rec in records:
        cleaned.append({
            "serialNumber": rec.get("Serial Number", ""),
            "name": rec.get("Name", ""),
            "programEvents": rec.get("Program\\ Events", ""),
            "issueDate": rec.get("Issue Date", ""),
            "position": rec.get("Position", ""),
            "programPhotoLink": rec.get("Program Photo Link", ""),
            "certificateUrl": rec.get("Certificate URL", ""),
        })
    return jsonify(cleaned)

# === Add a Participant ===


@app.route("/participants", methods=["POST"])
def add_participant():
    data = request.json
    row = [
        data["serialNumber"],
        data["name"],
        data["programEvents"],
        data["issueDate"],
        data["position"],
        data["programPhotoLink"],
        data["certificateUrl"]
    ]
    sheet.append_row(row)
    return jsonify({"message": "Participant added successfully."}), 201

# === Delete a Participant ===


@app.route("/participants/<serial_number>", methods=["DELETE"])
def delete_participant(serial_number):
    req_data = request.json or {}
    password = req_data.get("password")

    if password != ADMIN_PASSWORD:
        return jsonify({"error": "Unauthorized: Invalid admin password."}), 401

    records = sheet.get_all_records()
    for i, row in enumerate(records, start=2):  # skip header
        if row.get("Serial Number") == serial_number:
            sheet.delete_rows(i)
            return jsonify({"message": "Participant deleted."}), 200
    return jsonify({"error": "Participant not found."}), 404

# === Update a Participant ===


@app.route("/participants/<serial_number>", methods=["PUT"])
def update_participant(serial_number):
    req = request.json or {}
    password = req.get("password")

    if password != ADMIN_PASSWORD:
        return jsonify({"error": "Unauthorized"}), 401

    records = sheet.get_all_records()
    headers = sheet.row_values(1)

    # Find row index
    row_index = None
    for i, row in enumerate(records, start=2):
        if row.get("Serial Number") == serial_number:
            row_index = i
            break

    if not row_index:
        return jsonify({"error": "Participant not found"}), 404

    # Map header → value
    update_data = {
        "Serial Number": req["serialNumber"],
        "Name": req["name"],
        "Program Events": req["programEvents"],
        "Issue Date": req["issueDate"],
        "Position": req["position"],
        "Program Photo Link": req["programPhotoLink"],
        "Certificate URL": req["certificateUrl"],
    }

    for col_name, value in update_data.items():
        col_index = headers.index(col_name) + 1
        sheet.update_cell(row_index, col_index, value)

    return jsonify({"message": "Participant updated successfully"}), 200


@app.route("/check-password")
def check_password():
    return jsonify({
        "ADMIN_PASSWORD": ADMIN_PASSWORD
    })


@app.route('/verify-password', methods=['POST'])
def verify_password():
    data = request.json
    password = data.get('password')
    if password == os.environ.get('ADMIN_PASSWORD'):
        return jsonify({"status": "ok"}), 200
    return jsonify({"status": "unauthorized"}), 401


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
