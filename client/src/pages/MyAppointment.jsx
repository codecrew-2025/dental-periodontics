// MyAppointment.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MyAppointment.css";
import { API_BASE_URL } from "../config/api";
import { getStoredPatientId } from '../utils/patientIdentity';

const ALLOWED_TIMES = [
  "9:00 AM","9:15 AM","9:30 AM","9:45 AM",
  "10:00 AM","10:15 AM","10:30 AM","10:45 AM",
  "11:15 AM","11:30 AM","11:45 AM",
  "12:00 PM","12:15 PM","12:30 PM","12:45 PM",
  "2:00 PM","2:15 PM","2:30 PM","2:45 PM","3:00 PM",
];

const MyAppointment = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const patientId = getStoredPatientId();

  // Reschedule modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const buildApiUrl = (path) =>
    `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  useEffect(() => {
    if (patientId) {
      fetchAppointments();
    } else {
      setError("Please log in to view your appointments");
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    const onFocus = () => {
      if (patientId) fetchAppointments();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [patientId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        buildApiUrl(`/api/appointment/appointments/patient/${encodeURIComponent(patientId)}`),
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      const data = await response.json();
      if (data.success) {
        setAppointments(data.appointments);
      } else {
        setError("Failed to load appointments.");
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("Unable to connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const response = await fetch(buildApiUrl(`/api/appointment/${appointmentId}/cancel`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      const data = await response.json();
      if (data.success) {
        fetchAppointments();
        alert("Appointment cancelled successfully.");
      } else {
        alert("Failed to cancel appointment.");
      }
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert("Unable to cancel appointment. Please try again later.");
    }
  };

  // Open reschedule modal
  const openRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setProposedDate("");
    setProposedTime("");
    setRescheduleReason("");
    setShowModal(true);
  };

  // Submit reschedule request to backend
  const handleRescheduleSubmit = async () => {
    if (!proposedDate || !proposedTime) {
      alert("Please select both a new date and time.");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(buildApiUrl("/api/appointment/patient-reschedule"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId: selectedAppointment.bookingId,
          proposedDate,
          proposedTime,
          reason: rescheduleReason,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        fetchAppointments();
        alert("Reschedule request sent! Awaiting PG/UG review.");
      } else {
        alert(data.message || "Failed to submit reschedule request.");
      }
    } catch (err) {
      console.error("Error submitting reschedule:", err);
      alert("Unable to connect to server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Patient confirms appointment as-is (no date/time change)
  const handleConfirmAppointment = async (appointment) => {
    if (!window.confirm(`Confirm attendance for appointment on ${appointment.appointmentDate} at ${appointment.appointmentTime}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(buildApiUrl("/api/appointment/patient-confirm"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appointmentId: appointment.bookingId }),
      });
      const data = await response.json();
      if (data.success) {
        fetchAppointments();
        alert("Appointment confirmed! You're all set.");
      } else {
        alert(data.message || "Could not confirm appointment.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    }
  };

  // Patient accepts the doctor-approved counter-proposal
  const handleAcceptCounter = async (appointment) => {
    const proposed = appointment.rescheduleRequest;
    const msg = proposed?.proposedDate
      ? `Accept new appointment on ${proposed.proposedDate} at ${proposed.proposedTime}?`
      : "Are you sure you want to accept the proposed new time?";
    if (!window.confirm(msg)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(buildApiUrl("/api/appointment/patient-accept-counter"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appointmentId: appointment.bookingId }),
      });
      const data = await response.json();
      if (data.success) {
        fetchAppointments();
        alert("Appointment confirmed with new time!");
      } else {
        alert(data.message || "Failed to accept counter-proposal.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    }
  };

  const getStatusTag = (status, appointmentDate, appointmentTime) => {
    try {
      const now = new Date();
      const appointmentDateTime = new Date(`${appointmentDate}T${convertTo24Hour(appointmentTime)}`);

      if (now > appointmentDateTime && status !== "cancelled") {
        return <span className="status-tag status-expired">EXPIRED</span>;
      }

      switch (status) {
        case "confirmed":
          return <span className="status-tag status-confirmed">CONFIRMED</span>;
        case "cancelled":
          return <span className="status-tag status-cancelled">CANCELLED</span>;
        case "rescheduled":
          return <span className="status-tag status-rescheduled">RESCHEDULED</span>;
        case "patient_reschedule_requested":
          return <span className="status-tag status-waiting">RESCHEDULE REQUESTED</span>;
        case "pg_counter_reschedule_pending_doc":
          return <span className="status-tag status-waiting">WAITING FOR DOCTOR</span>;
        case "pg_counter_reschedule_approved_doc":
          return (
            <span className="status-tag status-action-required">
              ⚡ ACTION REQUIRED
            </span>
          );
        case "assigned":
          return <span className="status-tag status-assigned">ACCEPTED</span>;
        default:
          return <span className="status-tag status-waiting">WAITING FOR CONFIRMATION</span>;
      }
    } catch {
      return <span className="status-tag status-waiting">WAITING FOR CONFIRMATION</span>;
    }
  };

  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return "00:00";
    const [time, modifier] = timeStr.split(" ");
    if (!modifier) return time;
    let [hours, minutes] = time.split(":");
    if (modifier === "PM" && hours !== "12") hours = String(+hours + 12);
    if (modifier === "AM" && hours === "12") hours = "00";
    return `${hours.padStart(2, "0")}:${minutes}`;
  };

  const isFutureAppointment = (date, time) => {
    const now = new Date();
    const appt = new Date(`${date}T${convertTo24Hour(time)}`);
    return appt > now;
  };

  const renderActionButtons = (a) => {
    const isFuture = isFutureAppointment(a.appointmentDate, a.appointmentTime);
    const canModify = isFuture && a.status !== "cancelled" && a.status !== "completed" && a.status !== "confirmed";

    // Doctor approved PG's counter-proposal — patient must Accept new time or Reschedule again
    if (a.status === "pg_counter_reschedule_approved_doc") {
      const proposed = a.rescheduleRequest;
      return (
        <div className="action-buttons action-buttons--col">
          {proposed?.proposedDate && (
            <div className="proposed-time-badge">
              📅 {proposed.proposedDate} · {proposed.proposedTime}
            </div>
          )}
          <div className="action-buttons action-buttons--row">
            <button className="btn-accept" onClick={() => handleAcceptCounter(a)}>
              ✓ Accept
            </button>
            <button className="btn-reschedule" onClick={() => openRescheduleModal(a)}>
              ↺ Reschedule
            </button>
          </div>
        </div>
      );
    }

    // Patient reschedule already requested — waiting for PG/UG
    if (a.status === "patient_reschedule_requested") {
      return (
        <div className="action-buttons">
          <span className="no-actions">⏳ Awaiting PG Review…</span>
        </div>
      );
    }

    // PG counter waiting for doctor confirmation
    if (a.status === "pg_counter_reschedule_pending_doc") {
      return (
        <div className="action-buttons">
          <span className="no-actions">⏳ Awaiting Doctor Approval…</span>
        </div>
      );
    }

    // Assigned by PG/UG – patient needs to accept
    if (a.status === "assigned") {
      return (
        <div className="action-buttons action-buttons--col">
          <div className="action-buttons action-buttons--row">
            <button
              className="btn-accept"
              onClick={() => handleConfirmAppointment(a)}
            >
              ✓ Accept
            </button>
            <button className="btn-reschedule" onClick={() => openRescheduleModal(a)}>
              ↺ Reschedule
            </button>
          </div>
        </div>
      );
    }

    // Normal modifiable appointment — show Accept + Reschedule + Cancel
    if (canModify) {
      return (
        <div className="action-buttons action-buttons--col">
          <div className="action-buttons action-buttons--row">
            <button
              className="btn-accept"
              onClick={() => handleConfirmAppointment(a)}
              title="Confirm you will attend this appointment"
            >
              ✓ Accept
            </button>
            <button
              className="btn-reschedule"
              onClick={() => openRescheduleModal(a)}
              title="Request a different date/time"
            >
              ↺ Reschedule
            </button>
          </div>
          <button
            className="btn-cancel btn-cancel--sm"
            onClick={() => handleCancelAppointment(a._id || a.bookingId)}
          >
            Cancel
          </button>
        </div>
      );
    }

    return <span className="no-actions">No Actions</span>;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <p>Loading appointments…</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="error-container">
          <p>{error}</p>
          <button type="button" className="btn-book-now" onClick={fetchAppointments}>
            Retry
          </button>
        </div>
      );
    }
    if (appointments.length === 0) {
      return <p style={{ textAlign: "center", color: "rgba(255,255,255,0.7)" }}>No appointments found.</p>;
    }

    return (
      <div className="table-container">
        <table className="appointment-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>BOOKING ID</th>
              <th>DATE &amp; TIME</th>
              <th>COMPLAINT</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a, index) => (
              <tr key={a.bookingId}>
                <td>{index + 1}</td>
                <td>{a.bookingId}</td>
                <td>
                  {a.appointmentDate}
                  <span className="date-time-separator">•</span>
                  {a.appointmentTime}
                </td>
                <td>{a.chiefComplaint}</td>
                <td>{getStatusTag(a.status, a.appointmentDate, a.appointmentTime)}</td>
                <td>{renderActionButtons(a)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ── Today's date for min attribute
  const todayISO = new Date().toISOString().split("T")[0];

  return (
    <div className="appointment-dashboard">
      <header className="portal-header">
        <div className="header-left">
          <img src="/images/dental logo.png" alt="SRM Dental Logo" className="logo" />
          <h3 className="logo-text">SRM Dental College</h3>
        </div>
        <button className="btn-back-dashboard" onClick={() => navigate("/patient-dashboard")}>
          Back to Dashboard
        </button>
      </header>

      <main className="container">
        <h1>My Appointments</h1>
        {renderContent()}
      </main>

      {/* ── Reschedule Modal ── */}
      {showModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Reschedule</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-current">
              <div className="modal-current-row">
                <span className="modal-label">Booking ID</span>
                <span className="modal-value">{selectedAppointment.bookingId}</span>
              </div>
              <div className="modal-current-row">
                <span className="modal-label">Current Date</span>
                <span className="modal-value">{selectedAppointment.appointmentDate}</span>
              </div>
              <div className="modal-current-row">
                <span className="modal-label">Current Time</span>
                <span className="modal-value">{selectedAppointment.appointmentTime}</span>
              </div>
            </div>

            <div className="modal-divider">
              <span>Propose New Schedule</span>
            </div>

            <div className="modal-form">
              <label className="modal-field">
                <span>New Date <span className="required">*</span></span>
                <input
                  type="date"
                  min={todayISO}
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="modal-input"
                />
              </label>

              <label className="modal-field">
                <span>New Time <span className="required">*</span></span>
                <select
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="modal-input"
                >
                  <option value="">-- Select Time --</option>
                  {ALLOWED_TIMES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <label className="modal-field">
                <span>Reason (optional)</span>
                <textarea
                  rows={3}
                  placeholder="Why do you need to reschedule?"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="modal-input modal-textarea"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="btn-accept"
                onClick={handleRescheduleSubmit}
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointment;
