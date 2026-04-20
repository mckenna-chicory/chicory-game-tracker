import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Lock, LogOut, CheckCircle2 } from 'lucide-react';

const SHEETDB_API = 'https://sheetdb.io/api/v1/ah8sgykqsdzf8';
const ADMIN_PIN = '1313';
const COMPANY_NAME = 'Chicory';

const TASK_LIST = [
  { label: 'Lapsed Customer', value: 0.50 },
  { label: 'Complete Training', value: 0.10 },
  { label: 'LinkedIn Repost', value: 0.05 },
  { label: 'AI Labs Submission', value: 0.25 },
  { label: 'AI Labs Release', value: 2.50 },
  { label: 'AMC IO', value: 1.00 },
  { label: 'CSM In-Person Client Meeting', value: 1.00 },
  { label: '$75K ADRM IO', value: 2.00 },
  { label: 'Earned Media', value: 2.50 },
  { label: 'WMC PM Driven IO', value: 2.50 },
  { label: 'Mid-Flight Incremental', value: 5.00 },
  { label: '>$1M Booked Customer', value: 5.00 },
  { label: 'Branded Case Study', value: 5.00 },
];

const MILESTONES = [
  { goal: 30, reward: '$25 Gift Card', tier: 1 },
  { goal: 60, reward: 'Chicory Swag', tier: 2 },
  { goal: 100, reward: 'Elevated Experience at Summer Event', tier: 3 },
];

function GameTracker() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const [employeeName, setEmployeeName] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${SHEETDB_API}?limit=1000`);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const result = await response.json();
      const rows = result.data || [];
      
      // Filter out header row and invalid entries
      const validRows = rows.filter(row => 
        row['Employee Name'] && row['Amount'] && !isNaN(parseFloat(row['Amount']))
      );
      
      // Sort by timestamp (newest first)
      validRows.sort((a, b) => {
        const timeA = new Date(a['Timestamp'] || 0);
        const timeB = new Date(b['Timestamp'] || 0);
        return timeB - timeA;
      });
      
      setData(validRows);
      
      // Calculate running total
      const sum = validRows.reduce((acc, row) => {
        return acc + parseFloat(row['Amount']) || 0;
      }, 0);
      
      setTotal(sum);
      setLastUpdate(new Date());
      setError('');
    } catch (err) {
      setError('Unable to fetch data. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAdminPin = (e) => {
    e.preventDefault();
    if (adminPin === ADMIN_PIN) {
      setIsAdminMode(true);
      setAdminPin('');
      setPinError('');
    } else {
      setPinError('Incorrect PIN');
      setAdminPin('');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    
    if (!employeeName.trim()) {
      setSubmitSuccess('Please enter an employee name');
      return;
    }
    
    let taskAmount = 0;
    let taskLabel = '';
    
    if (useCustom) {
      if (!customAmount || isNaN(parseFloat(customAmount))) {
        setSubmitSuccess('Please enter a valid amount');
        return;
      }
      taskAmount = parseFloat(customAmount);
      taskLabel = 'Custom Task';
    } else {
      if (!selectedTask) {
        setSubmitSuccess('Please select a task');
        return;
      }
      const task = TASK_LIST.find(t => t.label === selectedTask);
      taskAmount = task.value;
      taskLabel = selectedTask;
    }

    setSubmitting(true);
    
    try {
      const now = new Date();
      const timestamp = now.toISOString().replace('T', ' ').slice(0, 19);
      
      const newRow = {
        'Timestamp': timestamp,
        'Employee Name': employeeName.trim(),
        'Task Description': taskLabel,
        'Amount': taskAmount.toFixed(2),
      };

      const response = await fetch(SHEETDB_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [newRow] }),
      });

      if (!response.ok) throw new Error('Failed to add task');

      setEmployeeName('');
      setSelectedTask('');
      setCustomAmount('');
      setUseCustom(false);
      setSubmitSuccess(`✓ Added $${taskAmount.toFixed(2)} for ${employeeName}`);
      
      setTimeout(() => setSubmitSuccess(''), 3000);
      
      // Refresh data immediately
      await fetchData();
    } catch (err) {
      setSubmitSuccess('Error adding task. Please try again.');
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getCartFillPercentage = () => {
    if (total < 10) return Math.max(10, (total / 10) * 25);
    if (total < 30) return 25 + ((total - 10) / 20) * 40;
    if (total < 60) return 65 + ((total - 30) / 30) * 25;
    return Math.min(100, 90 + ((total - 60) / 40) * 10);
  };

  const recentEntries = data.slice(0, 15);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f4f8 100%)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6b46c1 0%, #4c51bf 100%)',
        color: 'white',
        padding: '2rem 1rem',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '2.5rem', fontWeight: 600 }}>
          🛒 {COMPANY_NAME} Q2 Game Tracker
        </h1>
        <p style={{ margin: 0, opacity: 0.95, fontSize: '1rem' }}>
          Working together to reach amazing rewards!
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}>
            <AlertCircle style={{ color: '#dc2626', width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ color: '#991b1b' }}>{error}</div>
          </div>
        )}

        {isAdminMode ? (
          <AdminPanel
            onAddTask={handleAddTask}
            employeeName={employeeName}
            setEmployeeName={setEmployeeName}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            customAmount={customAmount}
            setCustomAmount={setCustomAmount}
            useCustom={useCustom}
            setUseCustom={setUseCustom}
            submitting={submitting}
            submitSuccess={submitSuccess}
            onLogout={() => setIsAdminMode(false)}
          />
        ) : (
          <>
            {/* Main Tracker Display */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Total & Cart */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                gridColumn: 'span 1',
              }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Earned</div>
                  <div style={{ fontSize: '3rem', fontWeight: 700, color: '#6b46c1' }}>
                    ${total.toFixed(2)}
                  </div>
                  {lastUpdate && (
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                      Updated {Math.round((Date.now() - lastUpdate) / 1000)}s ago
                    </div>
                  )}
                </div>

                {/* Shopping Cart Visual */}
                <div style={{ position: 'relative', height: '220px', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                  {/* Cart outline */}
                  <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', position: 'absolute' }}>
                    {/* Cart wheel left */}
                    <circle cx="50" cy="180" r="8" fill="#9ca3af" />
                    {/* Cart wheel right */}
                    <circle cx="150" cy="180" r="8" fill="#9ca3af" />
                    {/* Cart basket */}
                    <path d="M 40 170 L 50 60 L 150 60 L 160 170 Z" fill="none" stroke="#6b46c1" strokeWidth="2.5" />
                    {/* Cart handle */}
                    <path d="M 70 50 Q 100 20 130 50" fill="none" stroke="#6b46c1" strokeWidth="2.5" />
                  </svg>

                  {/* Fill animation */}
                  <div style={{
                    position: 'absolute',
                    bottom: '26px',
                    left: '42px',
                    right: '40px',
                    height: `${Math.min(getCartFillPercentage(), 140)}px`,
                    background: 'linear-gradient(135deg, #6b46c1 0%, #4c51bf 100%)',
                    opacity: 0.4,
                    borderRadius: '0 0 8px 8px',
                    transition: 'height 0.6s ease-out',
                  }} />

                  {/* Grocery items floating in cart */}
                  <div style={{
                    position: 'absolute',
                    bottom: '26px',
                    left: 0,
                    right: 0,
                    height: `${Math.min(getCartFillPercentage(), 140)}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    padding: '0.75rem',
                    fontSize: '1.5rem',
                  }}>
                    {total > 5 && '🍎'}
                    {total > 15 && '🥕'}
                    {total > 25 && '🥛'}
                    {total > 35 && '🍝'}
                    {total > 50 && '🥬'}
                    {total > 65 && '🍊'}
                    {total > 80 && '🧀'}
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                  Cart filling up... {Math.round(getCartFillPercentage())}%
                </div>
              </div>

              {/* Milestones */}
              <div style={{
                display: 'grid',
                gridTemplateRows: 'repeat(3, 1fr)',
                gap: '1rem',
                gridColumn: 'span 1',
              }}>
                {MILESTONES.map((milestone) => {
                  const progress = Math.min((total / milestone.goal) * 100, 100);
                  const isUnlocked = total >= milestone.goal;

                  return (
                    <div
                      key={milestone.tier}
                      style={{
                        background: isUnlocked ? 'linear-gradient(135deg, #d4fc7f 0%, #a3e635 100%)' : 'white',
                        borderRadius: '8px',
                        padding: '1rem',
                        boxShadow: isUnlocked ? '0 8px 16px rgba(74, 222, 128, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                        border: isUnlocked ? '2px solid #84cc16' : '1px solid #e5e7eb',
                        transition: 'all 0.4s ease',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                      }}>
                        <div>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: isUnlocked ? '#166534' : '#374151',
                          }}>
                            Tier {milestone.tier}
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: isUnlocked ? '#15803d' : '#6b7280',
                            marginTop: '0.25rem',
                          }}>
                            {milestone.reward}
                          </div>
                        </div>
                        {isUnlocked && <span style={{ fontSize: '1.5rem' }}>🎉</span>}
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.5rem',
                      }}>
                        <div style={{
                          flex: 1,
                          height: '6px',
                          background: isUnlocked ? '#dcfce7' : '#f3f4f6',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: isUnlocked ? '#16a34a' : `linear-gradient(90deg, #6b46c1 0%, #4c51bf 100%)`,
                            transition: 'width 0.6s ease-out',
                          }} />
                        </div>
                      </div>

                      <div style={{
                        fontSize: '0.75rem',
                        color: isUnlocked ? '#15803d' : '#6b7280',
                        fontWeight: 500,
                      }}>
                        ${total.toFixed(2)} / ${milestone.goal}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Receipt Section */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e5e7eb',
            }}>
              <h2 style={{
                margin: '0 0 1rem',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                📋 Recent Contributions
              </h2>

              <div style={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: '#374151',
                background: '#f9fafb',
                padding: '1rem',
                borderRadius: '6px',
                maxHeight: '400px',
                overflowY: 'auto',
              }}>
                {loading ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                    Loading contributions...
                  </div>
                ) : recentEntries.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                    No contributions yet. Great things coming soon!
                  </div>
                ) : (
                  <>
                    {recentEntries.map((entry, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: idx < recentEntries.length - 1 ? '1px solid #e5e7eb' : 'none',
                        fontSize: '0.8rem',
                      }}>
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: '#6b46c1' }}>{entry['Employee Name']}</strong>
                          <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>
                            {entry['Task Description']}
                          </div>
                        </div>
                        <div style={{
                          textAlign: 'right',
                          fontWeight: 600,
                          color: '#16a34a',
                          whiteSpace: 'nowrap',
                          marginLeft: '1rem',
                        }}>
                          +${parseFloat(entry['Amount']).toFixed(2)}
                        </div>
                      </div>
                    ))}

                    <div style={{
                      borderTop: '2px solid #d1d5db',
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 700,
                      color: '#1f2937',
                      fontSize: '0.9rem',
                    }}>
                      <span>TOTAL</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Admin Access Footer */}
            <div style={{
              textAlign: 'center',
              marginTop: '2rem',
              padding: '1rem',
            }}>
              <button
                onClick={() => setIsAdminMode(true)}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e5e7eb';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.color = '#6b7280';
                }}
              >
                <Lock style={{ width: '16px', height: '16px' }} />
                Admin Access
              </button>
            </div>
          </>
        )}

        {isAdminMode && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              onClick={() => setIsAdminMode(false)}
              style={{
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#6b7280',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e5e7eb';
                e.target.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.color = '#6b7280';
              }}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
              Exit Admin Mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPanel({
  onAddTask,
  employeeName,
  setEmployeeName,
  selectedTask,
  setSelectedTask,
  customAmount,
  setCustomAmount,
  useCustom,
  setUseCustom,
  submitting,
  submitSuccess,
  onLogout,
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      maxWidth: '500px',
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
      }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1f2937' }}>
          ✨ Add Contribution
        </h2>
        <button
          onClick={onLogout}
          style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Logout
        </button>
      </div>

      <form onSubmit={onAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Employee Name */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '0.5rem',
          }}>
            Employee Name
          </label>
          <input
            type="text"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="Enter employee name"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Task Selection */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '0.75rem',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
            }}>
              <input
                type="radio"
                checked={!useCustom}
                onChange={() => setUseCustom(false)}
                style={{ cursor: 'pointer' }}
              />
              Select from list
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
            }}>
              <input
                type="radio"
                checked={useCustom}
                onChange={() => setUseCustom(true)}
                style={{ cursor: 'pointer' }}
              />
              Custom amount
            </label>
          </div>

          {!useCustom ? (
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            >
              <option value="">Choose a task...</option>
              {TASK_LIST.map((task) => (
                <option key={task.label} value={task.label}>
                  {task.label} - ${task.value.toFixed(2)}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              step="0.01"
              min="0"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount (e.g., 2.50)"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            background: 'linear-gradient(135deg, #6b46c1 0%, #4c51bf 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {submitting ? 'Adding...' : 'Add Contribution'}
        </button>

        {/* Success/Error Message */}
        {submitSuccess && (
          <div style={{
            background: submitSuccess.startsWith('✓') ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${submitSuccess.startsWith('✓') ? '#86efac' : '#fca5a5'}`,
            color: submitSuccess.startsWith('✓') ? '#15803d' : '#991b1b',
            borderRadius: '6px',
            padding: '0.75rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            {submitSuccess.startsWith('✓') && <CheckCircle2 style={{ width: '16px', height: '16px' }} />}
            {submitSuccess}
          </div>
        )}
      </form>
    </div>
  );
}

export default GameTracker;
