/* eslint-disable */
const fs = require('fs');
const path = 'src/app/tasks/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

const targetStr = `    if (error) {
      toast.error(\`Failed to assign task: \${error.message}\`);
      return;
    }

    // Also send an instant notification to the employee
    await supabase.from('notifications').insert([{
      recipient: newTask.assignee,
      message: \`You have been assigned a new \${taskType.replace('_', ' ')}.\`
    }]);

    toast.success(successMsg);`;

const replaceStr = `    if (error) {
      toast.error(\`Failed to assign task: \${error.message}\`);
      return;
    }

    // Insert into Live Activity Leaderboard
    await supabase.from('activity_logs').insert([{
      action_type: 'TASK_ASSIGNED',
      description: \`Assigned a new \${taskType.replace('_', ' ')} to \${newTask.assignee}\`,
      employee_name: currentUser?.name || 'Admin'
    }]);

    // Send an instant notification to the employee (Dashboard)
    await supabase.from('notifications').insert([{
      recipient: newTask.assignee,
      message: \`You have been assigned a new \${taskType.replace('_', ' ')}.\`
    }]);

    // Trigger EXTREME Notification (Email Alert)
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: newTask.assignee,
          type: 'EXTREME',
          title: \`URGENT: New \${newTask.priority || 'Medium'} Priority Task Assigned!\`,
          message: \`You have been assigned a new \${taskType.replace('_', ' ')}.\\nDeadline: \${newTask.date || 'No deadline'}\\nNotes: \${newTask.notes || 'None'}\`
        })
      });
    } catch (err) {
      console.error("Failed to trigger extreme notification:", err);
    }

    toast.success(successMsg);`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync(path, content, 'utf-8');
console.log('Successfully updated page.tsx');
