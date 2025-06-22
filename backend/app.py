from flask import Flask, request, jsonify
from flask_cors import CORS
import gspread
import os
import json
from oauth2client.service_account import ServiceAccountCredentials

app = Flask(__name__)
CORS(app)

# === Google Sheet Setup ===
scope = ["https://spreadsheets.google.com/feeds",
         "https://www.googleapis.com/auth/drive"]
json_creds = os.environ.get("GOOGLE_CREDENTIALS")

if not json_creds:
    raise Exception("Missing GOOGLE_CREDENTIALS environment variable!")

creds_dict = json.loads(json_creds)
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
    records = sheet.get_all_records()
    for i, row in enumerate(records, start=2):  # skip header
        if row.get("Serial Number") == serial_number:
            sheet.delete_rows(i)
            return jsonify({"message": "Participant deleted."}), 200
    return jsonify({"error": "Participant not found."}), 404

# === Update a Participant ===


@app.route("/participants/<serial_number>", methods=["PUT"])
def update_participant(serial_number):
    new_data = request.json
    records = sheet.get_all_records()
    for i, row in enumerate(records, start=2):
        if row.get("Serial Number") == serial_number:
            sheet.update(f"A{i}:G{i}", [[
                new_data["serialNumber"],
                new_data["name"],
                new_data["programEvents"],
                new_data["issueDate"],
                new_data["position"],
                new_data["programPhotoLink"],
                new_data["certificateUrl"]
            ]])
            return jsonify({"message": "Participant updated."}), 200
    return jsonify({"error": "Participant not found."}), 404


if __name__ == "__main__":
    app.run(debug=True)
