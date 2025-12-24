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
  type: 'edit' | 'delete';
}

function PasswordModal({ isOpen, onClose, onConfirm, title, message, type }: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate validation delay
    onConfirm(password);
    setPassword("");
    setError("");
    setIsLoading(false);
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${type === 'delete' ? 'bg-red-100' : 'bg-amber-100'}`}>
              {type === 'delete' ? (
                <Shield className="w-6 h-6 text-red-600" />
              ) : (
                <Lock className="w-6 h-6 text-amber-600" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">Security verification required</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className={`p-4 rounded-xl mb-6 ${type === 'delete' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`text-sm ${type === 'delete' ? 'text-red-700' : 'text-amber-700'}`}>
              {message}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Administrator Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="Enter your admin password"
              autoFocus
            />
            {error && (
              <p className="mt-3 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 ${type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : type === 'delete' ? (
                <Trash2 className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {isLoading ? 'Verifying...' : 'Confirm Action'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    type: 'edit' | 'delete';
    participant?: Participant;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'edit',
    title: '',
    message: ''
  });


  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get("https://ieeedu-admincertificate.onrender.com/participants");
      setParticipants(res.data);
      setFilteredParticipants(res.data);
    } catch (error) {
      console.error("Error fetching participants:", error);
      setError("Failed to connect to the server. Please ensure the backend is running on port 5000.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter participants based on search and filter criteria
  useEffect(() => {
    let filtered = participants;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.programEvents.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPosition) {
      filtered = filtered.filter(p => p.position === filterPosition);
    }

    setFilteredParticipants(filtered);
  }, [participants, searchTerm, filterPosition]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isValidForm = () => {
    const serialPattern = /^A\d{8}$/;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!serialPattern.test(form.serialNumber)) {
      alert("Serial Number must be 9 characters (A followed by 8 digits). Example: A20250001");
      return false;
    }
    if (!form.name.trim()) {
      alert("Name is required.");
      return false;
    }
    if (!form.programEvents.trim()) {
      alert("Program Events is required.");
      return false;
    }
    if (!datePattern.test(form.issueDate)) {
      alert("Issue Date must be in YYYY-MM-DD format.");
      return false;
    }
    if (!form.position.trim()) {
      alert("Position is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!isValidForm()) return;

    if (isEditing) {
      setPasswordModal({
        isOpen: true,
        type: 'edit',
        title: 'Confirm Update',
        message: 'This action will modify participant data. Please verify your administrator credentials to proceed.'
      });
    } else {
      await submitForm();
    }
  };

  const submitForm = async (password?: string) => {
    setIsLoading(true);
    try {
      if (isEditing) {
        await axios.put(
          `https://ieeedu-admincertificate.onrender.com/participants/${form.serialNumber}`,
          {
            ...form,
            password: password,  // ✅ Send the password in the request body
          }
        );
      } else {
        await axios.post(
          "https://ieeedu-admincertificate.onrender.com/participants",
          form
        );
      }
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Failed to submit form", error);
      alert("Operation failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
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
  };

  const handleEdit = (participant: Participant) => {
    setPasswordModal({
      isOpen: true,
      type: 'edit',
      participant,
      title: 'Administrator Access Required',
      message: `You are about to modify ${participant.name}'s profile. This action requires administrator privileges.`
    });
  };

  const handleDelete = (participant: Participant) => {
    setPasswordModal({
      isOpen: true,
      type: 'delete',
      participant,
      title: 'Confirm Deletion',
      message: `You are about to permanently delete ${participant.name} from the system. This action cannot be undone and requires administrator authorization.`
    });
  };


  const handlePasswordConfirm = async (password: string) => {
    if (!password.trim()) {
      alert("Password required");
      return;
    }

    if (passwordModal.type === 'edit' && passwordModal.participant) {
      try {
        const res = await axios.post("https://ieeedu-admincertificate.onrender.com/verify-password", {
          password: password
        });
        if (res.status === 200) {
          setForm(passwordModal.participant);
          setIsEditing(true);
        } else {
          alert("Invalid admin password. Access denied.");
        }
      } catch {
        alert("Invalid admin password. Access denied.");
      } finally {
        setPasswordModal({ ...passwordModal, isOpen: false });
      }
    } else if (passwordModal.type === 'delete' && passwordModal.participant) {
      setIsLoading(true);
      try {
        await axios.delete(
          `https://ieeedu-admincertificate.onrender.com/participants/${passwordModal.participant.serialNumber}`,
          {
            data: {
              password: password,
            },
          }
        );
        fetchData();
      } catch (error) {
        console.error("Failed to delete participant", error);
        alert("Deletion failed. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
        setPasswordModal({ ...passwordModal, isOpen: false });
      }
    }
  };



  const handlePasswordModalClose = () => {
    setPasswordModal({ ...passwordModal, isOpen: false });
  };

  const uniquePositions = [...new Set(participants.map(p => p.position))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 ">
        {/* Enhanced Header */}
        <div className="mb-8 mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <Users className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  IEEE Cerficate Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1">IEEE Dibrugarh University Students Branch</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">Live</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-4 mt-10 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm text-amber-800 font-medium">
                  <strong>Security Protocol Active:</strong> Administrator authentication required for data modifications
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  All edit and delete operations are logged and require password verification
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 shadow-sm">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Connection Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Enhanced Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h2 className="text-2xl font-semibold flex items-center gap-3">
              {isEditing ? (
                <>
                  <Pencil className="w-6 h-6" />
                  Edit Participant Profile
                </>
              ) : (
                <>
                  <Plus className="w-6 h-6" />
                  Add New Participant
                </>
              )}
            </h2>
            {isEditing && (
              <p className="text-blue-100 mt-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Administrator access verified - ready to update participant data
              </p>
            )}
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Serial Number *
                </label>
                <input
                  name="serialNumber"
                  placeholder="e.g. A20250001"
                  value={form.serialNumber}
                  onChange={handleChange}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  disabled={isEditing}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Full Name *
                </label>
                <input
                  name="name"
                  placeholder="Enter participant's full name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Program Events *
                </label>
                <input
                  name="programEvents"
                  placeholder="Enter program or event details"
                  value={form.programEvents}
                  onChange={handleChange}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Issue Date *
                </label>
                <input
                  name="issueDate"
                  type="date"
                  value={form.issueDate}
                  onChange={handleChange}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Position *
                </label>
                <input
                  name="position"
                  placeholder="Enter position or role"
                  value={form.position}
                  onChange={handleChange}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Program Photo Link
                </label>
                <input
                  name="programPhotoLink"
                  placeholder="Enter photo URL (optional)"
                  value={form.programPhotoLink}
                  onChange={handleChange}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-1 space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Certificate URL
                </label>
                <input
                  name="certificateUrl"
                  placeholder="Enter certificate URL (optional)"
                  value={form.certificateUrl}
                  onChange={handleChange}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : isEditing ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {isLoading ? 'Processing...' : isEditing ? 'Update Participant' : 'Add Participant'}
              </button>

              {isEditing && (
                <button
                  onClick={resetForm}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-3"
                >
                  <X className="w-5 h-5" />
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search participants by name, serial number, or program..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
            <div className="md:w-64">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                >
                  <option value="">All Positions</option>
                  {uniquePositions.map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Participants Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                <Users className="w-6 h-6" />
                Participants Directory
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {filteredParticipants.length} of {participants.length}
                </span>
              </h2>

            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Serial Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Media
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      {isLoading ? (
                        <div className="flex flex-col items-center gap-4">
                          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                          <p className="text-gray-600 font-medium">Loading participants...</p>
                        </div>
                      ) : searchTerm || filterPosition ? (
                        <div className="flex flex-col items-center gap-4">
                          <Search className="w-12 h-12 text-gray-300" />
                          <div>
                            <p className="text-gray-600 font-medium">No participants match your search</p>
                            <p className="text-sm text-gray-500 mt-1">Try adjusting your search terms or filters</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <Users className="w-12 h-12 text-gray-300" />
                          <div>
                            <p className="text-gray-600 font-medium">No participants registered yet</p>
                            <p className="text-sm text-gray-500 mt-1">Add your first participant using the form above</p>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((participant, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {participant.serialNumber.slice(-2)}
                            </span>
                          </div>
                          <span className="text-sm font-mono font-medium text-gray-900">
                            {participant.serialNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-semibold text-sm">
                              {participant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{participant.name}</p>
                            <p className="text-xs text-gray-500">{participant.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {participant.programEvents}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{participant.issueDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {participant.position}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {participant.programPhotoLink ? (
                            <a
                              href={participant.programPhotoLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg"
                            >
                              <Camera className="w-4 h-4" />
                              <span className="text-xs font-medium">Photo</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">No photo</span>
                          )}
                          {participant.certificateUrl ? (
                            <a
                              href={participant.certificateUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg"
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-xs font-medium">Cert</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">No cert</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(participant)}
                            className="flex items-center gap-1 text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 p-2 rounded-lg transition-all duration-200"
                            title="Edit participant (requires admin password)"
                          >
                            <Pencil className="w-4 h-4" />
                            <Lock className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(participant)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-all duration-200"
                            title="Delete participant (requires admin password)"
                          >
                            <Trash2 className="w-4 h-4" />
                            <Lock className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enhanced Password Modal */}
      <PasswordModal
        isOpen={passwordModal.isOpen}
        onClose={handlePasswordModalClose}
        onConfirm={handlePasswordConfirm}
        title={passwordModal.title}
        message={passwordModal.message}
        type={passwordModal.type}
      />
    </div>
  );
}