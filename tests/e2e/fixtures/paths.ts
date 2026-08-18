import path from 'path';
import fs from 'fs';

export const STORAGE_STATE_DIR = path.join(__dirname, '.auth');

export const AUTH_PATHS = {
  student: path.join(STORAGE_STATE_DIR, 'student.json'),
  admin: path.join(STORAGE_STATE_DIR, 'admin.json'),
  counselor: path.join(STORAGE_STATE_DIR, 'counselor.json'),
};

export function ensureAuthDir() {
  if (!fs.existsSync(STORAGE_STATE_DIR)) {
    fs.mkdirSync(STORAGE_STATE_DIR, { recursive: true });
  }
}
