// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const normalizeRole = (value) => String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
const normalizeDepartment = (value) => String(value || '').trim().toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '');

const doctorDepartmentCaseApiPrefixes = {
  pedodontics: ['/api/pedodontics'],
  oral: ['/api/oral'],
  general: ['/api/oral'],
  generaldentistry: ['/api/oral'],
  oralandmaxillofacial: ['/api/oral'],
  oralmaxillofacial: ['/api/oral'],
  oralandmaxillofacialsurgery: ['/api/oral'],
  oralmaxillofacialsurgery: ['/api/oral'],
  oralmedicine: ['/api/oral'],
  oralmedicineandradiology: ['/api/oral'],
  oralmedicineradiology: ['/api/oral'],
};

const allRestrictedDoctorCasePrefixes = Array.from(
  new Set(Object.values(doctorDepartmentCaseApiPrefixes).flat().filter(Boolean))
);

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    console.log('Auth middleware - incoming token header:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
    const user = await User.findOne({ 
      _id: decoded.userId 
    }).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token invalid' 
      });
    }

    const normalizedRole = normalizeRole(user.role);
    if (normalizedRole === 'doctor' || normalizedRole === 'pg') {
      const requestPath = String(req.originalUrl || req.url || '').split('?')[0].toLowerCase();
      const isRestrictedCaseApi = allRestrictedDoctorCasePrefixes.some((prefix) => requestPath.startsWith(prefix));

      // Allow bypass for patient-level case fetches when client sets a trusted header.
      // This is used by the UI when a doctor has explicitly selected a patient and
      // needs to view that patient's case sheets across departments.
      const bypassHeader = String(req.header('x-bypass-department-check') || '').trim().toLowerCase();
      const bypassRequested = bypassHeader === '1' || bypassHeader === 'true';

      if (isRestrictedCaseApi) {
        if (bypassRequested) {
          // Skip department restriction when client explicitly requests bypass
          console.log('Auth middleware: bypassing department check via header for', requestPath);
        } else {
        const normalizedDepartment = normalizeDepartment(user.department);
        const allowedPrefixes = doctorDepartmentCaseApiPrefixes[normalizedDepartment] || [];
        const isAllowed = allowedPrefixes.some((prefix) => requestPath.startsWith(prefix));

        if (!isAllowed) {
          return res.status(403).json({
            success: false,
            message: 'Access denied for this department'
          });
        }
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.name, error.message);
    // Provide more specific feedback for common JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token invalid' });
    }
    return res.status(401).json({ success: false, message: 'Authentication failed', error: error.message });
  }
};

export default auth;