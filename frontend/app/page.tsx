"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Camera,
  FileText,
  Trash2,
  Pencil,
  Users,
  Plus,
  AlertCircle,
  Lock,
  X,
  Search,
  Filter,
  Calendar,
  MapPin,
  Award,
  CheckCircle,
  XCircle,
  RefreshCw,
  Shield
} from "lucide-react";

interface Participant {
  serialNumber: string;
  name: string;
  programEvents: string;
  issueDate: string;
  position: string;
  programPhotoLink: string;
  certificateUrl: string;
}

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [form, setForm] = useState<Participant>({
    serialNumber: "",
    name: "",
    programEvents: "",
    issueDate: "",
    position: "",
    programPhotoLink: "",
    certificateUrl: ""
  });

  const [originalSerial, setOriginalSerial] = useState<string | null>(null); // 🔑 FIX
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("");

  const API = "https://ieeedu-admincertificate.onrender.com";

  // ================= FETCH =================
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API}/participants`);
      setParticipants(res.data);
      setFilteredParticipants(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= FILTER =================
  useEffect(() => {
    let data = participants;
    if (searchTerm)
      data = data.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    if (filterPosition)
      data = data.filter(p => p.position === filterPosition);
    setFilteredParticipants(data);
  }, [participants, searchTerm, filterPosition]);

  // ================= FORM =================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      serialNumber: "",
      name: "",
      programEvents: "",
      issueDate: "",
      position: "",
      programPhotoLink: "",
      certificateUrl: ""
    });
    setOriginalSerial(null); // 🔑 RESET
    setIsEditing(false);
  };

  // ================= ADD / UPDATE =================
  const submitForm = async (password?: string) => {
    setIsLoading(true);
    try {
      if (isEditing && originalSerial) {
        await axios.put(
          `${API}/participants/${originalSerial}`, // 🔑 CORRECT SERIAL
          { ...form, password }
        );
      } else {
        await axios.post(`${API}/participants`, form);
      }
      resetForm();
      fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  // ================= EDIT =================
  const handleEdit = async (p: Participant) => {
    const password = prompt("Enter admin password");
    if (!password) return;

    const res = await axios.post(`${API}/verify-password`, { password });
    if (res.status === 200) {
      setForm(p);
      setOriginalSerial(p.serialNumber); // 🔑 STORE ORIGINAL
      setIsEditing(true);
    } else {
      alert("Invalid password");
    }
  };

  // ================= DELETE =================
  const handleDelete = async (p: Participant) => {
    const password = prompt("Enter admin password");
    if (!password) return;

    await axios.delete(`${API}/participants/${p.serialNumber}`, {
      data: { password }
    });

    fetchData();
  };

  // ================= UI =================
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">IEEE Certificate Admin</h1>

      {/* FORM */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <input
          name="serialNumber"
          value={form.serialNumber}
          onChange={handleChange}
          placeholder="Serial"
          disabled={isEditing} // 🔒 LOCK SERIAL
          className="border p-2"
        />
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border p-2" />
        <input name="programEvents" value={form.programEvents} onChange={handleChange} placeholder="Program" className="border p-2" />
        <input name="issueDate" type="date" value={form.issueDate} onChange={handleChange} className="border p-2" />
        <input name="position" value={form.position} onChange={handleChange} placeholder="Position" className="border p-2" />
        <input name="programPhotoLink" value={form.programPhotoLink} onChange={handleChange} placeholder="Photo URL" className="border p-2" />
        <input name="certificateUrl" value={form.certificateUrl} onChange={handleChange} placeholder="Cert URL" className="border p-2" />
      </div>

      <button
        onClick={() => submitForm(prompt("Enter admin password") || undefined)}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        {isEditing ? "Update" : "Add"}
      </button>

      {/* TABLE */}
      <table className="w-full mt-10 border">
        <thead>
          <tr className="bg-gray-100">
            <th>Serial</th>
            <th>Name</th>
            <th>Program</th>
            <th>Position</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredParticipants.map(p => (
            <tr key={p.serialNumber} className="border-t">
              <td>{p.serialNumber}</td>
              <td>{p.name}</td>
              <td>{p.programEvents}</td>
              <td>{p.position}</td>
              <td className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="text-blue-600">Edit</button>
                <button onClick={() => handleDelete(p)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
