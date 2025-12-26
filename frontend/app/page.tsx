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

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  title: string;
  message: string;
  type: "edit" | "delete";
}

function PasswordModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type
}: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    onConfirm(password);
    setPassword("");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg mb-3"
          />

          {error && (
            <p className="text-red-600 text-sm flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              className={`flex-1 py-2 rounded-lg text-white ${type === "delete" ? "bg-red-600" : "bg-blue-600"
                }`}
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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

  const [isEditing, setIsEditing] = useState(false);
  const [originalSerial, setOriginalSerial] = useState<string | null>(null);
  const [verifiedPassword, setVerifiedPassword] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    type: "edit" | "delete";
    participant?: Participant;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "edit",
    title: "",
    message: ""
  });

  const API = "https://ieeedu-admincertificate.onrender.com";

  const fetchData = async () => {
    setIsLoading(true);
    const res = await axios.get(`${API}/participants`);
    setParticipants(res.data);
    setFilteredParticipants(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let data = participants;
    if (searchTerm) {
      data = data.filter(
        p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterPosition) {
      data = data.filter(p => p.position === filterPosition);
    }
    setFilteredParticipants(data);
  }, [searchTerm, filterPosition, participants]);

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
    setIsEditing(false);
    setOriginalSerial(null);
    setVerifiedPassword(null);
  };

  const submitForm = async () => {
    setIsLoading(true);
    if (isEditing) {
      await axios.put(
        `${API}/participants/${originalSerial}`,
        { ...form, password: verifiedPassword }
      );
    } else {
      await axios.post(`${API}/participants`, form);
    }
    resetForm();
    fetchData();
    setIsLoading(false);
  };

  const handleEdit = (p: Participant) => {
    setPasswordModal({
      isOpen: true,
      type: "edit",
      participant: p,
      title: "Admin Verification",
      message: "Enter admin password to edit"
    });
  };

  const handleDelete = (p: Participant) => {
    setPasswordModal({
      isOpen: true,
      type: "delete",
      participant: p,
      title: "Confirm Delete",
      message: "This action is irreversible"
    });
  };

  const handlePasswordConfirm = async (password: string) => {
    if (passwordModal.type === "edit" && passwordModal.participant) {
      await axios.post(`${API}/verify-password`, { password });
      setForm(passwordModal.participant);
      setOriginalSerial(passwordModal.participant.serialNumber);
      setVerifiedPassword(password);
      setIsEditing(true);
    }

    if (passwordModal.type === "delete" && passwordModal.participant) {
      await axios.delete(
        `${API}/participants/${passwordModal.participant.serialNumber}`,
        { data: { password } }
      );
      fetchData();
    }

    setPasswordModal({ ...passwordModal, isOpen: false });
  };

  const uniquePositions = [...new Set(participants.map(p => p.position))];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">IEEE Certificate Admin</h1>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <input name="serialNumber" value={form.serialNumber} onChange={handleChange} placeholder="Serial" />
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
        <input name="programEvents" value={form.programEvents} onChange={handleChange} placeholder="Program" />
        <input type="date" name="issueDate" value={form.issueDate} onChange={handleChange} />
        <input name="position" value={form.position} onChange={handleChange} placeholder="Position" />
        <input name="certificateUrl" value={form.certificateUrl} onChange={handleChange} placeholder="Certificate URL" />
      </div>

      <button onClick={submitForm} className="bg-blue-600 text-white px-6 py-2 rounded">
        {isEditing ? "Update" : "Add"}
      </button>

      <table className="w-full mt-8 border">
        <thead>
          <tr className="bg-gray-100">
            <th>Serial</th>
            <th>Name</th>
            <th>Program</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredParticipants.map(p => (
            <tr key={p.serialNumber} className="border-t">
              <td>{p.serialNumber}</td>
              <td>{p.name}</td>
              <td>{p.programEvents}</td>
              <td className="flex gap-2">
                <button onClick={() => handleEdit(p)}>Edit</button>
                <button onClick={() => handleDelete(p)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <PasswordModal
        {...passwordModal}
        onConfirm={handlePasswordConfirm}
        onClose={() => setPasswordModal({ ...passwordModal, isOpen: false })}
      />
    </div>
  );
}
