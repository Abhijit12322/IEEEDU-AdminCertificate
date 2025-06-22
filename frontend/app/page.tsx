'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import { Camera, FileText, Trash2, Pencil, Users, Plus, AlertCircle, Lock, X } from "lucide-react";

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
}

function PasswordModal({ isOpen, onClose, onConfirm, title, message }: PasswordModalProps) {
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

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-gray-600 mb-4">{message}</p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              placeholder="Enter your password"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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

  // You can change this password as needed
  const ADMIN_PASSWORD = "admin123";

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get("https://ieeedu-admincertificate.onrender.com/participants");
      setParticipants(res.data);
    } catch (error) {
      console.error("Error fetching participants:", error);
      setError("Failed to fetch participants. Make sure the backend server is running on port 5000.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      // Show password modal for editing
      setPasswordModal({
        isOpen: true,
        type: 'edit',
        title: 'Confirm Update',
        message: 'Please enter the admin password to update this participant.'
      });
    } else {
      // No password required for adding new participants
      await submitForm();
    }
  };

  const submitForm = async (password?: string) => {
    if (isEditing && password !== ADMIN_PASSWORD) {
      alert("Incorrect password. Update cancelled.");
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing) {
        await axios.put(`https://ieeedu-admincertificate.onrender.com/participants/${form.serialNumber}`, form);
      } else {
        await axios.post("https://ieeedu-admincertificate.onrender.com/participants", form);
      }
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Failed to submit form", error);
      alert("Error submitting the form. Check console and ensure backend is running.");
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
      title: 'Confirm Edit',
      message: `Please enter the admin password to edit ${participant.name}'s information.`
    });
  };

  const handleDelete = (participant: Participant) => {
    setPasswordModal({
      isOpen: true,
      type: 'delete',
      participant,
      title: 'Confirm Delete',
      message: `Please enter the admin password to delete ${participant.name} from the system. This action cannot be undone.`
    });
  };

  const handlePasswordConfirm = async (password: string) => {
    if (password !== ADMIN_PASSWORD) {
      alert("Incorrect password. Action cancelled.");
      setPasswordModal({ ...passwordModal, isOpen: false });
      return;
    }

    if (passwordModal.type === 'edit' && passwordModal.participant) {
      setForm(passwordModal.participant);
      setIsEditing(true);
      setPasswordModal({ ...passwordModal, isOpen: false });
    } else if (passwordModal.type === 'delete' && passwordModal.participant) {
      setIsLoading(true);
      try {
        await axios.delete(`http://ieeedu-admincertificate.onrender.com/participants/${passwordModal.participant.serialNumber}`);
        fetchData();
      } catch (error) {
        console.error("Failed to delete participant", error);
        alert("Error deleting participant. Check console and ensure backend is running.");
      } finally {
        setIsLoading(false);
      }
      setPasswordModal({ ...passwordModal, isOpen: false });
    }
  };

  const handlePasswordModalClose = () => {
    setPasswordModal({ ...passwordModal, isOpen: false });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Participant Manager</h1>
          </div>
          <p className="text-gray-600">Manage program participants, certificates, and documentation</p>
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-700">
                <strong>Security Notice:</strong> Admin password required for editing or deleting participants
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {isEditing ? "Edit Participant" : "Add New Participant"}
            </h2>
            {isEditing && (
              <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                <Lock className="w-4 h-4" />
                Password verification completed - you can now update this participant
              </p>
            )}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number *
                </label>
                <input
                  name="serialNumber"
                  placeholder="e.g. A20250001"
                  value={form.serialNumber}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  name="name"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program Events *
                </label>
                <input
                  name="programEvents"
                  placeholder="Enter program events"
                  value={form.programEvents}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date *
                </label>
                <input
                  name="issueDate"
                  type="date"
                  value={form.issueDate}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position *
                </label>
                <input
                  name="position"
                  placeholder="Enter position"
                  value={form.position}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program Photo Link
                </label>
                <input
                  name="programPhotoLink"
                  placeholder="Enter photo URL"
                  value={form.programPhotoLink}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate URL
                </label>
                <input
                  name="certificateUrl"
                  placeholder="Enter certificate URL"
                  value={form.certificateUrl}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isEditing ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isEditing ? "Update Participant" : "Add Participant"}
              </button>

              {isEditing && (
                <button
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">
              Participants ({participants.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serial Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Photo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          Loading participants...
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-12 h-12 text-gray-300" />
                          <p>No participants found</p>
                          <p className="text-sm">Add your first participant using the form above</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  participants.map((participant, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {participant.serialNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {participant.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {participant.programEvents}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {participant.issueDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {participant.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {participant.programPhotoLink ? (
                          <a
                            href={participant.programPhotoLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                          >
                            <Camera className="w-4 h-4" />
                            <span className="sr-only">View Photo</span>
                          </a>
                        ) : (
                          <span className="text-gray-400">No photo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {participant.certificateUrl ? (
                          <a
                            href={participant.certificateUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-green-600 hover:text-green-800 transition-colors flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="sr-only">View Certificate</span>
                          </a>
                        ) : (
                          <span className="text-gray-400">No certificate</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(participant)}
                            className="text-amber-600 hover:text-amber-800 p-1 rounded transition-colors flex items-center gap-1"
                            title="Edit participant (requires password)"
                          >
                            <Pencil className="w-4 h-4" />
                            <Lock className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(participant)}
                            className="text-red-600 hover:text-red-800 p-1 rounded transition-colors flex items-center gap-1"
                            title="Delete participant (requires password)"
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

      {/* Password Modal */}
      <PasswordModal
        isOpen={passwordModal.isOpen}
        onClose={handlePasswordModalClose}
        onConfirm={handlePasswordConfirm}
        title={passwordModal.title}
        message={passwordModal.message}
      />
    </div>
  );
}
