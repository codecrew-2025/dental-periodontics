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
    const header = req.header('Authorization') || '';
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    console.log('Auth middleware - incoming token header:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
    const user = await User.findOne({ _id: decoded.userId }).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Token invalid' });
    }

    const normalizedRole = normalizeRole(user.role);
    if (normalizedRole === 'doctor' || normalizedRole === 'pg') {
      const requestPath = String(req.originalUrl || req.url || '').split('?')[0].toLowerCase();
      const isRestrictedCaseApi = allRestrictedDoctorCasePrefixes.some((prefix) => requestPath.startsWith(prefix));

      // Allow bypass for patient-level case fetches when client sets a trusted header.
      const bypassHeader = String(req.header('x-bypass-department-check') || '').trim().toLowerCase();
      const bypassRequested = bypassHeader === '1' || bypassHeader === 'true';

      if (isRestrictedCaseApi && !bypassRequested) {
        const normalizedDept = normalizeDepartment(user.department);
        const allowedPrefixes = doctorDepartmentCaseApiPrefixes[normalizedDept] || [];
        const isAllowed = allowedPrefixes.some((prefix) => requestPath.startsWith(prefix));

        if (!isAllowed) {
          return res.status(403).json({ success: false, message: 'Access denied for this department' });
        }
      }
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error?.name, error?.message);
    if (error?.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    if (error?.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token invalid' });
    }
    return res.status(401).json({ success: false, message: 'Authentication failed', error: String(error?.message || error) });
  }
};

export default auth;