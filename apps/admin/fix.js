/* eslint-disable */
const fs = require('fs');
const path = 'src/app/tasks/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Fix RegistrationTask
content = content.replace(
  /interface RegistrationTask \{[\s\S]*?completed_at\?: string;[\s\S]*?\}/,
  `interface RegistrationTask {
  id: string;
  student_name: string;
  phone: string;
  email: string;
  test: string;
  target_score: string;
  status: TaskStatus;
  created_at: string;
  completed_at?: string;
  completed_by?: string;
  assignee?: string;
  priority?: string;
  deadline?: string;
}`
);

// Fix WalkInTask
content = content.replace(
  /interface WalkInTask \{[\s\S]*?completed_at\?: string;[\s\S]*?\}/,
  `interface WalkInTask {
  id: string;
  ticket_number: string;
  full_name: string;
  mobile: string;
  email: string;
  city: string;
  destinations: string[];
  preferred_subjects: string[];
  status: TaskStatus;
  created_at: string;
  completed_at?: string;
  completed_by?: string;
  assignee?: string;
  priority?: string;
  deadline?: string;
}`
);

fs.writeFileSync(path, content, 'utf-8');
console.log('Fixed interfaces for real');
